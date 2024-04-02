import { AxiomRequest, withAxiom } from 'next-axiom'

export const GET = withAxiom(async (_req: AxiomRequest) => {
	return new Response('pong', { status: 200 })
})

export const dynamic = 'force-dynamic'
