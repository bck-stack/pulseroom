import assert from 'node:assert/strict';
import { getOrCreateRoom, applyRoomAction, generatePostMortem } from './src/engine.mjs';

const room = getOrCreateRoom('TEST-ROOM-99', 'db-pool-exhaustion');
assert.equal(room.status, 'ACTIVE_OUTAGE');
assert.equal(room.code, 'INC-4021');

// 1. Two engineers join the shared room and broadcast cursors
applyRoomAction(room, { type: 'JOIN', userId: 'eng-1', name: 'Bolat (Lead SRE)', color: '#38bdf8', x: 580, y: 310, tool: 'Inspect' });
applyRoomAction(room, { type: 'JOIN', userId: 'eng-2', name: 'Kaan (Infra Peer)', color: '#f43f5e', x: 920, y: 390, tool: 'Trace' });
assert.equal(Object.keys(room.participants).length, 2);

// 2. Engineer 1 pins root-cause log evidence
applyRoomAction(room, { type: 'PIN_LOG', logId: 'log-102', userName: 'Bolat (Lead SRE)', color: '#38bdf8' });
assert.equal(room.pinnedEvidence.length, 2);

// 3. Routine card (1 vote required) executes immediately on 1st approval
applyRoomAction(room, { type: 'VOTE_CARD', cardId: 'card-pool-tx', userId: 'eng-1', userName: 'Bolat (Lead SRE)', vote: 'approve' });
const routineCard = room.cards.find(c => c.id === 'card-pool-tx');
assert.equal(routineCard.status, 'EXECUTED');
assert.equal(room.status, 'MITIGATING');

// 4. Breaking card (2 votes quorum required) waits after 1st vote, executes on 2nd engineer vote
applyRoomAction(room, { type: 'VOTE_CARD', cardId: 'card-kill-webhook-tx', userId: 'eng-1', userName: 'Bolat (Lead SRE)', vote: 'approve' });
const breakingCard = room.cards.find(c => c.id === 'card-kill-webhook-tx');
assert.equal(breakingCard.status, 'PENDING');
assert.equal(breakingCard.approvals.length, 1);

applyRoomAction(room, { type: 'VOTE_CARD', cardId: 'card-kill-webhook-tx', userId: 'eng-2', userName: 'Kaan (Infra Peer)', vote: 'approve' });
assert.equal(breakingCard.status, 'EXECUTED');
assert.equal(room.status, 'RESOLVED');

// 5. Post-Mortem Markdown contains both responders and executed cards
const md = generatePostMortem(room);
assert.ok(md.includes('Bolat (Lead SRE)'));
assert.ok(md.includes('Kaan (Infra Peer)'));
assert.ok(md.includes('RESOLVED'));

console.log('✅ All multiplayer war-room tests passed (2-engineer quorum, live cursors, evidence pinning, post-mortem).');
