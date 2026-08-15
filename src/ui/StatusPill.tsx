import { statusClass } from './statuses'

export default function StatusPill({ status }: { status: string }) {
  // Colour is paired with the visible label so meaning never relies on colour alone.
  return <span className={'status-pill ' + statusClass(status)}>{status}</span>
}
