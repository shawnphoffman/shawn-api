import cacheData from 'memory-cache'

import redis, { RedisKey } from '@/utils/redis'

// TODO redis?

type FetchProps = {
	url: string | URL | Request
	options?: RequestInit
	cacheMinutes?: number
	redisCache?: boolean
}

async function fetchWithCache({ url, options, cacheMinutes = 10 }: FetchProps) {
	const value = cacheData.get(url)

	if (value) {
		console.log('🔷 CACHED', url)
		return value
	} else {
		console.log('🔶 NOT CACHED', url)
		const res = await fetch(url, options)
		const data = await res.json()
		// console.log("FETCHED DATA", data);

		cacheData.put(url, data, cacheMinutes * 1000 * 60)
		return data
	}
}

export async function fetchHtmlWithCache({ url, options, cacheMinutes = 10, redisCache = false }: FetchProps) {
	let value: any
	// Same key for both stores, and for reads and writes
	const cacheKey = `${RedisKey.FetchCache}:${encodeURIComponent(url.toString())}`
	if (!redisCache) {
		value = cacheData.get(cacheKey)
		if (value) {
			console.log('🔷 MEM CACHED', url)
			return value
		}
	} else {
		value = await redis().get<string>(cacheKey)
		if (value) {
			console.log('🔷 REDIS CACHED', url)
			return value
		}
	}

	console.log('🔶 NOT CACHED', url)
	const res = await fetch(url, options)
	const data = await res.text()

	// Never cache an error page (rate limits, outages) for the full cache window
	if (!res.ok) {
		console.log('🔶 NOT CACHING', res.status, url)
		return data
	}

	if (redisCache) {
		await redis().set(cacheKey, data, { ex: cacheMinutes * 60 })
	} else {
		cacheData.put(cacheKey, data, cacheMinutes * 1000 * 60)
	}
	return data
}

export default fetchWithCache
