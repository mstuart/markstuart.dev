---
name: markstuart.dev
description: A quiet, evidence-led editorial system with a pixel-art signature.
colors:
  paper: "#fafafa"
  ink: "#18181b"
  muted-ink: "#52525b"
  interactive-teal: "#0f766e"
  interactive-teal-hover: "#115e59"
  rule: "#71717a"
  action-ink: "#ffffff"
  soft-paper: "#f4f4f5"
  night-paper: "#09090b"
  night-ink: "#f4f4f5"
  night-muted-ink: "#a1a1aa"
  night-interactive-teal: "#5eead4"
  night-interactive-teal-hover: "#99f6e4"
  night-action-teal: "#2dd4bf"
  night-action-ink: "#09090b"
  night-soft-paper: "#18181b"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.111
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.333
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  article:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.882
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.333
  micro-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "80px"
components:
  action:
    backgroundColor: "{colors.interactive-teal}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "44px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.soft-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
    height: "44px"
---

# Design System: markstuart.dev

## Overview

**Creative North Star: "The Quiet Lab Notebook"**

Quiet ink is a text-first, evidence-led visual system. Near-white and near-black
surfaces create the paper, zinc typography provides the ink, and teal is
reserved for links, focus, selection, and action. Content sits in a narrow
editorial column with modest headings, compact monospaced metadata, light
dividers, and generous vertical rhythm.

Personality comes from a restrained pixel-art identity system: Mark's portrait,
animated monogram, and poster-cat scene. These elements provide a distinctive
digital signature while remaining subordinate to the work, writing, and
evidence.

**Key Characteristics:**

- Evidence before ornament.
- Teal communicates interaction, not decoration.
- Narrow editorial reading columns use whitespace and hairlines for structure.
- Small monospaced metadata stays compact and secondary.
- One pixel-art gesture carries a page's character.

## Colors

The palette treats the page as paper and type as ink, with a single teal voice
for interaction and equivalent semantic roles in dark mode.

### Primary

- **Interactive Teal:** Used for links, selected controls, visible focus, and
  primary actions. Its dark-mode counterpart remains brighter against the night
  paper.

### Neutral

- **Paper and Night Paper:** The light and dark page canvases.
- **Ink and Night Ink:** Primary text and high-confidence content.
- **Muted Ink:** Supporting copy, metadata, and quiet labels.
- **Rule:** Borders, separators, and control outlines.
- **Soft Paper:** Grouped controls, media tiles, and restrained card surfaces.

**The One Voice Rule.** Teal communicates interaction, never ambient decoration.

## Typography

**Display Font:** Geist (with system sans-serif fallback)

**Body Font:** Geist (with system sans-serif fallback)

**Article Font:** Newsreader (with Georgia and serif fallbacks)

**Label/Mono Font:** Geist Mono (with system monospace fallback)

**Character:** Geist keeps the interface precise and contemporary. Newsreader
slows long-form reading without changing the surrounding interface voice, while
Geist Mono makes dates, counts, and technical metadata feel measured.

### Hierarchy

- **Display:** Medium weight with tight tracking, reserved for the homepage name.
- **Title:** Medium weight for page titles and principal content headings.
- **Body:** Regular weight for interface and descriptive copy.
- **Article:** Newsreader with a deliberately open line height for long-form MDX.
- **Label:** Compact mono for metadata, counts, dates, and technical identifiers.
- **Micro-label:** Uppercase sans or mono with expanded tracking, used sparingly.

**The Quiet Hierarchy Rule.** Use weight, spacing, and type family before adding
size or color.

## Layout

Most content uses a 672px reading column with 24px page gutters and 64px
vertical page padding. The homepage increases its vertical padding to 80px on
larger screens and separates major sections by 80px. Wider project and header
surfaces may use a 1024px shell. The recurring rhythm uses 4px, 8px, 16px, 24px,
40px, and 80px intervals.

The responsive system begins with the narrow layout, then expands at 640px,
768px, and 1024px. Below 360px, header density reduces while interactive targets
remain at least 44px. List rows and mobile navigation commonly use 48px targets.

## Elevation & Depth

The system is flat by default. Depth comes from tonal surfaces, borders,
dividers, spacing, and state changes. The desktop overflow-navigation popover
is the single structural exception: it uses the incumbent large overlay shadow
to separate a temporary menu from page content. Pixel art may be clipped by a
gently rounded frame, but it does not float above the page.

**The Flat-by-Default Rule.** Create separation with paper, rules, and rhythm.
Reserve the large shadow for temporary overlay navigation, never content cards.

## Shapes

Corners are compact and functional: 4px for inline focus targets, 6px for most
controls, and 8px for cards and artwork. Full pills are reserved for filters,
segmented choices, and circular media. One-pixel neutral borders describe
controls without making the interface feel boxed in.

## Components

### Buttons

- **Shape:** Gently curved controls with a 6px radius and a 44px minimum height.
- **Primary:** Teal background, high-contrast action ink, medium-weight label,
  and compact horizontal padding.
- **Hover / Focus:** A darker teal hover in light mode, a lighter teal hover in
  dark mode, and a visible two-pixel teal focus ring with page-colored offset.
- **Press:** A subtle 0.98 scale provides tactile confirmation.

### Chips

- **Style:** Full-pill outline controls with muted text at rest.
- **State:** Selected filters use the interaction color while retaining clear
  text contrast. Every chip preserves the 44px target.

### Cards / Containers

- **Corner Style:** An 8px radius.
- **Background:** Soft paper for grouped forms and muted cards; plain paper for
  most editorial content.
- **Shadow Strategy:** None.
- **Border:** Light rules only when the grouping needs a hard edge.
- **Internal Padding:** Usually 16px, increasing only for wider project cards.

### Inputs / Fields

- **Style:** Page-colored field, one-pixel neutral border, 6px radius, and 44px
  minimum height.
- **Focus:** The same visible two-pixel teal ring as other controls.
- **Error / Disabled:** Error copy uses amber; disabled actions retain their
  shape and reduce opacity.

### Navigation

Navigation uses compact Geist labels, muted rest states, and teal or foreground
emphasis for hover and active states. Desktop navigation stays in the fixed
64px header; smaller layouts use an accessible menu with focus containment,
Escape handling, and the same touch-target rules.

### Editorial List Row

Rows combine a small media or icon tile, a title and context block, and
right-aligned mono metadata. A light divider provides continuity, while hover
adds only a soft-paper surface.

### Pixel Identity

The portrait, animated monogram, and poster-cat scene are signature components.
Use one as an identifying gesture, preserve hard pixel edges, and keep it
secondary to the page's evidence.

## Do's and Don'ts

### Do:

- **Do** reserve teal for links, focus, selection, and action.
- **Do** organize document-like content with whitespace, soft surfaces, and
  light dividers.
- **Do** keep metadata compact, monospaced, and secondary.
- **Do** preserve 44px interactive targets, visible focus, dark-mode parity,
  and reduced-motion behavior.
- **Do** let one pixel-art element provide the page's personality.

### Don't:

- **Don't** add decorative gradients, shadows, or accent washes.
- **Don't** turn every content block into a bordered card.
- **Don't** use teal for noninteractive emphasis.
- **Don't** add oversized marketing typography or dense dashboard chrome.
- **Don't** animate essential information or ignore reduced-motion preferences.
