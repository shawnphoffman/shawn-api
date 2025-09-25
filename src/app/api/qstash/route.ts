import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function handler(_req: NextRequest) {
	await new Promise(r => setTimeout(r, 1000))

	console.log('Success')
	return NextResponse.json({ name: 'John Doe Serverless' })
}

// Lazy verification - only create the handler when actually called
let verifiedHandler: any = null

function getVerifiedHandler() {
	if (!verifiedHandler) {
		verifiedHandler = verifySignatureAppRouter(handler)
	}
	return verifiedHandler
}

export const POST = async (req: NextRequest) => {
	return getVerifiedHandler()(req)
}
