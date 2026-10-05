import { NextRequest, NextResponse } from 'next/server'

import { podcastFeeds } from '@/config/feeds/podcasts'
import { rssFeeds } from '@/config/feeds/rss'
import { youtubeFeeds } from '@/config/feeds/youtube'
import { guardJob } from '@/lib/jobs/guard'
import { withJobLock } from '@/lib/jobs/lock'
import { getBskyAgent } from '@/third-party/bluesky/agent'

import processFeeds from './_processFeeds'
import { applyFeedDownPolicy, FeedResult, newFeedResult, recordError } from './_result'
import processRssFeeds from './_processRssFeeds'
import processYoutubeFeeds from './_processYouTubeFeeds'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Longer than any normal run, so a run that dies does not block the next one for long
const LOCK_SECONDS = 600

// A feed that throws outside its own deliveries still gets a result, so the other feeds keep going
async function runFeed(name: string, check: () => Promise<FeedResult>): Promise<FeedResult> {
	try {
		return await check()
	} catch (error) {
		const result = newFeedResult(name)
		recordError(result, `${name} failed`, error)
		return result
	}
}

/**
 * GET /api/podcast-data/check
 *
 * Checks every podcast, RSS and YouTube feed and posts new items to Discord,
 * Bluesky, Overcast and the sites' refresh URLs, recording each delivery in
 * Redis so it happens once. Called by Cronicle on the Mac mini.
 *
 * Returns a JSON summary: 200 when everything worked, 500 when a delivery
 * failed or a feed has been down for two hours, 409 when another run is still
 * going. A feed that is only briefly down shows up under warnings. `?debug=true` runs
 * the checks without posting anything.
 */
export async function GET(req: NextRequest) {
	const rejected = guardJob(req, 'podcast-check')
	if (rejected) return rejected

	const debug = req.nextUrl.searchParams.get('debug') === 'true'

	const run = await withJobLock('podcast-check', LOCK_SECONDS, async () => {
		const results: FeedResult[] = []
		for (const config of podcastFeeds) {
			results.push(await runFeed(config.name, () => processFeeds({ debug, config })))
		}
		for (const config of rssFeeds) {
			results.push(await runFeed(config.name, () => processRssFeeds({ debug, config })))
		}
		for (const config of youtubeFeeds) {
			results.push(await runFeed(config.name, () => processYoutubeFeeds({ debug, config })))
		}
		// A dry run posts nothing, so log in to Bluesky to prove the account and client still work
		if (debug) {
			results.push(
				await runFeed('Bluesky login', async () => {
					await getBskyAgent()
					return newFeedResult('Bluesky login')
				})
			)
		}
		// Feeds that would not load only fail the job once they have been down for a while
		await applyFeedDownPolicy(results, { debug })
		return results
	})

	if (run.locked) {
		return NextResponse.json({ error: 'Another podcast check is still running' }, { status: 409 })
	}

	const results = run.result
	const errors = results.flatMap(r => r.errors.map(e => `${r.feed}: ${e}`))
	const sent = results.flatMap(r => r.sent.map(s => `${r.feed}: ${s}`))
	const warnings = results.flatMap(r => r.warnings.map(w => `${r.feed}: ${w}`))

	return NextResponse.json(
		{
			ok: errors.length === 0,
			debug,
			feeds: results.length,
			sent,
			errors,
			warnings,
			results,
		},
		{ status: errors.length === 0 ? 200 : 500 }
	)
}
