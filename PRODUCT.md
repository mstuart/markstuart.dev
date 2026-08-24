# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Engineering peers and practitioners looking for writing, open source work,
  technical decisions, and reusable ideas about APIs, SDKs, web platforms, and
  AI-enabled engineering.
- Engineering leaders, hiring teams, and prospective collaborators evaluating
  Mark's experience through public evidence rather than unsupported claims.
- Conference, podcast, press, and community organizers reviewing talks,
  appearances, and areas of expertise.
- Returning readers who follow new writing through email or RSS and visitors
  who use the listening history, project index, or terminal interface.

## Product Purpose

markstuart.dev is Mark Stuart's professional home on the web. It gives visitors
a concise introduction, then lets them inspect the work, writing, projects,
talks, and independent references behind it. Success means a visitor can
quickly understand Mark's focus and follow the evidence that matters to them.

## Positioning

The site is an evidence-led portfolio for a senior engineering practitioner who
has built developer platforms, APIs, SDKs, and web systems at scale. It combines
career history with source links, case studies, open source work, technical
writing, talks, and third-party references instead of relying on a marketing
resume alone.

## Operating Context

Visitors arrive from search, GitHub, publications, conference material, and
direct professional referrals. They can browse a concise or expanded career
history, read local and externally published writing, inspect public projects,
subscribe through confirmed email or RSS, and use a non-indexed terminal-style
view. The site is responsive, supports light and dark themes, and is deployed on
Vercel.

## Capabilities and Constraints

- Public routes cover Mark's profile, work history, writing, projects, press,
  talks, listening history, current stack, RSS feed, and terminal interface.
- `lib/data/resume.ts` is authoritative for biography, role history, and career
  claims. Other curated content must remain consistent with it.
- Provider-backed features include double-opt-in email, inbound email,
  notifications, durable votes, and week-coarsened Spotify history.
- Live Spotify presence is intentionally unavailable so the public site does
  not expose real-time location or activity.
- Personal content, identity assets, and third-party marks are not granted under
  the source-code license. Asset provenance must remain explicit.
- Public claims must be truthful, evidence-grounded, and conservative.
- The interface must remain accessible and responsive, preserve visible focus,
  respect reduced motion, and keep primary controls at least 44px tall.

## Brand Commitments

The product name is `markstuart.dev`, and the public identity is Mark Stuart.
The voice is direct, specific, technically credible, and personal without
inflation. Pixel artwork provides a distinctive digital signature, while the
work and its evidence remain primary. The site uses the established “quiet ink”
direction: restrained editorial presentation, generous space, compact metadata,
and teal reserved for interaction.

## Evidence on Hand

- `lib/data/resume.ts` contains role-level career evidence links.
- `content/posts/` and `lib/data/writing.ts` contain local and externally
  published writing.
- `lib/data/projects.ts`, `lib/data/all-projects.ts`, and
  `lib/data/project-case-studies.ts` contain public projects, contributions, and
  structured case studies.
- `lib/data/mentions.ts`, `lib/data/talks.ts`, `lib/data/appearances.ts`, and
  `lib/data/community.ts` contain independent references and appearances.
- `docs/asset-rights.md` records the known provenance and redistribution status
  of public assets. Missing provenance must not be fabricated.

## Product Principles

1. Lead with proof, then let visitors choose their depth.
2. Keep claims accurate, conservative, and consistent with the source of record.
3. Make technical work legible to both practitioners and engineering leaders.
4. Protect personal privacy and require deliberate consent for subscriptions.
5. Keep the site useful without provider credentials or client-side JavaScript.

## Accessibility & Inclusion

The site targets WCAG 2.2 AA behavior. Navigation, forms, dialogs, filters, and
content must work by keyboard, expose useful names and states, retain visible
focus, support zoom and narrow screens, meet contrast requirements, and honor a
visitor's reduced-motion preference.
