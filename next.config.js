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
		]
	},
})
