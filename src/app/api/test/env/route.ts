export async function GET(request: Request) {
	return Response.json({ env: process.env })
}
