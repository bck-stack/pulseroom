# Known Gotchas & Sharp Edges (`PulseRoom`)

## Cursor Coordinate Normalization Across Different Viewport Sizes
- Raw pixel coordinates (`clientX`, `clientY`) break when one engineer is on a 1440p monitor and another is on a 13-inch laptop.
- **Fix:** Always normalize cursor positions to canvas-space coordinates (`worldX`, `worldY` relative to the 1200x700 topology coordinate system) before broadcasting over the room socket.

## Preventing Stale Presence Ghosts on Tab Close
- Browser tabs killed abruptly don't always send a clean WebSocket close frame before the next heartbeat.
- **Fix:** Room state prunes participant cursors after `12000ms` of inactivity while preserving their historical pins, chat messages, and remediation votes in the incident audit log.

## Quorum Deadlock in Single-Reviewer Testing
- If a `BREAKING` remediation card requires 2 approvals, a developer testing alone in a single tab would be blocked unless a second participant joins.
- **Fix:** Added both instant multi-tab room sync (opening a second browser window joins as a second engineer Seat #2) and a toggleable "Simulated SRE Peer (Maya)" autonomous teammate who inspects nodes and casts quorum votes in real time.
