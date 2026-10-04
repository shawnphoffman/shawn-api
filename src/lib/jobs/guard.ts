import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

/** Scheduled jobs. ENABLED_JOBS names which of these a deployment runs. */
export type JobName = 'podcast-check' | 'star-wars-daily' | 'star-wars-frequent' | 'sf6-daily' | 'sync-awards'

type JobRejection = { status: number; error: string }

function matchesSecret(authorization: string | null | undefined, secret: string) {
	if (!authorization) return false
	const expected = Buffer.from(`Bearer ${secret}`)
	const received = Buffer.from(authorization)
	return expected.length === received.length && timingSafeEqual(expected, received)
}

/**
 * Decides whether a scheduled job may run on this deployment.
 *
 * ENABLED_JOBS is a comma-separated list of job names, so the Mac mini and
 * Vercel never both run (and post from) the same job. When it is unset,
 * every job may run.
 *
 * Every job also needs `Authorization: Bearer $CRON_SECRET`. Vercel cron
 * sends that header on its own; Cronicle sends it from each job's headers.
 */
export function checkJobRequest(job: JobName, authorization: string | null | undefined): JobRejection | null {
	const enabled = process.env.ENABLED_JOBS
	if (enabled !== undefined) {
		const jobs = enabled
			.split(',')
			.map(j => j.trim())
			.filter(Boolean)
		if (!jobs.includes(job)) {
			return { status: 404, error: `Job ${job} is not enabled on this deployment` }
		}
	}

	const secret = process.env.CRON_SECRET
	if (!secret) {
		return { status: 500, error: 'CRON_SECRET is not configured' }
	}
	if (!matchesSecret(authorization, secret)) {
		return { status: 401, error: 'Unauthorized' }
	}

	return null
}

/** App Router version: the response to send when the job may not run, or null when it may. */
export function guardJob(req: Request, job: JobName): NextResponse | null {
	const rejection = checkJobRequest(job, req.headers.get('authorization'))
	return rejection ? NextResponse.json({ error: rejection.error }, { status: rejection.status }) : null
}
