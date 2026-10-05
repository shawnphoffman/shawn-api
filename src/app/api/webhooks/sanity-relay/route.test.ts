import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-axiom', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { POST } from './route'

const body = '{"_type":"episode"}'
const fetchMock = vi.fn()

const request = (headers: Record<string, string> = {}) =>
	new NextRequest('http://localhost/api/webhooks/sanity-relay', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } })

beforeEach(() => {
	fetchMock.mockReset().mockResolvedValue(new Response('ok', { status: 200 }))
	vi.stubGlobal('fetch', fetchMock)
	vi.stubEnv('SANITY_REVALIDATE_SECRET', 'sanity-secret')
})

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('POST /api/webhooks/sanity-relay', () => {
	it('refuses everything when the secret is not configured', async () => {
		vi.stubEnv('SANITY_REVALIDATE_SECRET', '')
		const res = await POST(request())
		expect(res.status).toBe(500)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('rejects an unsigned request without forwarding it', async () => {
		const res = await POST(request())
		expect(res.status).toBe(401)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('rejects a request signed with a different secret', async () => {
		const signature = await encodeSignatureHeader(body, Date.now(), 'not-the-secret')
		const res = await POST(request({ [SIGNATURE_HEADER_NAME]: signature }))
		expect(res.status).toBe(401)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('forwards a correctly signed request to every site, body unchanged', async () => {
		const signature = await encodeSignatureHeader(body, Date.now(), 'sanity-secret')
		const res = await POST(request({ [SIGNATURE_HEADER_NAME]: signature }))
		expect(res.status).toBe(200)
		expect(fetchMock.mock.calls.length).toBeGreaterThan(0)
		for (const [url, init] of fetchMock.mock.calls) {
			expect(String(url)).toMatch(/\/api\/revalidate$/)
			expect(init.body).toBe(body)
		}
	})
})
