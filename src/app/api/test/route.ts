export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const status = searchParams.get('status') || '200'
	const message = searchParams.get('message') || 'test-response'

	if (status === '504') {
		await new Promise(resolve => setTimeout(resolve, 10000))
	}

	return Response.json(
		{
			message: message,
			status: parseInt(status),
		},
		{ status: parseInt(status) }
	)
}
