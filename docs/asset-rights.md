# Asset rights and provenance

The MIT License covers this repository's source code. It does not license Mark
Stuart's identity, biography, editorial content, or original visual artwork for
reuse in another site. Publication in this repository is not evidence that an
asset may be copied or used to imply endorsement.

## Retained visual assets

| Retained path or dependency | Source | Rights holder | License or publication basis | Modifications | Site use | Checked |
| --- | --- | --- | --- | --- | --- | --- |
| `public/avatar.png` | User-supplied ChatGPT-generated pixel portrait provided on 2026-08-23; provider terms: <https://openai.com/policies/terms-of-use/> | Site owner, subject to the provider terms and any applicable third-party rights | Retained and published at the site owner's explicit direction. OpenAI's terms address ownership of output as between the user and OpenAI; this ledger does not claim uniqueness or rights beyond those terms. No reuse license is granted here. | Stored as a PNG and rendered through the site's pixel-avatar treatment | Homepage and top-navigation portrait | 2026-08-25 |
| `public/poster-cat-8bit.png` | Mark Stuart's original pixel artwork; `lib/tui-art.ts` records this file as its source | Mark Stuart | Original artwork published by its creator for this site. No reuse license is granted here. | Converted to half-block terminal-rendering data in `lib/tui-art.ts`; the source PNG is retained | Homepage poster scene and terminal artwork source | 2026-08-24 |
| `public/posts/jquery-compatibility-layer-shaped-web/john-resig-jsconf-us-2010.jpg` | JS Conf photograph: <https://www.flickr.com/photos/jsconf/4586826039/>, via <https://commons.wikimedia.org/wiki/File:John_Resig_(4586826039).jpg> | JS Conf | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/); the article credits JS Conf, links the source and license, and identifies the resize | Resized from the original to 1280 by 853 pixels | Editorial illustration of John Resig speaking at JSConf US in April 2010 | 2026-08-27 |
| `public/posts/jquery-compatibility-layer-shaped-web/paul-irish-jquery-source-youtube.jpg` | Frame from Paul Irish's [10 Things I Learned from the jQuery Source](https://www.youtube.com/watch?v=i_qE1iAmjFg) video | Paul Irish or the applicable video rightsholder | Limited editorial quotation used to identify and discuss the linked video. No reuse license or ownership is claimed. | Captured as a 1280 by 720 JPEG and linked directly to the source video | Editorial illustration beside commentary about the source walkthrough | 2026-08-27 |
| `public/posts/jquery-compatibility-layer-shaped-web/jquery-chain-carbon.png`, `public/posts/jquery-compatibility-layer-shaped-web/jquery-chain-carbon-mobile.png` | Site-owner-authored jQuery example exported with [Carbon](https://carbon.now.sh/); Carbon documents PNG export and is [MIT licensed](https://github.com/carbon-app/carbon) | Mark Stuart owns the example code; Carbon contributors own Carbon's implementation | Original example published by its author for this article. Carbon's repository is MIT licensed. No rights in third-party typefaces or syntax themes are claimed. | Exported at desktop and mobile aspect ratios with Carbon's macOS-window presentation | Responsive code illustration in the jQuery article | 2026-08-27 |
| `public/posts/eslint-making-javascript-rules-programmable/eslint-logo-color.svg` | Official SVG from the [ESLint website repository](https://github.com/eslint/eslint.org/blob/main/src/assets/images/logo/eslint-logo-color.svg); ESLint publishes [logo-use guidance and downloads](https://eslint.org/branding/) | OpenJS Foundation | Third-party project mark used without alteration to identify the subject of the article under ESLint's published brand guidance. No endorsement or redistribution license is claimed; forks should replace it. | None | Editorial identification in the ESLint article | 2026-08-28 |
| `public/posts/eslint-making-javascript-rules-programmable/jamund-ferguson-javascript-forest.jpg` | Opening slide from Jamund Ferguson's [Hiking Through the JavaScript Forest](https://speakerdeck.com/xjamundx/hiking-through-the-javascript-forest) deck | Jamund Ferguson or the applicable slide rightsholder | Limited editorial quotation used to identify and discuss the linked presentation. No reuse license or ownership is claimed. | Captured from the source deck as a 769 by 577 JPEG and linked directly to the presentation | Editorial illustration beside Mark Stuart's account of learning about ASTs and ESLint plugins from Jamund Ferguson | 2026-08-28 |
| `public/posts/eslint-making-javascript-rules-programmable/eslint-rule-flow.svg`, `public/posts/eslint-making-javascript-rules-programmable/eslint-rule-flow-mobile.svg` | Original diagrams created for this article | Mark Stuart | Original artwork published by its creator for this site. No reuse license is granted here. | Authored as responsive desktop and mobile SVGs using the site's existing visual tokens | Editorial explanation of ESLint's parse, visit, and report flow | 2026-08-28 |
| `public/posts/stripe-developer-experience-reset-the-standard/stripe-api-2011.jpg` | Early Stripe homepage image published in [Stripe's history of its payments API](https://stripe.com/blog/payment-api-design) | Stripe or the applicable image rightsholder | Limited editorial quotation used to identify and discuss Stripe's 2011 developer experience. The article credits Stripe and links directly to the source. No reuse license or ownership is claimed. | Stored as a 1078 by 347 JPEG | Editorial illustration of Stripe's early charge API | 2026-08-30 |
| `public/posts/stripe-developer-experience-reset-the-standard/workbench-inspector.png`, `public/posts/stripe-developer-experience-reset-the-standard/workbench-debug.webp` | Product images published in [Stripe's 2024 Workbench launch](https://stripe.com/blog/workbench-a-new-way-to-debug-monitor-and-grow-your-stripe-integration) | Stripe or the applicable image rightsholder | Limited editorial quotation used to identify and discuss the linked product experience. The article credits Stripe and links directly to the source. No reuse license or ownership is claimed. | Stored as a 1620 by 934 PNG and a 1620 by 981 WebP | Editorial illustrations of Workbench's Inspector and its place in the Stripe Dashboard | 2026-08-30 |
| `public/work/rocket.png`, `public/work/ebay.png`, `public/work/paypal.png`, `public/work/qplay.png`, `public/work/statefarm.png` | Existing repository assets: Rocket, eBay, PayPal, and Qplay first appear in commit `632979b`; the current State Farm rendition first appears in commit `8c39c22`. Each mark identifies the employer named beside it. | Rocket, eBay, PayPal, Qplay, and State Farm respectively | Third-party employer marks restored at the site owner's explicit direction for narrow nominative identification. No endorsement or redistribution license is claimed; forks should replace them. | Existing square PNG renditions are resized by Next.js without recoloring or tracing | Homepage employer chips, resume role tiles, employer-authored posts, PayPal talks, and PayPal press coverage | 2026-08-25 |
| `public/stack/*.png` | Existing product and application logo tiles restored from pre-scrub commit `3cdb21a` | The product and application vendors represented by each mark | Third-party marks restored at the site owner's explicit direction to identify the exact products in the Stack. No endorsement or redistribution license is claimed; forks should replace them. | Existing square renditions are resized by Next.js without recoloring or tracing | Stack product rows | 2026-08-25 |
| `public/talks/*.png` | Existing event, publisher, and platform logo tiles restored from pre-scrub commit `3cdb21a` | The event, publisher, and platform owners represented by each mark | Third-party marks restored at the site owner's explicit direction to identify the linked talk or appearance. No endorsement or redistribution license is claimed; forks should replace them. | Existing square renditions are resized by Next.js without recoloring or tracing | Talk, appearance, and community rows | 2026-08-25 |
| `public/press/*` | Existing publication, organization, and platform logo tiles restored from pre-scrub commit `3cdb21a` | The publication, organization, and platform owners represented by each mark | Third-party marks restored at the site owner's explicit direction to identify the linked coverage. No endorsement or redistribution license is claimed; forks should replace them. | Existing square renditions are resized by Next.js without recoloring or tracing | Press and reference rows | 2026-08-25 |
| `app/icon.svg` | Repository-authored site identity | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Authored as SVG | Site icon and local writing tile | 2026-08-24 |
| `app/apple-icon.tsx` | Repository-authored site identity derived from the markstuart.dev monogram | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Programmatically renders the Apple touch icon | Apple touch icon | 2026-08-24 |
| `app/opengraph-image.tsx` | Repository-authored site identity and typography | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Programmatically renders the social preview image | Open Graph and social preview | 2026-08-24 |
| `@phosphor-icons/react@2.1.10` | Phosphor Icons React package: <https://github.com/phosphor-icons/react> | Phosphor Icons contributors | MIT License | Icons are sized and colored through component props and CSS | Generic interface decoration; brand-shaped social icons identify the linked GitHub, LinkedIn, and X profiles only, as narrow nominative references | 2026-08-24 |

The marks listed above are the only stored third-party brand artwork. Their use
identifies the named employer, product, event, publication, or platform and does
not imply endorsement. The previously removed third-party press portraits,
avatars, and book-cover artwork remain excluded; rows without a restored logo
use generic Phosphor icons.

Remote Spotify artwork is fetched at runtime and is not stored in the
repository. Its availability does not grant redistribution rights.

## Adding or changing an asset

Before committing media, record all of the following in this ledger:

1. Exact file or narrowly defined path pattern.
2. Original source URL or the name of the creator and source file.
3. Rights holder.
4. License, written permission, or the limited legal basis for use.
5. Attribution and notice requirements.
6. Whether the asset was cropped, recolored, traced, or otherwise modified.
7. Intended site context and the date the evidence was checked.

Do not copy an image from search results or a third-party site merely because
it is publicly visible. Store permission evidence outside the public
repository when it contains private correspondence, and record only a neutral
reference to that evidence here.

If provenance or permission is uncertain, exclude the asset from a public fork
or replace it with original text, CSS, or independently licensed media.
