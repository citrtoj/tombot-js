const { Client, GatewayIntentBits, Partials } = require('discord.js');
const commands = require("./commands/Commands");

const client = new Client({
    intents: [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.GuildMember
    ]
  });

client.on("messageCreate", async(message) => {
    if (message.author.id === client.user.id) {
        return;
    }
    Object.keys(commands).forEach((key, idx) => {
      commands[key].exec(message);
    })
  });



module.exports = () => {
    client.login(`${process.env.DISCORD_TOKEN}`);
    console.log("Logged into Discord!");
};