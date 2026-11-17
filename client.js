window.__ModuleLoader__.load({
  id: 'dsh-appearance',
  factory(require) {
    const BASE = '/dsh-appearance'
    const STYLE_ID = 'dsh-appearance-style'
    let styleEl = null

    function log(...args) {
      try {
        console.log('[dsh-appearance]', ...args)
      } catch {}
    }

    function alpha(pct) {
      const v = Number(pct)
      if (!Number.isFinite(v)) return 0.2
      return Math.round(Math.max(0, Math.min(100, v))) / 100
    }

    function applyCss(data) {
      const cfg = data && typeof data === 'object' && data.config ? data.config : {}
      const workspace = alpha(cfg.workspaceOpacity ?? 20)
      const sidebar = alpha(cfg.sidebarOpacity ?? 30)
      const overlay = alpha(cfg.overlayStrength ?? 40)
      const accent = typeof cfg.accentColor === 'string' && cfg.accentColor !== '' ? cfg.accentColor : '#cd5e85'
      const icon = typeof cfg.accentIconColor === 'string' && cfg.accentIconColor !== '' ? cfg.accentIconColor : '#a87080'

      const parts = [
        'body { --dsw-alias-bg-base: rgba(255,255,255,' + workspace + ') !important; }',
        'body[data-ds-dark-theme] { --dsw-alias-bg-base: rgba(21,21,23,' + workspace + ') !important; }',
        'body { --dsw-specific-sidebar-fill: rgba(255,255,255,' + sidebar + ') !important; }',
        'body[data-ds-dark-theme] { --dsw-specific-sidebar-fill: rgba(21,21,23,' + sidebar + ') !important; }',
        '[data-turn-process] { color: ' + accent + ' !important; -webkit-text-fill-color: ' + accent + ' !important; }',
        '[data-process-activity] { color: ' + accent + ' !important; -webkit-text-fill-color: ' + accent + ' !important; }',
        '[data-composer-stat] svg { color: ' + icon + ' !important; }',
        '[data-clock] button[aria-haspopup="dialog"] { color: ' + icon + ' !important; -webkit-text-fill-color: ' + icon + ' !important; }',
        '[data-clock] [class*="timeEnd"], [data-clock] [class*="timeStart"] { color: ' + icon + ' !important; -webkit-text-fill-color: ' + icon + ' !important; }',
        '[data-clock] button:not([aria-haspopup="dialog"]) { color: var(--dsw-alias-label-tertiary) !important; -webkit-text-fill-color: var(--dsw-alias-label-tertiary) !important; }',
      ]

      if (typeof data.image === 'string' && data.image !== '') {
        parts.push(
          'body {',
          '  background-color: transparent !important;',
          "  background-image: linear-gradient(rgba(15,16,22," + overlay + "), rgba(15,16,22," + overlay + ")), url('" + data.image + "');",
          '  background-size: cover;',
          '  background-position: center;',
          '  background-attachment: fixed;',
          '  background-repeat: no-repeat;',
          '}',
        )
      }

      const css = parts.join('\n')
      if (styleEl === null) {
        styleEl = document.createElement('style')
        styleEl.id = STYLE_ID
        document.head.appendChild(styleEl)
      }
      styleEl.textContent = css
      log('appearance applied:', data.image || '(no image)', cfg)
    }

    return {
      apply(ctx) {
        log('client loaded')
        fetch(BASE + '/status.json', { cache: 'no-store' })
          .then((response) => response.json())
          .then((data) => applyCss(data))
          .catch((error) => log('status fetch failed:', String(error)))
        ctx.effect(() => {
          return () => {
            if (styleEl !== null) {
              styleEl.remove()
              styleEl = null
            }
          }
        })
      },
    }
  },
})
