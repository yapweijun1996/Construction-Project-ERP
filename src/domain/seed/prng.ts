/**
 * Deterministic PRNG layer for the seed engine.
 *
 * Contract (docs/02-architecture/DEMO-DATA-ENGINE.md): identical
 * seed + seedVersion + catalog files must reproduce the identical baseline.
 *
 * - mulberry32: 32-bit state PRNG, value range [0, 1).
 * - hash32 (xmur3): string -> uint32, used to derive per-stream seeds.
 * - streamRng: independent deterministic stream for a named pipeline stage,
 *   so reordering one stage's draws cannot shift another stage's numbers.
 */

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hash32(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

export function streamRng(seedVersion: string, seed: number, stream: string): Rng {
  return mulberry32(hash32(seedVersion + ':' + seed + ':' + stream))
}

/** Convenience wrapper with domain-friendly draws. */
export class Random {
  constructor(private readonly rng: Rng) {}

  /** Uniform in [0, 1). */
  next(): number {
    return this.rng()
  }

  /** Integer in [minInclusive, maxInclusive]. */
  int(minInclusive: number, maxInclusive: number): number {
    if (maxInclusive < minInclusive) throw new Error('Random.int: empty range')
    return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1))
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Random.pick: empty collection')
    return items[Math.floor(this.next() * items.length)]
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability
  }

  /** SGD amount in [minExclusive, maxExclusive), rounded to cents. */
  money(minExclusive: number, maxExclusive: number): number {
    const raw = minExclusive + this.next() * (maxExclusive - minExclusive)
    return Math.round(raw * 100) / 100
  }
}
