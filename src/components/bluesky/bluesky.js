import 'dotenv/config'

import { BskyAgent, RichText } from '@atproto/api'
// import { captureException, captureMessage } from '@sentry/node'

// import type { BleetArgs, BleetResponse, ImageBlob } from '../types'
// import { fetchRemoteImageBuffer, getItemImage } from '../utils/imageUtils'

const username = process.env.BSKY_USERNAME
const password = process.env.BSKY_PASSWORD

const agent = new BskyAgent({
	service: 'https://bsky.social',
})

// const websiteTarget = `Check out their website...`

// const formatBleet = async (agent, { contentType, item, homepage, handle = [] }) => {
const formatBleet = async (agent, { contentType, items, url /*, handle = []*/ }) => {
	const stinger = `New Star Wars ${contentType}`
	let txt = `${stinger}!!!
${items}`

	if (url) {
		txt += `
	${url}`
	}

	// 	if (handle.length) {
	// 		txt += `
	// @${handle.join(' @')}`
	// 	}

	const rt = new RichText({ text: txt })
	await rt.detectFacets(agent)

	const facets = [
		...(url
			? [
					{
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

	// let thumb
	// const image = getItemImage(item)
	// if (image) {
	// 	const buffer = await fetchRemoteImageBuffer(image)

	// 	const blob = await manualUploadBlob(agent, buffer)

	// 	if (blob) {
	// 		thumb = blob
	// 	}
	// }

	const record = {
		text: rt.text,
		langs: ['en'],
		facets,
		// embed: {
		// 	$type: 'app.bsky.embed.external',
		// 	external: {
		// 		// uri: item.link ? item.link : homepage ? homepage : '',
		// 		title: item.title,
		// 		description: stinger,
		// 		// thumb,
		// 	},
		// },
	}

	console.log('================')
	console.log(record)
	console.log('================')

	return record
}

//
// TODO - Check bsky for existing bleet
//

export const postBleet = async ({ contentType, items, url }) => {
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
		const record = await formatBleet(agent, { contentType, items, url })

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
