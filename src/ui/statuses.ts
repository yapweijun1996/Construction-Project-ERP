// Business statuses per docs/03-design/DESIGN-SYSTEM.md
export const BUSINESS_STATUSES = [
  'Draft',
  'Submitted',
  'Certified',
  'Partially Certified',
  'Billed',
  'Credit',
  'Partially Paid',
  'Settled',
  'On Hold',
  'Closed',
] as const

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number]

export function statusClass(status: string): string {
  return 'status--' + status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
