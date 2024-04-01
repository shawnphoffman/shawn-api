import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function middleware(request: NextRequest) {
	// retrieve the current response
	const response = NextResponse.next()

	console.log('💉', request.nextUrl.pathname)

	if (request.method === 'OPTIONS') {
		return NextResponse.json({}, { headers: corsHeaders })
	}

	// if the incoming is for the desired API endpoint
	if (request.nextUrl.pathname === '/api/star-wars/name-generator') {
		Object.entries(corsHeaders).forEach(([key, value]) => {
			response.headers.append(key, value)
		})
	}

	return response
}

// specify the path regex to apply the middleware to
export const config = {
	matcher: '/api/:path*',
}
