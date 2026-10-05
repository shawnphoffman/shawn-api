import puppeteer from 'puppeteer'
import { z } from 'zod'

import { fetchWithSolver } from '@/lib/scrape/solver'

import { extractGoodpodsPodcastId } from '../goodpodsId'

import { Source } from '../types'

/**
 * Goodpods returns a Podcast object with a `leaderboard_info_list` array
 * of leaderboards the show is currently ranked on. We only need a subset
 * for award rendering + sync.
 */
const LeaderboardSchema = z.object({
	leaderboard_id: z.number(),
	category_tag: z.string(),
	period_type: z.string(),
	indie_only: z.boolean(),
	current_position: z.number(),
	url_slug: z.string(),
})

export const GoodpodsPodcastSchema = z.object({
	review_average: z.number().optional(),
	total_reviews: z.number().optional(),
	leaderboard_info_list: z.array(LeaderboardSchema),
})

export type GoodpodsPodcast = z.infer<typeof GoodpodsPodcastSchema>

// The Goodpods SPA fetches this endpoint client-side. Calling it directly
// from server-side is faster than running puppeteer; sometimes Goodpods
// rotates anti-bot heuristics and we need the puppeteer fallback.
// The podcast id is embedded in the public Goodpods URL as the trailing
// numeric segment.

async function fetchNative(url: string): Promise<GoodpodsPodcast | null> {
	const podcastId = extractGoodpodsPodcastId(url)
	if (!podcastId) return null

	const apiUrl = `https://v2.goodpods.com/podcast/details?podcast_id=${podcastId}`
	const res = await fetch(apiUrl, {
		headers: {
			accept: 'application/json',
			'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			referer: 'https://goodpods.com/',
		},
	})
	if (!res.ok) {
		return null
	}
	const data = await res.json()
	return data
}

async function fetchPuppeteer(url: string): Promise<GoodpodsPodcast | null> {
	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&stealth=true&headless=true`,
	})
	try {
		const page = await browser.newPage()

		const responsePromise = new Promise<unknown>(resolve => {
			page.on('response', async response => {
				const respUrl = response.url()
				const method = response.request().method().toUpperCase()
				const isOptions = method === 'OPTIONS'
				if (!isOptions && respUrl?.startsWith('https://v2.goodpods.com/podcast/details')) {
					try {
						const respJson = await response.json()
						resolve(respJson)
					} catch {
						// Goodpods sometimes returns non-JSON; ignore and let the timeout decide.
					}
				}
			})
		})

		await page.goto(url)
		const podData = await Promise.race([
			responsePromise,
			new Promise<null>(resolve => setTimeout(() => resolve(null), 15000)),
		])
		if (!podData) return null
		return podData as GoodpodsPodcast
	} finally {
		await browser.close().catch(() => {})
	}
}

/**
 * Goodpods renders the podcast details into the page's Next.js data, in the
 * react-query cache, so the page HTML alone is enough. Finds the cached query
 * whose data has the leaderboard list.
 */
export function extractPodcastFromPage(html: string): unknown | null {
	const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
	if (!match) return null
	let nextData: { props?: { pageProps?: { dehydratedState?: { queries?: { state?: { data?: unknown } }[] } } } }
	try {
		nextData = JSON.parse(match[1])
	} catch {
		return null
	}
	const queries = nextData.props?.pageProps?.dehydratedState?.queries ?? []
	const podcast = queries.map(q => q.state?.data).find(data => Array.isArray((data as { leaderboard_info_list?: unknown } | undefined)?.leaderboard_info_list))
	return podcast ?? null
}

// Cloudflare's bot check stops browserless on Goodpods; the solver gets through
async function fetchSolver(url: string): Promise<GoodpodsPodcast | null> {
	const html = await fetchWithSolver(url)
	if (!html) return null
	return extractPodcastFromPage(html) as GoodpodsPodcast | null
}

export const goodpodsSource: Source<GoodpodsPodcast> = {
	name: 'goodpods',
	fetchNative,
	fetchSolver,
	fetchPuppeteer,
}

/**
 * Map a Goodpods leaderboard into the shape that sites + Sanity awards
 * consume (image URL + link URL + frequency). Pulled out of the original
 * route handler so the sync job can reuse it without going through HTTP.
 */
export type GoodpodsAward = {
	externalId: string
	category: string
	frequency: 'Weekly' | 'Monthly' | 'All-Time' | string
	linkUrl: string
	imageUrl: string
	imageWidth: number
	imageHeight: number
	currentPosition: number
}

export function leaderboardsToAwards(input: GoodpodsPodcast): GoodpodsAward[] {
	return input.leaderboard_info_list.map(leaderboard => {
		let frequency: GoodpodsAward['frequency']
		if (leaderboard.period_type === 'alltime') frequency = 'All-Time'
		else if (leaderboard.period_type === 'month') frequency = 'Monthly'
		else frequency = 'Weekly'

		const slug = leaderboard.url_slug.includes('/')
			? leaderboard.url_slug
			: `${leaderboard.url_slug}/all-${leaderboard.url_slug}`

		const linkUrl = `https://goodpods.com/leaderboard/top-100-shows-by-category/${slug}?indie=${leaderboard.indie_only}&period=${leaderboard.period_type}#${leaderboard.leaderboard_id}`

		let position = 100
		if (leaderboard.current_position === 1) position = 1
		else if (leaderboard.current_position === 2) position = 2
		else if (leaderboard.current_position === 3) position = 3
		else if (leaderboard.current_position <= 5) position = 5
		else if (leaderboard.current_position <= 10) position = 10
		else if (leaderboard.current_position <= 50) position = 50

		let period = ''
		if (leaderboard.period_type === 'month') period = '_month'
		else if (leaderboard.period_type === 'week') period = '_week'

		const imageUrl = `https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/${slug.replace(
			'/',
			'_'
		)}_top${position}${period}.png`

		return {
			externalId: String(leaderboard.leaderboard_id),
			category: leaderboard.category_tag,
			frequency,
			linkUrl,
			imageUrl,
			imageWidth: 250,
			imageHeight: 77,
			currentPosition: leaderboard.current_position,
		}
	})
}
