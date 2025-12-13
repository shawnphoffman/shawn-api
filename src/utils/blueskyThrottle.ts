import redis, { RedisKey } from '@/utils/redis'

/**
 * Normalizes a handle by removing @ symbol and converting to lowercase
 */
function normalizeHandle(handle: string): string {
	return handle.replace(/^@/, '').toLowerCase()
}

/**
 * Gets the delay needed before posting to avoid spamming handles.
 * Returns the maximum delay (in milliseconds) needed across all handles.
 * Returns 0 if no delay is needed.
 *
 * @param handles Array of handles to check (e.g., ['blueharvest.bsky.social'])
 * @returns Delay in milliseconds (0 if no delay needed)
 */
export async function getHandleDelay(handles: string[]): Promise<number> {
	if (!handles || handles.length === 0) {
		return 0
	}

	const delays: number[] = []
	const now = Date.now()

	for (const handle of handles) {
		const normalizedHandle = normalizeHandle(handle)
		const key = `${RedisKey.BskyThrottle}:${normalizedHandle}`

		try {
			const lastMentionTimestamp = await redis().get<number>(key)

			if (lastMentionTimestamp) {
				// Calculate time remaining until 60 seconds have passed
				const timeSinceLastMention = now - lastMentionTimestamp
				const delay = Math.max(0, 60000 - timeSinceLastMention)
				delays.push(delay)
			} else {
				// No previous mention, no delay needed for this handle
				delays.push(0)
			}
		} catch (error) {
			// If Redis fails, don't delay (fail open)
			console.error('Error checking handle throttle:', error)
			delays.push(0)
		}
	}

	// Return the maximum delay needed across all handles
	return Math.max(...delays)
}

/**
 * Records that handles were mentioned in a post.
 * Sets a timestamp for each handle with a 60-second TTL.
 *
 * @param handles Array of handles that were mentioned
 */
export async function recordHandleMentions(handles: string[]): Promise<void> {
	if (!handles || handles.length === 0) {
		return
	}

	const now = Date.now()

	for (const handle of handles) {
		const normalizedHandle = normalizeHandle(handle)
		const key = `${RedisKey.BskyThrottle}:${normalizedHandle}`

		try {
			// Store timestamp with 60-second TTL
			await redis().set(key, now, { ex: 60 })
		} catch (error) {
			// Log error but don't fail the post
			console.error('Error recording handle mention:', error)
		}
	}
}
