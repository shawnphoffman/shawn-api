import { getYoutiniNews } from '@/getters/star-wars/news'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const news = await getYoutiniNews()
	return NextResponse.json(news)
}
