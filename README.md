# Discord Quest Bot

Automate quest completion via console.

**by [@kirkosint](https://github.com/kirkosint)**

---

## Usage

### Desktop App (Recommended)
1. Open Discord desktop app
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. Click Console tab
4. Paste `script.js` contents
5. Press Enter

### Browser (Limited)
1. Open discord.com in browser
2. Press `F12` → Console tab
3. Paste script and hit Enter

**Note:** Desktop gameplay and streaming quests ONLY work in the desktop app.

---

## What It Does

- Finds all your active quests
- Completes them automatically
- Shows progress in real-time
- Handles rate limits

**Quest types supported:**
- Video watching (browser or app)
- Desktop gameplay (app only)
- Streaming (app only, needs 1+ viewer)
- Activities (browser or app)

---

## Features

- Auto-detects enrolled quests
- Skips completed/expired quests
- Built-in rate limiting
- Auto-retry on errors
- Progress bars and completion tracking

---

## Desktop App Quests

Some quests require the Discord desktop app:

**PLAY_ON_DESKTOP**
- Must use desktop app
- Simulates running the game
- No viewer required

**STREAM_ON_DESKTOP**
- Must use desktop app
- Need at least 1 person watching in voice channel
- Join VC before running script

---

## Troubleshooting

**"No active quests"** → Enroll in quests from Quest Hub first

**"Desktop app required"** → Download from discord.com/download

**"No voice channels"** → Join a VC for activity quests

**Progress stuck on streaming quest** → Make sure someone is watching your stream

---

## How It Works

Hooks into Discord's internal webpack to access quest APIs. Sends progress updates at realistic intervals while respecting rate limits.

---

## Disclaimer

Uses Discord's internal APIs. Not officially supported. Use at your own risk.

May violate ToS. Could break with Discord updates.

---

## License

MIT

---

**[@kirkosint](https://github.com/kirkosint)**
