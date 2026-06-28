const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
client.activeCalls = new Map(); // callId -> { ownerId, adminIds, channelId, guildId, members }
client.PREFIX = 'sd.';

// Load commands (supports module.exports.extra for multi-command files)
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  client.commands.set(cmd.name, cmd);
  if (cmd.extra) {
    for (const extraCmd of cmd.extra) {
      client.commands.set(extraCmd.name, extraCmd);
    }
  }
}

client.on('ready', () => {
  console.log(`✅ SkyCord is online as ${client.user.tag}`);
  client.user.setActivity('sd.help | SkyCord', { type: 3 }); // WATCHING
});

// Message handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.PREFIX)) return;

  const args = message.content.slice(client.PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply('❌ Something went wrong running that command.');
  }
});

// Voice state update — join/leave sounds + call notifications
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  if (member.user.bot) return;

  const joined = !oldState.channelId && newState.channelId;
  const left = oldState.channelId && !newState.channelId;

  // Find if this channel is a SkyCord managed call
  for (const [callId, call] of client.activeCalls) {
    if (joined && newState.channelId === call.channelId) {
      call.members.add(member.id);
      // Announce join in the call's text channel via bot message
      const textChannel = newState.guild.channels.cache.find(
        c => c.name === 'skycord-calls' && c.isTextBased()
      );
      if (textChannel) {
        const embed = new EmbedBuilder()
          .setColor('#00b4d8')
          .setDescription(`📞 **${member.displayName}** joined the call!`)
          .setTimestamp();
        textChannel.send({ embeds: [embed] });
      }
    }
    if (left && oldState.channelId === call.channelId) {
      call.members.delete(member.id);
      const textChannel = oldState.guild.channels.cache.find(
        c => c.name === 'skycord-calls' && c.isTextBased()
      );
      if (textChannel) {
        const embed = new EmbedBuilder()
          .setColor('#e63946')
          .setDescription(`📴 **${member.displayName}** left the call.`)
          .setTimestamp();
        textChannel.send({ embeds: [embed] });
      }
      // Clean up empty calls
      if (call.members.size === 0) {
        client.activeCalls.delete(callId);
        const vc = oldState.guild.channels.cache.get(call.channelId);
        if (vc) vc.delete().catch(() => {});
        if (textChannel) {
          textChannel.send(`📵 Call \`${callId}\` ended — everyone left.`);
        }
      }
    }
  }
});

require('dotenv').config();
client.login(process.env.DISCORD_TOKEN);
