import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'

import { isValidGitHubSignature } from './github'

const body = '{"zen":"Keep it logically awesome."}'
const sign = (payload: string, secret: string) => `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`

describe('isValidGitHubSignature', () => {
	it('accepts a signature made with the same secret', () => {
		expect(isValidGitHubSignature(body, sign(body, 's3cret'), 's3cret')).toBe(true)
		expect(isValidGitHubSignature(Buffer.from(body), sign(body, 's3cret'), 's3cret')).toBe(true)
	})

	it('rejects a missing signature, a wrong secret, or a changed body', () => {
		expect(isValidGitHubSignature(body, undefined, 's3cret')).toBe(false)
		expect(isValidGitHubSignature(body, sign(body, 'other'), 's3cret')).toBe(false)
		expect(isValidGitHubSignature(body + ' ', sign(body, 's3cret'), 's3cret')).toBe(false)
	})

	it('rejects a signature of the wrong length without throwing', () => {
		expect(isValidGitHubSignature(body, 'sha256=deadbeef', 's3cret')).toBe(false)
	})
})
