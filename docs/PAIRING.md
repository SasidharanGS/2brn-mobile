# Pairing your phone with the desktop daemon

The 2brn daemon listens on loopback only and requires a per-machine bearer token, so
a phone can't reach it until you opt in to **LAN access** and pair. Everything stays
on your own network — nothing is sent to any cloud.

## One-time setup

### 1. Enable LAN access on the desktop

Either flip the toggle in the desktop app (**Settings → Connect a phone**), or set it
manually and restart the daemon:

```jsonc
// ~/.2brn/config.json
{ "lan_access": true }
```

The change takes effect on the next daemon restart (the daemon then binds
`0.0.0.0:7842` instead of `127.0.0.1`). The bearer token still gates every request.

### 2. Get the pairing code

In the daemon folder on your desktop:

```bash
uv run python -m brn_daemon.pair
```

This prints your LAN URL and token, and — if you've installed the optional `qrcode`
package (`uv pip install qrcode`) — a scannable QR code. (The desktop app's
**Connect a phone** panel shows the same QR.)

### 3. Pair on the phone

Open **2brn → Connect a device**:

- **Scan QR** — point the camera at the QR from step 2. Done.
- **Enter manually** — type the URL (e.g. `http://192.168.1.23:7842`) and paste the
  token.

The phone validates the connection, stores the token in the Android Keystore
(`expo-secure-store`), and drops you into the app. You won't need to pair again unless
you disconnect (Settings → Disconnect) or the token changes.

## Security notes

- The transport is plain HTTP over your LAN; the **bearer token is the gate** (it's
  required on every endpoint except the `/status` health probe).
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
