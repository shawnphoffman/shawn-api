import { randomUUID } from 'crypto'

import redis, { RedisKey } from '@/utils/redis'

// Deletes the lock only if this run still owns it
const RELEASE_SCRIPT = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`

/**
 * Runs `fn` only if no other run of the same job holds the lock, so two
 * overlapping runs cannot post the same item. The lock expires after
 * `ttlSeconds` in case a run dies without releasing it.
 */
export async function withJobLock<T>(job: string, ttlSeconds: number, fn: () => Promise<T>): Promise<{ locked: true } | { locked: false; result: T }> {
	const key = `${RedisKey.JobLock}:${job}`
	const token = randomUUID()

	const acquired = await redis().set(key, token, { nx: true, ex: ttlSeconds })
	if (!acquired) {
		return { locked: true }
	}

	try {
		return { locked: false, result: await fn() }
	} finally {
		await redis().eval(RELEASE_SCRIPT, [key], [token])
	}
}
