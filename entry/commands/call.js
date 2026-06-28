const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const { isStaff, isCallOwner, isCallAdmin, getUserCall } = require('../utils/perms');
const { v4: uuidv4 } = require('uuid');

// Send a DM invite to a user for a call
async function sendCallInvite(client, inviterId, targetUser, callId, guild, voiceChannel) {
  const inviter = await client.users.fetch(inviterId);
  const embed = new EmbedBuilder()
    .setColor('#00b4d8')
    .setTitle('📞 Incoming SkyCord Call!')
    .setDescription(
      `**${inviter.username}** is inviting you to join a call in **${guild.name}**!\n\n` +
      `📌 Join voice channel: **${voiceChannel.name}**\n` +
      `🆔 Call ID: \`${callId}\`\n\n` +
      `*Jump into the voice channel to connect!*`
    )
    .setThumbnail(inviter.displayAvatarURL())
    .setTimestamp();

  try {
    await targetUser.send({ embeds: [embed] });
    return true;
  } catch {
    return false; // DMs closed
  }
}

// Create a voice channel for a call
async function createCallChannel(guild, callId, members) {
  const category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'skycord calls'
  );

  const vc = await guild.channels.create({
    name: `📞 Call-${callId.slice(0, 6)}`,
    type: ChannelType.GuildVoice,
    parent: category || null,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionFlagsBits.Connect],
      },
      ...members.map(id => ({
        id,
        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      })),
      {
        id: guild.client.user.id,
        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      },
    ],
  });

  return vc;
}

const callCmd = {
  name: 'call',
  description: 'Call a user (sends them a DM invite)',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to call! `sd.call @user`');
    if (target.id === message.author.id) return message.reply('❌ You can\'t call yourself!');

    const callId = uuidv4().slice(0, 8).toUpperCase();
    const memberIds = [message.author.id, target.id];

    const vc = await createCallChannel(message.guild, callId, memberIds);

    client.activeCalls.set(callId, {
      ownerId: message.author.id,
      adminIds: new Set(),
      channelId: vc.id,
      guildId: message.guild.id,
      members: new Set([message.author.id]),
    });

    const dmSent = await sendCallInvite(client, message.author.id, target, callId, message.guild, vc);

    const embed = new EmbedBuilder()
      .setColor('#00b4d8')
      .setTitle('📞 Call Started!')
      .addFields(
        { name: 'Call ID', value: `\`${callId}\``, inline: true },
        { name: 'Voice Channel', value: `${vc}`, inline: true },
        { name: 'DM Invite', value: dmSent ? '✅ Sent!' : '⚠️ Failed (DMs closed)', inline: true }
      )
      .setDescription(`Calling **${target.username}**... Join ${vc} to connect!`)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};

const groupCallCmd = {
  name: 'groupcall',
  description: 'Start a group call with multiple users',
  async execute(message, args, client) {
    const targets = [...message.mentions.users.values()];
    if (targets.length === 0) return message.reply('❌ Mention at least one person! `sd.groupcall @user1 @user2`');

    const callId = uuidv4().slice(0, 8).toUpperCase();
    const memberIds = [message.author.id, ...targets.map(u => u.id)];
    const vc = await createCallChannel(message.guild, callId, memberIds);

    client.activeCalls.set(callId, {
      ownerId: message.author.id,
      adminIds: new Set(),
      channelId: vc.id,
      guildId: message.guild.id,
      members: new Set([message.author.id]),
    });

    const results = await Promise.all(
      targets.map(async (t) => {
        const sent = await sendCallInvite(client, message.author.id, t, callId, message.guild, vc);
        return `${t.username}: ${sent ? '✅' : '⚠️ DMs closed'}`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor('#00b4d8')
      .setTitle('📞 Group Call Started!')
      .addFields(
        { name: 'Call ID', value: `\`${callId}\``, inline: true },
        { name: 'Voice Channel', value: `${vc}`, inline: true },
        { name: 'Invites Sent', value: results.join('\n'), inline: false }
      )
      .setDescription(`You own this call. Join ${vc} to start!`)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};

const inviteCmd = {
  name: 'invite',
  description: 'Invite someone to your current call',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to invite!');

    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call right now.');

    const { callId, call } = found;

    // Only call admins, owner, or staff can invite
    const member = message.guild.members.cache.get(message.author.id);
    if (!isCallAdmin(client, callId, message.author.id) && !isStaff(member)) {
      return message.reply('❌ Only the call owner, admins, or staff can invite people.');
    }

    // Add them to perms
    const vc = message.guild.channels.cache.get(call.channelId);
    await vc.permissionOverwrites.edit(target.id, {
      Connect: true,
      Speak: true,
    });

    const dmSent = await sendCallInvite(client, message.author.id, target, callId, message.guild, vc);

    message.reply(
      `📨 Invited **${target.username}** to call \`${callId}\`. DM: ${dmSent ? '✅ Sent' : '⚠️ Failed (DMs closed)'}`
    );
  }
};

const endCallCmd = {
  name: 'endcall',
  description: 'End your current call',
  async execute(message, args, client) {
    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call.');

    const { callId, call } = found;
    const member = message.guild.members.cache.get(message.author.id);

    if (!isCallOwner(client, callId, message.author.id) && !isStaff(member)) {
      return message.reply('❌ Only the call owner or staff can end the call.');
    }

    const vc = message.guild.channels.cache.get(call.channelId);
    client.activeCalls.delete(callId);
    if (vc) await vc.delete().catch(() => {});

    message.reply(`📵 Call \`${callId}\` has been ended.`);
  }
};

const kickCallCmd = {
  name: 'kick',
  description: 'Kick someone from the current call',
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mention someone to kick!');

    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call.');

    const { callId, call } = found;
    const member = message.guild.members.cache.get(message.author.id);

    if (!isCallAdmin(client, callId, message.author.id) && !isStaff(member)) {
      return message.reply('❌ Only call admins or staff can kick members.');
    }

    if (target.voice.channelId === call.channelId) {
      await target.voice.disconnect();
    }

    // Remove their permission
    const vc = message.guild.channels.cache.get(call.channelId);
    await vc.permissionOverwrites.edit(target.id, { Connect: false });

    message.reply(`👢 **${target.displayName}** was kicked from the call.`);
  }
};

const promoteCmd = {
  name: 'promote',
  description: 'Promote someone to call admin',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to promote!');

    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call.');

    const { callId, call } = found;

    if (!isCallOwner(client, callId, message.author.id)) {
      return message.reply('❌ Only the call owner can promote admins.');
    }

    call.adminIds.add(target.id);
    message.reply(`⭐ **${target.username}** is now a call admin in \`${callId}\`!`);
  }
};

const demoteCmd = {
  name: 'demote',
  description: 'Remove call admin from someone',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to demote!');

    const found = getUserCall(client, message.author.id);
    if (!found) return message.reply('❌ You\'re not in a SkyCord call.');

    const { callId, call } = found;

    if (!isCallOwner(client, callId, message.author.id)) {
      return message.reply('❌ Only the call owner can demote admins.');
    }

    call.adminIds.delete(target.id);
    message.reply(`🔽 **${target.username}** is no longer a call admin.`);
  }
};

module.exports = callCmd;
module.exports.extra = [groupCallCmd, inviteCmd, endCallCmd, kickCallCmd, promoteCmd, demoteCmd];
