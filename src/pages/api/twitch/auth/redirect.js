export default async function handler(req, res) {
	console.log(JSON.stringify(req.body, null, 2))

	res.status(200).json({ status: 'success' })
}
