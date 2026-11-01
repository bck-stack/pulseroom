import http from 'node:http';
import crypto from 'node:crypto';
import { getOrCreateRoom, applyRoomAction, generatePostMortem } from './src/engine.mjs';
import { renderAppHtml } from './src/ui.mjs';

const PORT = Number(process.env.PORT || 4321);

// Connected WebSocket clients per roomId
const roomClients = new Map();

function broadcastToRoom(roomId, payload, excludeSocket = null) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  const frame = encodeWsFrame(JSON.stringify(payload));
  for (const sock of clients) {
    if (sock !== excludeSocket && !sock.destroyed) {
      try {
        sock.write(frame);
      } catch {}
    }
  }
}

function encodeWsFrame(str) {
  const payload = Buffer.from(str, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const byte0 = buffer[offset];
    const byte1 = buffer[offset + 1];
    const opcode = byte0 & 0x0f;
    const isMasked = Boolean(byte1 & 0x80);
    let payloadLen = byte1 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    if (opcode === 0x08) {
      // Close frame
      messages.push({ close: true });
      break;
    }

    if (opcode === 0x01) {
      const dataStart = offset + headerLen + maskLen;
      const raw = Buffer.from(buffer.subarray(dataStart, dataStart + payloadLen));
      if (isMasked) {
        const mask = buffer.subarray(offset + headerLen, offset + headerLen + 4);
        for (let i = 0; i < raw.length; i++) {
          raw[i] ^= mask[i & 3];
        }
      }
      messages.push({ text: raw.toString('utf8') });
    }
    offset += headerLen + maskLen + payloadLen;
  }
  return messages;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const roomId = (url.searchParams.get('room') || 'WAR-ROOM-01').toUpperCase();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderAppHtml());
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'pulseroom-war-room', ts: new Date().toISOString() }));
    return;
  }

  if (url.pathname === '/api/room' && req.method === 'GET') {
    const room = getOrCreateRoom(roomId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, room }));
    return;
  }

  if (url.pathname === '/api/room/postmortem' && req.method === 'GET') {
    const room = getOrCreateRoom(roomId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, roomId: room.roomId, markdown: generatePostMortem(room) }));
    return;
  }

  if (url.pathname === '/api/room/action' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const action = JSON.parse(body || '{}');
      const room = getOrCreateRoom(roomId);
      const result = applyRoomAction(room, action);
      if (result.ephemeral && action.userId) {
        broadcastToRoom(room.roomId, {
          type: 'CURSOR_UPDATE',
          userId: action.userId,
          participant: room.participants[action.userId]
        });
      } else {
        broadcastToRoom(room.roomId, { type: 'ROOM_STATE', room });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, room }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  const roomId = (url.searchParams.get('room') || 'WAR-ROOM-01').toUpperCase();
  const room = getOrCreateRoom(roomId);

  if (!roomClients.has(room.roomId)) {
    roomClients.set(room.roomId, new Set());
  }
  roomClients.get(room.roomId).add(socket);

  // Send initial room state immediately
  socket.write(encodeWsFrame(JSON.stringify({ type: 'ROOM_STATE', room })));

  socket.on('data', (buf) => {
    const frames = decodeWsFrames(buf);
    for (const f of frames) {
      if (f.close) {
        socket.end();
        return;
      }
      if (f.text) {
        try {
          const action = JSON.parse(f.text);
          const result = applyRoomAction(room, action);
          if (result.ephemeral && action.userId) {
            broadcastToRoom(room.roomId, {
              type: 'CURSOR_UPDATE',
              userId: action.userId,
              participant: room.participants[action.userId]
            });
          } else {
            broadcastToRoom(room.roomId, { type: 'ROOM_STATE', room });
          }
        } catch {}
      }
    }
  });

  const cleanup = () => {
    roomClients.get(room.roomId)?.delete(socket);
  };
  socket.on('close', cleanup);
  socket.on('error', cleanup);
});

server.listen(PORT, () => {
  console.log(`⚡ PulseRoom Multiplayer War-Room running at http://localhost:${PORT}`);
});
