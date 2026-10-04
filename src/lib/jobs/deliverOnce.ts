import redis from '@/utils/redis'

export type DeliveryResult = 'sent' | 'skipped'

/**
 * Runs one delivery (a Discord post, a Bluesky post, a ping) unless the Redis
 * set says it already happened, and records it only after it succeeds. A
 * delivery that throws stays unrecorded, so the next run tries it again.
 */
export async function deliverOnce(setKey: string, member: string, deliver: () => Promise<unknown>): Promise<DeliveryResult> {
	if (await redis().sismember(setKey, member)) {
		return 'skipped'
	}
	await deliver()
	await redis().sadd(setKey, member)
	return 'sent'
}
