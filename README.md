# Pro Climbing Viewer

Zoom in on climbers during World Climbing boulder semifinals using keys 1–4.

## Description

World Climbing boulder semifinal streams often have 4 small video feeds at
the top showing each of the 4 climbers. This addon allows easily zooming in
to one of those 4 feeds using the keys 1-4, and returning to the normal
view with 0 or 5.

This is a Firefox port of the Chrome extension originally written by
Simon M. and published at 
https://chromewebstore.google.com/detail/pro-climbing-viewer/kgconjiihlekdadbmidcodlajddpfchf

## Developer documentation

### Setup

```bash
npm install
```

### `npm run` commands

| Command | Description |
|---|---|
| `npm run lint` | Validate the extension (`manifest.json` + code) with `web-ext lint`. |
| `npm run start:firefox` | Launch Firefox with the extension temporarily loaded, for local testing. |
| `npm run build` | Package the extension into an **unsigned** `.xpi` in `web-ext-artifacts/`. Handy for inspection, but unsigned add-ons can't be installed in release Firefox. |
| `npm run sign` | Sign the current `manifest.json` version to the **unlisted** channel and download the signed `.xpi`. Automated signing (no review wait); the file is self-distributable and installable in release Firefox. |
| `npm run publish` | Submit the current `manifest.json` version to the **listed** channel for public release on [AMO](https://addons.mozilla.org). Goes through Mozilla review before it appears publicly. |

The version being signed/published always comes from `manifest.json`. Note that
AMO version numbers must be unique across both channels, so bump the version
before each `sign`/`publish`.

### Environment variables (for `sign` and `publish`)

Both `sign` and `publish` talk to the AMO API and require your credentials in the
environment. Generate them at addons.mozilla.org → **Manage API Keys**:

```bash
export WEB_EXT_API_KEY=user:xxxxxxxx:123      # JWT issuer
export WEB_EXT_API_SECRET=xxxxxxxxxxxxxxxxxx  # JWT secret
```
