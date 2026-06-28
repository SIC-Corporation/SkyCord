# 📞 SkyCord — Skype on Discord

A Discord bot that brings Skype-style calling features to your server.

## Features
- 📞 Private & group calls with DM invites
- 📋 Contact list per user (JSON-based)
- 👋 Join/leave announcements in call channel
- 🏠 Call ownership system with promotable admins
- 🤖 Bot TTS into calls (`sd.say`)
- 🛡️ Full staff override controls
- 🔒 Voice channels locked to invited members only

## Commands (prefix: `sd.`)

| Command | Description |
|---|---|
| `sd.help` | Show all commands |
| `sd.add @user` | Add to contacts |
| `sd.remove @user` | Remove from contacts |
| `sd.contacts` | View contact list |
| `sd.call @user` | Call someone (DM invite) |
| `sd.groupcall @u1 @u2` | Group call (DM invites) |
| `sd.invite @user` | Invite to current call |
| `sd.endcall` | End your call |
| `sd.kick @user` | Kick from call (admin) |
| `sd.promote @user` | Make call admin (owner) |
| `sd.demote @user` | Remove call admin (owner) |
| `sd.say <text>` | Bot speaks in call (TTS) |
| `sd.calls` | List all calls (staff) |
| `sd.staffkick @user` | Force kick (staff) |
| `sd.staffend <callId>` | Force end call (staff) |

## Setup

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/skycord
cd skycord
npm install
```

### 2. Set your token
```bash
cp .env.example .env
# Edit .env and paste your Discord bot token
```

### 3. Discord server setup
Create these in your server:
- A **category** named `SkyCord Calls` (call channels appear here)
- A **text channel** named `skycord-calls` (join/leave logs appear here)

### 4. Bot permissions needed
Make sure your bot has:
- ✅ Manage Channels
- ✅ Move Members
- ✅ Connect / Speak
- ✅ Send Messages
- ✅ Read Message History

### 5. Run locally
```bash
npm start
```

---

## 🚀 Hosting 24/7 (Free)

### Option A — Railway (recommended)
1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variable: `DISCORD_TOKEN` = your token
4. Done! It stays online 24/7.

### Option B — Render
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add env var `DISCORD_TOKEN`

---

## Staff Detection
Users are detected as staff if they have:
- `Administrator` or `ManageGuild` permission
- A role named: `staff`, `mod`, `moderator`, or `admin`
