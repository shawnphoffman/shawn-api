import Cors from 'src/utils/cors'

const podSites = [
	/blueharvest\.rocks$/,
	/theblueypodcast\.com$/,
	/blueypodcast\.com$/,
	/jammedtransmissions\.com$/,
	/justshillin\.com$/,
	/localhost/,
]

const corsCheck = async (req, res) => {
	return await Cors(req, res, {
		methods: ['GET', 'OPTIONS'],
		origin: podSites,
	})
}

export default corsCheck
