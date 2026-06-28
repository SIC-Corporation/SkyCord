const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show all SkyCord commands',
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor('#00b4d8')
      .setTitle('📞 SkyCord — Command List')
      .setDescription('Skype vibes, Discord power. Prefix: `sd.`')
      .addFields(
        {
          name: '📋 Contacts',
          value: [
            '`sd.add @user` — Add someone to your contacts',
            '`sd.remove @user` — Remove a contact',
            '`sd.contacts` — View your contact list',
          ].join('\n'),
        },
        {
          name: '📞 Calls',
          value: [
            '`sd.call @user` — Invite someone to a private call (DM invite sent)',
            '`sd.groupcall @user1 @user2...` — Start a group call',
            '`sd.invite @user` — Invite someone to your current call',
            '`sd.endcall` — End your call (owner/staff only)',
            '`sd.kick @user` — Kick from call (call admin/staff)',
            '`sd.promote @user` — Make someone a call admin (owner only)',
            '`sd.demote @user` — Remove call admin (owner only)',
          ].join('\n'),
        },
        {
          name: '🤖 Bot in Call',
          value: [
            '`sd.say <text>` — Bot speaks in your voice channel (TTS)',
          ].join('\n'),
        },
        {
          name: '🛡️ Staff Only',
          value: [
            '`sd.staffkick @user` — Force-kick anyone from any call',
            '`sd.staffend <callId>` — Force-end any call',
            '`sd.calls` — List all active calls',
          ].join('\n'),
        }
      )
      .setFooter({ text: 'SkyCord — Skype on Discord' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
