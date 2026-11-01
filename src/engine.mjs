import { createInitialRoomState, SCENARIOS } from './scenarios.mjs';

const rooms = new Map();

export function getOrCreateRoom(roomId = 'WAR-ROOM-01', scenarioId = 'db-pool-exhaustion') {
  const cleanId = String(roomId || 'WAR-ROOM-01').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 28) || 'WAR-ROOM-01';
  if (!rooms.has(cleanId)) {
    rooms.set(cleanId, createInitialRoomState(cleanId, scenarioId));
  }
  const room = rooms.get(cleanId);
  pruneStaleParticipants(room);
  return room;
}

export function pruneStaleParticipants(room) {
  const now = Date.now();
  for (const [pid, p] of Object.entries(room.participants)) {
    if (!p.isBot && now - (p.lastSeen || 0) > 15000) {
      delete room.participants[pid];
    }
  }
}

function nowTime() {
  return new Date().toISOString().slice(11, 19);
}

export function applyRoomAction(room, action) {
  const ts = nowTime();
  switch (action.type) {
    case 'JOIN':
    case 'CURSOR': {
      const { userId, name, color, x, y, activeNodeId, tool, bubbleText } = action;
      if (!userId) return { ephemeral: true };
      const existing = room.participants[userId] || {};
      room.participants[userId] = {
        userId,
        name: name || existing.name || 'Engineer',
        color: color || existing.color || '#38bdf8',
        x: typeof x === 'number' ? x : (existing.x ?? 420),
        y: typeof y === 'number' ? y : (existing.y ?? 260),
        activeNodeId: activeNodeId !== undefined ? activeNodeId : (existing.activeNodeId || null),
        tool: tool || existing.tool || 'Inspect',
        bubbleText: bubbleText !== undefined ? bubbleText : (existing.bubbleText || ''),
        isBot: Boolean(action.isBot || existing.isBot),
        lastSeen: Date.now()
      };
      return { ephemeral: true };
    }

    case 'MOVE_NODE': {
      const { nodeId, x, y } = action;
      const node = room.nodes.find(n => n.id === nodeId);
      if (node && typeof x === 'number' && typeof y === 'number') {
        node.x = Math.max(70, Math.min(1080, Math.round(x)));
        node.y = Math.max(70, Math.min(580, Math.round(y)));
        room.stateVersion++;
      }
      return { ephemeral: false };
    }

    case 'PIN_LOG': {
      const { logId, userName, color } = action;
      const log = room.logs.find(l => l.id === logId);
      if (!log) return { ephemeral: false };
      if (!room.pinnedEvidence.some(p => p.logId === logId)) {
        room.pinnedEvidence.unshift({
          id: 'pin-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          logId: log.id,
          service: log.service,
          text: log.msg,
          pinnedBy: userName || 'Engineer',
          color: color || '#38bdf8',
          ts
        });
        room.timeline.unshift({
          id: 'ev-' + Date.now(),
          ts,
          actor: userName || 'Engineer',
          type: 'PIN',
          text: `Pinned root-cause evidence from [${log.service}]: "${log.msg.slice(0, 72)}..."`
        });
        room.stateVersion++;
      }
      return { ephemeral: false };
    }

    case 'PROPOSE_CARD': {
      const { title, command, riskTier, targetNode, userName } = action;
      if (!title || !command) return { ephemeral: false };
      const tier = ['ROUTINE', 'BREAKING', 'DECISION'].includes(riskTier) ? riskTier : 'ROUTINE';
      const newCard = {
        id: 'card-' + Date.now(),
        title: String(title).slice(0, 120),
        command: String(command).slice(0, 180),
        riskTier: tier,
        targetNode: targetNode || room.nodes[room.nodes.length - 1].id,
        requiredApprovals: tier === 'ROUTINE' ? 1 : 2,
        impactSummary: `Proposed live by ${userName || 'Engineer'} during incident triage.`,
        effect: {
          latencyMultiplier: 0.35,
          errorMultiplier: 0.15,
          fixesNodes: [targetNode || room.nodes[room.nodes.length - 1].id]
        },
        status: 'PENDING',
        approvals: [{ userId: action.userId || 'u1', name: userName || 'Engineer', ts }],
        vetoes: [],
        executedAt: null
      };
      if (newCard.approvals.length >= newCard.requiredApprovals) {
        executeCardEffect(room, newCard, userName || 'Engineer');
      }
      room.cards.unshift(newCard);
      room.timeline.unshift({
        id: 'ev-' + Date.now(),
        ts,
        actor: userName || 'Engineer',
        type: 'PROPOSE',
        text: `Proposed ${tier} card: "${newCard.title}"`
      });
      room.stateVersion++;
      return { ephemeral: false };
    }

    case 'VOTE_CARD': {
      const { cardId, userId, userName, vote } = action;
      const card = room.cards.find(c => c.id === cardId);
      if (!card || card.status !== 'PENDING') return { ephemeral: false };
      const uid = userId || userName || 'anon';
      const uname = userName || 'Engineer';

      card.approvals = card.approvals.filter(a => a.userId !== uid);
      card.vetoes = card.vetoes.filter(v => v.userId !== uid);

      if (vote === 'approve') {
        card.approvals.push({ userId: uid, name: uname, ts });
        room.timeline.unshift({
          id: 'ev-' + Date.now(),
          ts,
          actor: uname,
          type: 'APPROVE',
          text: `Approved [${card.riskTier}] "${card.title}" (${card.approvals.length}/${card.requiredApprovals})`
        });
        if (card.approvals.length >= card.requiredApprovals) {
          executeCardEffect(room, card, uname);
        }
      } else if (vote === 'veto') {
        card.vetoes.push({ userId: uid, name: uname, ts });
        card.status = 'VETOED';
        room.timeline.unshift({
          id: 'ev-' + Date.now(),
          ts,
          actor: uname,
          type: 'VETO',
          text: `Vetoed [${card.riskTier}] "${card.title}" — blocked execution`
        });
      }
      room.stateVersion++;
      return { ephemeral: false };
    }

    case 'CHAT': {
      const { userId, userName, color, text } = action;
      if (!text || !String(text).trim()) return { ephemeral: false };
      const clean = String(text).trim().slice(0, 280);
      room.chat.push({
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        ts,
        sender: userName || 'Engineer',
        color: color || '#38bdf8',
        text: clean
      });
      if (room.chat.length > 50) room.chat.shift();
      if (userId && room.participants[userId]) {
        room.participants[userId].bubbleText = clean.slice(0, 64);
      }
      room.stateVersion++;
      return { ephemeral: false };
    }

    case 'SWITCH_SCENARIO': {
      const { scenarioId, userName } = action;
      if (!SCENARIOS[scenarioId]) return { ephemeral: false };
      const preservedParticipants = room.participants;
      const fresh = createInitialRoomState(room.roomId, scenarioId);
      Object.assign(room, fresh);
      room.participants = preservedParticipants;
      room.timeline.unshift({
        id: 'ev-' + Date.now(),
        ts,
        actor: userName || 'Engineer',
        type: 'SCENARIO',
        text: `Loaded incident scenario ${room.code}: ${room.title}`
      });
      room.stateVersion++;
      return { ephemeral: false };
    }

    case 'SIMULATE_PEER': {
      runSimulatedPeerStep(room);
      return { ephemeral: false };
    }

    default:
      return { ephemeral: false };
  }
}

function executeCardEffect(room, card, triggeredBy) {
  const ts = nowTime();
  card.status = 'EXECUTED';
  card.executedAt = ts;

  const { latencyMultiplier = 0.3, errorMultiplier = 0.1, fixesNodes = [] } = card.effect || {};
  for (const node of room.nodes) {
    if (fixesNodes.includes(node.id)) {
      node.latencyMs = Math.max(8, Math.round(node.latencyMs * latencyMultiplier));
      node.errorRate = Number(Math.max(0.0, node.errorRate * errorMultiplier).toFixed(2));
      node.cpu = Math.max(22, Math.round(node.cpu * 0.52));
      if (node.errorRate < 1.0) {
        node.status = 'healthy';
      } else if (node.errorRate < 10.0) {
        node.status = 'degraded';
      }
    }
  }

  for (const edge of room.edges) {
    const fromNode = room.nodes.find(n => n.id === edge.from);
    const toNode = room.nodes.find(n => n.id === edge.to);
    if (fromNode?.status === 'healthy' && toNode?.status === 'healthy') {
      edge.status = 'healthy';
      if (edge.traffic === 'storm') edge.traffic = 'high';
    } else if (toNode?.status === 'degraded') {
      edge.status = 'degraded';
    }
  }

  const anyCritical = room.nodes.some(n => n.status === 'critical');
  const anyDegraded = room.nodes.some(n => n.status === 'degraded');
  if (!anyCritical && !anyDegraded) {
    room.status = 'RESOLVED';
    room.resolvedAt = Date.now();
  } else {
    room.status = 'MITIGATING';
  }

  room.logs.push({
    id: 'log-exec-' + Date.now(),
    ts: ts + '.090',
    service: card.targetNode || 'control-plane',
    level: 'INFO',
    msg: `[QUORUM EXECUTED] ${card.command} -> error_rate dropped, connections stabilized`,
    traceId: 'tr-fix-' + Math.random().toString(36).slice(2, 6),
    isEvidence: false
  });

  room.timeline.unshift({
    id: 'ev-exec-' + Date.now(),
    ts,
    actor: 'Quorum Runner',
    type: 'EXECUTED',
    text: `Executed "${card.title}" after quorum approval (triggered by ${triggeredBy}). System status: ${room.status}`
  });
}

export function runSimulatedPeerStep(room) {
  const botId = 'peer-maya-sre';
  const criticalNodes = room.nodes.filter(n => n.status !== 'healthy');
  const targetNode = criticalNodes[0] || room.nodes[room.nodes.length - 1];

  room.participants[botId] = {
    userId: botId,
    name: 'Maya (SRE Peer)',
    color: '#10b981',
    x: targetNode.x + Math.round((Math.random() - 0.5) * 50),
    y: targetNode.y + Math.round((Math.random() - 0.5) * 40),
    activeNodeId: targetNode.id,
    tool: 'Tracing',
    bubbleText: `Inspecting ${targetNode.label} (${targetNode.errorRate}% err)`,
    isBot: true,
    lastSeen: Date.now()
  };

  // 1. Pin an unpinned evidence log if available
  const unpinnedEvidence = room.logs.find(l => l.isEvidence && !room.pinnedEvidence.some(p => p.logId === l.id));
  if (unpinnedEvidence) {
    applyRoomAction(room, {
      type: 'PIN_LOG',
      logId: unpinnedEvidence.id,
      userName: 'Maya (SRE Peer)',
      color: '#10b981'
    });
    room.participants[botId].bubbleText = `Pinned evidence from ${unpinnedEvidence.service}!`;
    return;
  }

  // 2. Otherwise, cast quorum approval vote on a pending card that already has 1 approval or is breaking
  const pendingWithVote = room.cards.find(c => c.status === 'PENDING' && c.approvals.length > 0 && !c.approvals.some(a => a.userId === botId));
  const anyPending = pendingWithVote || room.cards.find(c => c.status === 'PENDING' && !c.approvals.some(a => a.userId === botId));

  if (anyPending) {
    applyRoomAction(room, {
      type: 'VOTE_CARD',
      cardId: anyPending.id,
      userId: botId,
      userName: 'Maya (SRE Peer)',
      vote: 'approve'
    });
    room.participants[botId].bubbleText = `Approved ${anyPending.riskTier} card!`;
  } else {
    room.stateVersion++;
  }
}

export function generatePostMortem(room) {
  const durationSec = Math.max(12, Math.round(((room.resolvedAt || Date.now()) - room.startedAt) / 1000));
  const executedCards = room.cards.filter(c => c.status === 'EXECUTED');
  const participantsList = Object.values(room.participants).map(p => p.name).join(', ') || 'On-Call SRE Team';

  return `# Incident Post-Mortem: ${room.code} — ${room.title}

- **Room ID:** \`${room.roomId}\`
- **Severity:** \`${room.severity}\`
- **Final Status:** \`${room.status}\`
- **Time to Mitigation (MTTR):** \`${durationSec}s\`
- **Responders in Multiplayer Room:** ${participantsList}

## 1. Executive Summary
${room.summary}

**Root Cause Identified:** ${room.rootCauseHint}

## 2. Collaborative Evidence Pinned by Responders
${room.pinnedEvidence.map(p => `- **[${p.ts}] \`${p.service}\` (pinned by ${p.pinnedBy}):** \`${p.text}\``).join('\n')}

## 3. Quorum-Approved Remediation Actions Executed
${executedCards.length ? executedCards.map(c => `- **[${c.executedAt}] \`${c.riskTier}\` — ${c.title}**\n  - Command: \`${c.command}\`\n  - Approved by: ${c.approvals.map(a => a.name).join(', ')}`).join('\n') : '- *Mitigation in progress (no cards executed yet).*'}

## 4. Audit Timeline
${room.timeline.slice(0, 12).map(e => `- \`${e.ts}\` **[${e.type}] ${e.actor}:** ${e.text}`).join('\n')}
`;
}
