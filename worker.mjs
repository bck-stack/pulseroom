import { getOrCreateRoom, applyRoomAction, generatePostMortem } from './src/engine.mjs';
import { renderAppHtml } from './src/ui.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const roomId = (url.searchParams.get('room') || 'WAR-ROOM-01').toUpperCase();

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/ws' && request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      const room = getOrCreateRoom(roomId);
      server.send(JSON.stringify({ type: 'ROOM_STATE', room }));
      server.addEventListener('message', (ev) => {
        try {
          const action = JSON.parse(ev.data);
          applyRoomAction(room, action);
          server.send(JSON.stringify({ type: 'ROOM_STATE', room }));
        } catch {}
      });
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(renderAppHtml(), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      });
    }

    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, service: 'pulseroom-war-room', ts: new Date().toISOString() }, { headers: corsHeaders });
    }

    if (url.pathname === '/api/room' && request.method === 'GET') {
      const room = getOrCreateRoom(roomId);
      return Response.json({ ok: true, room }, { headers: corsHeaders });
    }

    if (url.pathname === '/api/room/postmortem' && request.method === 'GET') {
      const room = getOrCreateRoom(roomId);
      return Response.json({ ok: true, roomId: room.roomId, markdown: generatePostMortem(room) }, { headers: corsHeaders });
    }

    if (url.pathname === '/api/room/action' && request.method === 'POST') {
      const action = await request.json();
      const room = getOrCreateRoom(roomId);
      applyRoomAction(room, action);
      return Response.json({ ok: true, room }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  }
};
