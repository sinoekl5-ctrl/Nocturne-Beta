# Nocturne visual prototype

A dependency-free, static browser-chrome concept for the Nocturne design foundation. It is deliberately separate from Chromium so the five Space moods and sidebar interactions can be reviewed before an engine integration is selected.

## Run

Requires Node.js 20 or newer. From the repository root:

```sh
npm run dev
```

Open `http://127.0.0.1:4173`. No package installation or external font download is required.

## Interactions

- Choose Atelier, Gambit, Vigil, Drift, or Ember in the Space switcher (keys `1`–`5`).
- Open the command bar with `Ctrl/Cmd + L`; it filters the sample tabs/actions, recognizes local preview addresses, and evaluates simple arithmetic without `eval`.
- Toggle split view, reading mode, Day Study, high contrast, reduced motion, RTL mirroring, texture, and private-room presentation in Preferences.
- Add a tab or pin and collapse the tab folders.

## Honest boundary

This is not a browser and does not load websites. It has no Chromium process, web contents, real profiles, cookie stores, history, extension support, downloads, or security boundary. The page area is a static sample document. “Private room” is a UI state only and must never be described as secure isolation. Local settings persistence is intentionally not implemented yet.
