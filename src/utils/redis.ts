import { Redis } from '@upstash/redis'

export const RedisKey = {
	Discord: 'api:discord',
	Bluesky: 'api:bsky',
	//
	RssDiscord: 'rss:discord',
	RssBluesky: 'rss:bsky',
	RssOvercast: 'rss:overcast',
	RssRefresh: 'rss:refresh',
	RssShawnApi: 'rss:shawn-api',
	//
	TestDiscord: 'test:discord',
	TestBluesky: 'test:bluesky',
	TestOvercast: 'test:overcast',
	//
	FetchCache: 'fetch:cache',
}

let redis: Redis | null = null

function getRedis() {
	if (!redis) {
		redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL!,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		})
	}
	return redis
}

export default getRedis
