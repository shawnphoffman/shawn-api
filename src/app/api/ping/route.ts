export const dynamic = 'force-dynamic'

export async function GET(_request: Request) {
	return new Response('pong', { status: 200 })
}
