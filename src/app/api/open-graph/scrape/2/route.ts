import { handleScrape } from '@/lib/scrape/handler'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// All three scrape routes share one implementation. The /1 and /2 paths are
// kept so existing callers keep working.
export async function GET(request: Request) {
	return handleScrape(request)
}
