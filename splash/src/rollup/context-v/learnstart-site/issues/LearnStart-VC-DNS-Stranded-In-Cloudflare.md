---
title: learnstart.vc DNS is stranded in an inaccessible Cloudflare account
date_created: 2026-08-04
date_modified: 2026-08-04
authors:
  - Michael Staton
augmented_with: Claude Opus 5 on Claude Code
semantic_version: 0.0.0.1
status: Open
lede: The domain's records are served by Cloudflare, the Cloudflare account can't be reached, and the zone still carries live Google Workspace email alongside the ghost of the deleted Heroku site. Snapshot first, cut over second.
tags:
  - DNS
  - Cloudflare
  - Vercel
  - Email-Deliverability
  - LearnStart
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
