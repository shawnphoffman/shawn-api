import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { fetchInTiers } from './tier'

const schema = z.object({ ok: z.boolean() })

describe('fetchInTiers', () => {
	it('tries native, then the solver, then puppeteer, and takes the first valid result', async () => {
		const calls: string[] = []
		const result = await fetchInTiers({
			url: 'https://example.com',
			schema,
			source: {
				name: 'test',
				fetchNative: async () => (calls.push('native'), null),
				fetchSolver: async () => (calls.push('solver'), { ok: true }),
				fetchPuppeteer: async () => (calls.push('puppeteer'), { ok: true }),
			},
		})
		expect(calls).toEqual(['native', 'solver'])
		expect(result).toEqual({ tier: 'solver', data: { ok: true } })
	})

	it('skips the solver for sources without one and moves past invalid data', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		const result = await fetchInTiers({
			url: 'https://example.com',
			schema,
			source: { name: 'test', fetchNative: async () => ({ wrong: 1 }) as unknown as { ok: boolean }, fetchPuppeteer: async () => ({ ok: false }) },
		})
		expect(result).toEqual({ tier: 'puppeteer', data: { ok: false } })
	})

	it('returns null when every tier fails', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const result = await fetchInTiers({
			url: 'https://example.com',
			schema,
			source: { name: 'test', fetchNative: async () => null, fetchSolver: async () => { throw new Error('x') }, fetchPuppeteer: async () => null },
		})
		expect(result).toBeNull()
	})
})
