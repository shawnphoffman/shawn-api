import 'dotenv/config'

import { BskyAgent, RichText } from '@atproto/api'
// import { captureException, captureMessage } from '@sentry/node'
import { log } from 'next-axiom'

import { fetchRemoteImageBuffer, getContentType, getOgImageUrl } from './imageUtils'
import { addToStarWarsFeed } from './shawnbot'

const username = process.env.BSKY_USERNAME
const password = process.env.BSKY_PASSWORD

const agent = new BskyAgent({
	service: 'https://bsky.social',
})

const websiteTarget = `Click here for more...`

const formatBleet = async (agent, { contentType, items, url, title, desc }) => {
	const hasContentType = !!contentType

	const stinger = hasContentType ? `New Star Wars ${contentType}` : ''
	let txt = hasContentType
		? `${stinger}!!!
${items}`
		: items

	if (hasContentType && url) {
		txt += `
${websiteTarget}`
	}

	const rt = new RichText({ text: txt })
	await rt.detectFacets(agent)

	const facets = [
		...(hasContentType && url
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
				description: desc || stinger || '',
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

	log.info('================')
	log.info(record)
	log.info('================')

	return record
}

//
// TODO - Check bsky for existing bleet
//

export const postBleet = async ({ contentType, items, url, title, desc }) => {
	// Login
	const loginResponse = await agent.login({
		identifier: username,
		password: password,
	})
	if (!loginResponse.success) {
		log.error('BLUESKY LOGIN FAILED')
		// captureMessage('BLUESKY LOGIN FAILED', 'error')
	}

	// try {
	// Generate Bleet
	const record = await formatBleet(agent, { contentType, items, url, title, desc })

	// Post Bleet
	const post = await agent.post(record)

	log.info(`Bleeting: ${contentType || 'NO TYPE'}`)
	log.info(post)
	log.info('================')

	if (post?.cid) {
		await addToStarWarsFeed({ cid: post.cid, uri: post.uri, indexedAt: new Date().toISOString() })
	}

	return post
	// } catch (error) {
	// 	log.error('BLUESKY POST FAILED', error)
	// 	// captureException(error)
	// 	return null
	// }
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

	// try {
	const resp = await fetch(uploadUrl, options)
	const json = await resp.json()

	// log.info('MANUAL UPLOAD BLOB', json)

	return json.blob
	// } catch (error) {
	// 	return
	// }
}
