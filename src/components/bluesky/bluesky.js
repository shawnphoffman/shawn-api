import 'dotenv/config'

import { BskyAgent, RichText } from '@atproto/api'
import { fetchRemoteImageBuffer, getContentType, getOgImageUrl } from './imageUtils'
// import { captureException, captureMessage } from '@sentry/node'

const username = process.env.BSKY_USERNAME
const password = process.env.BSKY_PASSWORD

const agent = new BskyAgent({
	service: 'https://bsky.social',
})

const websiteTarget = `Click here for more...`

const formatBleet = async (agent, { contentType, items, url, title }) => {
	const stinger = `New Star Wars ${contentType}`
	let txt = `${stinger}!!!
${items}`

	if (url) {
		txt += `
${websiteTarget}`
	}

	const rt = new RichText({ text: txt })
	await rt.detectFacets(agent)

	const facets = [
		...(url
			? [
					{
						index: {
							byteStart: txt.indexOf(websiteTarget),
							byteEnd: txt.indexOf(websiteTarget) + websiteTarget.length,
						},
						features: [
							{
								$type: 'app.bsky.richtext.facet#link',
								uri: url,
							},
						],
					},
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  ]
			: []),
		...(rt.facets || []),
	]

	const record = {
		text: rt.text,
		langs: ['en-US'],
		facets,
		embed: {
			$type: 'app.bsky.embed.external',
			external: {
				uri: url ? url : '',
				title: title || stinger,
				description: stinger,
				// thumb: thumb,
			},
		},
	}

	if (url) {
		const imageUrl = await getOgImageUrl(url)
		if (imageUrl) {
			const buffer = await fetchRemoteImageBuffer(imageUrl)

			const mimetype = getContentType(imageUrl)

			const blob = await manualUploadBlob(agent, buffer, mimetype)

			if (blob) {
				record.embed.external.thumb = blob
			}
		}
	}

	console.log('================')
	console.log(record)
	console.log('================')

	return record
}

//
// TODO - Check bsky for existing bleet
//

export const postBleet = async ({ contentType, items, url, title }) => {
	// Login
	const loginResponse = await agent.login({
		identifier: username,
		password: password,
	})
	if (!loginResponse.success) {
		console.error('BLUESKY LOGIN FAILED')
		// captureMessage('BLUESKY LOGIN FAILED', 'error')
	}

	try {
		// Generate Bleet
		const record = await formatBleet(agent, { contentType, items, url, title })

		// Post Bleet
		const post = await agent.post(record)

		console.log(`Bleeting: ${contentType}`)
		console.log(post)
		console.log('================')

		return post
	} catch (error) {
		console.error('BLUESKY POST FAILED', error)
		// captureException(error)
		return null
	}
}

// eslint-disable-next-line no-unused-vars
const manualUploadBlob = async (agent, buffer, mimetype) => {
	const jwt = agent.session?.accessJwt
	const uploadUrl = 'https://bsky.social/xrpc/com.atproto.repo.uploadBlob'

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${jwt}`,
			'Content-Type': mimetype,
		},
		body: buffer,
	}

	try {
		const resp = await fetch(uploadUrl, options)
		const json = await resp.json()

		// console.log('MANUAL UPLOAD BLOB', json)

		return json.blob
	} catch (error) {
		return
	}
}
