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

const websiteTarget = `Click here for more...`

// const formatBleet = async (agent, { contentType, item, homepage, handle = [] }) => {
const formatBleet = async (agent, { contentType, items, url, title /*, handle = []*/ }) => {
	const stinger = `New Star Wars ${contentType}`
	let txt = `${stinger}!!!
${items}`

	if (url) {
		txt += `
${websiteTarget}`
	}

	// if (url) {
	// 	txt += `
	// ${url}`
	// }

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
		embed: {
			$type: 'app.bsky.embed.external',
			external: {
				uri: url ? url : '',
				title: title || stinger,
				// description: stinger,
				// thumb,
			},
		},
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
