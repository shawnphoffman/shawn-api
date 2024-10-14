import { kv } from '@vercel/kv'

export const KvPrefix = {
	PodGoodpods: 'pod:goodpods',
	PodSpotify: 'pod:spotify',
}

const key = 'test-key-2'

export const misc = async () => {
	let testValue = await kv.get(key)
	if (!testValue) {
		testValue = `test-value-1-${Date.now()}`
		const t = await kv.set(key, testValue, {
			ex: 60,
			nx: true,
		})
		console.log('set', t)
	} else {
		console.log('cache', testValue)
	}
	return testValue
}
