import { authenticator } from 'otplib'
import Cors from 'src/utils/cors'

const host = process.env.SYNO_HOST
const username = process.env.SYNO_USERNAME
const password = process.env.SYNO_PASSWORD
const otpKey = process.env.SYNO_OTP_KEY
const searchPath = process.env.SYNO_SEARCH_PATH

const requestOptions = {
	method: 'GET',
}

const login = async () => {
	const otp = authenticator.generate(otpKey)

	const authURL = `${host}/webapi/entry.cgi?api=SYNO.API.Auth&version=7&method=login&account=${username}&passwd=${password}&session=ShawnApiFetch&format=sid&otp_code=${otp}`

	const response = await fetch(authURL, requestOptions)
	const json = await response.json()
	console.log('')
	console.log('login', json)

	return json?.data?.sid
}

const startSearch = async sid => {
	const url = `${host}/webapi/entry.cgi?api=SYNO.FileStation.Search&version=2&_sid=${encodeURIComponent(
		sid
	)}&method=start&folder_path=${encodeURIComponent(searchPath)}&filetype=file&recursive=true`

	const response = await fetch(url, requestOptions)
	const json = await response.json()
	console.log('')
	console.log('start', { json, url })

	return json?.data?.taskid
}

const fetchResults = async (sid, taskid) => {
	const url = `${host}/webapi/entry.cgi?api=SYNO.FileStation.Search&version=2&_sid=${encodeURIComponent(
		sid
	)}&method=list&taskid=${taskid}&filetype=file&sort_by=name`

	const response = await fetch(url, requestOptions)
	const json = await response.json()
	console.log('')
	console.log('results', { json, url })

	return json?.data
}

async function handler(req, res) {
	console.log('=======================')
	console.log('STARTING COMICS SEARCH')

	await Cors(req, res, {
		methods: ['GET', 'POST', 'OPTIONS'],
		// origin: [/\.shawn\.party/, /localhost/],
	})

	// if (req.method !== 'POST') {
	// 	res.status(405).send({ message: 'Only POST requests allowed' })
	// 	return
	// }

	// const { secret } = req?.body ?? {}

	const sid = await login()

	if (!sid) return res.status(500).json({ success: false, error: 'Login failed' })

	const task = await startSearch(sid)

	if (!task) return res.status(500).json({ success: false, error: 'Search failed' })

	const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

	let results = await fetchResults(sid, task)
	await delay(3000)

	// TODO Do this differently lololololololol
	if (!results || !results.finished || results.files.length === 0) {
		await delay(3000)
		console.log('retrying 1')
		results = await fetchResults(sid, task)
	}
	if (!results || !results.finished || results.files.length === 0) {
		await delay(2000)
		console.log('retrying 2')
		results = await fetchResults(sid, task)
	}
	if (!results || !results.finished || results.files.length === 0) {
		await delay(1000)
		console.log('retrying 3')
		results = await fetchResults(sid, task)
	}

	if (!results || !results.finished || results.files.length === 0)
		return res.status(500).json({ success: false, error: 'Results failed', task })

	const files = results.files.map(file => file.name.replace(/\.[^/.]+$/, '')).sort()

	res.status(200).json({
		success: true,
		files,
	})
}

export default handler

export const config = {
	api: {
		bodyParser: false,
	},
}
