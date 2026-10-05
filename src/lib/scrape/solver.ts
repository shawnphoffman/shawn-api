/**
 * Fetches a page through a FlareSolverr-compatible solver (Byparr runs next to
 * the app on the Mac mini), which gets past Cloudflare's bot checks that stop
 * browserless. Returns the page HTML, or null when no solver is configured
 * (as on Vercel) or the solver could not get through.
 */
export async function fetchWithSolver(url: string, timeoutMs = 120000): Promise<string | null> {
	const solverUrl = process.env.FLARESOLVERR_URL
	if (!solverUrl) return null

	const res = await fetch(`${solverUrl.replace(/\/$/, '')}/v1`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ cmd: 'request.get', url, maxTimeout: timeoutMs }),
		// The solver's own timeout plus room for it to answer
		signal: AbortSignal.timeout(timeoutMs + 30000),
	})
	if (!res.ok) return null

	const json: { status?: string; solution?: { status?: number; response?: string } } = await res.json()
	if (json.status !== 'ok' || json.solution?.status !== 200 || !json.solution.response) return null
	return json.solution.response
}
