import { authenticator } from 'otplib'

const host = process.env.SYNO_HOST
const username = process.env.SYNO_USERNAME
const password = process.env.SYNO_PASSWORD
const otpKey = process.env.SYNO_OTP_KEY
const searchPath = process.env.SYNO_SEARCH_PATH

const sessionName = 'ShawnApiFetch'
const requestOptions = {
	method: 'GET',
}

export const login = async () => {
	console.log('+ synology.login')
	const otp = authenticator.generate(otpKey)

	const authURL = `${host}/webapi/entry.cgi?api=SYNO.API.Auth&version=7&method=login&account=${username}&passwd=${password}&session=${sessionName}&format=sid&otp_code=${otp}`

	const response = await fetch(authURL, requestOptions)
	const json = await response.json()
	console.log('+ synology.login success', json)

	return json?.data?.sid
}

export const logout = async () => {
	console.log('+ synology.logout')

	const authURL = `${host}/webapi/entry.cgi?api=SYNO.API.Auth&version=1&method=logout&session=${sessionName}`

	const response = await fetch(authURL, requestOptions)
	const json = await response.json()
	const success = json?.success

	if (!success) {
		console.log('+ synology.logout failed')
	} else {
		console.log('+ synology.logout success')
	}
}

export const startSearch = async sid => {
	console.log('+ synology.startSearch')

	const url = `${host}/webapi/entry.cgi?api=SYNO.FileStation.Search&version=2&_sid=${encodeURIComponent(
		sid
	)}&method=start&folder_path=${encodeURIComponent(searchPath)}&filetype=file&recursive=true`

	const response = await fetch(url, requestOptions)
	const json = await response.json()
	console.log('+ synology.startSearch success', { json, url })

	return json?.data?.taskid
}

export const cleanSearches = async (sid, taskIds) => {
	console.log('+ synology.cleanSearches')

	const url = `${host}/webapi/entry.cgi?api=SYNO.FileStation.Search&version=2&_sid=${encodeURIComponent(
		sid
	)}&method=clean&taskid=${taskIds.join(',')}`

	const response = await fetch(url, requestOptions)
	const json = await response.json()
	console.log('+ synology.cleanSearches success', { json, url })

	return json?.success
}

export const getSearchResults = async (sid, taskid) => {
	console.log('+ synology.getSearchResults')

	const url = `${host}/webapi/entry.cgi?api=SYNO.FileStation.Search&version=2&_sid=${encodeURIComponent(
		sid
	)}&method=list&taskid=${taskid}&filetype=file&sort_by=name`

	const response = await fetch(url, requestOptions)
	const json = await response.json()
	console.log('+ synology.getSearchResults success', { json, url })

	const result = json?.data
	const success = json?.success ?? false
	const finished = result?.finished ?? false
	const files = result?.files ?? []
	const out = {
		finished,
		files,
		success,
		fileCount: files?.length ?? 0,
	}
	// console.log('+ synology.getSearchResults out', out)
	return out
}

export const RedisKey = {
	SEARCH_TASK_ID: 'syno:search:taskid',
	SEARCH_TASK_IDS: 'syno:search:taskids',
	SEARCH_RESULTS: 'syno:search:results',
}
