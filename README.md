# sanction.

Current checkpoint: clients editorial page and black tab navigation.

The exact supplied 1290 × 2796 PNG backgrounds fill the viewport. The solid black pill tab bar overlays them without consuming layout space. Desktop landscape displays a centered portrait canvas with black sidebars.

| Tab | Background |
| --- | --- |
| call. | Rose |
| email. | Violet |
| clients. | Blue |
| events. | Green |
| notes. | Golden |

Static HTML, CSS, and JavaScript live in `dist/`. No install or build step is required. Serve `dist/` with any static web server. Sites hosting is configured in `.openai/hosting.json`.

For the iPhone full-screen presentation, open in Safari and add to the Home Screen. The standalone status-bar configuration allows the background beneath the status area; browser chrome remains controlled by Safari in a normal tab.

The root, body, and app use `100lvh` (with `100vh` fallback) in standalone/fullscreen display modes. This avoids the shortened `100dvh` reported by some iOS Home Screen apps. Browser tabs retain dynamic viewport sizing. Safe-area spacing applies to the floating navigation, not the background.

The clients page follows the supplied video and still references: centered `CLIENTS • MANAGEMENT`, a deliberately empty hero, the `BLUE` badge beside `CLIENTELE LUMI`, the exact description `the space where all of your confirmed prospects are managed`, a rounded portrait photo, and a left-aligned `CLIENTS | 0 CONFIRMED.` heading above an empty list. Other tabs retain their background-only content. No client data storage has been added.

The regular-weight header stays at its original safe-area position while the content scrolls beneath it; the header has no background, border, or blur strip. The hero occupies 60% of the viewport (559px on the 932px-tall target iPhone), with 16px content margins. The photo frame follows the reference's 655:1111 ratio and 24px corner radius. The original repository `client-photo.png` is copied byte-for-byte into `dist/assets/`; CSS crops its center to the frame without stretching the source image. No object, placeholder, spin controls, or object animation is present in the reserved hero space.

The updated visual lock uses black/gray text with a blue badge background `#86A5FF`. The prior colored-heading/text treatment is superseded by this editorial direction. System sans-serif typography is paired with a regular-weight monospace edition label. The pinned title and description share the same inherited font family and regular weight 400; its photo gap is 18px with no minimum-height spacer. The count heading and description use shared CSS rules for identical font family, weight 400, size, line height, and letter spacing. The count heading aligns to the same left inset as the description and photo. Its number is derived from direct LI children in `#confirmed-clients` and updates on additions/removals via MutationObserver. The empty list is hidden with no empty-state message. Scrolling moves a single long, eased mask over a preblurred copy of the existing sky, rather than changing a global blur radius or using a short frosted panel. The fade begins 180px above the edition label and spans 58% of the viewport, clamped to 360–600px, with a subtle pale-blue tint blended through the same mask. Never add a top strip, top backdrop, or bar behind the Dynamic Island. Navigation is solid black, with uppercase labels, gray inactive labels, a white active label, and four short white separators.

The app always starts on `clients.` and returns there when reopened from the background or restored from browser history. The blue background is preloaded for the initial view.

The app icon is the owner's original `Untitled design.png` (1024 × 1024 RGBA), copied byte-for-byte to `dist/assets/sanction-icon.png`. Its transparency is preserved. Both HTML entry points and the web app manifest reference this icon.

## Checkpoint convention

When the owner ends a request with `build`, implement the requested change and commit the completed checkpoint to `slckyy/sanction.`. Do not change other GitHub repositories or expand the feature scope.
