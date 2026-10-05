import { AtpAgent } from '@atproto/api'

const agent = new AtpAgent({
	service: 'https://bsky.social',
})

/**
 * One logged-in Bluesky agent per process. It logs in on first use, and again
 * whenever the session has been dropped (for example after its refresh token
 * expired), instead of creating a new session for every post.
 */
export async function getBskyAgent(): Promise<AtpAgent> {
	if (!agent.hasSession) {
		await agent.login({
			identifier: process.env.BSKY_USERNAME!,
			password: process.env.BSKY_PASSWORD!,
		})
	}
	return agent
}
