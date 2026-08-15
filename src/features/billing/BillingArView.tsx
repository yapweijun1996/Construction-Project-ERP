/**
 * TASK-009 — Billing & AR credit flow (SPEC-006).
 *
 * CCAR -> AR Document -> Receipt/Credit Allocation -> Settlement.
 * Positive certifications bill as invoices; negative certifications produce
 * explicit credit notes (ADR-008). Existing credit is applied during
 * allocation and never deducted again inside the next PCAR (BR-AR-003).
 */

import { useMemo, useState } from 'react'
import { buildBaseline } from '../../data/baseline'
import { computeProjectKpis, formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function BillingArView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)
  const [docId, setDocId] = useState<string | null>(null)

  if (!project) return <p className="section-note">Project not found.</p>

  const k = computeProjectKpis(ds, project)
  const docs = ds.arDocuments.filter((d) => d.projectId === projectId)
  const receiptsById = new Map<string, typeof ds.receipts>()
  for (const r of ds.receipts) {
    if (r.projectId !== projectId) continue
    const list = receiptsById.get(r.arDocumentId) ?? []
    list.push(r)
    receiptsById.set(r.arDocumentId, list)
  }
  const docsById = new Map(ds.arDocuments.map((d) => [d.id, d]))

  const active = docs.find((d) => d.id === docId) ?? null

  if (!active) {
    return (
      <article className="section">
        <header className="section-header">
          <label className="project-picker">
            Project
            <select value={projectId} onChange={(e) => onChangeProject(e.target.value)}>
              {ds.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
              ))}
            </select>
          </label>
          <h1>Billing &amp; AR</h1>
          <p className="section-description">
            Invoices, credit notes, receipts and allocations — certified does not equal invoiced, which does not
            equal collected (BR-AR-001).
          </p>
        </header>
        <div className="section-body">
          <dl className="contract-summary">
            <div className="kpi-card"><dt>Billed</dt><dd>{formatSgd(k.billed)}</dd></div>
            <div className="kpi-card"><dt>Credits</dt><dd className={k.credits < 0 ? 'delta-neg' : undefined}>{formatSgd(k.credits)}</dd></div>
            <div className="kpi-card"><dt>Collected</dt><dd>{formatSgd(k.collected)}</dd></div>
            <div className="kpi-card"><dt>AR Exposure</dt><dd className={k.ar < 0 ? 'delta-neg' : undefined}>{formatSgd(k.ar)}</dd></div>
          </dl>

          <h2>AR Documents ({docs.length})</h2>
          <div className="table-scroll">
            <table className="register-table">
              <caption className="visually-hidden">AR documents for {project.code}</caption>
              <thead>
                <tr>
                  <th scope="col">Doc No</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Issued</th>
                  <th scope="col" className="num">Amount</th>
                  <th scope="col" className="num">GST</th>
                  <th scope="col" className="num">Total</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className={d.kind === 'credit-note' ? 'row-negative' : undefined}>
                    <td>
                      <button type="button" className="row-link" onClick={() => setDocId(d.id)}>
                        {d.docNo}
                      </button>
                    </td>
                    <td>
                      {d.kind === 'invoice' ? (
                        <span className="progress-pill">Invoice</span>
                      ) : (
                        <span className="do-pill">Credit Note</span>
                      )}
                    </td>
                    <td>{d.issuedAt}</td>
                    <td className="num">{formatSgd(d.amount)}</td>
                    <td className="num">{formatSgd(d.gst)}</td>
                    <td className={'num ' + (d.total < 0 ? 'delta-neg' : '')}>{formatSgd(d.total)}</td>
                    <td><StatusPill status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="revision-note" role="note">
            Negative certifications bill as explicit credit notes. Existing credit is applied during
            allocation — never deducted again inside the next PCAR (BR-AR-003).
          </p>
        </div>
      </article>
    )
  }

  const isCredit = active.kind === 'credit-note'
  const docReceipts = receiptsById.get(active.id) ?? []
  const docAllocations = ds.allocations.filter((a) => a.arDocumentId === active.id)
  const creditAllocations = ds.allocations.filter((a) => a.creditDocumentId === active.id)

  return (
    <article className="section">
      <header className="section-header">
        <button type="button" className="back-link" onClick={() => setDocId(null)}>
          ← Back to AR documents
        </button>
        <h1>{active.docNo} <span className="claim-period">({active.issuedAt})</span></h1>
        <p className="section-description">
          {isCredit
            ? 'Credit note — negative certification produces an explicit AR credit (ADR-008).'
            : 'Invoice raised from certification. Collection is a separate stage (BR-AR-001).'}
        </p>
      </header>
      <div className="section-body">
        <dl className={'contract-summary ' + (isCredit ? 'summary-negative' : '')}>
          <div className="kpi-card"><dt>Kind</dt><dd className="kpi-small">{isCredit ? 'Credit Note' : 'Invoice'}</dd></div>
          <div className="kpi-card"><dt>Amount</dt><dd className={active.amount < 0 ? 'delta-neg' : undefined}>{formatSgd(active.amount)}</dd></div>
          <div className="kpi-card"><dt>GST</dt><dd>{formatSgd(active.gst)}</dd></div>
          <div className="kpi-card"><dt>Total</dt><dd className={active.total < 0 ? 'delta-neg' : undefined}>{formatSgd(active.total)}</dd></div>
          <div className="kpi-card"><dt>Status</dt><dd className="kpi-small"><StatusPill status={active.status} /></dd></div>
        </dl>

        {!isCredit && (
          <>
            <h2>Receipts ({docReceipts.length})</h2>
            <div className="table-scroll">
              <table className="register-table">
                <caption className="visually-hidden">Receipts for {active.docNo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Receipt No</th>
                    <th scope="col">Received</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {docReceipts.map((r) => (
                    <tr key={r.id}>
                      <td>{r.receiptNo}</td>
                      <td>{r.receivedAt}</td>
                      <td className="num">{formatSgd(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {docReceipts.length === 0 && (
              <p className="section-note" role="status">No receipts yet — outstanding AR.</p>
            )}

            <h2>Allocations ({docAllocations.length})</h2>
            <div className="table-scroll">
              <table className="register-table">
                <caption className="visually-hidden">Allocations for {active.docNo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Receipt</th>
                    <th scope="col">Applied Credit</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {docAllocations.map((a) => {
                    const credit = a.creditDocumentId ? docsById.get(a.creditDocumentId) : undefined
                    return (
                      <tr key={a.id}>
                        <td>{ds.receipts.find((r) => r.id === a.receiptId)?.receiptNo ?? a.receiptId}</td>
                        <td>{credit ? credit.docNo : '—'}</td>
                        <td className="num">{formatSgd(a.amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {isCredit && (
          <>
            <h2>Applied Against ({creditAllocations.length})</h2>
            <div className="table-scroll">
              <table className="register-table">
                <caption className="visually-hidden">Applications of {active.docNo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Receipt</th>
                    <th scope="col" className="num">Amount Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {creditAllocations.map((a) => (
                    <tr key={a.id}>
                      <td>{docsById.get(a.arDocumentId)?.docNo ?? a.arDocumentId}</td>
                      <td>{ds.receipts.find((r) => r.id === a.receiptId)?.receiptNo ?? '—'}</td>
                      <td className="num">{formatSgd(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {creditAllocations.length === 0 && (
              <p className="section-note" role="status">Not yet applied — available credit reduces future collections.</p>
            )}
          </>
        )}
      </div>
    </article>
  )
}
