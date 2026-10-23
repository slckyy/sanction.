# sanction.

Checkpoint 1: iPhone-first five-tab skeleton.

The exact supplied 1290 × 2796 PNG backgrounds fill the viewport. The floating glass tab bar overlays them without consuming layout space. Desktop landscape displays a centered portrait canvas with black sidebars.

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

Only the visual skeleton and tab switching are implemented. Data storage and tab content await the owner's next instructions.

The app always starts on `clients.` and returns there when reopened from the background or restored from browser history. The blue background is preloaded for the initial view.

## Checkpoint convention

When the owner ends a request with `build`, implement the requested change and commit the completed checkpoint to `slckyy/sanction.`. Do not change other GitHub repositories or expand the feature scope.
