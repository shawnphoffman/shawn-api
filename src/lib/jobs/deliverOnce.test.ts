import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeRedis, FakeRedis } from '@/test/fakeRedis'

let fake: FakeRedis
vi.mock('@/utils/redis', () => ({ default: () => fake }))

import { deliverOnce } from './deliverOnce'

beforeEach(() => {
	fake = createFakeRedis()
})

describe('deliverOnce', () => {
	it('sends and records a new delivery', async () => {
		const send = vi.fn().mockResolvedValue(undefined)
		expect(await deliverOnce('rss:discord', 'show:ep1', send)).toBe('sent')
		expect(send).toHaveBeenCalledOnce()
		expect(fake.sets.get('rss:discord')?.has('show:ep1')).toBe(true)
	})

	it('skips a delivery Redis already has', async () => {
		await fake.sadd('rss:discord', 'show:ep1')
		const send = vi.fn()
		expect(await deliverOnce('rss:discord', 'show:ep1', send)).toBe('skipped')
		expect(send).not.toHaveBeenCalled()
	})

	it('does not record a delivery that failed, so the next run retries it', async () => {
		const send = vi.fn().mockRejectedValue(new Error('Discord said no'))
		await expect(deliverOnce('rss:discord', 'show:ep1', send)).rejects.toThrow('Discord said no')
		expect(fake.sets.get('rss:discord')?.has('show:ep1') ?? false).toBe(false)

		const retry = vi.fn().mockResolvedValue(undefined)
		expect(await deliverOnce('rss:discord', 'show:ep1', retry)).toBe('sent')
	})
})
