#!/usr/bin/env bash
#
# dev-sites.sh — run several Astro Knots sites at once on auto-assigned ports.
#
# Ports start at 4321 (Astro's default) and walk upward, skipping anything
# already listening, so this never collides with a dev server you already have
# open in another terminal.
#
#   ./scripts/dev-sites.sh                    # the three design spikes
#   ./scripts/dev-sites.sh gth-site           # just one (or any subset)
#   ./scripts/dev-sites.sh --all              # every site in sites/
#   ./scripts/dev-sites.sh --list             # what's discoverable
#   ./scripts/dev-sites.sh --from 5000        # start port hunting at 5000
#   ./scripts/dev-sites.sh --host             # expose on the LAN
#
# Ctrl-C stops all of them.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITES_DIR="$ROOT/sites"

# Sites that make up the current three-directions design spikes. Each is a
# different client; they're grouped here only because they're reviewed together.
DEFAULT_SITES=(dominocielo-site gth-site multiphasic-site)

PORT_FROM=4321
HOST_FLAG=""
declare -a WANTED=()

while [ $# -gt 0 ]; do
  case "$1" in
    --all)   WANTED=(--ALL--); shift ;;
    --list)  WANTED=(--LIST--); shift ;;
    --host)  HOST_FLAG="--host"; shift ;;
    --from)  PORT_FROM="${2:?--from needs a port number}"; shift 2 ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*)      echo "unknown flag: $1" >&2; exit 2 ;;
    *)       WANTED+=("$1"); shift ;;
  esac
done

# --- discovery -------------------------------------------------------------
# Find every directory under sites/ that holds an astro.config.*, up to two
# levels deep so nested sites (coglet-shuffle/astro-site) are found too.
discover() {
  find "$SITES_DIR" -maxdepth 3 -name 'astro.config.*' -not -path '*/node_modules/*' 2>/dev/null \
    | sed 's|/astro\.config\..*$||' | sort
}

path_for() { # name -> path, matching on the final path segment
  local name="$1" p
  while IFS= read -r p; do
    [ "$(basename "$p")" = "$name" ] && { printf '%s\n' "$p"; return 0; }
  done < <(discover)
  return 1
}

if [ "${WANTED[0]:-}" = "--LIST--" ]; then
  echo "Discoverable sites:"
  while IFS= read -r p; do printf '  %-22s %s\n' "$(basename "$p")" "${p#"$ROOT"/}"; done < <(discover)
  exit 0
fi

declare -a NAMES=()
if [ "${WANTED[0]:-}" = "--ALL--" ]; then
  while IFS= read -r p; do NAMES+=("$(basename "$p")"); done < <(discover)
elif [ ${#WANTED[@]} -gt 0 ]; then
  NAMES=("${WANTED[@]}")
else
  NAMES=("${DEFAULT_SITES[@]}")
fi

# --- port hunting ----------------------------------------------------------
port_busy() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1
  else
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3<&- 3>&-; return 0; } || return 1
  fi
}

next_port=$PORT_FROM
CLAIMED_PORT=""
# Sets CLAIMED_PORT rather than echoing it: a command substitution would run this
# in a subshell, and the next_port increment would be lost -- handing every site
# the same port.
claim_port() {
  while port_busy "$next_port"; do next_port=$((next_port + 1)); done
  CLAIMED_PORT=$next_port
  next_port=$((next_port + 1))   # don't hand the same one out twice in this run
}

# --- resolve, install, launch ----------------------------------------------
declare -a RUN_NAMES=() RUN_PATHS=() RUN_PORTS=()

for name in "${NAMES[@]}"; do
  if ! dir="$(path_for "$name")"; then
    echo "  ✗ $name — not found under sites/ (try --list)" >&2
    continue
  fi
  if [ ! -d "$dir/node_modules/astro" ]; then
    echo "  → $name: installing dependencies…"
    if [ -f "$dir/pnpm-lock.yaml" ]; then
      (cd "$dir" && pnpm install --ignore-workspace) || { echo "  ✗ $name: install failed" >&2; continue; }
    else
      (cd "$dir" && pnpm install) || { echo "  ✗ $name: install failed" >&2; continue; }
    fi
  fi
  claim_port
  RUN_NAMES+=("$name"); RUN_PATHS+=("$dir"); RUN_PORTS+=("$CLAIMED_PORT")
done

[ ${#RUN_NAMES[@]} -eq 0 ] && { echo "Nothing to run." >&2; exit 1; }

COLORS=(36 35 32 33 34 31)   # cyan, magenta, green, yellow, blue, red
RESET=$'\033[0m'

cleanup() {
  trap '' INT TERM EXIT
  echo
  echo "Shutting down…"
  kill -- -$$ 2>/dev/null || kill 0 2>/dev/null
}
trap cleanup INT TERM EXIT

echo
echo "Starting ${#RUN_NAMES[@]} site(s):"
for i in "${!RUN_NAMES[@]}"; do
  c="${COLORS[$((i % ${#COLORS[@]}))]}"
  printf '  \033[%sm%-16s\033[0m http://localhost:%s\n' "$c" "${RUN_NAMES[$i]}" "${RUN_PORTS[$i]}"
done
echo
echo "Ctrl-C stops all of them."
echo

for i in "${!RUN_NAMES[@]}"; do
  name="${RUN_NAMES[$i]}"; dir="${RUN_PATHS[$i]}"; port="${RUN_PORTS[$i]}"
  c="${COLORS[$((i % ${#COLORS[@]}))]}"
  prefix=$'\033['"$c"'m['"$name"']'"$RESET"
  (
    cd "$dir" || exit 1
    # shellcheck disable=SC2086
    # --ignore-lock: Astro 7 writes a per-project lock and will silently reuse an
    # already-running dev server (ignoring --port) instead of starting a new one,
    # which also detaches and breaks Ctrl-C. We want the port we assigned.
    #
    # ASTRO_DEV_BACKGROUND: Astro refuses --ignore-lock when it detects an AI-agent
    # shell, because it force-backgrounds the server there. Its own check is
    #   agentDetected = !process.env.ASTRO_DEV_BACKGROUND && isRunByAgent()
    # so setting this opts out of the detection and keeps the server in our
    # foreground. In a normal terminal isRunByAgent() is already false, so this
    # is a no-op; it only matters when an agent runs the script.
    ASTRO_DEV_BACKGROUND=1 \
      pnpm exec astro dev --port "$port" --strictPort --ignore-lock $HOST_FLAG 2>&1 \
      | while IFS= read -r line; do printf '%s %s\n' "$prefix" "$line"; done
  ) &
done

wait
