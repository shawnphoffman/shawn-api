import fetchWithCache from '@/utils/fetchWithCache'

async function processPurpleData(json) {
	const output = {}

	var pm25value = json.sensor['pm2.5']
	var AQI = aqiFromPM(pm25value)

	output.aqi = AQI
	output.raw = json

	function aqiFromPM(pm) {
		if (isNaN(pm)) return '-'
		if (pm == undefined) return '-'
		if (pm < 0) return pm
		if (pm > 1000) return '-'
		/*                                  AQI         RAW PM2.5
			Good                               0 - 50   |   0.0 – 12.0
			Moderate                          51 - 100  |  12.1 – 35.4
			Unhealthy for Sensitive Groups   101 – 150  |  35.5 – 55.4
			Unhealthy                        151 – 200  |  55.5 – 150.4
			Very Unhealthy                   201 – 300  |  150.5 – 250.4
			Hazardous                        301 – 400  |  250.5 – 350.4
			Hazardous                        401 – 500  |  350.5 – 500.4
			*/
		if (pm > 350.5) {
			return calcAQI(pm, 500, 401, 500.4, 350.5) //Hazardous
		} else if (pm > 250.5) {
			return calcAQI(pm, 400, 301, 350.4, 250.5) //Hazardous
		} else if (pm > 150.5) {
			return calcAQI(pm, 300, 201, 250.4, 150.5) //Very Unhealthy
		} else if (pm > 55.5) {
			return calcAQI(pm, 200, 151, 150.4, 55.5) //Unhealthy
		} else if (pm > 35.5) {
			return calcAQI(pm, 150, 101, 55.4, 35.5) //Unhealthy for Sensitive Groups
		} else if (pm > 12.1) {
			return calcAQI(pm, 100, 51, 35.4, 12.1) //Moderate
		} else if (pm >= 0) {
			return calcAQI(pm, 50, 0, 12, 0) //Good
		} else {
			return undefined
		}
	}

	function calcAQI(Cp, Ih, Il, BPh, BPl) {
		var a = Ih - Il
		var b = BPh - BPl
		var c = Cp - BPl
		return Math.round((a / b) * c + Il)
	}

	return output
}

const sensorUrl = 'https://api.purpleair.com/v1/sensors/151596?fields=name,confidence,altitude,temperature,humidity,voc,pm2.5'

export default async function handler(req, res) {
	var myHeaders = new Headers()
	myHeaders.append('X-API-KEY', process.env.PURPLE_API_KEY)

	var requestOptions = {
		method: 'GET',
		headers: myHeaders,
	}

	const data = await fetchWithCache(sensorUrl, requestOptions)

	const responseData = await processPurpleData(data)

	res.status(200).send(responseData)
}
