import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Checks GitHub's X-Hub-Signature-256 header, an HMAC-SHA256 of the raw
 * request body made with the webhook's secret.
 */
export function isValidGitHubSignature(rawBody: Buffer | string, signature: string | undefined | null, secret: string): boolean {
	if (!signature) return false
	const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`)
	const received = Buffer.from(signature)
	return expected.length === received.length && timingSafeEqual(expected, received)
}
