/**
 * TASK-013 — offline awareness (SPEC-010: offline after warm load).
 */

import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      You are offline — project data is cached locally and stays readable.
    </div>
  )
}
