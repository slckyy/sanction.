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

The clients page follows the supplied video and still references: centered `CLIENTS • MANAGEMENT`, a deliberately empty hero, the `BLUE` badge beside `CLIENTELE LUMI`, the exact description, a rounded portrait photo, and a native `CLIENTS` disclosure showing `no clients open.`. Other tabs retain their background-only content. No client data storage has been added.

The header scrolls offscreen with the page. The hero occupies 60% of the viewport (559px on the 932px-tall target iPhone), with 16px content margins. The photo frame follows the reference's 655:1111 ratio and 24px corner radius. The original repository `client-photo.png` is copied byte-for-byte into `dist/assets/`; CSS crops its center to the frame without stretching the source image. No object, placeholder, spin controls, or object animation is present in the reserved hero space.

The updated visual lock uses black/gray text with a blue badge background `#86A5FF`. The prior colored-heading/text treatment is superseded by this editorial direction. System sans-serif typography is paired with a small bold monospace edition label. Scrolling gradually blurs the original background into a blue gradient; a feathered translucent pale-blue tint supports black text. Never add a top strip, top backdrop, or bar behind the Dynamic Island. Navigation is solid black, with uppercase labels, gray inactive labels, a white active label, and four short white separators.

The app always starts on `clients.` and returns there when reopened from the background or restored from browser history. The blue background is preloaded for the initial view.

The app icon is the owner's original `Untitled design.png` (1024 × 1024 RGBA), copied byte-for-byte to `dist/assets/sanction-icon.png`. Its transparency is preserved. Both HTML entry points and the web app manifest reference this icon.

## Checkpoint convention

When the owner ends a request with `build`, implement the requested change and commit the completed checkpoint to `slckyy/sanction.`. Do not change other GitHub repositories or expand the feature scope.
