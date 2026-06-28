const { EmbedBuilder } = require('discord.js');
const { isStaff, getUserCall } = require('../utils/perms');

// sd.say — bot sends TTS message in the call's text channel (Discord TTS)
const sayCmd = {
  name: 'say',
  description: 'Bot speaks in the call channel using TTS',
  async execute(message, args, client) {
    if (args.length === 0) return message.reply('❌ Usage: `sd.say <message>`');

    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call.');

    const { call } = found;
    const vc = message.guild.channels.cache.get(call.channelId);
    if (!vc) return message.reply('❌ Call channel not found.');

    // Find or use skycord-calls text channel
    const textChannel = message.guild.channels.cache.find(
      c => c.name === 'skycord-calls' && c.isTextBased()
    ) || message.channel;

    const text = args.join(' ');
    await textChannel.send({ content: `🔊 *${text}*`, tts: true });
    message.reply(`✅ Bot said: *"${text}"* in the call channel.`);
  }
};

// sd.calls — staff: list all active calls
const listCallsCmd = {
  name: 'calls',
  description: '[Staff] List all active SkyCord calls',
  async execute(message, args, client) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!isStaff(member)) return message.reply('❌ Staff only!');

    if (client.activeCalls.size === 0) {
      return message.reply('📵 No active SkyCord calls right now.');
    }

    const lines = [];
    for (const [callId, call] of client.activeCalls) {
      const owner = await client.users.fetch(call.ownerId).catch(() => null);
      const vc = message.guild.channels.cache.get(call.channelId);
      lines.push(
        `🆔 \`${callId}\` — Owner: **${owner?.username || 'Unknown'}** — Members: ${call.members.size} — Channel: ${vc || 'deleted'}`
      );
    }

    const embed = new EmbedBuilder()
      .setColor('#f4a261')
      .setTitle(`📞 Active SkyCord Calls (${client.activeCalls.size})`)
      .setDescription(lines.join('\n'))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};

// sd.staffkick @user — staff: force kick from any call
const staffKickCmd = {
  name: 'staffkick',
  description: '[Staff] Force kick someone from any call',
  async execute(message, args, client) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!isStaff(member)) return message.reply('❌ Staff only!');

    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention someone to kick!');

    let kicked = false;
    for (const [callId, call] of client.activeCalls) {
      if (call.members.has(target.id) && target.voice.channelId === call.channelId) {
        await target.voice.disconnect();
        call.members.delete(target.id);
        kicked = true;
        message.reply(`👢 [Staff] Kicked **${target.displayName}** from call \`${callId}\`.`);
        break;
      }
    }

    if (!kicked) message.reply(`⚠️ **${target.displayName}** isn't in any active SkyCord call.`);
  }
};

// sd.staffend <callId> — staff: force end any call
const staffEndCmd = {
  name: 'staffend',
  description: '[Staff] Force end any call by ID',
  async execute(message, args, client) {
    const member = message.guild.members.cache.get(message.author.id);
    if (!isStaff(member)) return message.reply('❌ Staff only!');

    const callId = args[0]?.toUpperCase();
    if (!callId) return message.reply('❌ Usage: `sd.staffend <callId>`');

    const call = client.activeCalls.get(callId);
    if (!call) return message.reply(`❌ No call found with ID \`${callId}\`.`);

    const vc = message.guild.channels.cache.get(call.channelId);
    client.activeCalls.delete(callId);
    if (vc) await vc.delete().catch(() => {});

    message.reply(`🛡️ [Staff] Force-ended call \`${callId}\`.`);
  }
};

module.exports = sayCmd;
module.exports.extra = [listCallsCmd, staffKickCmd, staffEndCmd];
