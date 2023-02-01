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
				// TODO Update this to detect 1:n "a" in utah and reply with n+y
				if (message.includes('utah')) {
					m.reply('Utaaaaaah...')
					return
				}
				if (message.includes('dougie')) {
					m.reply('Dougie')
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
