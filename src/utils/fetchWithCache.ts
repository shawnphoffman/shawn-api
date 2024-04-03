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
	const redisKey = `${RedisKey.FetchCache}:${encodeURIComponent(url.toString())}`
	if (!redisCache) {
		value = cacheData.get(redisKey)
		if (value) {
			console.log('🔷 MEM CACHED', url)
			return value
		}
	} else {
		value = await redis.get(RedisKey.FetchCache)
		if (value) {
			console.log('🔷 REDIS CACHED', url)
			return value
		}
	}

	console.log('🔶 NOT CACHED', url)
	const res = await fetch(url, options)
	const data = await res.text()
	// console.log("FETCHED HTML", data);

	if (redisCache) {
		// @ts-expect-error true/never
		await redis.set(redisKey, data, { ex: cacheMinutes * 60, keepTtl: true })
	}
	cacheData.put(url, data, cacheMinutes * 1000 * 60)
	return data
}

export default fetchWithCache
