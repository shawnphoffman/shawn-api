const { withAxiom } = require('next-axiom')
module.exports = withAxiom({
	// ... your existing config
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
})
