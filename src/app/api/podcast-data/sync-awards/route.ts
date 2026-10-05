import { NextRequest, NextResponse } from 'next/server'

import { guardJob } from '@/lib/jobs/guard'
import { withJobLock } from '@/lib/jobs/lock'
import { cacheGoodpods } from '@/lib/podcast-data/goodpodsCache'
import { expireUnseenAwards, listPodcastsForSync, upsertAward } from '@/lib/podcast-data/sanity'
import { GoodpodsPodcastSchema, goodpodsSource, leaderboardsToAwards } from '@/lib/podcast-data/sources/goodpods'
import { fetchInTiers } from '@/lib/podcast-data/tier'

export const dynamic = 'force-dynamic'
// The solver takes 15-30 seconds per podcast, longer on its first request after a restart
export const maxDuration = 600

type PodcastSummary = {
	podcast: string
	tier: string | null
	awards: number
	expired: number
	rating?: number
	error?: string
}

/**
 * GET /api/podcast-data/sync-awards
 *
 * For every Sanity podcast (`category`) with a goodpodsUrl: scrapes its
 * Goodpods page (through the Cloudflare solver on the Mac mini), upserts each
 * current leaderboard as a Sanity award (`source: 'goodpods'`), expires synced
 * awards Goodpods no longer lists, and refreshes the cached rating the sites
 * read. Hand-made awards are left alone.
 *
 * Runs on the Mac mini from Cronicle, because Vercel cannot get past
 * Goodpods' Cloudflare check. Auth is the shared job guard. Answers 500 when
 * any podcast failed, and `?debug=true` scrapes without writing anything.
 */
export async function GET(request: NextRequest) {
	const rejected = guardJob(request, 'sync-awards')
	if (rejected) return rejected

	const debug = request.nextUrl.searchParams.get('debug') === 'true'

	const run = await withJobLock('sync-awards', 1800, async () => {
		const start = Date.now()
		const now = new Date().toISOString()
		const podcasts = await listPodcastsForSync()
		const summary: PodcastSummary[] = []

		for (const pod of podcasts) {
			if (!pod.goodpodsUrl) continue
			try {
				const result = await fetchInTiers({ source: goodpodsSource, url: pod.goodpodsUrl, schema: GoodpodsPodcastSchema })
				if (!result) {
					// Nothing is expired when the scrape fails, so a Goodpods outage never clears the sites' awards
					summary.push({ podcast: pod.title, tier: null, awards: 0, expired: 0, error: 'all tiers failed' })
					continue
				}

				const awards = leaderboardsToAwards(result.data)
				let expired = 0
				if (!debug) {
					await cacheGoodpods(pod.goodpodsUrl, result.data)
					for (const a of awards) {
						await upsertAward({
							categoryId: pod._id,
							source: 'goodpods',
							externalId: a.externalId,
							name: a.category,
							frequency: a.frequency,
							linkUrl: a.linkUrl,
							imageUrl: a.imageUrl,
							width: a.imageWidth,
							height: a.imageHeight,
							expiresAt: computeExpiresAt(a.frequency, now),
							lastSeenAt: now,
						})
					}
					expired = await expireUnseenAwards(
						pod._id,
						awards.map(a => a.externalId),
						now
					)
				}
				summary.push({ podcast: pod.title, tier: result.tier, awards: awards.length, expired, rating: result.data.review_average })
			} catch (error) {
				console.error(`[sync-awards] ${pod.title} failed`, error)
				summary.push({ podcast: pod.title, tier: null, awards: 0, expired: 0, error: error instanceof Error ? error.message : 'unknown' })
			}
		}

		return { elapsedMs: Date.now() - start, podcasts: summary.length, summary }
	})

	if (run.locked) {
		return NextResponse.json({ error: 'Another awards sync is still running' }, { status: 409 })
	}

	const failed = run.result.summary.filter(s => s.error)
	return NextResponse.json(
		{
			ok: failed.length === 0,
			debug,
			...run.result,
			awards: run.result.summary.reduce((n, s) => n + s.awards, 0),
			...(run.result.podcasts === 0 ? { note: 'No podcasts with goodpodsUrl set.' } : {}),
		},
		{ status: failed.length === 0 ? 200 : 500 }
	)
}

function computeExpiresAt(frequency: string, nowIso: string): string | null {
	const now = new Date(nowIso)
	const days = (() => {
		switch (frequency) {
			case 'Weekly':
				return 7
			case 'Monthly':
				return 31
			case 'Daily':
				return 1
			default:
				return null
		}
	})()
	if (days === null) return null
	const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
	return expires.toISOString()
}
