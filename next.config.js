const { withAxiom } = require('next-axiom')
module.exports = withAxiom({
	output: 'standalone',
	async redirects() {
		return [
			{
				source: '/api/pod-data/:path*',
				destination: '/api/podcast-data/:path*',
				permanent: true,
			},
			{
				source: '/api/star-wars/daily-check',
				destination: '/api/star-wars/check/daily',
				permanent: true,
			},
			{
				source: '/api/star-wars/frequent-check',
				destination: '/api/star-wars/check/frequent',
				permanent: true,
			},
			{
				source: '/api/patreon/:path*',
				destination: '/api/podcast-data/patreon/:path*',
				permanent: true,
			},
		]
	},
	async headers() {
		return [
			// {
			// 		// matching all API routes
			// 		source: "/api/:path*",
			// 		headers: [
			// 			 // omitted for brevity...
			// 		]
			// },
			{
				source: '/api/star-wars/name-generator',
				headers: [
					{ key: 'Access-Control-Allow-Origin', value: 'https://shawn.party' },
					{ key: 'Access-Control-Allow-Methods', value: 'POST' },
					{ key: 'Access-Control-Allow-Headers', value: '*' },
				],
			},
		]
	},
})
