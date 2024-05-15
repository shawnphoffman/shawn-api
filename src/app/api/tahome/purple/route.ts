import { withAxiom } from 'next-axiom'

import fetchWithCache from '@/utils/fetchWithCache'

const apiKey = process.env.PURPLE_API_KEY
const sensorUrl = 'https://api.purpleair.com/v1/sensors/151596?fields=name,confidence,altitude,temperature,humidity,voc,pm2.5'

type PurpleOutput = {
	aqi: number | string | undefined
	raw: any
}

/**
 * Calculates the Air Quality Index (AQI) based on the given parameters.
 * @param Cp - The concentration of pollutant.
 * @param Ih - The AQI value corresponding to the higher concentration.
 * @param Il - The AQI value corresponding to the lower concentration.
 * @param BPh - The higher breakpoint concentration.
 * @param BPl - The lower breakpoint concentration.
 * @returns The calculated AQI.
 */
function calcAQI(Cp: number, Ih: number, Il: number, BPh: number, BPl: number): number {
	var a = Ih - Il
	var b = BPh - BPl
	var c = Cp - BPl
	return Math.round((a / b) * c + Il)
}

/**
 * Calculates the Air Quality Index (AQI) based on the given PM2.5 value.
 * @param pm - The PM2.5 value.
 * @returns The calculated AQI.
 */
function aqiFromPM(pm: number): number | '-' | undefined {
	if (isNaN(pm)) return '-'
	if (pm == undefined) return '-'
	if (pm < 0) return pm
	if (pm > 1000) return '-'
	/*                                       AQI     RAW PM2.5
		Good                                0 - 50  |  0.0 – 12.0
		Moderate                          51 - 100  |  12.1 – 35.4
		Unhealthy for Sensitive Groups   101 – 150  |  35.5 – 55.4
		Unhealthy                        151 – 200  |  55.5 – 150.4
		Very Unhealthy                   201 – 300  |  150.5 – 250.4
		Hazardous                        301 – 400  |  250.5 – 350.4
		Hazardous                        401 – 500  |  350.5 – 500.4
	*/
	/* UPDATED 2024 */
	/*                                       AQI     RAW PM2.5
		Good                                0 - 50  |  0.0 – 9.0
		Moderate                          51 - 100  |  9.1 – 35.4
		Unhealthy for Sensitive Groups   101 – 150  |  35.5 – 55.4
		Unhealthy                        151 – 200  |  55.5 – 125.4
		Very Unhealthy                   201 – 300  |  125.5 – 225.4
		Hazardous                        301 – 400  |  225.5 – 500.4
	*/
	if (pm > 250.5) {
		return calcAQI(pm, 500, 301, 500.4, 225.5) //Hazardous
	} else if (pm > 150.5) {
		return calcAQI(pm, 300, 201, 225.4, 125.5) //Very Unhealthy
	} else if (pm > 55.5) {
		return calcAQI(pm, 200, 151, 125.4, 55.5) //Unhealthy
	} else if (pm > 35.5) {
		return calcAQI(pm, 150, 101, 55.4, 35.5) //Unhealthy for Sensitive Groups
	} else if (pm > 12.1) {
		return calcAQI(pm, 100, 51, 35.4, 9.1) //Moderate
	} else if (pm >= 0) {
		return calcAQI(pm, 50, 0, 9, 0) //Good
	} else {
		return undefined
	}
}

/**
 * Retrieves the data from the PurpleAir API and calculates the AQI.
 * @returns The response containing the AQI and raw data.
 */
export const GET = withAxiom(async () => {
	try {
		const myHeaders = new Headers()
		myHeaders.append('X-API-KEY', apiKey!)

		const requestOptions = {
			method: 'GET',
			headers: myHeaders,
		}

		const data = await fetchWithCache({ url: sensorUrl, options: requestOptions })

		var pm25value = data.sensor['pm2.5']
		var AQI = aqiFromPM(pm25value)

		const responseData: PurpleOutput = {
			aqi: AQI,
			raw: data,
		}

		return Response.json(responseData)
	} catch (error) {
		console.log('Error:', error)
		return Response.json({ error }, { status: 500 })
	}
})

export const dynamic = 'force-dynamic'
