import { describe, expect, it, vi } from 'vitest'

vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { runSections } from './sections'

describe('runSections', () => {
	it('responds 200 when every section works', async () => {
		const res = await runSections([
			{ name: 'News', run: async () => '<ul></ul>' },
			{ name: 'Youtini', run: async () => '<ul></ul>' },
		])
		expect(res.status).toBe(200)
		expect((await res.json()).ok).toBe(true)
	})

	it('keeps running after a section throws and responds 500', async () => {
		const later = vi.fn().mockResolvedValue('ok')
		const res = await runSections([
			{
				name: 'Books',
				run: async () => {
					throw new Error('fandom was down')
				},
			},
			{ name: 'TV', run: later },
		])
		expect(later).toHaveBeenCalledOnce()
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.sections[0]).toEqual({ name: 'Books', ok: false, error: 'fandom was down' })
		expect(body.sections[1].ok).toBe(true)
	})
})
