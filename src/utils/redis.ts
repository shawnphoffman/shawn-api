import { Redis } from '@upstash/redis'

export const RedisKey = {
	Discord: 'api:discord',
	Bluesky: 'api:bsky',
	//
	RssDiscord: 'rss:discord',
	RssBluesky: 'rss:bsky',
	RssOvercast: 'rss:overcast',
	RssShawnApi: 'rss:shawn-api',
	//
	TestDiscord: 'test:discord',
	TestBluesky: 'test:bluesky',
	TestOvercast: 'test:overcast',
	//
	FetchCache: 'fetch:cache',
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export default redis
