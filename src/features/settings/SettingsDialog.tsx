/**
 * TASK-013 — settings / demo data panel (DEMO-RESET.md).
 *
 * Settings → Demo Data → Reset Demo Data. Shows the seed version, warning,
 * and recreates the deterministic baseline after a two-step confirm.
 */

import { useState } from 'react'
import { resetDemoData, seedInfo } from '../../data/demoStore'
import { serializeBaseline } from '../../domain/seed/engine'
import { buildBaseline } from '../../data/baseline'
import { runIntegrityChecks, type IntegrityReport } from '../../domain/integrity'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog({ open, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [report, setReport] = useState<IntegrityReport | null>(null)

  if (!open) return null

  const info = seedInfo()
  const before = serializeBaseline(buildBaseline())

  const confirmReset = () => {
    resetDemoData()
    const after = serializeBaseline(buildBaseline())
    setDone(after === before)
    setConfirming(false)
  }

  return (
    <div className="settings-stack">
      <button type="button" className="sheet-backdrop" aria-label="Close settings" onClick={onClose} />
      <div className="app-sheet settings-sheet" role="dialog" aria-modal="true" aria-label="Settings">
        <h2>Settings</h2>
        <section aria-labelledby="integrity-heading" className="settings-section">
          <h3 id="integrity-heading">Data Integrity</h3>
          {!report && (
            <button type="button" className="step-button" onClick={() => setReport(runIntegrityChecks(buildBaseline()))}>
              Run Integrity Checks
            </button>
          )}
          {report && (
            <div aria-live="polite">
              <p className={report.failCount === 0 ? 'section-note' : 'reset-confirm'} role="status">
                {report.okCount} passed, {report.failCount} failed — engine {report.engineVersion} / seed{' '}
                {report.seedVersion}
              </p>
              {report.failCount > 0 && (
                <ul className="doc-list">
                  {report.checks.filter((c) => c.status === 'fail').map((c) => (
                    <li key={c.id}>
                      <strong>{c.label}</strong>
                      {c.detail ? ' — ' + c.detail : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
        <section aria-labelledby="demo-data-heading" className="settings-section">
          <h3 id="demo-data-heading">Demo Data</h3>
          <dl className="settings-list">
            <div><dt>Seed version</dt><dd>{info.seedVersion}</dd></div>
            <div><dt>Seed</dt><dd>{info.seed}</dd></div>
            <div><dt>Engine version</dt><dd>{info.engineVersion}</dd></div>
            <div><dt>Projects</dt><dd>{info.projects}</dd></div>
          </dl>
          {!confirming && !done && (
            <button type="button" className="step-button" onClick={() => setConfirming(true)}>
              Reset Demo Data
            </button>
          )}
          {confirming && (
            <div className="reset-confirm" role="alert">
              <p>
                <strong>Warning:</strong> this clears only this app&apos;s local demo edits and recreates the
                identical deterministic baseline ({info.seedVersion}). This cannot be undone.
              </p>
              <div className="stepper-actions">
                <button type="button" className="step-button" onClick={confirmReset}>
                  Confirm Reset
                </button>
                <button type="button" className="step-button" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {done && (
            <p className="section-note" role="status">
              Demo data reset — the deterministic baseline was recreated identically.
            </p>
          )}
        </section>
        <button type="button" className="sheet-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
