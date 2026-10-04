import { withAxiom } from 'next-axiom'

import redis, { RedisKey } from '@/utils/redis'

const apiKey = process.env.PURPLE_API_KEY
const sensorUrl = 'https://api.purpleair.com/v1/sensors/151596?fields=name,confidence,altitude,temperature,humidity,voc,pm2.5,pm2.5_cf_1'

// Ask PurpleAir at most once a minute across all instances; keep the last reading for a day as a fallback
const FRESH_SECONDS = 60
const KEEP_SECONDS = 60 * 60 * 24

type PurpleResponse = {
	time_stamp: number
	data_time_stamp: number
	sensor: Record<string, any>
}

type CachedReading = {
	checkedAt: number
	data: PurpleResponse
}

type PurpleOutput = {
	aqi: number | string | undefined
	// PM2.5 the AQI was calculated from: EPA-corrected when the sensor reports cf=1 and humidity
	pm25: number
	corrected: boolean
	aqiUncorrected: number | string | undefined
	raw: any
}

/**
 * EPA correction for PurpleAir PM2.5 (Barkjohn et al. 2022, used on the AirNow Fire and Smoke Map).
 * Takes the cf=1 reading averaged across both channels and the sensor's relative humidity.
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC9784900/
 */
function correctPM(cf1: number, rh: number): number {
	const typical = 0.524 * cf1 - 0.0862 * rh + 5.75
	const heavySmoke = 4.21e-4 * cf1 ** 2 + 0.392 * cf1 + 3.44

	let pm = typical
	if (cf1 >= 611) {
		pm = heavySmoke
	} else if (cf1 >= 570) {
		const weight = 0.0244 * cf1 - 13.9
		pm = weight * heavySmoke + (1 - weight) * typical
	}

	// Clean air with high humidity can push the linear fit slightly below zero
	return Math.max(0, pm)
}

async function fetchSensor(): Promise<PurpleResponse> {
	const res = await fetch(sensorUrl, {
		headers: { 'X-API-KEY': apiKey! },
		cache: 'no-store',
		signal: AbortSignal.timeout(10_000),
	})
	if (!res.ok) {
		throw new Error(`PurpleAir request failed: ${res.status} ${res.statusText}`)
	}

	const data = await res.json()
	if (typeof data?.data_time_stamp !== 'number' || typeof data?.sensor?.['pm2.5'] !== 'number') {
		throw new Error('PurpleAir response is missing data_time_stamp or sensor pm2.5')
	}
	return data
}

async function readCache(): Promise<CachedReading | null> {
	try {
		return await redis().get<CachedReading>(RedisKey.TahomePurple)
	} catch (error) {
		console.error('Tahome purple cache read failed:', error)
		return null
	}
}

async function writeCache(reading: CachedReading) {
	try {
		await redis().set(RedisKey.TahomePurple, reading, { ex: KEEP_SECONDS })
	} catch (error) {
		console.error('Tahome purple cache write failed:', error)
	}
}

/**
 * Returns the newest sensor reading, shared across every instance through Redis.
 * PurpleAir's API can answer with an older reading after a newer one, so an older reading never replaces a newer one.
 */
async function getSensorData(): Promise<PurpleResponse> {
	const cached = await readCache()
	const now = Math.floor(Date.now() / 1000)

	if (cached && now - cached.checkedAt < FRESH_SECONDS) {
		return cached.data
	}

	let fresh: PurpleResponse
	try {
		fresh = await fetchSensor()
	} catch (error) {
		if (!cached) throw error
		// Serve the last reading and wait a full interval before asking PurpleAir again
		console.error('PurpleAir fetch failed, serving cached reading:', error)
		await writeCache({ checkedAt: now, data: cached.data })
		return cached.data
	}

	const newest = cached && cached.data.data_time_stamp > fresh.data_time_stamp ? cached.data : fresh
	await writeCache({ checkedAt: now, data: newest })
	return newest
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
	// EPA truncates PM2.5 to one decimal, then picks the bucket by the same 2024 breakpoints the formulas use
	const c = Math.floor(pm * 10) / 10
	if (c > 225.4) {
		return calcAQI(c, 500, 301, 500.4, 225.5) //Hazardous
	} else if (c > 125.4) {
		return calcAQI(c, 300, 201, 225.4, 125.5) //Very Unhealthy
	} else if (c > 55.4) {
		return calcAQI(c, 200, 151, 125.4, 55.5) //Unhealthy
	} else if (c > 35.4) {
		return calcAQI(c, 150, 101, 55.4, 35.5) //Unhealthy for Sensitive Groups
	} else if (c > 9.0) {
		return calcAQI(c, 100, 51, 35.4, 9.1) //Moderate
	} else if (c >= 0) {
		return calcAQI(c, 50, 0, 9, 0) //Good
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
		const data = await getSensorData()

		const { sensor } = data
		const rawPm25 = sensor['pm2.5']
		const cf1 = sensor['pm2.5_cf_1']
		const corrected = typeof cf1 === 'number' && typeof sensor.humidity === 'number'
		const pm25 = corrected ? correctPM(cf1, sensor.humidity) : rawPm25

		const responseData: PurpleOutput = {
			aqi: aqiFromPM(pm25),
			pm25: Math.round(pm25 * 10) / 10,
			corrected,
			aqiUncorrected: aqiFromPM(rawPm25),
			raw: data,
		}

		return Response.json(responseData)
	} catch (error) {
		console.log('Error:', error)
		return Response.json({ error }, { status: 500 })
	}
})

export const dynamic = 'force-dynamic'
