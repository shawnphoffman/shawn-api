import { NextRequest, NextResponse } from 'next/server'

import { listPodcastsForSync, upsertAward } from '@/lib/podcast-data/sanity'
import { GoodpodsPodcastSchema,goodpodsSource, leaderboardsToAwards } from '@/lib/podcast-data/sources/goodpods'
import { fetchInTiers } from '@/lib/podcast-data/tier'

export const dynamic = 'force-dynamic'
// puppeteer fallback is slow; up to 60s per podcast worst case
export const maxDuration = 300

/**
 * GET /api/podcast-data/sync-awards
 *
 * Iterates every Sanity `category` document that has a goodpodsUrl set,
 * fetches its current Goodpods leaderboards via the tiered fetcher, and
 * upserts each leaderboard as a Sanity award (`source: 'goodpods'`).
 *
 * Auth: in production (Vercel cron), Vercel sends `Authorization: Bearer
 * $CRON_SECRET` (auto-assigned). In dev / manual triggers, set
 * `CRON_SECRET` and pass `?secret=...` or the Authorization header.
 *
 * Triggered hourly by the crons entry in vercel.json.
 */
export async function GET(request: NextRequest) {
	const secret = process.env.CRON_SECRET
	const auth = request.headers.get('authorization')
	const querySecret = request.nextUrl.searchParams.get('secret')
	const authorized = !secret || auth === `Bearer ${secret}` || querySecret === secret
	if (!authorized) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const start = Date.now()
	const now = new Date().toISOString()
	const podcasts = await listPodcastsForSync()
	if (podcasts.length === 0) {
		return NextResponse.json({ ok: true, podcasts: 0, awards: 0, note: 'No podcasts with goodpodsUrl set.' })
	}

	const summary: Array<{
		podcast: string
		tier: string | null
		awards: number
		error?: string
	}> = []

	let totalAwards = 0

	for (const pod of podcasts) {
		if (!pod.goodpodsUrl) continue
		try {
			const result = await fetchInTiers({
				source: goodpodsSource,
				url: pod.goodpodsUrl,
				schema: GoodpodsPodcastSchema,
			})
			if (!result) {
				summary.push({ podcast: pod.title, tier: null, awards: 0, error: 'all tiers failed' })
				continue
			}
			const awards = leaderboardsToAwards(result.data)
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
			summary.push({ podcast: pod.title, tier: result.tier, awards: awards.length })
			totalAwards += awards.length
		} catch (error) {
			console.error(`[sync-awards] ${pod.title} failed`, error)
			summary.push({ podcast: pod.title, tier: null, awards: 0, error: error instanceof Error ? error.message : 'unknown' })
		}
	}

	return NextResponse.json({
		ok: true,
		elapsedMs: Date.now() - start,
		podcasts: podcasts.length,
		awards: totalAwards,
		summary,
	})
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
