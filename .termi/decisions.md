# Project Decisions (`PulseRoom`)

## 2026-10-31 — Dual-Transport Multiplayer State Sync (RFC 6455 WebSocket + SSE/Delta Fallback)
- **Decision:** Keep room state authoritative on the server/edge room instance while pairing a native RFC 6455 WebSocket upgrade handler with a low-latency delta sync endpoint (`/api/room/:id/sync`) and `BroadcastChannel` for same-machine multi-window demos.
- **Why:** During incident simulations, cursor telemetry runs at 25–30 Hz while remediation vote cards and pinned log annotations require strict causal ordering. Separating ephemeral cursor frames from versioned room state mutations (`stateVersion`) prevents dropped votes when two engineers click "Approve" within the same 50 ms window.

## 2026-10-31 — Risk-Tiered Quorum Cards for Production Remediation
- **Decision:** Model infrastructure actions (`ROUTINE`, `BREAKING`, `DECISION`) as shared approval cards on the war-room timeline rather than immediate single-click buttons.
- **Why:** In real outages, hasty one-person commands (like flushing a primary cache or draining an availability zone) often turn a partial degradation into a full outage. Requiring a second engineer's approval on `BREAKING` actions directly enforces the two-person rule inside the shared room.

## 2026-11-01 — Deterministic Telemetry Simulation Engine with Live Metric Recovery
- **Decision:** Drive each outage scenario (`db-pool-exhaustion`, `webhook-retry-storm`, `jwt-split-brain`, `worker-memory-leak`) from a deterministic graph tick loop where node error rates, p99 latency, and packet drop probability dynamically recompute based on active remediation cards.
- **Why:** Static mockups don't show whether a fix actually worked or made things worse. By propagating traffic along directed edges every tick, applying a bad fix (e.g., restarting the API gateway during a downstream DB lock) visibly spikes retries, while the right fix drains the queue and restores green packet flow across all connected clients simultaneously.

## 2026-11-01 — '/' Hotkey Opens Live Cursor Chat on the Topology Canvas
- **Decision:** Pressing `/` while the topology canvas is focused opens the live cursor chat bubble anchored to that responder's cursor, and every message typed there is broadcast over WebSocket to all connected responders in real time.
- **Why:** Incident responders already track each other via cursor telemetry; letting them annotate the exact spot on the topology map without leaving the canvas keeps coordination inside the shared view instead of a separate chat sidebar, and the WebSocket broadcast keeps the ephemeral chat frames on the same transport as cursor frames so ordering stays consistent.
