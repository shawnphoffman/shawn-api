// =======================
// CLEANING
// =======================
export const cleanDate = (raw: Date | string) => {
	let cleaned: Date
	if (typeof raw === 'string') {
		cleaned = new Date(raw)
	} else {
		cleaned = raw
	}
	cleaned.setUTCHours(0, 0, 0, 0)
	return cleaned
}

// =======================
// GETTERS
// =======================

export const getToday = () => {
	const d = new Date()
	// d.setUTCHours(0, 0, 0, 0)
	return d
}

export const getTomorrow = () => {
	const d = new Date()
	// d.setUTCHours(0, 0, 0, 0)
	d.setDate(d.getUTCDate() + 1)
	return d
}

export const getYesterday = () => {
	const d = new Date()
	// d.setUTCHours(0, 0, 0, 0)
	d.setDate(d.getUTCDate() - 1)
	return d
}

// =======================
// TESTS
// =======================

export const isToday = (date: Date) => {
	const t = getToday()
	// date.setUTCHours(0, 0, 0, 0)
	// return date.getTime() === t.getTime()
	return isSameDate(date, t)
}

export const isTomorrow = (date: Date) => {
	const t = getTomorrow()
	// date.setUTCHours(0, 0, 0, 0)
	// return date.getTime() === t.getTime()
	return isSameDate(date, t)
}

export const isYesterday = (date: Date) => {
	const t = getYesterday()
	// date.setUTCHours(0, 0, 0, 0)
	// return date.getTime() === t.getTime()
	return isSameDate(date, t)
}

export const isSameDate = (date1: Date, date2: Date) => {
	return (
		date1.getUTCFullYear() === date2.getUTCFullYear() &&
		date1.getUTCMonth() === date2.getUTCMonth() &&
		date1.getUTCDate() === date2.getUTCDate()
	)
}

// =======================
// DISPLAY
// =======================

export const displayDate = (date: Date | string) => {
	// return date.toISOString().slice(0, 10)
	const cleaned = cleanDate(date)
	return `${getDayOfWeek(cleaned)} ${getMonth(cleaned)} ${cleaned.getUTCDate()}`
}

const getMonth = (date: Date) => {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	return months[date.getUTCMonth()]
}

const getDayOfWeek = (date: Date) => {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	return days[date.getUTCDay()]
}
