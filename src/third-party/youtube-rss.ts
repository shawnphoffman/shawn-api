// // curl \
// //   'https://youtube.googleapis.com/youtube/v3/videos?part=status&part=contentDetails&part=liveStreamingDetails&id=Kj3Wmn7b0YY&key=[YOUR_API_KEY]' \
// //   --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
// //   --header 'Accept: application/json' \
// //   --compressed

// import { youtube_v3 } from '@googleapis/youtube'

// export const isYouTubeShort = async (videoId: string) => {
// 	const url = `https://www.youtube.com/shorts/${videoId}`
// 	const resp = await fetch(url, {
// 		method: 'HEAD',
// 		redirect: 'manual',
// 	})
// 	// console.log('isYouTubeShort', resp)

// 	return resp.status === 200
// }

// export const isYouTubeScheduled = async (videoId: string) => {
// 	const post = await getYouTubeVideo(videoId)

// 	if (!post) return false

// 	// console.log('isYouTubeScheduled', post)

// 	const scheduledStartTime = post.liveStreamingDetails?.scheduledStartTime

// 	if (!scheduledStartTime) return false

// 	const now = new Date()
// 	const scheduled = new Date(scheduledStartTime)

// 	return now < scheduled
// }

// // 'Kj3Wmn7b0YY'
// export const getYouTubeVideo = async (videoId: string) => {
// 	// console.log('getYouTubeVideo', videoId)
// 	const temp = new youtube_v3.Youtube({
// 		auth: process.env.YOUTUBE_API_KEY,
// 	})
// 	const post = await temp.videos.list({
// 		id: [videoId],
// 		part: ['status', 'liveStreamingDetails'],
// 		// part: [
// 		// 	'contentDetails',
// 		// 	'id',
// 		// 	'liveStreamingDetails',
// 		// 	'localizations',
// 		// 	'player',
// 		// 	'recordingDetails',
// 		// 	'snippet',
// 		// 	'statistics',
// 		// 	'status',
// 		// 	'topicDetails',
// 		// 	// NOPE
// 		// 	// 'processingDetails',
// 		// 	// 'fileDetails',
// 		// 	// 'suggestions',
// 		// ],
// 	})

// 	if (!post?.data?.items?.length) {
// 		return null
// 	}

// 	return post.data.items[0]
// }
