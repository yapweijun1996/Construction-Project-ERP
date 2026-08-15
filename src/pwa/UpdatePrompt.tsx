/**
 * TASK-013 — user-controlled service-worker update prompt (SPEC-010).
 *
 * Pure presentational component: the registration hook feeds needRefresh;
 * the user decides when to reload. Never auto-reloads under the user.
 */

interface Props {
  needRefresh: boolean
  onReload: () => void
}

export default function UpdatePrompt({ needRefresh, onReload }: Props) {
  if (!needRefresh) return null
  return (
    <div className="update-prompt" role="status" aria-live="polite">
      <span>New version available — your data is safe locally.</span>
      <button type="button" onClick={onReload}>
        Reload
      </button>
    </div>
  )
}
