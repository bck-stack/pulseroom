export function renderAppHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PulseRoom — Multiplayer Incident War-Room & System Topology Canvas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-0: #07090e;
      --bg-1: #0d111a;
      --bg-2: #131926;
      --bg-3: #1c2436;
      --border: #232d42;
      --text-0: #f8fafc;
      --text-1: #94a3b8;
      --text-2: #64748b;
      --accent: #38bdf8;
      --emerald: #10b981;
      --amber: #f59e0b;
      --crimson: #f43f5e;
      --violet: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-0);
      color: var(--text-0);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      user-select: none;
    }
    code, pre, .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    /* Top Header */
    .topbar {
      height: 58px;
      background: rgba(13, 17, 26, 0.92);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      gap: 12px;
      z-index: 20;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f43f5e, #a855f7, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 0 18px rgba(244, 63, 94, 0.35);
    }
    .brand-title {
      font-weight: 700;
      font-size: 15px;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--text-1);
      display: block;
    }

    .incident-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      padding: 5px 10px;
      border-radius: 8px;
    }
    .sev-badge {
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .sev-badge.ACTIVE_OUTAGE {
      background: rgba(244, 63, 94, 0.18);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.45);
      animation: pulseRed 1.8s infinite;
    }
    .sev-badge.MITIGATING {
      background: rgba(245, 158, 11, 0.18);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
    }
    .sev-badge.RESOLVED {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.45);
    }
    @keyframes pulseRed {
      0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.35); }
      50% { box-shadow: 0 0 0 6px rgba(244, 63, 94, 0); }
    }

    select.scenario-select {
      background: var(--bg-1);
      color: var(--text-0);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 8px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .presence-list {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 4px;
    }
    .avatar-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 3px 10px 3px 5px;
      font-size: 11px;
      font-weight: 500;
    }
    .avatar-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #07090e;
    }

    .btn {
      background: var(--bg-2);
      color: var(--text-0);
      border: 1px solid var(--border);
      border-radius: 7px;
      padding: 6px 11px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--bg-3);
      border-color: #3b4b6b;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      border-color: #38bdf8;
    }
    .btn-primary:hover {
      filter: brightness(1.1);
    }
    .btn-emerald {
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.45);
    }
    .btn-emerald:hover {
      background: rgba(16, 185, 129, 0.28);
    }
    .btn-crimson {
      background: rgba(244, 63, 94, 0.14);
      color: #fb7185;
      border-color: rgba(244, 63, 94, 0.4);
    }

    /* Main Workspace Grid */
    .workspace {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 410px;
      overflow: hidden;
    }
    .left-column {
      display: grid;
      grid-template-rows: 1fr 255px;
      overflow: hidden;
      border-right: 1px solid var(--border);
    }

    /* Canvas Stage */
    .canvas-stage {
      position: relative;
      background:
        radial-gradient(circle at 50% 45%, rgba(56, 189, 248, 0.06), transparent 65%),
        linear-gradient(to right, rgba(35, 45, 66, 0.26) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(35, 45, 66, 0.26) 1px, transparent 1px);
      background-size: 100% 100%, 32px 32px, 32px 32px;
      overflow: hidden;
    }
    canvas#topologyCanvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: crosshair;
    }

    /* Floating Canvas Overlays */
    .canvas-hud-top {
      position: absolute;
      top: 12px;
      left: 14px;
      right: 14px;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      gap: 10px;
    }
    .hud-card {
      pointer-events: auto;
      background: rgba(13, 17, 26, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 8px 12px;
      font-size: 12px;
      max-width: 540px;
    }
    .hud-metrics {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .metric-box {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      color: var(--text-1);
      letter-spacing: 0.05em;
    }
    .metric-val {
      font-size: 15px;
      font-weight: 700;
    }

    .canvas-toolbar {
      position: absolute;
      bottom: 12px;
      left: 14px;
      display: flex;
      gap: 6px;
      background: rgba(13, 17, 26, 0.9);
      border: 1px solid var(--border);
      padding: 5px;
      border-radius: 8px;
    }
    .tool-btn {
      background: transparent;
      color: var(--text-1);
      border: 1px solid transparent;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .tool-btn.active {
      background: rgba(56, 189, 248, 0.16);
      color: var(--accent);
      border-color: rgba(56, 189, 248, 0.4);
    }

    /* Bottom Telemetry & Evidence Panel */
    .telemetry-panel {
      background: var(--bg-1);
      border-top: 1px solid var(--border);
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      overflow: hidden;
    }
    .subpanel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid var(--border);
    }
    .subpanel:last-child {
      border-right: none;
    }
    .panel-header {
      height: 36px;
      padding: 0 12px;
      background: var(--bg-2);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-1);
    }
    .log-list, .evidence-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .log-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: rgba(19, 25, 38, 0.7);
      border: 1px solid rgba(35, 45, 66, 0.7);
      font-size: 11.5px;
    }
    .log-row.FATAL, .log-row.ERROR {
      border-left: 3px solid var(--crimson);
      background: rgba(244, 63, 94, 0.06);
    }
    .log-row.WARN {
      border-left: 3px solid var(--amber);
    }
    .log-row.INFO {
      border-left: 3px solid var(--emerald);
    }
    .pin-item {
      padding: 7px 9px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.07);
      border: 1px solid rgba(56, 189, 248, 0.25);
      font-size: 11.5px;
    }

    /* Right Sidebar: Quorum Cards + Chat/Timeline */
    .right-sidebar {
      background: var(--bg-1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .cards-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .vote-card {
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 11px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .vote-card.EXECUTED {
      border-color: rgba(16, 185, 129, 0.5);
      background: rgba(16, 185, 129, 0.06);
    }
    .vote-card.VETOED {
      opacity: 0.55;
      border-color: rgba(244, 63, 94, 0.4);
    }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .tier-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .tier-pill.ROUTINE {
      background: rgba(56, 189, 248, 0.16);
      color: #38bdf8;
    }
    .tier-pill.BREAKING {
      background: rgba(244, 63, 94, 0.18);
      color: #fb7185;
    }
    .tier-pill.DECISION {
      background: rgba(168, 85, 247, 0.18);
      color: #c084fc;
    }
    .card-cmd {
      background: #06080d;
      border: 1px solid #1d2638;
      padding: 6px 8px;
      border-radius: 5px;
      font-size: 11px;
      color: #93c5fd;
      overflow-x: auto;
      white-space: nowrap;
    }
    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 2px;
    }

    /* Room Chat & Audit Log */
    .chat-section {
      height: 255px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      background: var(--bg-0);
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
    }
    .chat-input-row {
      display: flex;
      gap: 6px;
      padding: 8px 10px;
      background: var(--bg-1);
      border-top: 1px solid var(--border);
    }
    .chat-input-row input {
      flex: 1;
      background: var(--bg-2);
      border: 1px solid var(--border);
      color: var(--text-0);
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
    }
    .chat-input-row input:focus {
      border-color: var(--accent);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 6, 10, 0.78);
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-card {
      background: var(--bg-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: min(720px, 92vw);
      max-height: 84vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
    }
    .modal-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    textarea.pm-textarea {
      width: 100%;
      height: 340px;
      background: var(--bg-0);
      color: #e2e8f0;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.55;
      resize: none;
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brand-logo">⚡</div>
      <div>
        <span class="brand-title">PulseRoom</span>
        <span class="brand-sub mono" id="roomCodeDisplay">ROOM: WAR-ROOM-01</span>
      </div>
    </div>

    <div class="incident-bar">
      <span class="sev-badge ACTIVE_OUTAGE mono" id="incidentStatusBadge">SEV-1 · ACTIVE_OUTAGE</span>
      <select class="scenario-select" id="scenarioSelect" title="Switch Live Outage Scenario">
        <option value="db-pool-exhaustion">INC-4021 · Postgres Pool Exhaustion (SEV-1)</option>
        <option value="cache-stampede">INC-4088 · Flash Sale Cache Stampede (SEV-1)</option>
        <option value="jwt-split-brain">INC-4104 · Split-Brain JWT Key Rotation (SEV-2)</option>
      </select>
    </div>

    <div class="topbar-right">
      <div class="presence-list" id="presenceList"></div>
      <button class="btn btn-emerald" id="simulatePeerBtn" title="Trigger AI SRE Teammate (Maya) to inspect, pin evidence, and cast quorum votes">
        🤖 Ask SRE Peer (Maya)
      </button>
      <button class="btn" id="openSecondTabBtn" title="Open a second engineer seat in a new browser window to test live multiplayer cursors & quorum voting">
        👥 +2nd Engineer Window
      </button>
      <button class="btn btn-primary" id="postMortemBtn">
        📋 Post-Mortem
      </button>
    </div>
  </header>

  <main class="workspace">
    <section class="left-column">
      <div class="canvas-stage" id="canvasContainer">
        <canvas id="topologyCanvas"></canvas>

        <div class="canvas-hud-top">
          <div class="hud-card">
            <div style="font-weight:700;font-size:13px;margin-bottom:3px;" id="hudTitle">Loading scenario...</div>
            <div style="color:var(--text-1);font-size:11.5px;" id="hudSummary">Connecting to multiplayer state room...</div>
          </div>

          <div class="hud-card hud-metrics">
            <div class="metric-box">
              <span class="metric-label">Peak p99 Latency</span>
              <span class="metric-val mono" id="metricLatency" style="color:#fb7185">-- ms</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">Global Error %</span>
              <span class="metric-val mono" id="metricError" style="color:#fb7185">-- %</span>
            </div>
            <div class="metric-box">
              <span class="metric-label">Quorum Cards</span>
              <span class="metric-val mono" id="metricCards" style="color:#38bdf8">0 / 0</span>
            </div>
          </div>
        </div>

        <div class="canvas-toolbar">
          <button class="tool-btn active" data-tool="Inspect">🔍 Inspect & Drag</button>
          <button class="tool-btn" data-tool="Trace">📡 Trace Path</button>
          <button class="tool-btn" data-tool="Patch">🛠️ Quorum Patch</button>
          <button class="tool-btn" id="cursorBubbleBtn" title="Shortcut: Press / to broadcast a live floating message on your cursor">💬 Cursor Bubble (/)</button>
        </div>
      </div>

      <div class="telemetry-panel">
        <div class="subpanel">
          <div class="panel-header">
            <span>📡 Live Distributed Telemetry & Logs</span>
            <span class="mono" id="logFilterLabel" style="color:var(--accent)">ALL SERVICES</span>
          </div>
          <div class="log-list" id="logList"></div>
        </div>
        <div class="subpanel">
          <div class="panel-header">
            <span>📌 Shared Root-Cause Evidence Board</span>
            <span class="mono" id="evidenceCount">0 PINNED</span>
          </div>
          <div class="evidence-list" id="evidenceList"></div>
        </div>
      </div>
    </section>

    <aside class="right-sidebar">
      <div class="panel-header">
        <span>🛡️ Multiplayer Quorum Remediation Cards</span>
        <button class="btn" id="newCardModalBtn" style="padding:2px 8px;font-size:10.5px;">+ Propose Card</button>
      </div>
      <div class="cards-container" id="cardsContainer"></div>

      <div class="chat-section">
        <div class="panel-header">
          <span>💬 War-Room Live Stream & Audit Timeline</span>
          <span class="mono" id="syncStatusIndicator" style="color:#34d399">● LIVE SYNC</span>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <form class="chat-input-row" id="chatForm">
          <input type="text" id="chatInput" placeholder="Message war-room & broadcast cursor bubble..." autocomplete="off" />
          <button type="submit" class="btn btn-primary">Send</button>
        </form>
      </div>
    </aside>
  </main>

  <!-- Post-Mortem Modal -->
  <div class="modal-backdrop" id="pmModal">
    <div class="modal-card">
      <div class="panel-header" style="height:44px;font-size:12px;">
        <span>📋 Collaborative Incident Post-Mortem Report</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-emerald" id="copyPmBtn">Copy Markdown</button>
          <button class="btn" id="closePmBtn">Close</button>
        </div>
      </div>
      <div class="modal-body">
        <textarea class="pm-textarea mono" id="pmTextarea" readonly></textarea>
      </div>
    </div>
  </div>

  <!-- Propose Custom Card Modal -->
  <div class="modal-backdrop" id="proposeModal">
    <div class="modal-card" style="width:min(500px, 92vw);">
      <div class="panel-header" style="height:44px;font-size:12px;">
        <span>🛠️ Propose Multiplayer Remediation Card</span>
        <button class="btn" id="closeProposeBtn">Close</button>
      </div>
      <form class="modal-body" id="proposeForm" style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:11px;color:var(--text-1);display:block;margin-bottom:4px;">Action Title</label>
          <input type="text" id="propTitle" required placeholder="e.g., Drain Canary Pods & Increase Pool Timeout" style="width:100%;padding:8px;background:var(--bg-0);border:1px solid var(--border);color:var(--text-0);border-radius:6px;" />
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-1);display:block;margin-bottom:4px;">CLI / SQL Remediation Command</label>
          <input type="text" id="propCmd" required placeholder="pulseroom-ctl drain --canary && pg_reload_conf()" class="mono" style="width:100%;padding:8px;background:var(--bg-0);border:1px solid var(--border);color:#93c5fd;border-radius:6px;" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:11px;color:var(--text-1);display:block;margin-bottom:4px;">Risk Tier & Quorum Rule</label>
            <select id="propTier" style="width:100%;padding:8px;background:var(--bg-0);border:1px solid var(--border);color:var(--text-0);border-radius:6px;">
              <option value="BREAKING">BREAKING (Requires 2 Approvals)</option>
              <option value="DECISION">DECISION (Requires 2 Approvals)</option>
              <option value="ROUTINE">ROUTINE (1 Approval Clears)</option>
            </select>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-1);display:block;margin-bottom:4px;">Target Service Node</label>
            <select id="propNode" style="width:100%;padding:8px;background:var(--bg-0);border:1px solid var(--border);color:var(--text-0);border-radius:6px;"></select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="justify-content:center;padding:9px;">Submit Card to War-Room</button>
      </form>
    </div>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const ROOM_ID = (urlParams.get('room') || 'WAR-ROOM-01').toUpperCase();
    const SEAT_NUM = urlParams.get('seat') || (sessionStorage.getItem('pulseroom_seat') || '');
    const PALETTE = ['#38bdf8', '#f43f5e', '#a855f7', '#eab308', '#ec4899', '#14b8a6'];
    const DEFAULT_NAMES = ['Bolat (Lead SRE)', 'Kaan (Infra Eng)', 'Alex (DB Reliability)', 'Zin (Edge Ops)'];

    const seatIdx = SEAT_NUM ? (parseInt(SEAT_NUM, 10) - 1) : Math.floor(Math.random() * 100);
    const USER_ID = sessionStorage.getItem('pulseroom_uid') || ('eng-' + Math.random().toString(36).slice(2, 8));
    sessionStorage.setItem('pulseroom_uid', USER_ID);

    const USER_NAME = urlParams.get('name') || sessionStorage.getItem('pulseroom_name') || DEFAULT_NAMES[seatIdx % DEFAULT_NAMES.length];
    sessionStorage.setItem('pulseroom_name', USER_NAME);
    const USER_COLOR = PALETTE[seatIdx % PALETTE.length];

    document.getElementById('roomCodeDisplay').textContent = 'ROOM: ' + ROOM_ID + ' · ' + USER_NAME;

    let roomState = null;
    let selectedNodeId = null;
    let currentTool = 'Inspect';
    let myCursor = { x: 480, y: 300, bubbleText: '' };
    let draggingNode = null;
    let particles = [];
    let lastRenderedVersion = -1;

    // Web Audio tactical feedback
    function playTone(freq = 520, duration = 0.09, type = 'sine') {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {}
    }

    // BroadcastChannel for ultra-fast multi-tab sync + WebSocket/Fetch server sync
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pulseroom_' + ROOM_ID) : null;
    if (bc) {
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'CURSOR_FAST' && roomState?.participants) {
          roomState.participants[ev.data.userId] = ev.data.payload;
        } else if (ev.data?.type === 'STATE_UPDATED') {
          fetchRoomState();
        }
      };
    }

    let ws = null;
    function connectWebSocket() {
      try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(proto + '//' + location.host + '/ws?room=' + encodeURIComponent(ROOM_ID));
        ws.onopen = () => {
          document.getElementById('syncStatusIndicator').textContent = '● WS LIVE';
          sendAction({
            type: 'JOIN',
            userId: USER_ID,
            name: USER_NAME,
            color: USER_COLOR,
            x: myCursor.x,
            y: myCursor.y,
            tool: currentTool
          });
        };
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.type === 'ROOM_STATE') {
              updateRoomState(data.room);
            } else if (data.type === 'CURSOR_UPDATE' && roomState) {
              roomState.participants[data.userId] = data.participant;
              renderPresence();
            }
          } catch {}
        };
        ws.onclose = () => {
          document.getElementById('syncStatusIndicator').textContent = '● HTTP SYNC';
        };
      } catch {}
    }

    async function fetchRoomState() {
      try {
        const res = await fetch('/api/room?room=' + encodeURIComponent(ROOM_ID));
        if (res.ok) {
          const data = await res.json();
          updateRoomState(data.room);
        }
      } catch {}
    }

    async function sendAction(action) {
      action.userId = action.userId || USER_ID;
      action.userName = action.userName || USER_NAME;
      action.color = action.color || USER_COLOR;

      if (action.type === 'CURSOR' && bc) {
        bc.postMessage({
          type: 'CURSOR_FAST',
          userId: USER_ID,
          payload: {
            userId: USER_ID,
            name: USER_NAME,
            color: USER_COLOR,
            x: action.x,
            y: action.y,
            activeNodeId: selectedNodeId,
            tool: currentTool,
            bubbleText: myCursor.bubbleText,
            lastSeen: Date.now()
          }
        });
      }

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(action));
        if (action.type !== 'CURSOR' && bc) bc.postMessage({ type: 'STATE_UPDATED' });
        return;
      }

      try {
        const res = await fetch('/api/room/action?room=' + encodeURIComponent(ROOM_ID), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        if (res.ok) {
          const data = await res.json();
          updateRoomState(data.room);
          if (bc && action.type !== 'CURSOR') bc.postMessage({ type: 'STATE_UPDATED' });
        }
      } catch {}
    }

    function updateRoomState(newRoom) {
      if (!newRoom) return;
      const prevStatus = roomState?.status;
      roomState = newRoom;
      if (prevStatus && prevStatus !== 'RESOLVED' && newRoom.status === 'RESOLVED') {
        playTone(587.33, 0.12, 'triangle');
        setTimeout(() => playTone(880, 0.22, 'triangle'), 110);
      }
      renderPresence();
      if (newRoom.stateVersion !== lastRenderedVersion) {
        lastRenderedVersion = newRoom.stateVersion;
        renderHUD();
        renderLogsAndEvidence();
        renderCards();
        renderChatAndTimeline();
      }
    }

    function renderPresence() {
      if (!roomState) return;
      const container = document.getElementById('presenceList');
      const list = Object.values(roomState.participants || {});
      container.innerHTML = list.map(p => \`
        <div class="avatar-pill" style="border-color:\${p.color}55">
          <span class="avatar-dot" style="background:\${p.color}">\${(p.name || 'E')[0]}</span>
          <span>\${escapeHtml(p.name)}</span>
          <span class="mono" style="color:var(--text-2);font-size:10px;">· \${escapeHtml(p.tool || 'Inspect')}</span>
        </div>
      \`).join('');
    }

    function renderHUD() {
      const badge = document.getElementById('incidentStatusBadge');
      badge.className = 'sev-badge mono ' + roomState.status;
      badge.textContent = roomState.severity + ' · ' + roomState.status;

      document.getElementById('scenarioSelect').value = roomState.scenarioId;
      document.getElementById('hudTitle').textContent = roomState.code + ': ' + roomState.title;
      document.getElementById('hudSummary').textContent = roomState.summary;

      const maxLat = Math.max(...roomState.nodes.map(n => n.latencyMs));
      const maxErr = Math.max(...roomState.nodes.map(n => n.errorRate));
      const execCount = roomState.cards.filter(c => c.status === 'EXECUTED').length;

      const latEl = document.getElementById('metricLatency');
      latEl.textContent = maxLat + ' ms';
      latEl.style.color = maxLat > 400 ? '#fb7185' : (maxLat > 100 ? '#fbbf24' : '#34d399');

      const errEl = document.getElementById('metricError');
      errEl.textContent = maxErr.toFixed(1) + '%';
      errEl.style.color = maxErr > 5 ? '#fb7185' : (maxErr > 1 ? '#fbbf24' : '#34d399');

      document.getElementById('metricCards').textContent = execCount + ' / ' + roomState.cards.length;

      const propNode = document.getElementById('propNode');
      propNode.innerHTML = roomState.nodes.map(n => \`<option value="\${n.id}">\${n.label} (\${n.id})</option>\`).join('');
    }

    function renderLogsAndEvidence() {
      const logList = document.getElementById('logList');
      const filterLabel = document.getElementById('logFilterLabel');
      filterLabel.textContent = selectedNodeId ? ('FILTER: ' + selectedNodeId.toUpperCase()) : 'ALL SERVICES (CLICK NODE TO FILTER)';

      const visibleLogs = selectedNodeId
        ? roomState.logs.filter(l => l.service === selectedNodeId)
        : roomState.logs;

      logList.innerHTML = visibleLogs.map(l => {
        const alreadyPinned = roomState.pinnedEvidence.some(p => p.logId === l.id);
        return \`
          <div class="log-row \${l.level}">
            <div style="display:flex;gap:8px;align-items:center;min-width:0;flex:1;">
              <span class="mono" style="color:var(--text-2);font-size:10.5px;">\${l.ts}</span>
              <span class="mono" style="color:var(--accent);font-weight:600;">[\${l.service}]</span>
              <span class="mono" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="\${escapeHtml(l.msg)}">\${escapeHtml(l.msg)}</span>
            </div>
            <button class="btn" style="padding:2px 7px;font-size:10.5px;\${alreadyPinned ? 'opacity:0.5;' : ''}" onclick="window.pinLog('\${l.id}')">
              \${alreadyPinned ? '📌 Pinned' : '📌 Pin Evidence'}
            </button>
          </div>
        \`;
      }).join('');

      const evidenceList = document.getElementById('evidenceList');
      document.getElementById('evidenceCount').textContent = roomState.pinnedEvidence.length + ' PINNED';
      evidenceList.innerHTML = roomState.pinnedEvidence.map(p => \`
        <div class="pin-item">
          <div style="display:flex;justify-content:space-between;font-size:10.5px;margin-bottom:3px;">
            <span class="mono" style="color:\${p.color || '#38bdf8'};font-weight:700;">[\${escapeHtml(p.service)}] Pinned by \${escapeHtml(p.pinnedBy)}</span>
            <span class="mono" style="color:var(--text-2);">\${p.ts}</span>
          </div>
          <div class="mono" style="color:#e2e8f0;font-size:11px;">\${escapeHtml(p.text)}</div>
        </div>
      \`).join('');
    }

    function renderCards() {
      const container = document.getElementById('cardsContainer');
      container.innerHTML = roomState.cards.map(c => {
        const approvalsText = c.approvals.length
          ? ('Approved by: ' + c.approvals.map(a => a.name).join(', '))
          : 'Awaiting first engineer approval';
        const isExecuted = c.status === 'EXECUTED';
        const isVetoed = c.status === 'VETOED';

        return \`
          <div class="vote-card \${c.status}">
            <div class="card-top">
              <span class="tier-pill \${c.riskTier} mono">\${c.riskTier} · QUORUM \${c.approvals.length}/\${c.requiredApprovals}</span>
              <span class="mono" style="font-size:10.5px;color:var(--text-1);">target: \${c.targetNode}</span>
            </div>
            <div style="font-weight:600;font-size:12.5px;line-height:1.35;">\${escapeHtml(c.title)}</div>
            <div class="card-cmd mono">\${escapeHtml(c.command)}</div>
            <div style="font-size:11.5px;color:var(--text-1);line-height:1.35;">\${escapeHtml(c.impactSummary)}</div>
            <div class="card-actions">
              <span style="font-size:10.5px;color:\${isExecuted ? '#34d399' : 'var(--text-1)'};font-weight:500;">
                \${isExecuted ? ('✓ Executed at ' + c.executedAt) : (isVetoed ? '✕ Vetoed' : escapeHtml(approvalsText))}
              </span>
              \${c.status === 'PENDING' ? \`
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-emerald" style="padding:4px 9px;font-size:11px;" onclick="window.voteCard('\${c.id}', 'approve')">
                    ✓ Approve (\${c.approvals.length}/\${c.requiredApprovals})
                  </button>
                  <button class="btn btn-crimson" style="padding:4px 8px;font-size:11px;" onclick="window.voteCard('\${c.id}', 'veto')">
                    ✕ Veto
                  </button>
                </div>
              \` : ''}
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderChatAndTimeline() {
      const box = document.getElementById('chatMessages');
      const combined = [
        ...roomState.timeline.slice(0, 8).map(t => ({
          ts: t.ts,
          html: \`<div style="font-size:11px;color:var(--text-1);"><span class="mono" style="color:var(--text-2);">\${t.ts}</span> <strong style="color:#c084fc;">[\${t.type}]</strong> <strong>\${escapeHtml(t.actor)}:</strong> \${escapeHtml(t.text)}</div>\`
        })),
        ...roomState.chat.slice(-8).map(m => ({
          ts: m.ts,
          html: \`<div style="font-size:11.5px;"><span class="mono" style="color:var(--text-2);">\${m.ts}</span> <strong style="color:\${m.color};">\${escapeHtml(m.sender)}:</strong> \${escapeHtml(m.text)}</div>\`
        }))
      ];
      box.innerHTML = combined.map(x => x.html).join('');
      box.scrollTop = box.scrollHeight;
    }

    window.pinLog = (logId) => {
      playTone(660, 0.07, 'sine');
      sendAction({ type: 'PIN_LOG', logId });
    };

    window.voteCard = (cardId, vote) => {
      playTone(vote === 'approve' ? 740 : 280, 0.1, 'triangle');
      sendAction({ type: 'VOTE_CARD', cardId, vote });
    };

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Canvas Rendering & Physics Loop
    const canvas = document.getElementById('topologyCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function spawnParticles() {
      if (!roomState) return;
      for (const edge of roomState.edges) {
        const from = roomState.nodes.find(n => n.id === edge.from);
        const to = roomState.nodes.find(n => n.id === edge.to);
        if (!from || !to) continue;
        const rate = edge.traffic === 'storm' ? 0.42 : (edge.traffic === 'high' ? 0.2 : 0.1);
        if (Math.random() < rate) {
          particles.push({
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            t: 0,
            speed: edge.traffic === 'storm' ? 0.022 : 0.014,
            status: edge.status
          });
        }
      }
      if (particles.length > 260) particles.splice(0, particles.length - 260);
    }

    function drawCanvas() {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      if (roomState) {
        spawnParticles();

        // Draw directed edges
        for (const edge of roomState.edges) {
          const from = roomState.nodes.find(n => n.id === edge.from);
          const to = roomState.nodes.find(n => n.id === edge.to);
          if (!from || !to) continue;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.lineWidth = edge.traffic === 'storm' ? 2.6 : 1.6;
          ctx.strokeStyle = edge.status === 'critical'
            ? 'rgba(244, 63, 94, 0.55)'
            : (edge.status === 'degraded' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.28)');
          ctx.stroke();
        }

        // Draw live traffic particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.t += p.speed;
          if (p.t >= 1) {
            particles.splice(i, 1);
            continue;
          }
          const x = p.fromX + (p.toX - p.fromX) * p.t;
          const y = p.fromY + (p.toY - p.fromY) * p.t;
          ctx.beginPath();
          ctx.arc(x, y, p.status === 'critical' ? 3.5 : 2.6, 0, Math.PI * 2);
          ctx.fillStyle = p.status === 'critical' ? '#f43f5e' : (p.status === 'degraded' ? '#f59e0b' : '#34d399');
          ctx.fill();
        }

        // Draw service nodes
        const now = Date.now();
        for (const node of roomState.nodes) {
          const isSelected = selectedNodeId === node.id;
          const statusColor = node.status === 'critical' ? '#f43f5e' : (node.status === 'degraded' ? '#f59e0b' : '#10b981');

          if (node.status === 'critical') {
            const pulseR = 46 + (Math.sin(now / 180) + 1) * 10;
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          const boxW = 166;
          const boxH = 74;
          const bx = node.x - boxW / 2;
          const by = node.y - boxH / 2;

          ctx.fillStyle = isSelected ? '#172136' : '#0f1523';
          ctx.strokeStyle = isSelected ? '#38bdf8' : statusColor;
          ctx.lineWidth = isSelected ? 2.4 : 1.5;
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 10);
          ctx.fill();
          ctx.stroke();

          // Status dot
          ctx.beginPath();
          ctx.arc(bx + 14, by + 18, 5, 0, Math.PI * 2);
          ctx.fillStyle = statusColor;
          ctx.fill();

          // Title & role
          ctx.fillStyle = '#f8fafc';
          ctx.font = '600 12px Inter, sans-serif';
          ctx.fillText(node.label, bx + 26, by + 22);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '400 10.5px Inter, sans-serif';
          ctx.fillText(node.role, bx + 14, by + 39);

          // Live metrics row
          ctx.font = '500 10.5px "JetBrains Mono", monospace';
          ctx.fillStyle = node.latencyMs > 300 ? '#fb7185' : '#38bdf8';
          ctx.fillText(node.latencyMs + 'ms', bx + 14, by + 59);

          ctx.fillStyle = node.errorRate > 2 ? '#fb7185' : '#34d399';
          ctx.fillText(node.errorRate + '% err', bx + 68, by + 59);

          ctx.fillStyle = '#64748b';
          ctx.fillText('CPU ' + node.cpu + '%', bx + 118, by + 59);
        }

        // Draw Multiplayer Cursors
        for (const p of Object.values(roomState.participants || {})) {
          if (p.userId === USER_ID) continue;
          drawCursor(p.x, p.y, p.name, p.color, p.tool, p.bubbleText);
        }
      }

      requestAnimationFrame(drawCanvas);
    }

    function drawCursor(x, y, name, color, tool, bubbleText) {
      ctx.save();
      ctx.translate(x, y);

      // Pointer arrow
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(4.5, 11.5);
      ctx.lineTo(10.5, 14);
      ctx.closePath();
      ctx.fillStyle = color || '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#07090e';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Name + tool tag
      const label = name + (tool ? ' · ' + tool : '');
      ctx.font = '600 11px Inter, sans-serif';
      const tw = ctx.measureText(label).width + 14;
      ctx.fillStyle = color || '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(10, 14, tw, 20, 6);
      ctx.fill();

      ctx.fillStyle = '#07090e';
      ctx.fillText(label, 17, 28);

      // Floating cursor chat bubble
      if (bubbleText) {
        ctx.font = '500 11px Inter, sans-serif';
        const bw = ctx.measureText(bubbleText).width + 16;
        ctx.fillStyle = 'rgba(13, 17, 26, 0.94)';
        ctx.strokeStyle = color || '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(10, 38, bw, 22, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(bubbleText, 18, 53);
      }

      ctx.restore();
    }

    requestAnimationFrame(drawCanvas);

    // Canvas Pointer Interactions (Drag node, Click node, Broadcast cursor)
    let lastCursorSent = 0;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      myCursor.x = x;
      myCursor.y = y;

      if (draggingNode) {
        draggingNode.x = x;
        draggingNode.y = y;
      }

      const now = Date.now();
      if (now - lastCursorSent > 45) {
        lastCursorSent = now;
        sendAction({
          type: 'CURSOR',
          x,
          y,
          activeNodeId: selectedNodeId,
          tool: currentTool,
          bubbleText: myCursor.bubbleText
        });
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      if (!roomState) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = roomState.nodes.find(n => Math.abs(n.x - x) <= 83 && Math.abs(n.y - y) <= 37);
      if (hit) {
        selectedNodeId = hit.id;
        draggingNode = hit;
        playTone(440, 0.05, 'sine');
        renderLogsAndEvidence();
      } else {
        selectedNodeId = null;
        renderLogsAndEvidence();
      }
    });

    window.addEventListener('mouseup', () => {
      if (draggingNode) {
        sendAction({
          type: 'MOVE_NODE',
          nodeId: draggingNode.id,
          x: draggingNode.x,
          y: draggingNode.y
        });
        draggingNode = null;
      }
    });

    // Tool selection & Cursor bubble shortcut (/)
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        sendAction({ type: 'CURSOR', x: myCursor.x, y: myCursor.y, tool: currentTool });
      });
    });

    function promptCursorBubble() {
      const msg = prompt('Live Cursor Bubble Message (visible to everyone in the room):', myCursor.bubbleText || 'Checking pg-primary lock wait!');
      if (msg !== null) {
        myCursor.bubbleText = msg.slice(0, 64);
        sendAction({ type: 'CURSOR', x: myCursor.x, y: myCursor.y, tool: currentTool, bubbleText: myCursor.bubbleText });
      }
    }
    document.getElementById('cursorBubbleBtn').addEventListener('click', promptCursorBubble);
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        promptCursorBubble();
      }
    });

    // Topbar buttons
    document.getElementById('scenarioSelect').addEventListener('change', (e) => {
      sendAction({ type: 'SWITCH_SCENARIO', scenarioId: e.target.value });
    });

    document.getElementById('simulatePeerBtn').addEventListener('click', () => {
      playTone(620, 0.09, 'triangle');
      sendAction({ type: 'SIMULATE_PEER' });
    });

    document.getElementById('openSecondTabBtn').addEventListener('click', () => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('room', ROOM_ID);
      nextUrl.searchParams.set('seat', '2');
      nextUrl.searchParams.set('name', 'Kaan (Infra Peer)');
      window.open(nextUrl.toString(), '_blank', 'width=1100,height=780');
    });

    document.getElementById('chatForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      myCursor.bubbleText = text.slice(0, 64);
      sendAction({ type: 'CHAT', text });
      input.value = '';
    });

    // Post-Mortem Modal
    document.getElementById('postMortemBtn').addEventListener('click', async () => {
      const res = await fetch('/api/room/postmortem?room=' + encodeURIComponent(ROOM_ID));
      if (res.ok) {
        const data = await res.json();
        document.getElementById('pmTextarea').value = data.markdown;
        document.getElementById('pmModal').classList.add('open');
      }
    });
    document.getElementById('closePmBtn').addEventListener('click', () => {
      document.getElementById('pmModal').classList.remove('open');
    });
    document.getElementById('copyPmBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('pmTextarea').value);
      document.getElementById('copyPmBtn').textContent = '✓ Copied!';
      setTimeout(() => (document.getElementById('copyPmBtn').textContent = 'Copy Markdown'), 1500);
    });

    // Propose Card Modal
    document.getElementById('newCardModalBtn').addEventListener('click', () => {
      document.getElementById('proposeModal').classList.add('open');
    });
    document.getElementById('closeProposeBtn').addEventListener('click', () => {
      document.getElementById('proposeModal').classList.remove('open');
    });
    document.getElementById('proposeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      sendAction({
        type: 'PROPOSE_CARD',
        title: document.getElementById('propTitle').value,
        command: document.getElementById('propCmd').value,
        riskTier: document.getElementById('propTier').value,
        targetNode: document.getElementById('propNode').value
      });
      document.getElementById('propTitle').value = '';
      document.getElementById('propCmd').value = '';
      document.getElementById('proposeModal').classList.remove('open');
    });

    // Initial boot + periodic sync
    fetchRoomState().then(() => {
      // Automatically spawn SRE Peer Maya after 1.2s so the room immediately feels alive
      setTimeout(() => sendAction({ type: 'SIMULATE_PEER' }), 1200);
    });
    connectWebSocket();
    setInterval(fetchRoomState, 2000);
  </script>
</body>
</html>`;
}
