const domainId = process.env.SHORTIO_DOMAIN_BH
const authPk = process.env.SHORTIO_PUBLIC_KEY
const authSk = process.env.SHORTIO_SECRET_KEY

export const getLinks = async () => {
	const url = `https://api.short.io/api/links?domain_id=${domainId}&limit=100&dateSortOrder=desc`

	const options = {
		method: 'GET',
		headers: {
			accept: 'application/json',
			Authorization: authPk,
		},
	}

	const response = await fetch(url, options)
	const json = await response.json()

	console.log(json)

	return json
}

export const createLink = async (url, title) => {}

export const removeLink = async id => {}

// async function sendWebhook(url, content) {
// 	var myHeaders = new Headers()
// 	myHeaders.append('Content-Type', 'application/json')

// 	var requestOptions = {
// 		headers: myHeaders,
// 		method: 'POST',
// 		body: JSON.stringify(content),
// 	}

// 	const response = await fetch(url, requestOptions)

// 	console.log(response)
// }
