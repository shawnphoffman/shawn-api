import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkJobRequest, guardJob } from './guard'

afterEach(() => {
	vi.unstubAllEnvs()
})

describe('checkJobRequest', () => {
	it('rejects every job when CRON_SECRET is not set', () => {
		vi.stubEnv('CRON_SECRET', '')
		expect(checkJobRequest('podcast-check', 'Bearer anything')).toEqual({ status: 500, error: 'CRON_SECRET is not configured' })
	})

	it('accepts the right bearer token when ENABLED_JOBS is unset', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		delete process.env.ENABLED_JOBS
		expect(checkJobRequest('podcast-check', 'Bearer secret')).toBeNull()
	})

	it('rejects a missing or wrong token', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		expect(checkJobRequest('podcast-check', null)?.status).toBe(401)
		expect(checkJobRequest('podcast-check', 'Bearer secrex')).toEqual({ status: 401, error: 'Unauthorized' })
		expect(checkJobRequest('podcast-check', 'secret')?.status).toBe(401)
	})

	it('only runs jobs named in ENABLED_JOBS', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		vi.stubEnv('ENABLED_JOBS', 'podcast-check, star-wars-daily')
		expect(checkJobRequest('podcast-check', 'Bearer secret')).toBeNull()
		expect(checkJobRequest('star-wars-daily', 'Bearer secret')).toBeNull()
		expect(checkJobRequest('sync-awards', 'Bearer secret')?.status).toBe(404)
	})

	it('runs no jobs when ENABLED_JOBS is set but empty', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		vi.stubEnv('ENABLED_JOBS', '')
		expect(checkJobRequest('podcast-check', 'Bearer secret')?.status).toBe(404)
	})

	it('checks ENABLED_JOBS before the token, so a disabled job never reveals auth details', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		vi.stubEnv('ENABLED_JOBS', 'sync-awards')
		expect(checkJobRequest('podcast-check', null)?.status).toBe(404)
	})
})

describe('guardJob', () => {
	it('turns a rejection into a JSON response with the same status', async () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		delete process.env.ENABLED_JOBS
		const res = guardJob(new Request('http://localhost/api/x'), 'podcast-check')
		expect(res?.status).toBe(401)
		expect(await res?.json()).toEqual({ error: 'Unauthorized' })
	})

	it('returns null when the job may run', () => {
		vi.stubEnv('CRON_SECRET', 'secret')
		delete process.env.ENABLED_JOBS
		const req = new Request('http://localhost/api/x', { headers: { authorization: 'Bearer secret' } })
		expect(guardJob(req, 'podcast-check')).toBeNull()
	})
})
