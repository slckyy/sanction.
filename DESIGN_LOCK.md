# Locked page design — 2026-10-23

The owner approved the completed CALL page on 2026-10-24 as the master for the remaining LUMI pages. This approval includes its character presentation, materials, lighting, interaction, and scrolling. The earlier Clients layout lock below remains the shared layout foundation.

## Approved CALL / Rose master — 2026-10-24

Authoritative implementation: commit `7f28a48a02f316ca1ae9f5b2617efbaf1793501c`, approved by the owner with “that page is perfect. lock it in because essentially everything will be the exact same”. Preserve this checkpoint in Git history and reuse its implementation when the owner requests the next character.

The approved files are `dist/rose-viewer.js`, `dist/assets/rose-lumi-real.glb`, and the existing shared `dist/index.html`, `dist/app.js`, and `dist/styles.css`. The delivered model is `C:\Users\Administrator\Documents\LUMI_lighting_models\rose-lumi-real.glb`. Later documentation-only commits do not replace this visual checkpoint.

Locked presentation and behavior:

- The existing page content, background photograph and crop, typography, layout, responsive sizing, safe areas, blur progression, navigation, and scroll behavior.
- The actual Rose geometry and phone pose, including the repaired curved free arm and seamless shoulder. Preserve the refined phone, cord, and all other approved parts.
- Fine charcoal leather on the body; black molded plastic on the faceplate, handset, and recessed eye interiors; matte cord.
- Powered outer eye rims and handset LED accents, with local light spill. Rose's emission matches the actual under-light hue; the original broader painted eye rings are superseded by this approved outer-rim construction.
- The fixed rose light below LUMI at intensity 19, with the approved environment, fill, exposure, and material settings. Local LED lights follow the character; the main lighting remains fixed while he rotates.
- Transparent 3D rendering in the existing hero, fitted around the full assembly including the cord. No floor, backdrop, extra UI, or layout shift.
- Unrestricted quaternion rotation on all three axes, including roll; immediate dragging; subtle float; smooth return to the approved rest pose in 0.85 seconds (0.22 seconds with reduced motion).
- Rendering on every available display frame, without the former 30 fps throttle or long damping tail. Keep the optimized touch-target updates, native scrolling outside the character, reduced-motion support, and off-screen suspension.
- The pinned title's text alone overlays LUMI during scrolling. Do not restore the header clipping mask or add an opaque/blurred header layer over him.

For subsequent characters, reuse this viewer and material/lighting approach with their own approved poses, accessories, colors, atmosphere references, and existing page content. Fit each full assembly proportionally rather than copying Rose's dimensions or pose. Do not invent variant-specific layout or interaction changes. Further changes to the approved master require an explicit owner request.

### Approved texture and material master

The owner explicitly approved Rose itself on 2026-10-24 and instructed: "re-use those textures on the lumi's and objects as we go forward." Use the actual embedded textures and material definitions in the approved `dist/assets/rose-lumi-real.glb` as the master for future characters and accessories.

- Reuse the approved fine charcoal leather normal/roughness textures and finish on corresponding body surfaces. Adapt UV placement where needed to maintain the same physical grain scale without stretching or visible seams.
- Reuse the approved black molded plastic, matte finishes, and powered LED material system on corresponding accessory and face surfaces, respecting each object's existing material partitions.
- Preserve each variant's approved geometry, pose, accessory design, and distinct accent colors. Reusing Rose's finishes does not transfer Rose's hue to the other variants or make every accessory surface leather.

This lock records approval of Rose; it does not authorize starting the other four characters. Implement each when requested. The earlier empty-hero instruction below applies only to characters not yet authorized for integration.

## Authoritative baseline

The commit finalizing this lock at title weight 400 is the approved checkpoint, superseding the earlier weight-390 lock. Its `dist/index.html` Clients panel, `dist/styles.css`, `dist/app.js`, and existing assets together define the complete reference. Preserve that checkpoint in Git history; use its actual files rather than reconstructing the design from this summary.

## Replication contract

Page text, the editorial photo, the existing page background, and the locked badge fill listed below may differ. Everything else must match the Clients master pixel for pixel at the same viewport, safe-area insets, and scroll position. This includes typography, layout, margins, padding, alignment, photo frame, corner radii, header placement, reserved hero space, blur progression, scrolling, and tab navigation. Only the documented badge accent may vary through a page-specific color variable. Do not introduce other page-specific style overrides or automatic recoloring. Further visual changes require an explicit owner request.

Reuse a single shared layout and stylesheet when implementing the remaining pages. Supply page text and photo as content; do not independently recreate the layout per tab. Preserve existing responsive and safe-area rules. Text length can affect wrapping: fit replacement copy to the same line count and verify equivalent element positions; do not compensate with page-specific font sizes or spacing.

The four other tabs now replicate the Clients markup using the owner's exact text and uploaded editorial photos. Their existing background assets remain in place; their layout, colors, photo frame, blur formula, and typography share the same CSS. The approved Clients baseline remains commit `5f9f0e21f5937971138acc22b66e112ab69985a4`.

The reserved hero is now filled on CALL by the approved Rose master above. Other hero spaces remain empty until the owner requests their character integrations.

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
| Clients | BLUE | `#86A5FF` |
| Events | JADE | `#78D9B5` |
| Notes | GOLDEN | `#F3B363` |

Each badge uses its page's locked color. Badge shape, padding, type, and black text remain shared. These page accents and the existing page backgrounds are approved color variations within the shared layout.
