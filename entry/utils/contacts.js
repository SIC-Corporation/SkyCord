const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/contacts.json');

function loadContacts() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveContacts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getContacts(userId) {
  const data = loadContacts();
  return data[userId] || [];
}

function addContact(userId, targetId, targetTag) {
  const data = loadContacts();
  if (!data[userId]) data[userId] = [];
  const exists = data[userId].find(c => c.id === targetId);
  if (exists) return false;
  data[userId].push({ id: targetId, tag: targetTag, addedAt: new Date().toISOString() });
  saveContacts(data);
  return true;
}

function removeContact(userId, targetId) {
  const data = loadContacts();
  if (!data[userId]) return false;
  const before = data[userId].length;
  data[userId] = data[userId].filter(c => c.id !== targetId);
  saveContacts(data);
  return data[userId].length < before;
}

module.exports = { getContacts, addContact, removeContact };
