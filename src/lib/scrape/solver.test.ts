import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchWithSolver } from './solver'

const fetchMock = vi.fn()

beforeEach(() => {
	fetchMock.mockReset()
	vi.stubGlobal('fetch', fetchMock)
	vi.stubEnv('FLARESOLVERR_URL', 'http://byparr:8191/')
})

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('fetchWithSolver', () => {
	it('does nothing when no solver is configured', async () => {
		vi.stubEnv('FLARESOLVERR_URL', '')
		expect(await fetchWithSolver('https://goodpods.com/x')).toBeNull()
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('asks the solver for the page and returns its HTML', async () => {
		fetchMock.mockResolvedValue(Response.json({ status: 'ok', solution: { status: 200, response: '<html>ok</html>' } }))
		expect(await fetchWithSolver('https://goodpods.com/x', 60000)).toBe('<html>ok</html>')
		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe('http://byparr:8191/v1')
		expect(JSON.parse(init.body)).toEqual({ cmd: 'request.get', url: 'https://goodpods.com/x', maxTimeout: 60000 })
	})

	it('returns null when the solver could not get through', async () => {
		fetchMock.mockResolvedValue(Response.json({ status: 'error', message: 'Challenge not solved' }))
		expect(await fetchWithSolver('https://goodpods.com/x')).toBeNull()
		fetchMock.mockResolvedValue(Response.json({ status: 'ok', solution: { status: 403, response: 'blocked' } }))
		expect(await fetchWithSolver('https://goodpods.com/x')).toBeNull()
		fetchMock.mockResolvedValue(new Response('down', { status: 500 }))
		expect(await fetchWithSolver('https://goodpods.com/x')).toBeNull()
	})
})
