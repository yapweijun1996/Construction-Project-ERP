/**
 * TASK-010a — Procurement (SPEC-007 chain start).
 *
 * Purchase orders and subcontract awards feed cost commitments; suppliers
 * and subcontractors come from the seeded party register.
 */

import { useMemo } from 'react'
import { buildBaseline } from '../../data/baseline'
import { formatSgd } from '../../domain/kpis'
import StatusPill from '../../ui/StatusPill'

interface Props {
  projectId: string
  onChangeProject: (id: string) => void
}

export default function ProcurementView({ projectId, onChangeProject }: Props) {
  const ds = useMemo(() => buildBaseline(), [])
  const project = ds.projects.find((p) => p.id === projectId)

  if (!project) return <p className="section-note">Project not found.</p>

  const partyName = new Map(ds.parties.map((p) => [p.id, p.name]))
  const orders = ds.purchaseOrders.filter((po) => po.projectId === projectId)
  const awards = orders.filter((po) => po.kind === 'subcontract-award')
  const totalCommitted = orders.reduce((a, po) => a + po.amount, 0)

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
        <h1>Procurement</h1>
        <p className="section-description">
          Purchase orders and subcontract awards — the commitment side of cost control.
        </p>
      </header>
      <div className="section-body">
        <dl className="contract-summary">
          <div className="kpi-card"><dt>Orders</dt><dd className="kpi-small">{orders.length}</dd></div>
          <div className="kpi-card"><dt>Subcontract Awards</dt><dd className="kpi-small">{awards.length}</dd></div>
          <div className="kpi-card"><dt>Total Committed</dt><dd>{formatSgd(totalCommitted)}</dd></div>
        </dl>

        <h2>Purchase / Subcontract Orders ({orders.length})</h2>
        <div className="table-scroll">
          <table className="register-table">
            <caption className="visually-hidden">Purchase orders for {project.code}</caption>
            <thead>
              <tr>
                <th scope="col">Order No</th>
                <th scope="col">Kind</th>
                <th scope="col">Vendor</th>
                <th scope="col">Issued</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id}>
                  <td>{po.poNo}</td>
                  <td>
                    {po.kind === 'subcontract-award' ? (
                      <span className="do-pill">Subcontract Award</span>
                    ) : (
                      <span className="progress-pill">PO</span>
                    )}
                  </td>
                  <td>{partyName.get(po.vendorId) ?? po.vendorId}</td>
                  <td>{po.issuedAt}</td>
                  <td className="num">{formatSgd(po.amount)}</td>
                  <td><StatusPill status={po.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="revision-note" role="note">
          Subcontract awards flow into the Subcontracts section: Award → Subcon Claim → QS Verification →
          Subcon Certificate → AP/Payment (SPEC-007).
        </p>
      </div>
    </article>
  )
}
