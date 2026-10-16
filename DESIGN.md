# Design system

Corporate B2B visual language for the AquaChile recruitment portal. Apply these tokens and component rules consistently to the public evaluation
form and the admin dashboard while retaining each page's established
composition. Shared CSS tokens live in `src/styles/index.css`; dashboard layout
details live in `src/styles/admin.css`.

The palette below describes the supplied design reference, not a mandate to
replace established AquaChile branding or previously approved page layouts.
Prefer the current page's brand colors and composition when applying shared
typography, spacing, borders, and accessibility states.

## Visual principles

- Prioritize clarity, trust, and quick completion over decoration.
- Use a cool off-white canvas for administrative views and preserve the public
  form's branded photographic background and glass panel.
- Keep the admin's navy navigation and AquaChile teal as the established
  primary action color; use the corporate orange only where a page already
  uses the orange action palette.
- Keep information grouped with subtle borders and restrained shadows.
- Maintain consistent vertical rhythm and readable contrast at every viewport.

## Color tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-color-canvas` | `#F4F6F8` | Page background |
| `--ui-color-surface` | `#FFFFFF` | Cards, fields, and tables |
| `--ui-color-surface-muted` | `#F8FAFC` | Utility and table header surfaces |
| `--ui-color-primary` | `#D94E1F` | Primary actions, focus, and active emphasis |
| `--ui-color-primary-hover` | `#C03F14` | Primary action hover |
| `--ui-color-primary-active` | `#A8350F` | Primary action pressed |
| `--ui-color-slate` | `#2E3E48` | Navigation and institutional headings |
| `--ui-color-slate-light` | `#3A4D59` | Secondary navigation surface |
| `--ui-color-tertiary` | `#4A6070` | Supporting emphasis |
| `--ui-color-text` | `#1A252C` | Primary text |
| `--ui-color-muted` | `#5A6570` | Supporting text and metadata |
| `--ui-color-border` | `#D1D5DB` | Standard borders |
| `--ui-color-error` | `#DC2626` | Validation errors |

## Typography

Use `Inter, ui-sans-serif, system-ui, sans-serif` for all pages. The browser
falls back to its system sans-serif if Inter is not installed.

- Main heading: 32px/40px, 700; mobile 26px/34px.
- Section heading: 20px/28px, 600.
- Small heading: 16px/24px, 600.
- Body large: 15px/24px; standard body: 13px/20px; supporting text: 12px/18px.
- Large, medium, and small labels: 14px/20px, 13px/18px, and 11px/16px.

## Layout, spacing, and shapes

- Canvas: `#F4F6F8`; content cards and form fields: white.
- Center the public form in a constrained card up to 760px wide.
- Use 36px card padding on desktop, 24px on tablet, and safe 16px gutters on
  mobile; remove excess outer elevation at narrow widths.
- Use 4px, 8px, 16px, 24px, and 36px spacing steps. Keep 24px between form
  fields and 4px between a field and its supporting text.
- Inputs and buttons: 4–6px radius. Cards: 8px radius. Status badges: pill.
- Level 1 shadow: `0 4px 20px -2px rgba(46, 62, 72, 0.08), 0 2px 6px -1px rgba(46, 62, 72, 0.04)`.

## Components

- Primary buttons use orange `#D94E1F`, white semibold text, 10px 24px padding,
  and a 4px radius. Hover to `#C03F14`; pressed to `#A8350F`; keyboard focus
  uses a 3px `rgba(217, 78, 31, 0.25)` ring.
- Secondary buttons use a transparent background, gray border, and slate text.
- Inputs use white background, `#D1D5DB` border, 10px 14px padding,
  `#1A252C` text, and `#9CA3AF` placeholder. Focus uses orange border and a
  soft orange ring.
- Helper text uses muted gray and sits 4px below its control. Errors use
  `#DC2626` for text and border.
- Navigation uses slate `#2E3E48` (optionally `#3A4D59`) with a subtle bottom
  border and high-contrast white brand mark.
- Use orange for links and active controls; underline links on hover.
- Status indicators remain distinguishable by label and restrained status
  colors, not color alone.

## Responsive behavior

- Desktop: centered constrained content, persistent admin navigation, spacious
  card padding.
- Tablet: 32px outer margins and 24px card padding.
- Mobile: 16px safe gutters, stacked controls, compact card padding, and
  horizontally scrollable wide tables where needed.
