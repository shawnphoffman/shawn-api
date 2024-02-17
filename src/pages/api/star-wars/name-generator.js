import Cors from 'src/utils/cors'

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
function properName(name) {
	return (
		'' +
		name
			.replace(/[^\s\-']+[\s\-']*/g, function (word) {
				return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
			})
			.replace(/\b(Van|De|Der|Da|Von)\b/g, function (wat) {
				return wat.toLowerCase()
			})
			.replace(/Mc(.)/g, function (match, letter3) {
				return 'Mc' + letter3.toUpperCase()
			})
	)
}

export default async function handler(req, res) {
	await Cors(req, res, {
		methods: ['POST', 'OPTIONS'],
		// origin: [/\.shawn\.party/, /localhost/],
	})

	if (req.method !== 'POST') {
		res.status(405).send({ message: 'Only POST requests allowed' })
		return
	}

	const { first, last, maiden, town } = req.body

	const outFirst = properName(`${last.substr(0, 3)}${first.substr(0, 2)}`)
	const outLast = properName(`${maiden.substr(0, 2)}${town.substr(0, 3)}`)

	// Set Cache Headers
	res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=599')

	res.json({
		// in: { first, last, maiden, town },
		// out: {
		first: outFirst,
		last: outLast,
		full: `${outFirst} ${outLast}`,
		// },
	})
}

//
// 3 last. 2 first
// 2 maiden. 3 hometown
//
