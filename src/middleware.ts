import { NextRequest, NextResponse } from 'next/server'

const whitelistPodSites = [
	'blueharvest.rocks',
	'justshillin.com',
	'jammedtransmissions.com',
	'scruffypod.com',
	'myweirdfoot.com',
	'blueypodcast.com',
	'shawn.party',
]

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function middleware(request: NextRequest) {
	// retrieve the current response
	const response = NextResponse.next()

	// console.log('💉', request.nextUrl.pathname)

	if (process.env.DISABLE_CORS != 'true') {
		if (request.nextUrl.pathname.includes('/api/podcast-data')) {
			const origin = request.headers.get('Origin')
			if (origin && !whitelistPodSites.some(wl => origin?.includes(wl))) {
				return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
			}
		}

		// if the incoming is for the desired API endpoint
		if (request.nextUrl.pathname === '/api/star-wars/name-generator') {
			Object.entries(corsHeaders).forEach(([key, value]) => {
				response.headers.append(key, value)
			})
		}
	}

	if (request.method === 'OPTIONS') {
		return NextResponse.json({}, { headers: corsHeaders })
	}

	return response
}

// specify the path regex to apply the middleware to
export const config = {
	matcher: '/api/:path*',
}
