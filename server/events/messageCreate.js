const { Events } = require('discord.js')

module.exports = {
	name: Events.MessageCreate,
	once: false,
	execute: async function (m) {
		console.log('-------------')
		console.log('MessageCreate')
		console.log(m)
		console.log('-------------')

		try {
			if (!m.author.bot) {
				const message = m.content.toLowerCase()

				let utahRegex = /(ut)(a+)(h)/gim
				let utahMatches = utahRegex.exec(m.content)
				let utahTest = !!utahMatches?.length || false

				if (message.includes('clean')) {
					await m.reply('You know I keep it clean!')
					const emoji = m.guild.emojis.cache.find(emoji => emoji.name === 'clean')
					m.react(emoji)
					return
				}
				if (message.includes('dook')) {
					m.reply("I don't dig in my dook!")
					m.react('💩')
					return
				}
				if (utahTest) {
					let rebuild = `${utahMatches[1]}${utahMatches[2]}${utahMatches[2]}${utahMatches[3]}`
					m.reply(rebuild)
					return
				}
				if (message.includes('dougy')) {
					m.reply('Dougy')
					return
				}
				if (message.includes('shithead')) {
					m.reply('https://go.blueharvest.rocks/rbj2ml')
					return
				}
				if (message.includes('could be')) {
					const emoji = m.guild.emojis.cache.find(emoji => emoji.name === 'coodbe')
					m.react(emoji)
					return
				}
			}
		} catch (error) {
			console.error(error)
		}
	},
}
