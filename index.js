/**
 * dsh-appearance — host half.
 *
 * Serves the user's background image and the current appearance configuration.
 * All tunable values live in the Config schema below, so they are editable in
 * the Plugin Manager settings form without touching code.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join } from 'node:path'
import z from '@deepseek-ai/schemastery'

export const name = 'dsh-appearance'

/** The webserver route is the only host service this plugin needs. */
export const inject = ['webServer']

/** Editable settings; the Plugin Manager renders a form from this schema. */
export const Config = z.object({
  backgroundDir: z.string().default(''),
  accentColor: z.string().default('#cd5e85'),
  accentIconColor: z.string().default('#a87080'),
  workspaceOpacity: z.number().step(1).min(0).max(100).default(20),
  sidebarOpacity: z.number().step(1).min(0).max(100).default(30),
  overlayStrength: z.number().step(1).min(0).max(100).default(40),
})

const BASE = '/dsh-appearance'
const IMAGE_ROUTE = BASE + '/image'
const STATUS_ROUTE = BASE + '/status.json'

const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp'])
const PREFERRED = ['background.png', 'background.jpg', 'background.jpeg', 'background.webp', 'background.gif', 'background.avif']

function contentDir(config) {
  const custom = config && typeof config.backgroundDir === 'string' ? config.backgroundDir.trim() : ''
  if (custom !== '') return custom
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'workspace-background')
}

function contentType(ext) {
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}

function versionOf(file) {
  try {
    const st = statSync(file)
    return 's' + st.size + '-t' + Math.round(st.mtimeMs)
  } catch {
    return '0'
  }
}

function findImage(dir) {
  if (!existsSync(dir)) return null
  for (const name of PREFERRED) {
    const p = join(dir, name)
    if (existsSync(p)) return p
  }
  let best = null
  let bestMtime = 0
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return null
  }
  for (const name of entries) {
    if (!EXTS.has(extname(name).toLowerCase())) continue
    const p = join(dir, name)
    let st
    try {
      st = statSync(p)
    } catch {
      continue
    }
    if (st.isFile() && st.mtimeMs > bestMtime) {
      bestMtime = st.mtimeMs
      best = p
    }
  }
  return best
}

function listFiles(dir) {
  const result = []
  if (existsSync(dir)) {
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      entries = []
    }
    for (const name of entries) {
      if (!EXTS.has(extname(name).toLowerCase())) continue
      const p = join(dir, name)
      try {
        const st = statSync(p)
        if (st.isFile()) result.push({ name, bytes: st.size, mtime: st.mtimeMs })
      } catch {
        /* ignore unreadable entry */
      }
    }
  }
  result.sort((a, b) => b.mtime - a.mtime)
  return result
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(payload, null, 2))
}

export function apply(ctx, config) {
  const dir = contentDir(config)

  const configPayload = {
    accentColor: typeof config?.accentColor === 'string' ? config.accentColor : '#cd5e85',
    accentIconColor: typeof config?.accentIconColor === 'string' ? config.accentIconColor : '#a87080',
    workspaceOpacity: typeof config?.workspaceOpacity === 'number' ? config.workspaceOpacity : 20,
    sidebarOpacity: typeof config?.sidebarOpacity === 'number' ? config.sidebarOpacity : 30,
    overlayStrength: typeof config?.overlayStrength === 'number' ? config.overlayStrength : 40,
  }

  const serveImage = (req, res) => {
    const file = findImage(dir)
    if (file === null) {
      res.writeHead(404, {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(
        'dsh-appearance: no image found in ' +
          dir +
          ' — drop background.png / background.jpg / *.webp there',
      )
      return
    }
    const etag = '"' + versionOf(file) + '"'
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { etag })
      res.end()
      return
    }
    try {
      const body = readFileSync(file)
      res.writeHead(200, {
        'content-type': contentType(extname(file)),
        'content-length': body.length,
        'cache-control': 'no-cache',
        etag,
      })
      res.end(body)
    } catch {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
      res.end('dsh-appearance: could not read the image')
    }
  }

  const serveStatus = (req, res) => {
    const file = findImage(dir)
    sendJson(res, {
      ok: true,
      dir,
      file: file === null ? null : basename(file),
      image: file === null ? null : IMAGE_ROUTE + '?v=' + encodeURIComponent(versionOf(file)),
      files: listFiles(dir),
      config: configPayload,
    })
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: IMAGE_ROUTE, handler: serveImage }), 'dsh-appearance: image')
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: STATUS_ROUTE, handler: serveStatus }), 'dsh-appearance: status')
}
