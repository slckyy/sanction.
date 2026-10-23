# Locked page design — 2026-10-23

The owner approved the existing Clients page as the exact visual master for every page, with the title finalized at 15px and weight 400.

## Authoritative baseline

The commit finalizing this lock at title weight 400 is the approved checkpoint, superseding the earlier weight-390 lock. Its `dist/index.html` Clients panel, `dist/styles.css`, `dist/app.js`, and existing assets together define the complete reference. Preserve that checkpoint in Git history; use its actual files rather than reconstructing the design from this summary.

## Replication contract

Page text, the editorial photo, the existing page background, and the locked badge fill listed below may differ. Everything else must match the Clients master pixel for pixel at the same viewport, safe-area insets, and scroll position. This includes typography, layout, margins, padding, alignment, photo frame, corner radii, header placement, reserved hero space, blur progression, scrolling, and tab navigation. Only the documented badge accent may vary through a page-specific color variable. Do not introduce other page-specific style overrides or automatic recoloring. Further visual changes require an explicit owner request.

Reuse a single shared layout and stylesheet when implementing the remaining pages. Supply page text and photo as content; do not independently recreate the layout per tab. Preserve existing responsive and safe-area rules. Text length can affect wrapping: fit replacement copy to the same line count and verify equivalent element positions; do not compensate with page-specific font sizes or spacing.

The four other tabs now replicate the Clients markup using the owner's exact text and uploaded editorial photos. Their existing background assets remain in place; their layout, colors, photo frame, blur formula, and typography share the same CSS. The approved Clients baseline remains commit `5f9f0e21f5937971138acc22b66e112ab69985a4`.

The owner clarified that this lock is the starting design for future page additions, including the floating element in the reserved hero. Keep that space empty until the owner requests that work.

## Key locked values

| Element | Values |
| --- | --- |
| Pinned title | 15px; weight 400; line-height 24px; letter-spacing -0.45px; centered |
| Title position | top: safe-area inset + 23px; left/right: 16px |
| Description and section heading | shared inherited system font; weight 375; size clamp(27px, 7.45cqw, 34px); line-height 1.02; letter-spacing -1.3px |
| Hero | 60% of app height; minimum 370px |
| Content side insets | max(16px, corresponding safe-area inset) |
| Edition label | monospace; 11px; weight 400; 8px gap; minimum height 21px |
| Description margins | 18px above and below |
| Photo | full content width; 655:1111 aspect ratio; centered cover crop; 24px radius |
| Section heading | 32px gap after photo; left aligned; zero margin |
| Navigation | preserve exact existing black pill geometry, typography, separators, and safe-area offsets |
| Blur and background | preserve all existing CSS values and scroll-driven behavior exactly |

The Clients copy remains “Clients • Management”, “The space where all of your confirmed prospects are managed.”, and “Zero confirmed clients:”. The count updates in English words when direct client list items are added or removed.

## Verification and delivery

Compare every replicated page to the master at identical viewport and scroll positions, including 430 × 932 CSS pixels. Check header and content coordinates, text metrics, photo bounds, navigation, and blur. Keep all non-content styling shared. Update the stylesheet cache version on every CSS change, commit to `slckyy/sanction.`, and distinguish a committed change from a verified live deployment.

## Locked badge palette

| Page | Badge | Fill |
| --- | --- | --- |
| Call | ROSE | `#F28B96` |
| Email | VIOLET | `#C394EE` |
| Clients | BLUE | `#86A5FF` |
| Events | JADE | `#78D9B5` |
| Notes | GOLDEN | `#F3B363` |

Each badge uses its page's locked color. Badge shape, padding, type, and black text remain shared. These page accents and the existing page backgrounds are approved color variations within the shared layout.
