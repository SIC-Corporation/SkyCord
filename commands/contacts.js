const { EmbedBuilder } = require('discord.js');
const { getContacts, addContact, removeContact } = require('../utils/contacts');

const addCmd = {
  name: 'add',
  description: 'Add a user to your contacts',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to add! `sd.add @user`');
    if (target.id === message.author.id) return message.reply('❌ You can\'t add yourself!');

    const added = addContact(message.author.id, target.id, target.tag);
    if (!added) return message.reply(`⚠️ **${target.username}** is already in your contacts.`);

    const embed = new EmbedBuilder()
      .setColor('#06d6a0')
      .setDescription(`✅ Added **${target.username}** to your SkyCord contacts!`)
      .setThumbnail(target.displayAvatarURL());
    message.reply({ embeds: [embed] });
  }
};

const removeCmd = {
  name: 'remove',
  description: 'Remove a user from your contacts',
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply('❌ Mention someone to remove! `sd.remove @user`');

    const removed = removeContact(message.author.id, target.id);
    if (!removed) return message.reply(`⚠️ **${target.username}** isn't in your contacts.`);

    message.reply(`🗑️ Removed **${target.username}** from your contacts.`);
  }
};

const contactsCmd = {
  name: 'contacts',
  description: 'View your contact list',
  async execute(message, args, client) {
    const contacts = getContacts(message.author.id);
    if (contacts.length === 0) {
      return message.reply('📋 Your contact list is empty. Use `sd.add @user` to add someone!');
    }

    const lines = contacts.map((c, i) => {
      const user = client.users.cache.get(c.id);
      const name = user ? `${user.username}` : c.tag;
      return `\`${i + 1}.\` **${name}** — \`sd.call @${name}\` or \`sd.invite @${name}\``;
    });

    const embed = new EmbedBuilder()
      .setColor('#00b4d8')
      .setTitle(`📋 ${message.author.username}'s Contacts (${contacts.length})`)
      .setDescription(lines.join('\n'))
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};

// Export all three as separate modules via a trick:
// We'll register them individually in index.js by loading all files,
// so we export the primary one and attach others.
module.exports = addCmd;
module.exports.extra = [removeCmd, contactsCmd];
