import cacheData from 'memory-cache'

async function fetchWithCache(url, options, cacheMinutes = 10) {
	const value = cacheData.get(url)
	if (value) {
		console.log('CACHED', url)
		return value
	} else {
		console.log('NOT CACHED', url)
		const res = await fetch(url, options)
		const data = await res.json()
		// console.log("FETCHED DATA", data);

		cacheData.put(url, data, cacheMinutes * 1000 * 60)
		return data
	}
}

export async function fetchHtmlWithCache(url, options, cacheMinutes = 10) {
	const value = cacheData.get(url)
	if (value) {
		console.log('CACHED', url)
		return value
	} else {
		console.log('NOT CACHED', url)
		const res = await fetch(url, options)
		const data = await res.text()
		// console.log("FETCHED HTML", data);

		cacheData.put(url, data, cacheMinutes * 1000 * 60)
		return data
	}
}

export default fetchWithCache
