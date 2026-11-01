export const SCENARIOS = {
  'db-pool-exhaustion': {
    id: 'db-pool-exhaustion',
    code: 'INC-4021',
    severity: 'SEV-1',
    title: 'Cascading Postgres Connection Pool Exhaustion',
    summary: 'Checkout 504 timeouts spiked to 38.4% after v2.14.0 deployed an unindexed webhook status update inside an open transaction.',
    rootCauseHint: 'webhook-worker holds open transactions while waiting on external HTTP callbacks, exhausting pg-primary max_connections=200.',
    nodes: [
      { id: 'edge-cdn', label: 'Edge Ingress', role: 'Cloudflare Anycast', x: 115, y: 215, status: 'healthy', rps: 14200, latencyMs: 14, errorRate: 0.2, cpu: 31 },
      { id: 'api-gw', label: 'API Gateway', role: 'Envoy Mesh', x: 335, y: 215, status: 'degraded', rps: 13850, latencyMs: 640, errorRate: 18.4, cpu: 68 },
      { id: 'auth-svc', label: 'Auth Service', role: 'Go / gRPC', x: 575, y: 105, status: 'healthy', rps: 6400, latencyMs: 19, errorRate: 0.1, cpu: 42 },
      { id: 'redis-cache', label: 'Redis Cluster', role: 'Session & Rate Limit', x: 855, y: 105, status: 'healthy', rps: 19200, latencyMs: 3, errorRate: 0.0, cpu: 29 },
      { id: 'checkout-svc', label: 'Checkout API', role: 'Node.js Workers', x: 575, y: 225, status: 'critical', rps: 4200, latencyMs: 1840, errorRate: 38.4, cpu: 89 },
      { id: 'webhook-worker', label: 'Webhook Dispatcher', role: 'Retry Queue Consumer', x: 575, y: 345, status: 'critical', rps: 3100, latencyMs: 2450, errorRate: 64.0, cpu: 96 },
      { id: 'pg-primary', label: 'Postgres Primary', role: 'pg-east-1a (200/200 conn)', x: 885, y: 285, status: 'critical', rps: 7300, latencyMs: 1920, errorRate: 41.2, cpu: 99 }
    ],
    edges: [
      { from: 'edge-cdn', to: 'api-gw', traffic: 'high', status: 'healthy' },
      { from: 'api-gw', to: 'auth-svc', traffic: 'normal', status: 'healthy' },
      { from: 'auth-svc', to: 'redis-cache', traffic: 'high', status: 'healthy' },
      { from: 'api-gw', to: 'checkout-svc', traffic: 'high', status: 'critical' },
      { from: 'api-gw', to: 'webhook-worker', traffic: 'normal', status: 'degraded' },
      { from: 'checkout-svc', to: 'pg-primary', traffic: 'high', status: 'critical' },
      { from: 'webhook-worker', to: 'pg-primary', traffic: 'storm', status: 'critical' },
      { from: 'checkout-svc', to: 'redis-cache', traffic: 'normal', status: 'healthy' }
    ],
    logs: [
      { id: 'log-101', ts: '14:02:11.042', service: 'pg-primary', level: 'FATAL', msg: 'remaining connection slots are reserved for non-replication superuser connections (active=200/200)', traceId: 'tr-9981a', isEvidence: true },
      { id: 'log-102', ts: '14:02:11.218', service: 'webhook-worker', level: 'WARN', msg: 'holding tx_id=88412 open while awaiting https://merchant-hook.example/notify (elapsed=14200ms)', traceId: 'tr-9981b', isEvidence: true },
      { id: 'log-103', ts: '14:02:11.509', service: 'checkout-svc', level: 'ERROR', msg: 'KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.', traceId: 'tr-9981c', isEvidence: true },
      { id: 'log-104', ts: '14:02:12.004', service: 'api-gw', level: 'ERROR', msg: 'upstream_reset_before_response_started{cluster=checkout-svc, code=504, duration=1842ms}', traceId: 'tr-9981c', isEvidence: false },
      { id: 'log-105', ts: '14:02:12.410', service: 'auth-svc', level: 'INFO', msg: 'token validation p99=18.4ms cache_hit_ratio=0.994', traceId: 'tr-9982a', isEvidence: false },
      { id: 'log-106', ts: '14:02:12.883', service: 'pg-primary', level: 'WARN', msg: '142 backend processes in state "idle in transaction" for >10s (application_name=webhook-worker)', traceId: 'tr-9982f', isEvidence: true },
      { id: 'log-107', ts: '14:02:13.120', service: 'webhook-worker', level: 'ERROR', msg: 'retry storm detected: 1,480 messages re-queued with zero jitter backoff', traceId: 'tr-9983a', isEvidence: true }
    ],
    cards: [
      {
        id: 'card-pool-tx',
        title: 'Switch PgBouncer to Transaction Pooling + 3s Idle-in-Tx Timeout',
        command: 'ALTER SYSTEM SET idle_in_transaction_session_timeout = "3000ms"; SELECT pg_reload_conf();',
        riskTier: 'ROUTINE',
        targetNode: 'pg-primary',
        requiredApprovals: 1,
        impactSummary: 'Reclaims 142 stuck idle-in-transaction connections held by webhook-worker within 3 seconds.',
        effect: { latencyMultiplier: 0.45, errorMultiplier: 0.35, fixesNodes: ['pg-primary'] }
      },
      {
        id: 'card-kill-webhook-tx',
        title: 'Cap Webhook Worker Concurrency to 15 & Decouple HTTP Callback from DB Tx',
        command: 'pulseroom-ctl scale webhook-worker --max-inflight=15 --detach-db-tx=true',
        riskTier: 'BREAKING',
        targetNode: 'webhook-worker',
        requiredApprovals: 2,
        impactSummary: 'Stops the retry storm hammering pg-primary. Requires 2-person approval as queued webhooks shift to async delivery.',
        effect: { latencyMultiplier: 0.12, errorMultiplier: 0.01, fixesNodes: ['webhook-worker', 'checkout-svc', 'api-gw', 'pg-primary'] }
      },
      {
        id: 'card-read-replica',
        title: 'Route Checkout Read Queries to Read-Replica & Enable Circuit Breaker',
        command: 'pulseroom-ctl mesh route checkout-svc --reads=pg-replica-1 --circuit-breaker=500ms',
        riskTier: 'DECISION',
        targetNode: 'checkout-svc',
        requiredApprovals: 2,
        impactSummary: 'Sheds 40% read load off pg-primary immediately with up to 150ms replication lag on order history.',
        effect: { latencyMultiplier: 0.55, errorMultiplier: 0.4, fixesNodes: ['checkout-svc', 'api-gw'] }
      }
    ]
  },

  'cache-stampede': {
    id: 'cache-stampede',
    code: 'INC-4088',
    severity: 'SEV-1',
    title: 'Thundering Herd Cache Stampede on Flash Sale Catalog',
    summary: '42,000 concurrent viewers refreshed the drop page when the catalog Redis key expired without request coalescing.',
    rootCauseHint: 'Simultaneous TTL expiry on catalog:hero:v4 caused 18,000 uncached cold queries per second to hit catalog-db directly.',
    nodes: [
      { id: 'edge-cdn', label: 'Edge Ingress', role: 'Cloudflare Anycast', x: 110, y: 300, status: 'healthy', rps: 42800, latencyMs: 11, errorRate: 0.1, cpu: 44 },
      { id: 'api-gw', label: 'Storefront Gateway', role: 'GraphQL Federation', x: 360, y: 300, status: 'degraded', rps: 41900, latencyMs: 890, errorRate: 22.7, cpu: 84 },
      { id: 'redis-cache', label: 'Redis Cache Ring', role: '0.4% Hit Ratio (Cold)', x: 640, y: 150, status: 'critical', rps: 41500, latencyMs: 42, errorRate: 14.5, cpu: 91 },
      { id: 'catalog-svc', label: 'Catalog Service', role: 'Rust / Actix', x: 640, y: 440, status: 'critical', rps: 39400, latencyMs: 1620, errorRate: 31.8, cpu: 97 },
      { id: 'catalog-db', label: 'Catalog Aurora DB', role: 'CPU 100% Lock Wait', x: 930, y: 300, status: 'critical', rps: 18900, latencyMs: 2180, errorRate: 46.0, cpu: 100 }
    ],
    edges: [
      { from: 'edge-cdn', to: 'api-gw', traffic: 'storm', status: 'degraded' },
      { from: 'api-gw', to: 'redis-cache', traffic: 'storm', status: 'critical' },
      { from: 'api-gw', to: 'catalog-svc', traffic: 'storm', status: 'critical' },
      { from: 'catalog-svc', to: 'redis-cache', traffic: 'high', status: 'degraded' },
      { from: 'catalog-svc', to: 'catalog-db', traffic: 'storm', status: 'critical' }
    ],
    logs: [
      { id: 'log-201', ts: '14:15:02.110', service: 'redis-cache', level: 'WARN', msg: 'key expired: catalog:drop:2026 — cache hit ratio dropped from 99.6% to 0.4% in 800ms', traceId: 'tr-7710a', isEvidence: true },
      { id: 'log-202', ts: '14:15:02.450', service: 'catalog-svc', level: 'ERROR', msg: '18,410 duplicate in-flight SQL queries for SELECT * FROM products WHERE drop_id=88', traceId: 'tr-7710b', isEvidence: true },
      { id: 'log-203', ts: '14:15:03.012', service: 'catalog-db', level: 'FATAL', msg: 'CPU utilization 100.0% — buffer pool contention on idx_products_drop_id', traceId: 'tr-7710c', isEvidence: true },
      { id: 'log-204', ts: '14:15:03.600', service: 'api-gw', level: 'ERROR', msg: 'GraphQL resolver timeout after 1500ms on field Query.featuredDrop', traceId: 'tr-7710d', isEvidence: false }
    ],
    cards: [
      {
        id: 'card-singleflight',
        title: 'Enable Request Coalescing (Singleflight) on Catalog Service',
        command: 'pulseroom-ctl feature-flag catalog-svc --enable-singleflight=true --dedupe-window=250ms',
        riskTier: 'ROUTINE',
        targetNode: 'catalog-svc',
        requiredApprovals: 1,
        impactSummary: 'Collapses 18,410 identical cold DB queries into 1 upstream query per 250ms window.',
        effect: { latencyMultiplier: 0.25, errorMultiplier: 0.1, fixesNodes: ['catalog-svc', 'catalog-db'] }
      },
      {
        id: 'card-edge-swr',
        title: 'Pre-Warm Redis Keys with Jittered TTL & Activate Edge Stale-While-Revalidate',
        command: 'pulseroom-ctl cache warm --prefix=catalog:drop --ttl-jitter=300s --edge-swr=60s',
        riskTier: 'BREAKING',
        targetNode: 'redis-cache',
        requiredApprovals: 2,
        impactSummary: 'Restores 99.8% cache hit ratio and prevents synchronized TTL cliffs across edge PoPs.',
        effect: { latencyMultiplier: 0.08, errorMultiplier: 0.005, fixesNodes: ['redis-cache', 'api-gw', 'catalog-svc', 'catalog-db'] }
      }
    ]
  },

  'jwt-split-brain': {
    id: 'jwt-split-brain',
    code: 'INC-4104',
    severity: 'SEV-2',
    title: 'Split-Brain JWT Signing Key Rotation Across Edge Regions',
    summary: '44% of authenticated API calls failing with 401 Invalid Signature after Auth Service rotated signing key kid=2026-11-a.',
    rootCauseHint: 'auth-svc began signing tokens with kid=2026-11-a before edge-cdn flushed its 1-hour cached JWKS public keyset.',
    nodes: [
      { id: 'edge-cdn', label: 'Edge JWKS Verifier', role: 'Stale JWKS (kid=2026-10-z)', x: 140, y: 290, status: 'critical', rps: 19400, latencyMs: 9, errorRate: 44.2, cpu: 38 },
      { id: 'api-gw', label: 'Core API Mesh', role: 'mTLS Router', x: 450, y: 290, status: 'degraded', rps: 10800, latencyMs: 38, errorRate: 19.5, cpu: 45 },
      { id: 'auth-svc', label: 'Identity Issuer', role: 'Signing kid=2026-11-a', x: 760, y: 150, status: 'degraded', rps: 5200, latencyMs: 29, errorRate: 4.2, cpu: 52 },
      { id: 'user-profile', label: 'Workspace API', role: 'GraphQL Node', x: 760, y: 430, status: 'healthy', rps: 5600, latencyMs: 24, errorRate: 0.2, cpu: 33 }
    ],
    edges: [
      { from: 'edge-cdn', to: 'api-gw', traffic: 'high', status: 'critical' },
      { from: 'api-gw', to: 'auth-svc', traffic: 'normal', status: 'degraded' },
      { from: 'api-gw', to: 'user-profile', traffic: 'normal', status: 'healthy' }
    ],
    logs: [
      { id: 'log-301', ts: '14:28:09.014', service: 'edge-cdn', level: 'ERROR', msg: 'JWT verification failed: unknown key id kid="2026-11-a" (cached JWKS only contains ["2026-10-z"])', traceId: 'tr-5512a', isEvidence: true },
      { id: 'log-302', ts: '14:28:09.402', service: 'auth-svc', level: 'INFO', msg: 'key rotation complete: promoted kid="2026-11-a" to active signer immediately (grace_period=0s)', traceId: 'tr-5512b', isEvidence: true },
      { id: 'log-303', ts: '14:28:10.118', service: 'api-gw', level: 'WARN', msg: 'spike in 401 responses from edge-cdn across eu-central and us-east PoPs', traceId: 'tr-5512c', isEvidence: false }
    ],
    cards: [
      {
        id: 'card-jwks-dual',
        title: 'Publish Dual-Key JWKS Manifest & Purge Edge Key Cache Globally',
        command: 'pulseroom-ctl auth publish-jwks --kids="2026-10-z,2026-11-a" && pulseroom-ctl cdn purge /.well-known/jwks.json',
        riskTier: 'BREAKING',
        targetNode: 'edge-cdn',
        requiredApprovals: 2,
        impactSummary: 'Propagates both old and new public keys to all 310 Edge PoPs in <2s, eliminating 401 signature drops.',
        effect: { latencyMultiplier: 0.4, errorMultiplier: 0.005, fixesNodes: ['edge-cdn', 'api-gw', 'auth-svc'] }
      }
    ]
  }
};

export function createInitialRoomState(roomId = 'WAR-ROOM-01', scenarioId = 'db-pool-exhaustion') {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS['db-pool-exhaustion'];
  const cloned = JSON.parse(JSON.stringify(scenario));
  return {
    roomId,
    scenarioId: cloned.id,
    code: cloned.code,
    severity: cloned.severity,
    title: cloned.title,
    summary: cloned.summary,
    rootCauseHint: cloned.rootCauseHint,
    status: 'ACTIVE_OUTAGE', // ACTIVE_OUTAGE | MITIGATING | RESOLVED
    startedAt: Date.now(),
    resolvedAt: null,
    stateVersion: 1,
    nodes: cloned.nodes,
    edges: cloned.edges,
    logs: cloned.logs,
    pinnedEvidence: [
      {
        id: 'pin-init-1',
        logId: cloned.logs[0].id,
        service: cloned.logs[0].service,
        text: cloned.logs[0].msg,
        pinnedBy: 'System Alert',
        color: '#f43f5e',
        ts: new Date().toISOString().slice(11, 19)
      }
    ],
    cards: cloned.cards.map(c => ({
      ...c,
      status: 'PENDING', // PENDING | EXECUTED | VETOED
      approvals: [],
      vetoes: [],
      executedAt: null
    })),
    participants: {},
    timeline: [
      {
        id: 'ev-1',
        ts: new Date().toISOString().slice(11, 19),
        actor: 'PagerDuty Bot',
        type: 'ALERT',
        text: `Triggered ${cloned.code} (${cloned.severity}): ${cloned.title}`
      }
    ],
    chat: [
      {
        id: 'msg-1',
        ts: new Date().toISOString().slice(11, 19),
        sender: 'Maya (SRE Lead)',
        color: '#10b981',
        text: `I'm in the room. Look at the red packet storm on ${cloned.nodes[cloned.nodes.length - 1].id} — let's pin the root-cause logs and vote on the remediation cards.`
      }
    ]
  };
}
