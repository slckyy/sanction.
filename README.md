# sanction.

Current checkpoint: Scheduler events, Past Events, and the circular Call import control. See [DESIGN_LOCK.md](DESIGN_LOCK.md) for the underlying approved design.

## Scheduler

Events has a matching circular plus control at the top left and an arrow to Past Events at the top right. The plus opens a Jade popup with Event Name, Event Details, a local date/time picker, and a white SCHEDULE EVENT button with black text. Events persist in this browser/device in the separate `sanction-events` IndexedDB database. No reminders or notification permissions are included, as requested.

Event cards reuse the client card spacing, typography, corners, and action row with Jade fill. They show a single-line name with ellipsis, the scheduled date with its ordinal suffix, Delete, and Details; there is no niche field or row. Details opens the shared Jade popup with the full name, exact notes, and scheduled date/time separated by horizontal rules. Upcoming Delete offers DELETE and DONE EARLY. Done Early moves the record to Past Events without losing its information. Events also move there at their scheduled instant, including when reopening after that time. Past Events uses the list-only layout and offers YES/NO before permanent deletion.

## Shared client lists

Call, Clients, and Lost render through the same card builder and CSS: the same typography, 16px corners, padding, 12px list gap, date/niche placement, and bottom action row. Their fills use Rose `#F28B96`, Blue `#86A5FF`, and Gray `#A5A9B2`. Active Clients use Jade `#78D9B5` for the name, Details, and Send text; the date and niche retain their original color.

The transparent circular X at the top left of Home opens `Sanction • Lost Clients`, using the owner's unchanged `lost-clients-bg.png`. This page contains the shared list directly beneath the pinned title and a white return button.

- Call's `Send to →`: `SEND TO LOST` or `SEND TO CLIENTS`.
- Clients' `Send to →`: `SEND TO LOST` or `ACTIVATE CLIENT`. Active clients show `DEACTIVATE` instead; deactivation restores white text and the activation option. This can be toggled repeatedly and persists after reopening.
- Lost's `Delete`: `DELETE CLIENT` or `SEND TO CALL LIST`.

All actions use the same accent-colored popup with two 52px buttons and an 8px gap. Moves and activation update the existing IndexedDB record atomically; deletion permanently removes that record. Original fields and IDs survive transfers. Old imports with no list metadata remain in Call. Sending an active client to Lost resets activation, and restoring sends it to Call. Counts update when cards move.

The matching circular copy control at the top left of Call copies the exact supplied research prompt, including its final edit note, with the START/END delimiters excluded. `dist/research-prompt.js` stores the full text; it is preloaded so clipboard access starts immediately from the tap gesture.

## Edit 1 — client import

The Call manager has a transparent circular down-arrow import control at the top right, matching the copy control at the top left. It replaces the former footer IMPORT CLIENTS button while preserving the same file picker and import flow. Shared full-width action buttons are 52 CSS pixels high with an 8-pixel stacked gap, regular-weight labels without periods, and white return buttons with black text.

Choose a JSON file containing an array of objects with `business_name`, `phone_number`, `date_added`, `business_info`, `google_page`, and `niche`. All fields are strings except `google_page`, which may be null. Dates are displayed exactly as supplied. The import preserves repeated records and has no hard-coded record-count limit. Invalid files and failed storage transactions do not partially add clients.

Imported prospects appear in the Call manager under its live word-based count. Cards use its Rose accent; business names are telephone links. Details opens a matching dialog with all six fields, a clickable Google URL when supplied, and a close button. Import reuses the startup screen and fade, with progress driven by file reading, validation/card preparation, IndexedDB writes, and list rendering. It returns to the originating page without resetting its scroll position.

Client records persist in IndexedDB in the current browser/device for this site origin. They are not uploaded to GitHub or synchronized across devices. Deletion is available through the Lost list; imports do not filter duplicates. The supplied real-client sample is not committed to the public repository.

GitHub Pages serves the root redirect into `dist/`. Publish each edit checkpoint to `main` and verify the corresponding Pages deployment; a local edit or commit alone is not a published checkpoint.

The exact supplied 1290 × 2796 PNG backgrounds fill the viewport. The solid black pill tab bar overlays them without consuming layout space. Desktop landscape displays a centered portrait canvas with black sidebars.

| Tab | Background |
| --- | --- |
| call. | Rose |
| clients. | Blue |
| events. | Green |
| notes. | Golden |

Static HTML, CSS, and JavaScript live in `dist/`. No install or build step is required. Serve `dist/` with any static web server. Sites hosting is configured in `.openai/hosting.json`.

For the iPhone full-screen presentation, open in Safari and add to the Home Screen. The standalone status-bar configuration allows the background beneath the status area; browser chrome remains controlled by Safari in a normal tab.

The root, body, and app use `100lvh` (with `100vh` fallback) in standalone/fullscreen display modes. This avoids the shortened `100dvh` reported by some iOS Home Screen apps. Browser tabs retain dynamic viewport sizing. Safe-area spacing applies to the floating navigation, not the background.

The clients page follows the supplied video and still references: centered `Clients • Management`, a deliberately empty hero, the `BLUE` badge beside `CLIENTELE LUMI`, the exact description `The space where all of your confirmed prospects are managed.`, a rounded portrait photo, and a left-aligned `Zero confirmed clients:` heading above an empty list. Call, Events, and Notes now clone this exact Clients markup with owner-supplied text and editorial photos. Their pre-existing tab backgrounds are preserved. All pages share typography, spacing, badge styling, photo geometry, blur behavior, and navigation. Each page has its own list and word-based count; Edit 1 adds JSON import and persistent client storage as described above.

The regular-weight header stays at its original safe-area position while the content scrolls beneath it; the header has no background, border, or blur strip. The hero occupies 60% of the viewport (559px on the 932px-tall target iPhone), with 16px content margins. The photo frame follows the reference's 655:1111 ratio and 24px corner radius. The original repository `client-photo.png` is copied byte-for-byte into `dist/assets/`; CSS crops its center to the frame without stretching the source image. No object, placeholder, spin controls, or object animation is present in the reserved hero space.

The updated visual lock uses black/gray text with page-matched badge fills: Rose `#F28B96`, Blue `#86A5FF`, Jade `#78D9B5`, and Golden `#F3B363`. The prior colored-heading/text treatment is superseded by this editorial direction. System sans-serif typography is paired with a regular-weight monospace edition label. The pinned title uses the inherited system font at 15px and weight 400. The description's photo gap is 18px with no minimum-height spacer. The count heading and description use shared CSS rules for identical font family, weight 375, size, line height, and letter spacing. The count heading aligns to the same left inset as the description and photo. Its count is written in words (Zero, One, Two, etc.), with singular/plural client wording. Each page's count is derived from direct LI children in its own list and updates on additions/removals via MutationObserver. The empty list is hidden with no empty-state message. Scrolling moves a single long, eased mask over a preblurred copy of the existing sky, rather than changing a global blur radius or using a short frosted panel. The fade begins 180px above the edition label and spans 58% of the viewport, clamped to 360–600px, with a subtle pale-blue tint blended through the same mask. Never add a top strip, top backdrop, or bar behind the Dynamic Island. Navigation is solid black, with uppercase labels, gray inactive labels, a white active label, and four short white separators.

The app always starts on `clients.` and returns there when reopened from the background or restored from browser history. The blue background is preloaded for the initial view.

Both HTML entry points use the owner's supplied 180 × 180 `sanction.png`, copied unchanged to `dist/assets/sanction.png`, as the Apple touch icon. The browser favicon and web app manifest retain the 1024 × 1024 `dist/assets/sanction-icon-black.png` asset.

## Checkpoint convention

When the owner ends a request with `build`, implement the requested change and commit the completed checkpoint to `slckyy/sanction.`. Do not change other GitHub repositories or expand the feature scope.

## Page content and counters

All page content is configured in `dist/app.js`; the Clients panel in `dist/index.html` is the shared visual template. Each page has an independent scroll/blur state and an independent observed list.

| Tab | Photo | List ID | Empty heading |
| --- | --- | --- | --- |
| Call | rose-photo.png | clients-to-call | Zero clients to call: |
| Clients | client-photo.png | confirmed-clients | Zero confirmed clients: |
| Events | jade-photo.png | scheduled-events | Zero events scheduled: |
| Notes | golden-photo.png | written-notes | Zero notes written: |

The three added photos are copied byte-for-byte from the uploaded root files into `dist/assets/`. The reserved hero stays empty for the later floating element. The locked design is a baseline for future owner-requested additions, not a ban on future features.
