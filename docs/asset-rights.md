# Asset rights and provenance

The MIT License covers this repository's source code. It does not license Mark
Stuart's identity, biography, editorial content, or original visual artwork for
reuse in another site. Publication in this repository is not evidence that an
asset may be copied or used to imply endorsement.

## Retained visual assets

| Retained path or dependency | Source | Rights holder | License or publication basis | Modifications | Site use | Checked |
| --- | --- | --- | --- | --- | --- | --- |
| `public/avatar.png` | User-supplied ChatGPT-generated pixel portrait provided on 2026-08-23; provider terms: <https://openai.com/policies/terms-of-use/> | Site owner, subject to the provider terms and any applicable third-party rights | Retained and published at the site owner's explicit direction. OpenAI's terms address ownership of output as between the user and OpenAI; this ledger does not claim uniqueness or rights beyond those terms. No reuse license is granted here. | Stored as a PNG and rendered through the site's pixel-avatar treatment | Homepage portrait | 2026-08-24 |
| `public/poster-cat-8bit.png` | Mark Stuart's original pixel artwork; `lib/tui-art.ts` records this file as its source | Mark Stuart | Original artwork published by its creator for this site. No reuse license is granted here. | Converted to half-block terminal-rendering data in `lib/tui-art.ts`; the source PNG is retained | Homepage poster scene and terminal artwork source | 2026-08-24 |
| `app/icon.svg` | Repository-authored site identity | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Authored as SVG | Site icon and local writing tile | 2026-08-24 |
| `app/apple-icon.tsx` | Repository-authored site identity derived from the markstuart.dev monogram | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Programmatically renders the Apple touch icon | Apple touch icon | 2026-08-24 |
| `app/opengraph-image.tsx` | Repository-authored site identity and typography | Mark Stuart | Original site identity published for markstuart.dev. No trademark or identity reuse license is granted here. | Programmatically renders the social preview image | Open Graph and social preview | 2026-08-24 |
| `@phosphor-icons/react@2.1.10` | Phosphor Icons React package: <https://github.com/phosphor-icons/react> | Phosphor Icons contributors | MIT License | Icons are sized and colored through component props and CSS | Generic interface decoration; brand-shaped social icons identify the linked GitHub, LinkedIn, and X profiles only, as narrow nominative references | 2026-08-24 |

No stored third-party employer, publication, conference, product, or tool
artwork remains. The site preserves the relevant names, factual copy, and
outbound evidence links using text, initials, and MIT-licensed generic
Phosphor icons instead.

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
