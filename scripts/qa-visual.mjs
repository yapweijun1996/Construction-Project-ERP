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

  // portfolio checks (TASK-004)
  const tableRows = await page.locator('.portfolio-table tbody tr').count()
  let workspace = null
  if (vp.name === 'desktop') {
    await page.locator('.portfolio-table .row-link').first().click()
    await page.waitForTimeout(200)
    const kpiCards = await page.locator('.kpi-card').count()
    // contract & commercial register (TASK-005)
    await page.locator('.app-sidebar a[href="#contract-commercial"]').click()
    await page.waitForTimeout(300)
    const registerTables = await page.locator('.register-table').count()
    const revisionNote = await page.locator('.revision-note').count()
    const evidencePills = (await page.locator('.do-pill').count()) + (await page.locator('.progress-pill').count())
    // progress section (TASK-006)
    await page.locator('.app-sidebar a[href="#progress"]').click()
    await page.waitForTimeout(300)
    const progressBars = await page.locator('progress').count()
    const progressTables = await page.locator('.register-table').count()
    // claims wizard (TASK-007)
    await page.locator('.app-sidebar a[href="#client-claims"]').click()
    await page.waitForTimeout(300)
    const pcarRows = await page.locator('.register-table tbody tr').count()
    await page.locator('.register-table .row-link').first().click()
    await page.waitForTimeout(200)
    const stepperSteps = await page.locator('.stepper button').count()
    await page.locator('.stepper button').nth(3).click()
    await page.waitForTimeout(150)
    const reviewFields = await page.locator('.contract-summary .kpi-card').count()
    // certification (TASK-008)
    await page.locator('.app-sidebar a[href="#certification"]').click()
    await page.waitForTimeout(300)
    const ccarRows = await page.locator('.register-table tbody tr').count()
    await page.locator('.register-table .row-link').first().click()
    await page.waitForTimeout(200)
    const compareCards = await page.locator('.contract-summary .kpi-card').count()
    // billing & AR (TASK-009)
    await page.locator('.app-sidebar a[href="#billing-ar"]').click()
    await page.waitForTimeout(300)
    const arRows = await page.locator('.register-table tbody tr').count()
    await page.locator('.register-table .row-link').first().click()
    await page.waitForTimeout(200)
    const arDetailHeadings = await page.locator('.section-body h2').count()
    // subcontracts (TASK-010)
    await page.locator('.app-sidebar a[href="#subcontracts"]').click()
    await page.waitForTimeout(300)
    const subcontractRows = await page.locator('.register-table tbody tr').count()
    await page.locator('.register-table .row-link').first().click()
    await page.waitForTimeout(200)
    const subclaimRows = await page.locator('.register-table tbody tr').count()
    // cost & POC (TASK-011)
    await page.locator('.app-sidebar a[href="#cost-poc"]').click()
    await page.waitForTimeout(300)
    const costCards = await page.locator('.kpi-grid .kpi-card').count()
    const measureCards = await page.locator('.contract-summary .kpi-card').count()
    const pocTrendRows = await page.locator('.register-table tbody tr').count()
    // documents & closeout (TASK-012)
    await page.locator('.app-sidebar a[href="#documents"]').click()
    await page.waitForTimeout(300)
    const docRows = await page.locator('.register-table tbody tr').count()
    await page.locator('.app-sidebar a[href="#closeout"]').click()
    await page.waitForTimeout(300)
    const retentionRows = await page.locator('.register-table tbody tr').count()
    // settings / demo reset (TASK-013)
    await page.locator('.settings-toggle').click()
    await page.waitForTimeout(200)
    const settingsDialog = await page.getByRole('dialog', { name: /settings/i }).count()
    const seedVersionVisible = await page.getByText('SG-DEMO-2026.1').count()
    await page.getByRole('button', { name: /reset demo data/i }).click()
    await page.waitForTimeout(150)
    const resetAlert = await page.getByRole('alert').count()
    await page.getByRole('button', { name: /^cancel$/i }).click()
    await page.getByRole('button', { name: /^close$/i }).click()
    await page.locator('.app-sidebar a[href="#overview"]').click()
    await page.waitForTimeout(200)
    workspace = { kpiCards, registerTables, revisionNote, evidencePills, progressBars, progressTables, pcarRows, stepperSteps, reviewFields, ccarRows, compareCards, arRows, arDetailHeadings, subcontractRows, subclaimRows, costCards, measureCards, pocTrendRows, docRows, retentionRows, settingsDialog, seedVersionVisible, resetAlert, backWorks: (await page.locator('.portfolio-table tbody tr').count()) === 30 }
  }

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
    sheetOk, drawerOk, tableRows, workspace,
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
