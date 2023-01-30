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
				if (m.content.toLowerCase().includes('clean')) {
					await m.reply('You know I keep it clean!')
					const reactionEmoji = m.guild.emojis.cache.find(emoji => emoji.name === 'clean')
					m.react(reactionEmoji)
					return
				}
				if (m.content.toLowerCase().includes('dook')) {
					m.reply("I don't dig in my dook!")
					m.react('💩')
					return
				}
				if (m.content.toLowerCase().includes('utah')) {
					m.reply('Utaaaaaah...')
					return
				}
				if (m.content.toLowerCase().includes('dougie')) {
					m.reply('Dougie')
					return
				}
				if (m.content.toLowerCase().includes('shithead')) {
					m.reply('https://go.blueharvest.rocks/rbj2ml')
					return
				}
			}
		} catch (error) {
			console.error(error)
		}
	},
}
