import { chromium } from 'playwright-core'
import { createRequire } from 'node:module'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const BASE = 'http://localhost:4173/Construction-Project-ERP/'
const OUT = 'spike/qa-release'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
const report = {}

// ---- desktop load + SW + assets ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const failed = []
  const errors = []
  page.on('requestfailed', (req) => failed.push(req.url() + ' :: ' + (req.failure()?.errorText ?? '')))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })

  // service worker registration & activation (offline capability)
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    try {
      await navigator.serviceWorker.ready
      const reg = await navigator.serviceWorker.getRegistration()
      return reg ? reg.active !== null : false
    } catch {
      return false
    }
  })

  const manifestOk = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]')
    if (!link) return false
    const res = await fetch(link.getAttribute('href'))
    if (!res.ok) return false
    const json = await res.json()
    return json.name === 'Construction Project ERP' && Array.isArray(json.icons) && json.icons.length >= 3
  })

  // offline warm-load test
  let offlineOk = false
  if (swReady) {
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForTimeout(800)
    offlineOk = (await page.locator('.app-header .brand-title').count()) === 1
    await context.setOffline(false)
  }

  // axe
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help }))
  })

  report.desktop = { swReady, manifestOk, offlineOk, failed, errors, axeCount: axe.length, axe }
  await context.close()
}

// ---- three-viewport overflow check ----
for (const [name, width, height] of [['tablet', 768, 1024], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return { h: doc.scrollWidth > doc.clientWidth, v: doc.scrollHeight > doc.clientHeight * 1.5 }
  })
  await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: true })
  report[name] = { overflowHorizontal: overflow.h, tallScroll: overflow.v }
  await page.close()
}

await browser.close()
fs.writeFileSync(OUT + '/report.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
