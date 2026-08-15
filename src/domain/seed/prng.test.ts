import { describe, expect, it } from 'vitest'
import { hash32, mulberry32, Random, streamRng } from './prng'

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(20260815)
    const b = mulberry32(20260815)
    const seqA = Array.from({ length: 100 }, () => a())
    const seqB = Array.from({ length: 100 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('differs across seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const seqA = Array.from({ length: 100 }, () => a())
    const seqB = Array.from({ length: 100 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('stays within [0, 1)', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('hash32 / streamRng', () => {
  it('hash32 is stable', () => {
    expect(hash32('a:b:c')).toBe(hash32('a:b:c'))
    expect(hash32('a:b:c')).not.toBe(hash32('a:b:d'))
  })

  it('derives stable, independent streams', () => {
    const s1a = streamRng('SG-DEMO-2026.1', 20260815, 'baseline')
    const s1b = streamRng('SG-DEMO-2026.1', 20260815, 'baseline')
    const s2 = streamRng('SG-DEMO-2026.1', 20260815, 'claims')
    const seq1a = Array.from({ length: 32 }, () => s1a())
    const seq1b = Array.from({ length: 32 }, () => s1b())
    const seq2 = Array.from({ length: 32 }, () => s2())
    expect(seq1a).toEqual(seq1b)
    expect(seq1a).not.toEqual(seq2)
  })

  it('changes when seedVersion or seed changes', () => {
    expect(Array.from({ length: 16 }, streamRng('v1', 7, 'x'))).not.toEqual(
      Array.from({ length: 16 }, streamRng('v2', 7, 'x')),
    )
    expect(Array.from({ length: 16 }, streamRng('v1', 7, 'x'))).not.toEqual(
      Array.from({ length: 16 }, streamRng('v1', 8, 'x')),
    )
  })
})

describe('Random helpers', () => {
  it('int respects bounds', () => {
    const r = new Random(mulberry32(99))
    for (let i = 0; i < 500; i++) {
      const v = r.int(3, 7)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(7)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('pick returns a member and is deterministic', () => {
    const items = ['a', 'b', 'c', 'd'] as const
    const r1 = new Random(mulberry32(5))
    const r2 = new Random(mulberry32(5))
    const picked = Array.from({ length: 20 }, () => r1.pick(items))
    const picked2 = Array.from({ length: 20 }, () => r2.pick(items))
    expect(picked).toEqual(picked2)
    for (const v of picked) expect(items).toContain(v)
  })

  it('shuffle preserves elements and is deterministic', () => {
    const r1 = new Random(mulberry32(12))
    const r2 = new Random(mulberry32(12))
    const a = r1.shuffle([1, 2, 3, 4, 5, 6])
    const b = r2.shuffle([1, 2, 3, 4, 5, 6])
    expect(a).toEqual(b)
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('money rounds to cents and stays in range', () => {
    const r = new Random(mulberry32(3))
    for (let i = 0; i < 500; i++) {
      const v = r.money(1000, 100000)
      expect(v).toBeGreaterThan(1000)
      expect(v).toBeLessThan(100000)
      // fractional part is quantised to 0.01 steps (floating-point tolerance)
      expect(Math.abs(v * 100 - Math.round(v * 100))).toBeLessThan(1e-6)
    }
  })
})
