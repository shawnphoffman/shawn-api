import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

import { KvPrefix } from '@/utils/kv'

import type { GoodpodsAward, Podcast } from './goodpodsData'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const url = searchParams.get('url')

	if (!url) {
		return NextResponse.json({ error: 'URL required' }, { status: 401 })
	}

	const kvUrl = `${KvPrefix.PodGoodpods}:${url}`
	try {
		const cachedResponse = (await kv.get(kvUrl)) as string | null
		if (cachedResponse) {
			console.log('cachedResponse', cachedResponse)
			// @ts-expect-error xxx
			return NextResponse.json({ ...cachedResponse, url, cached: true })
		}
	} catch (error) {
		console.error('Error getting cached response', error)
	}

	const launchArgs = JSON.stringify({ stealth: true })
	const browser = await puppeteer.connect({
		browserWSEndpoint: `${process.env.PUPPETEER_WSS}&launch=${launchArgs}`,
	})
	try {
		const page = await browser.newPage()

		// const collectedResponses: any[] = []

		const responsePromise = new Promise(resolve => {
			page.on('response', async response => {
				const respUrl = response.url()
				const method = response.request().method().toUpperCase()
				const isOptions = method === 'OPTIONS'
				if (!isOptions && respUrl.startsWith('https://v2.goodpods.com/podcast/details')) {
					const respJson = await response?.json()
					console.log('✅', respJson)
					// collectedResponses.push(respJson)
					resolve(respJson)
				}
			})
		})

		// await page.goto(url, { waitUntil: 'networkidle0' })
		// await page.goto(url, { timeout: 5000 })
		await page.goto(url)
		const podData = await responsePromise

		const vals: Podcast = JSON.parse(JSON.stringify(podData))

		console.log('vals', vals)

		const review_average = vals?.review_average
		const total_reviews = vals?.total_reviews

		const awards: Array<GoodpodsAward> = vals?.leaderboard_info_list.map(leaderboard => {
			const award = {
				imageHeight: 77,
				imageWidth: 250,
				category: leaderboard.category_tag,
			} as GoodpodsAward

			if (leaderboard.period_type === 'alltime') {
				award.frequency = 'All-Time'
			} else if (leaderboard.period_type === 'month') {
				award.frequency = 'Monthly'
			} else {
				award.frequency = 'Weekly'
			}

			let slug = ''
			if (leaderboard.url_slug.includes('/')) {
				slug = leaderboard.url_slug
			} else {
				slug = `${leaderboard.url_slug}/all-${leaderboard.url_slug}`
			}

			award.linkUrl = `https://goodpods.com/leaderboard/top-100-shows-by-category/${slug}?indie=${leaderboard.indie_only}&period=${leaderboard.period_type}#${leaderboard.leaderboard_id}`

			let position = 100
			if (leaderboard.current_position === 1) {
				position = 1
			} else if (leaderboard.current_position === 2) {
				position = 2
			} else if (leaderboard.current_position === 3) {
				position = 3
			} else if (leaderboard.current_position <= 5) {
				position = 5
			} else if (leaderboard.current_position <= 10) {
				position = 10
				// } else if (leaderboard.current_position <= 20) {
				// 	position = 20
			} else if (leaderboard.current_position <= 50) {
				position = 50
			}

			let period = ''
			if (leaderboard.period_type === 'month') {
				period = '_month'
			} else if (leaderboard.period_type === 'week') {
				period = '_week'
			}

			award.imageUrl = `https://storage.googleapis.com/goodpods-images-bucket/leaderboard_badges/${slug.replace(
				'/',
				'_'
			)}_top${position}${period}.png`

			return award
		})

		if (awards.length > 0) {
			kv.set(
				kvUrl,
				JSON.stringify({
					awards,
					review_average,
					total_reviews,
				}),
				{
					ex: 60 * 60 * 24 * 3,
				}
			)
		}

		return NextResponse.json({ awards, url, review_average, total_reviews })
	} catch (error) {
		console.log('Error:', error)
		return NextResponse.json({ error }, { status: 500 })
	} finally {
		console.log('closing browser')
		await browser.close()
	}
}

/**
"leaderboard_info_list": [
{
"leaderboard_id": 47389848,
"category_tag": "animation & manga",
"period_type": "month",
"indie_only": true,
"current_position": 1,
"last_position": 2,
"episode_id": null,
"podcast_id": 277737,
"user_id": null,
"user_leaderboard_type": null,
"url_slug": "leisure/animation-and-manga",
"keyword_slug": "animation-and-manga"
},
 */
