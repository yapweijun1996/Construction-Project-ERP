/**
 * TASK-016 — local edit layer (Phase 2).
 *
 * The deterministic seed baseline is immutable. User-registered commercial
 * changes are appended edits stored in the app's own namespace
 * (localStorage 'demo:edits'), merged on read, and cleared by Reset
 * (BR-CONTRACT-003: history is never silently overwritten).
 */

import type { BaselineDataset, CommercialChange } from './types'

export type LocalChangeKind = 'VO' | 'Omission' | 'Adjustment' | 'Revised PO' | 'Backcharge'

export interface LocalCommercialChange {
  id: string
  projectId: string
  contractId: string
  kind: LocalChangeKind
  description: string
  signedValue: number
  status: 'Approved' | 'Pending'
  createdAt: string
}

export interface LocalEditStore {
  commercialChanges: LocalCommercialChange[]
}

const STORAGE_KEY = 'demo:edits'

export const LOCAL_CHANGE_KINDS: readonly LocalChangeKind[] = ['VO', 'Omission', 'Adjustment', 'Revised PO', 'Backcharge']

export class LocalEditError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LocalEditError'
  }
}

export function emptyEdits(): LocalEditStore {
  return { commercialChanges: [] }
}

export function loadLocalEdits(): LocalEditStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyEdits()
    const parsed = JSON.parse(raw) as Partial<LocalEditStore>
    const list = Array.isArray(parsed?.commercialChanges) ? parsed.commercialChanges : []
    // fail closed: drop malformed entries rather than corrupt the view
    return { commercialChanges: list.filter(isValidLocalChange) }
  } catch {
    return emptyEdits()
  }
}

export function saveLocalEdits(store: LocalEditStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage unavailable — edits are simply not persisted
  }
}

export function isValidLocalChange(value: unknown): value is LocalCommercialChange {
  if (typeof value !== 'object' || value === null) return false
  const c = value as Record<string, unknown>
  return (
    typeof c.id === 'string' &&
    typeof c.projectId === 'string' &&
    typeof c.contractId === 'string' &&
    typeof c.kind === 'string' &&
    (LOCAL_CHANGE_KINDS as readonly string[]).includes(c.kind) &&
    typeof c.description === 'string' &&
    c.description.length > 0 &&
    typeof c.signedValue === 'number' &&
    Number.isFinite(c.signedValue) &&
    c.signedValue !== 0 &&
    (c.status === 'Approved' || c.status === 'Pending') &&
    typeof c.createdAt === 'string'
  )
}

export interface LocalChangeDraft {
  projectId: string
  contractId: string
  kind: LocalChangeKind
  description: string
  signedValue: number
  status: 'Approved' | 'Pending'
}

export function validateLocalChangeDraft(draft: LocalChangeDraft): void {
  if (!(LOCAL_CHANGE_KINDS as readonly string[]).includes(draft.kind)) {
    throw new LocalEditError('unknown change kind')
  }
  if (draft.description.trim().length === 0) throw new LocalEditError('description is required')
  if (!Number.isFinite(draft.signedValue) || draft.signedValue === 0) {
    throw new LocalEditError('signed value must be a non-zero number')
  }
  if ((draft.kind === 'VO' || draft.kind === 'Revised PO') && draft.signedValue < 0) {
    throw new LocalEditError(draft.kind + ' must be positive')
  }
  if ((draft.kind === 'Omission' || draft.kind === 'Backcharge') && draft.signedValue > 0) {
    throw new LocalEditError(draft.kind + ' must be negative')
  }
}

export function nextLocalChangeId(existing: LocalCommercialChange[]): string {
  const seq = existing.filter((c) => c.id.startsWith('ch-user-')).length + 1
  return 'ch-user-' + String(seq).padStart(3, '0')
}

export function addLocalChange(store: LocalEditStore, draft: LocalChangeDraft): LocalEditStore {
  validateLocalChangeDraft(draft)
  const change: LocalCommercialChange = {
    id: nextLocalChangeId(store.commercialChanges),
    projectId: draft.projectId,
    contractId: draft.contractId,
    kind: draft.kind,
    description: draft.description.trim(),
    signedValue: Math.round(draft.signedValue * 100) / 100,
    status: draft.status,
    createdAt: new Date().toISOString(),
  }
  return { commercialChanges: [...store.commercialChanges, change] }
}

export function removeLocalChange(store: LocalEditStore, id: string): LocalEditStore {
  return { commercialChanges: store.commercialChanges.filter((c) => c.id !== id) }
}

function toEntity(c: LocalCommercialChange, seq: number): CommercialChange {
  return {
    id: c.id,
    contractId: c.contractId,
    projectId: c.projectId,
    code: 'CH-L' + String(seq).padStart(3, '0'),
    kind: c.kind,
    description: c.description,
    signedValue: c.signedValue,
    status: c.status,
  }
}

/** Merged view: baseline + local edits, baseline untouched. */
export function applyLocalEdits(baseline: BaselineDataset, store: LocalEditStore): BaselineDataset {
  if (store.commercialChanges.length === 0) return baseline
  const userChanges = store.commercialChanges.map((c, i) => toEntity(c, i + 1))
  return {
    ...baseline,
    commercialChanges: [...baseline.commercialChanges, ...userChanges],
  }
}
