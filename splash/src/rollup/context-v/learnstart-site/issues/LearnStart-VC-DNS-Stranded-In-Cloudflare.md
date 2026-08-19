---
title: learnstart.vc DNS is stranded in an inaccessible Cloudflare account
date_created: 2026-08-04
date_modified: 2026-08-05
date_resolved: 2026-08-05
authors:
  - Michael Staton
augmented_with: Claude Opus 5 on Claude Code
semantic_version: 0.0.1.0
status: Resolved
lede: The domain's records are served by Cloudflare, the Cloudflare account can't be reached, and the zone still carries live Google Workspace email alongside the ghost of the deleted Heroku site. Snapshot first, cut over second.
tags:
  - DNS
  - Cloudflare
  - Vercel
  - Email-Deliverability
  - LearnStart
site_uuid: d55456bb-8bd9-4289-b78e-053d60d19140
hex_code: cytiv7
date_authored_initial_draft: 2026-08-05
date_authored_current_draft: 2026-08-05
publish: true
from: learnstart-site
from_path: issues/LearnStart-VC-DNS-Stranded-In-Cloudflare.md
---
<!-- Rolled up from learnstart-site/context-v/issues/LearnStart-VC-DNS-Stranded-In-Cloudflare.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

> **⚠️ 2026-08-04, later the same day — the cutover happened and email broke.**
> The domain was re-delegated at iwantmyname from Cloudflare to `ns1/ns2.vercel-dns.com`.
> Vercel stood up a **fresh, empty zone** containing only `A` records for the site. The
> Cloudflare zone is no longer consulted, so **MX, SPF, DKIM, and DMARC all vanished at
> once** and inbound mail to `@learnstart.vc` began failing. The DKIM key has since
> expired from every public resolver cache — **the copy below is the only surviving one.**
> Restore the records in the "MUST PRESERVE" section into Vercel's DNS panel.

> **✅ 2026-08-05 — the Cloudflare zone is still alive and still serving. Recovery is safe.**
> The delegation moved, but the *zone object* was never deleted from the Cloudflare account.
> `javon.ns.cloudflare.com` still answers authoritatively for every record. A full
> type-by-type re-dump against it matches the snapshot below **exactly** — nothing was
> lost that this file didn't already capture. See *Recovery Plan* at the bottom for the
> paste-ready values and the verification commands.
>
> This is a **time-limited** second source. If the Cloudflare account is ever recovered
> and the zone deleted, or if Cloudflare reaps it as inactive, it disappears. The
> committed snapshot in this file remains the durable copy.

> **🟢 2026-08-05 — RESOLVED. All eight mail records restored to the Vercel zone.**
> Executed via the Vercel CLI under the `colearn-labs` scope. MX, SPF, and DKIM verified
> byte-for-byte identical to the Cloudflare original; DMARC differs only by insignificant
> whitespace. Propagated to Google, Cloudflare, and Quad9 public resolvers. The site
> itself was never interrupted. See *Execution Log* at the bottom for what was actually
> run, the traps hit along the way, and the two decisions still outstanding.

Captured **2026-08-04** from the authoritative nameserver (`javon.ns.cloudflare.com`),
**before** any nameserver or record change.

**Why this file exists:** the zone is served by Cloudflare, and the Cloudflare account
is currently inaccessible. If the domain is ever re-delegated to another DNS host, the
Cloudflare zone stops being consulted and *every record below vanishes at once* — including
the four that carry Google Workspace email. They must be recreated at the new host, ideally
before the nameserver switch. This is that list.

Probed by explicit record type. Cloudflare answers `ANY` queries with a synthetic
`RFC8482` placeholder, so `dig ANY` based enumeration produces a false positive for
every name you ask about — don't trust a snapshot taken that way.

---

## 🔴 MUST PRESERVE — live Google Workspace email

Losing any of these breaks mail delivery, signing, or deliverability reputation.

```dns
; Mail exchangers
learnstart.vc.  MX  1   aspmx.l.google.com.
learnstart.vc.  MX  5   alt1.aspmx.l.google.com.
learnstart.vc.  MX  5   alt2.aspmx.l.google.com.
learnstart.vc.  MX  10  alt3.aspmx.l.google.com.
learnstart.vc.  MX  10  alt4.aspmx.l.google.com.

; SPF — authorizes Google to send as @learnstart.vc
learnstart.vc.  TXT  "v=spf1 include:_spf.google.com ~all"

; DKIM — signing key. Long value, stored as two concatenated strings in the zone.
google._domainkey.learnstart.vc.  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA17snZWaHckqp6rL42jtaNoRKemnzk4Z8QRCZ3aUC7A0NcUQtiRYi93eg6odcdvGPrw+w17ndNOJsfdXxf7FV0IazuuizsRMRWeBa/GAz+eRjJ84x1+dbiWBNYSoFrH4cotY0vuPl/25zUBF4evIQLZVdTAgBUHis+pAOm/T1baD5rdm6260u8E4FyhWOt3XQ9" "qu4maSANuO6qjF7Ur1tNKut1v9UClp/rP+dNhZyxuOALCczmBUdEcrO3xPJo2lVlBwHPRD9yiTrOownrQw3KFETBvvJWv9vCdmSwPHftD1cCYkmRXkX+k/tFtOh/jUdv2oPnMQVKo9YGrHbyo6DawIDAQAB"

; DMARC — note the rua target is a Cloudflare-managed reporting address,
; which stops collecting if the zone leaves Cloudflare. Repoint it then.
_dmarc.learnstart.vc.  TXT  "v=DMARC1;  p=none; rua=mailto:19531f6a12fc4c4b967800c6f8f9d8ce@dmarc-reports.cloudflare.net"
```

## ⚪ DEAD — the deleted Heroku site, safe to replace

The Heroku app was deleted after a lapsed payment (see the site narrative); these
records outlived it. `mysterious-hamlet-...herokudns.com` no longer resolves at all,
and the four apex IPs are EC2 addresses no longer serving anything of ours.

```dns
learnstart.vc.       A      54.162.128.250   ; ec2-...compute-1.amazonaws.com
learnstart.vc.       A      54.157.58.70
learnstart.vc.       A      52.204.242.176
learnstart.vc.       A      18.205.36.100
www.learnstart.vc.   CNAME  mysterious-hamlet-934zd96aeiyhpq5gx8qbzl9w.herokudns.com.  ; NXDOMAIN
email.learnstart.vc. CNAME  learnstart.vc.   ; resolves to the dead apex
blog.learnstart.vc.  CNAME  learnstart.vc.   ; resolves to the dead apex
```

`email.` and `blog.` deserve a decision rather than a reflex — they're dead *today* only
because the apex is dead, but they may have been real surfaces once. Decide whether to
drop them or repoint them; don't carry them forward pointing at Vercel by accident.

## Delegation

```dns
learnstart.vc.  NS  javon.ns.cloudflare.com.
learnstart.vc.  NS  ruth.ns.cloudflare.com.
```

Registrar of record is **1API GmbH** (iwantmyname's backend registrar), domain created
2017-02-15. Nameservers are delegated to Cloudflare, so **records edited in the
iwantmyname panel have no effect** — only the nameserver delegation itself is set there.
That delegation is also the escape hatch if Cloudflare access can't be recovered.

## No records found for

`AAAA`, `CAA`, and these probed subdomains: `mail smtp imap pop autodiscover autoconfig
ftp app api docs portal dev staging test cdn assets static m go link news newsletter
track click mg mailgun sendgrid k1/selector1/selector2/default._domainkey calendar drive
vpn remote shop store status help support`.

Absence here is not proof — this was a guessed wordlist, not a zone transfer (AXFR is
refused, as expected). A subdomain with an unguessed name would not appear.

---

## Recovery Plan (2026-08-05)

### State of play

| | Cloudflare zone (orphaned, still answering) | Vercel zone (authoritative today) |
|---|---|---|
| `NS` delegated here? | ❌ no longer | ✅ `ns1/ns2.vercel-dns.com` |
| `MX` | ✅ all five Google | ❌ **none** |
| `TXT` SPF | ✅ present | ❌ **none** |
| `google._domainkey` DKIM | ✅ present | ❌ **none** |
| `_dmarc` | ✅ present | ❌ **none** |
| Apex `A` | dead EC2 IPs | ✅ Vercel edge |

Inbound mail to `@learnstart.vc` fails because **no MX record exists at the
authoritative nameserver.** Sending fails SPF/DKIM alignment for the same reason.
The Google Workspace tenant itself is untouched — this is purely a DNS gap.

### Records to add in the Vercel DNS panel

Add these five (well, nine rows) to `learnstart.vc`. **Restore verbatim** — do not
"modernize" during a restore. Google confirms the legacy `aspmx` values are still fully
supported ("if your email is working, no changes are required"). Migrating to the single
`smtp.google.com` MX is a separate, optional change for later.

| Name | Type | Priority | Value |
|---|---|---|---|
| *(blank / `@`)* | MX | 1 | `aspmx.l.google.com` |
| *(blank / `@`)* | MX | 5 | `alt1.aspmx.l.google.com` |
| *(blank / `@`)* | MX | 5 | `alt2.aspmx.l.google.com` |
| *(blank / `@`)* | MX | 10 | `alt3.aspmx.l.google.com` |
| *(blank / `@`)* | MX | 10 | `alt4.aspmx.l.google.com` |
| *(blank / `@`)* | TXT | — | `v=spf1 include:_spf.google.com ~all` |
| `google._domainkey` | TXT | — | *(the single-line DKIM value below)* |
| `_dmarc` | TXT | — | `v=DMARC1; p=none; rua=mailto:19531f6a12fc4c4b967800c6f8f9d8ce@dmarc-reports.cloudflare.net` |

### The DKIM gotcha — enter it as ONE unbroken string

The zone stores the DKIM key as two quoted strings because a single TXT character-string
cannot exceed 255 bytes. That chunking is a **wire-format artifact, not part of the value.**
Paste this single 411-byte line into Vercel with **no quotes, no spaces at the join, no
line breaks.** Verified: the base64 payload decodes to a valid 2048-bit RSA public key.

```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA17snZWaHckqp6rL42jtaNoRKemnzk4Z8QRCZ3aUC7A0NcUQtiRYi93eg6odcdvGPrw+w17ndNOJsfdXxf7FV0IazuuizsRMRWeBa/GAz+eRjJ84x1+dbiWBNYSoFrH4cotY0vuPl/25zUBF4evIQLZVdTAgBUHis+pAOm/T1baD5rdm6260u8E4FyhWOt3XQ9qu4maSANuO6qjF7Ur1tNKut1v9UClp/rP+dNhZyxuOALCczmBUdEcrO3xPJo2lVlBwHPRD9yiTrOownrQw3KFETBvvJWv9vCdmSwPHftD1cCYkmRXkX+k/tFtOh/jUdv2oPnMQVKo9YGrHbyo6DawIDAQAB
```

The single most common way this restore fails is a stray space where the two chunks join
(`...t3XQ9 qu4ma...`). That silently invalidates every outbound signature.

### Do NOT touch the nameservers

The delegation at iwantmyname (`ns1/ns2.vercel-dns.com`) is correct and should stay.
Per iwantmyname's own docs, delegating away **deactivates their DNS panel entirely** —
records typed there have no effect. All record edits belong in Vercel now. Rolling the
nameservers back would only re-strand us in the inaccessible Cloudflare account.

### Two decisions to make, not reflexes

1. **`_dmarc` rua target.** The reporting mailbox is `…@dmarc-reports.cloudflare.net`,
   provisioned by the Cloudflare account we can't reach. Restore it verbatim first (keeps
   behavior identical, and `p=none` means it enforces nothing either way), then repoint it
   to a mailbox we actually control. Aggregate reports we can't read are decoration.
2. **`email.` and `blog.` subdomains.** Vercel's zone answers a **wildcard** — every
   unset subdomain, including these two, now resolves to Vercel's edge. They inherited a
   destination nobody chose. Decide explicitly: drop them, or point them somewhere real.

### Verification (allow up to ~24h, though Vercel's default TTL is 60s)

```bash
# Against Vercel's nameserver directly — no cache, immediate truth
dig +short MX  learnstart.vc                     @ns1.vercel-dns.com
dig +short TXT learnstart.vc                     @ns1.vercel-dns.com
dig +short TXT google._domainkey.learnstart.vc   @ns1.vercel-dns.com
dig +short TXT _dmarc.learnstart.vc              @ns1.vercel-dns.com

# Then against a public resolver, to confirm propagation
dig +short MX learnstart.vc @8.8.8.8
```

Mail flow is only truly proven by a round-trip: send from an outside address to a
`@learnstart.vc` mailbox, then reply outbound and check the receiving side's headers show
`dkim=pass` and `spf=pass`.

---

## Execution Log (2026-08-05)

Restored via the Vercel CLI rather than the dashboard, so the exact commands are
reproducible for the next domain that lands in this state.

### Setup

```bash
pnpm add -g vercel          # v58.7.0
vercel whoami               # already authenticated as mpstaton — no login needed
vercel teams ls             # mpstatons-projects | colearn | colearn-labs
```

**Trap 1 — the domain is not in the default scope.** `vercel domains ls` under
`mpstatons-projects` returned zero domains. `learnstart.vc` lives under **`colearn-labs`**,
added 19h earlier. Every `dns` command needs `--scope colearn-labs`.

### The zone before the fix

```
CAA    0 issue "pki.goog"                     (default)
CAA    0 issue "sectigo.com"                  (default)
CAA    0 issue "letsencrypt.org"              (default)
*      ALIAS  cname.vercel-dns-016.com.       (default)   ← the wildcard
@      ALIAS  147f64d72da621a3.vercel-dns-016.com  (default)
```

Five Vercel defaults, nothing else. Confirms the diagnosis exactly, and identifies the
`*` ALIAS as the source of the wildcard behavior noted above. Vercel marks these
`default` — they **cannot be deleted**, only overridden by a more specific record.

### Commands run

```bash
# Five MX
vercel dns add learnstart.vc '@' MX aspmx.l.google.com       1  --scope colearn-labs
vercel dns add learnstart.vc '@' MX alt1.aspmx.l.google.com  5  --scope colearn-labs
vercel dns add learnstart.vc '@' MX alt2.aspmx.l.google.com  5  --scope colearn-labs
vercel dns add learnstart.vc '@' MX alt3.aspmx.l.google.com  10 --scope colearn-labs
vercel dns add learnstart.vc '@' MX alt4.aspmx.l.google.com  10 --scope colearn-labs

# SPF
vercel dns add learnstart.vc '@' TXT 'v=spf1 include:_spf.google.com ~all' --scope colearn-labs

# DKIM — sourced live from the surviving Cloudflare NS so no human retypes 410 bytes
DKIM=$(dig +short TXT google._domainkey.learnstart.vc @javon.ns.cloudflare.com \
        | sed 's/" "//g; s/^"//; s/"$//')
vercel dns add learnstart.vc 'google._domainkey' TXT "$DKIM" --scope colearn-labs

# DMARC
vercel dns add learnstart.vc '_dmarc' TXT 'v=DMARC1; p=none; rua=mailto:19531f6a12fc4c4b967800c6f8f9d8ce@dmarc-reports.cloudflare.net' --scope colearn-labs
```

Piping the DKIM value from `dig` straight into `vercel dns add` is the part worth keeping.
It removes the copy-paste step entirely, which is where this record normally gets corrupted.

### Traps hit (all recoverable, none reached production in a bad state)

**Trap 2 — zsh does not word-split unquoted variables.** A helper that passed
`$S` where `S="--scope colearn-labs"` sent it as a *single* argument; the API rejected all
five MX adds with `unknown or unexpected option`. Because it failed uniformly, nothing was
half-applied. **Write `--scope colearn-labs` literally, or use an array.**

**Trap 3 — the same bug silently faked a passing verification.** A later check used
`set -- $probe` to split `"TXT _dmarc.learnstart.vc"` into type and name. zsh didn't split
it, `dig` received one malformed argument, and *both* sides of the comparison returned the
same garbage — printing three green `✔ MATCH` lines that compared nothing. A verification
harness that can pass while doing no work is worse than no harness. **Pass literal
arguments to `dig`, and assert non-empty output before comparing.**

**Trap 4 — off-by-one on the DKIM length guard.** The guard asserted 411 bytes, taken from
an earlier `wc -c` that counted the trailing newline; `${#DKIM}` is 410. It aborted
correctly rather than writing a bad record, but the fix is the right lesson: **assert on
meaning, not on length.** The replacement decodes the base64 payload and requires
`openssl` to confirm a valid 2048-bit RSA public key.

### Verified final state

| Check | Result |
|---|---|
| MX (5) vs Cloudflare original | ✔ byte-identical |
| SPF vs original | ✔ byte-identical |
| DKIM vs original | ✔ byte-identical, 410 bytes |
| DKIM chunk join | ✔ `...t3XQ9qu4ma...` — no stray space |
| DKIM payload | ✔ decodes to valid 2048-bit RSA public key |
| DMARC vs original | ≈ differs only by a double space after `v=DMARC1;` — whitespace between tags is insignificant per RFC 7489 |
| Propagation (8.8.8.8 / 1.1.1.1 / 9.9.9.9) | ✔ all four record sets on all three |
| `https://learnstart.vc` | ✔ 308 → `www`, which returns 200 |
| `aspmx.l.google.com:25` | ✔ reachable |

### Still outstanding

1. **Round-trip mail test.** DNS is correct, which is necessary but not sufficient. Send
   from an outside address to a `@learnstart.vc` mailbox, reply outbound, and confirm the
   receiving side's headers show `spf=pass` and `dkim=pass`. Until that's done this is
   "records restored", not "email verified working".
2. **Repoint the DMARC `rua`.** Still aimed at the Cloudflare-managed reporting mailbox
   from the account we can't reach. Harmless (`p=none`), but the reports go somewhere
   nobody can read.
3. **`email.` and `blog.`** still resolve via the undeleteable `*` ALIAS to Vercel's edge.
   Override them with explicit records or accept the default deliberately.
4. **Consider a CAA record for Google.** The zone's three default CAA records authorize
   `pki.goog`, `sectigo.com`, and `letsencrypt.org` — fine for Vercel's certs today, but
   worth a look if any mail-adjacent service later needs to issue against this domain.
