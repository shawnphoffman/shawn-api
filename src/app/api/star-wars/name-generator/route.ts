import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/*
To find your Star Wars name:
1. You take the first 3 letters from your first name and the first 2 from your last name to make your first name.
2. Then to make your last name you take the first 2 letters from your mother maiden name and the then the first 3 of the city you were born in.

For example:
- Name: Michael Johnson
- Mother's Maiden Name: Hill
- City of Birth: Talladega

First Name: *Mic*hael *Jo*hnson > "Micjo"
Last Name: *Hi*ll + *Tal*ladega > "Hital"
Output: "Micjo Hital"

*/
function properName(name: string) {
	return (
		'' +
		name
			.replace(/[^\s\-']+[\s\-']*/g, function (word: string) {
				return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
			})
			.replace(/\b(Van|De|Der|Da|Von)\b/g, function (wat: string) {
				return wat.toLowerCase()
			})
			.replace(/Mc(.)/g, function (match: any, letter3: string) {
				return 'Mc' + letter3.toUpperCase()
			})
	)
}

export async function POST(req: NextRequest) {
	try {
		const { first, last, maiden, town } = await req.json()

		const outFirst = properName(`${last.substr(0, 3)}${first.substr(0, 2)}`)
		const outLast = properName(`${maiden.substr(0, 2)}${town.substr(0, 3)}`)

		return Response.json({
			// in: { first, last, maiden, town },
			// out: {
			first: outFirst,
			last: outLast,
			full: `${outFirst} ${outLast}`,
			// },
		})
	} catch (e) {
		console.log(e)
		return new Response(null, { status: 400, statusText: 'Bad Request' })
	}
}
