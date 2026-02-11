#!/usr/bin/env node
// Generates a 100k-line log file for performance testing
const fs = require('fs')
const path = require('path')

const TOTAL_LINES = 100_000
const OUTPUT = path.join(__dirname, 'medium.log')

const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR']
const levelWeights = [0.3, 0.5, 0.15, 0.05] // cumulative: 30% debug, 50% info, 15% warn, 5% error
const modules = ['http', 'db', 'auth', 'scheduler', 'parser', 'ws', 'cache', 'config', 'main']
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const paths = [
  '/api/v1/logs', '/api/v1/users', '/api/v1/sessions', '/api/v1/config',
  '/api/v1/alerts', '/healthz', '/metrics', '/api/v1/search', '/api/v1/export'
]
const users = ['alice@example.com', 'bob@example.com', 'carol@example.com', 'dave@example.com']
const statusCodes = [200, 201, 204, 301, 400, 401, 403, 404, 500, 502, 503]

function pickLevel() {
  const r = Math.random()
  let cum = 0
  for (let i = 0; i < levels.length; i++) {
    cum += levelWeights[i]
    if (r < cum) return levels[i]
  }
  return levels[1]
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function padLevel(level) {
  return level.padEnd(5)
}

function generateLine(i) {
  const baseTime = new Date('2025-01-15T08:00:00.000Z')
  const ms = Math.floor(i * 50 + Math.random() * 30)
  const ts = new Date(baseTime.getTime() + ms)
  const level = pickLevel()
  const mod = pick(modules)
  const isoTime = ts.toISOString()

  switch (level) {
    case 'ERROR': {
      const templates = [
        `${isoTime} ${padLevel(level)} [${mod}] Query timeout after ${1000 + Math.floor(Math.random() * 9000)}ms: SELECT * FROM log_entries WHERE id = $1`,
        `${isoTime} ${padLevel(level)} [${mod}] Connection refused to upstream service at 10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${3000 + Math.floor(Math.random() * 5000)}`,
        `${isoTime} ${padLevel(level)} [${mod}] Unhandled exception: TypeError: Cannot read property 'id' of undefined\n    at Handler.process (src/${mod}/handler.ts:${42 + Math.floor(Math.random() * 200)}:15)`,
        `${isoTime} ${padLevel(level)} [${mod}] Failed to parse request body: SyntaxError: Unexpected token at position ${Math.floor(Math.random() * 500)}`
      ]
      return pick(templates)
    }
    case 'WARN': {
      const templates = [
        `${isoTime} ${padLevel(level)} [${mod}] Slow query detected, elapsed=${200 + Math.floor(Math.random() * 4800)}ms (threshold=200ms)`,
        `${isoTime} ${padLevel(level)} [${mod}] Token for user ${pick(users)} expires in ${Math.floor(Math.random() * 10)} minutes`,
        `${isoTime} ${padLevel(level)} [${mod}] Connection pool usage at ${70 + Math.floor(Math.random() * 30)}%, consider scaling`,
        `${isoTime} ${padLevel(level)} [${mod}] Rate limit approaching for client ${pick(users)}, ${800 + Math.floor(Math.random() * 200)}/1000 requests`
      ]
      return pick(templates)
    }
    case 'DEBUG': {
      const templates = [
        `${isoTime} ${padLevel(level)} [${mod}] Cache ${Math.random() > 0.5 ? 'hit' : 'miss'} for key=${mod}:${Math.floor(Math.random() * 10000)}`,
        `${isoTime} ${padLevel(level)} [${mod}] Processing batch item ${Math.floor(Math.random() * 1000)}/${1000}`,
        `${isoTime} ${padLevel(level)} [${mod}] SQL: SELECT id, name, created_at FROM ${mod}_entries WHERE active = true LIMIT 100`,
        `${isoTime} ${padLevel(level)} [${mod}] Heartbeat OK, uptime=${Math.floor(i / 20)}s, mem=${64 + Math.floor(Math.random() * 200)}MB`
      ]
      return pick(templates)
    }
    default: { // INFO
      const templates = [
        `${isoTime} ${padLevel(level)} [${mod}] ${pick(methods)} ${pick(paths)} ${pick(statusCodes)} ${1 + Math.floor(Math.random() * 500)}ms - user=${pick(users)}`,
        `${isoTime} ${padLevel(level)} [${mod}] WebSocket client connected, session_id=ws-${Math.random().toString(36).slice(2, 10)}, total=${1 + Math.floor(Math.random() * 50)}`,
        `${isoTime} ${padLevel(level)} [${mod}] Background job completed: ${pick(['cleanup', 'export', 'sync', 'backup'])} in ${10 + Math.floor(Math.random() * 5000)}ms`,
        `${isoTime} ${padLevel(level)} [${mod}] Metrics: requests=${Math.floor(Math.random() * 1000)}, errors=${Math.floor(Math.random() * 20)}, p99=${Math.floor(Math.random() * 500)}ms`
      ]
      return pick(templates)
    }
  }
}

const stream = fs.createWriteStream(OUTPUT)
for (let i = 0; i < TOTAL_LINES; i++) {
  stream.write(generateLine(i) + '\n')
}
stream.end(() => {
  const stats = fs.statSync(OUTPUT)
  console.log(`Generated ${OUTPUT} (${TOTAL_LINES} lines, ${(stats.size / 1024 / 1024).toFixed(1)} MB)`)
})
