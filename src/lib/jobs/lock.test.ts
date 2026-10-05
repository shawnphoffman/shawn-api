import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeRedis, FakeRedis } from '@/test/fakeRedis'

let fake: FakeRedis
vi.mock('@/utils/redis', () => ({ default: () => fake, RedisKey: { JobLock: 'job:lock' } }))

import { withJobLock } from './lock'

beforeEach(() => {
	fake = createFakeRedis()
})

describe('withJobLock', () => {
	it('runs the job and releases the lock afterwards', async () => {
		const result = await withJobLock('podcast-check', 600, async () => 'done')
		expect(result).toEqual({ locked: false, result: 'done' })
		expect(fake.values.has('job:lock:podcast-check')).toBe(false)
	})

	it('refuses to run while another run holds the lock', async () => {
		await fake.set('job:lock:podcast-check', 'someone-else')
		const fn = vi.fn()
		expect(await withJobLock('podcast-check', 600, fn)).toEqual({ locked: true })
		expect(fn).not.toHaveBeenCalled()
	})

	it('releases the lock even when the job throws', async () => {
		await expect(
			withJobLock('podcast-check', 600, async () => {
				throw new Error('boom')
			})
		).rejects.toThrow('boom')
		expect(fake.values.has('job:lock:podcast-check')).toBe(false)
	})

	it('never releases a lock another run took over', async () => {
		await withJobLock('podcast-check', 600, async () => {
			// Simulate this run's lock expiring and another run taking it
			fake.values.set('job:lock:podcast-check', 'another-run')
		})
		expect(fake.values.get('job:lock:podcast-check')).toBe('another-run')
	})
})
