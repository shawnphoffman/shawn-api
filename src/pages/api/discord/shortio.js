const domainId = process.env.SHORTIO_DOMAIN_BH
const authPk = process.env.SHORTIO_PUBLIC_KEY
const authSk = process.env.SHORTIO_SECRET_KEY

export const getLinks = async () => {
	const url = `https://api.short.io/api/links?domain_id=${domainId}&limit=100&dateSortOrder=desc`

	const options = {
		method: 'GET',
		headers: {
			accept: 'application/json',
			Authorization: authSk,
		},
	}

	const response = await fetch(url, options)
	const json = await response.json()

	const links = json.links.reduce((memo, link) => {
		if (link.idString !== process.env.SHORTIO_ROOT_LINK_ID) {
			memo.push({
				id: link.idString,
				shortURL: link.shortURL,
				originalURL: link.originalURL,
			})
		}
		return memo
	}, [])

	console.log('')
	console.log('getLinks')
	console.log(JSON.stringify(json, null, 2))

	return links
}

export const createLink = async (url, title) => {
	const options = {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/json',
			Authorization: authSk,
		},
		body: JSON.stringify({ domain: domainId, originalURL: url, allowDuplicates: true, title: title ? title : null }),
	}

	const response = await fetch('https://api.short.io/links', options)
	const json = await response.json()

	console.log('')
	console.log('createLink')
	console.log(JSON.stringify(json, null, 2))

	return {
		shortURL: json.shortURL,
		originalURL: json.originalURL,
		id: json.idString,
	}
}
