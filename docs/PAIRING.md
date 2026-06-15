# Pairing your phone with the desktop daemon

The 2brn daemon listens on loopback only, so a phone can't reach it until you opt in to
**LAN access** and pair. Pairing mints **your phone its own token** — separate from the
desktop's master token, and revocable on its own — which the phone uses over your home
Wi-Fi. Everything stays on your own network; nothing is sent to any cloud.

## One-time setup

### 1. Enable LAN access on the desktop

Either flip the toggle in the desktop app (**Settings → Connect a phone**), or set it
manually and restart the daemon:

```jsonc
// ~/.2brn/config.json
{ "lan_access": true }
```

The change takes effect on the next daemon restart (the daemon then binds
`0.0.0.0:7842` instead of `127.0.0.1`). A token still gates every request — over the LAN
that's your phone's own per-device token.

### 2. Get the pairing code

In the daemon folder on your desktop:

```bash
uv run python -m brn_daemon.pair
```

This mints a fresh **per-device token** and prints your LAN URL + token, and — if you've
installed the optional `qrcode` package (`uv pip install qrcode`) — a scannable QR code.
(The desktop app's **Connect a device** screen does the same: mint a token, show the QR,
and list/revoke paired devices.)

### 3. Pair on the phone

Open **2brn → Connect a device**:

- **Scan QR** — point the camera at the QR from step 2. Done.
- **Enter manually** — type the URL (e.g. `http://192.168.1.23:7842`) and paste the
  token.

The phone validates the connection, stores the token in the Android Keystore
(`expo-secure-store`), and drops you into the app. You won't need to pair again unless
you disconnect (Settings → Disconnect) or the desktop **revokes** this device.

## Security notes

- The transport is plain HTTP over your LAN; a **token is the gate** (required on every
  endpoint except the `/status` health probe). Over the LAN that's your phone's own
  **per-device token** — the desktop's master token never leaves loopback.
- **Revocable + self-healing.** Each phone gets its own token; revoke any device from the
  desktop's **Connect a device** screen. When a token is revoked, the next request fails
  with `401` and the app **automatically disconnects** back to this pairing screen — no
  hung state, no manual cleanup.
- LAN access is **off by default** — with it off, the daemon behaves exactly as before.
- The token lives only in the phone's hardware-backed keystore and is sent only to the
  URL you paired with.
- Future hardening (not in v1): self-signed TLS + cert pinning, or a self-hostable
  relay / Tailscale for access outside your home network.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Couldn't reach your desktop" | Both devices on the **same Wi-Fi**? Daemon running? `lan_access` on **and daemon restarted**? |
| "That pairing token was rejected" | Re-run `python -m brn_daemon.pair` and re-scan — the token may have changed. |
| Scan does nothing | Ensure good lighting; or use **Enter manually**. |
| Connects then drops | A firewall may be blocking port **7842** on the desktop — allow it on the local network. |
| Suddenly back at the pairing screen | This device's token was **revoked** on the desktop (Connect a device → remove). Pair again to mint a new one. |
