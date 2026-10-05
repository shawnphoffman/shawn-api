import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeRedis, FakeRedis } from '@/test/fakeRedis'

let fake: FakeRedis
vi.mock('@/utils/redis', () => ({ default: () => fake, RedisKey: { FeedDown: 'job:feed-down' } }))
vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { applyFeedDownPolicy, FEED_DOWN_ALERT_RUNS, FEED_DOWN_REMIND_RUNS, FeedResult, markFeedDown, newFeedResult } from './_result'

const downResult = (feed: string) => {
	const r = newFeedResult(feed)
	markFeedDown(r, 'No youtube feed found')
	return r
}

// Runs the policy for one feed `times` times in a row and returns the last result
async function runDown(feed: string, times: number, debug = false): Promise<FeedResult> {
	let r = downResult(feed)
	for (let i = 0; i < times; i++) {
		r = downResult(feed)
		await applyFeedDownPolicy([r], { debug })
	}
	return r
}

beforeEach(() => {
	fake = createFakeRedis()
})

describe('applyFeedDownPolicy', () => {
	it('treats a feed that just went down as a warning', async () => {
		const r = await runDown('Blue Harvest YouTube', 1)
		expect(r.errors).toEqual([])
		expect(r.warnings).toEqual(['No youtube feed found (down 1 run in a row)'])
	})

	it('fails the job once the feed has been down for two hours, and only then', async () => {
		const before = await runDown('Blue Harvest YouTube', FEED_DOWN_ALERT_RUNS - 1)
		expect(before.errors).toEqual([])

		const at = downResult('Blue Harvest YouTube')
		await applyFeedDownPolicy([at], { debug: false })
		expect(at.errors).toEqual([`No youtube feed found (down ${FEED_DOWN_ALERT_RUNS} runs in a row)`])

		const after = downResult('Blue Harvest YouTube')
		await applyFeedDownPolicy([after], { debug: false })
		expect(after.errors).toEqual([])
		expect(after.warnings).toHaveLength(1)
	})

	it('reminds about once a day while the feed stays down', async () => {
		const r = await runDown('Blue Harvest YouTube', FEED_DOWN_ALERT_RUNS + FEED_DOWN_REMIND_RUNS)
		expect(r.errors).toHaveLength(1)
	})

	it('clears the count when the feed reads again', async () => {
		await runDown('Blue Harvest YouTube', 5)
		await applyFeedDownPolicy([newFeedResult('Blue Harvest YouTube')], { debug: false })
		expect(fake.hashes.get('job:feed-down')).toEqual({})
		const again = await runDown('Blue Harvest YouTube', 1)
		expect(again.warnings).toEqual(['No youtube feed found (down 1 run in a row)'])
	})

	it('counts each feed separately', async () => {
		await runDown('Feed A', 3)
		const b = await runDown('Feed B', 1)
		expect(b.warnings).toEqual(['No youtube feed found (down 1 run in a row)'])
		expect(fake.hashes.get('job:feed-down')).toEqual({ 'Feed A': 3, 'Feed B': 1 })
	})

	it('never changes the counts on a dry run', async () => {
		await runDown('Blue Harvest YouTube', 2)
		const dry = await runDown('Blue Harvest YouTube', 3, true)
		expect(dry.warnings).toEqual(['No youtube feed found (down 3 runs in a row)'])
		await applyFeedDownPolicy([newFeedResult('Blue Harvest YouTube')], { debug: true })
		expect(fake.hashes.get('job:feed-down')).toEqual({ 'Blue Harvest YouTube': 2 })
	})
})
