import { chromium } from 'playwright-core'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)

const BASE = 'http://localhost:5173/Construction-Project-ERP/'
const OUT = 'spike/qa'
fs.mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

const browser = await chromium.launch({ channel: 'chrome' })
const report = {}

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(OUT, vp.name + '.png'), fullPage: true })

  const title = await page.title()
  const h1 = await page.locator('h1').first().textContent().catch(() => null)
  const navCount = await page.locator('.app-sidebar a').count()
  const bottomNavVisible = await page.locator('.app-bottom-nav').isVisible().catch(() => false)
  const menuToggleVisible = await page.locator('.menu-toggle').isVisible().catch(() => false)
  const statusPills = await page.locator('.status-pill').count()
  const skipLink = await page.locator('.skip-link').count()

  // mobile-only: more sheet flow
  let sheetOk = null
  if (vp.name === 'mobile') {
    await page.locator('.bottom-nav-more').click()
    await page.waitForTimeout(100)
    sheetOk = await page.locator('.app-sheet').isVisible()
    await page.locator('.sheet-close').click()
  }

  // tablet-only: drawer flow
  let drawerOk = null
  if (vp.name === 'tablet') {
    await page.locator('.menu-toggle').click()
    await page.waitForTimeout(150)
    drawerOk = await page.locator('.app-sidebar').evaluate((el) => el.classList.contains('drawer-open'))
  }

  report[vp.name] = {
    title, h1, navCount, bottomNavVisible, menuToggleVisible, statusPills, skipLink,
    sheetOk, drawerOk,
    consoleErrors, pageErrors,
  }
  await page.close()
}

// Axe accessibility scan (desktop page)
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
const axeResults = await page.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))
})
report.axe = { violations: axeResults }
fs.writeFileSync(path.join(OUT, 'axe.json'), JSON.stringify(axeResults, null, 2))
await page.close()
await browser.close()

console.log(JSON.stringify(report, null, 2))
