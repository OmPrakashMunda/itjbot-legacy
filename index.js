const {
    Client,
    LocalAuth,
    MessageMedia,
} = require('whatsapp-web.js');
const axios = require('axios');
const colors = require('colors');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const Sentry = require("@sentry/node");
const btoa = require('btoa');

const config = require('./config/config.json');
const db = require('./App/db');
const ai = require('./App/openai');
const sd = require('./App/stablediffusion');

const { getDownloadUrl } = require('./App/download');
const { textToSpeech } = require('./App/texttospeech');

let userMsg;
let botMsg;

Sentry.init({
    dsn: "https://c8ed695dc2b64b82856f8a96f8f76b65@o4505220469293056.ingest.sentry.io/4505220470996992",
    tracesSampleRate: 1.0,
});

try {
    const app = express();
    app.use(cors());

    app.use(express.urlencoded({
        extended: true
    }));

    app.use(express.json());

    const client = new Client({
        puppeteer: {
            headless: true,
            executablePath: '/usr/bin/google-chrome-stable',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        ffmpeg: './ffmpeg.exe',
        authStrategy: new LocalAuth({
            clientId: "client"
        })
    });

    const passwordHash = 'UAl6f2hDoDnRziDIUhDNiaBFbP3cTWb4eLWQr5xmliEJU8PBx2';

    client.on('qr', (qr) => {
        console.log(`[${moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss')}] Scan the QR below : `);
        qrcode.generate(qr, {
            small: true
        });
        console.log(qr);
    });

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '/public/index.html'));
    });

    app.get('/send', async (req, res) => {
        const phoneNumber = req.query.phoneNumber;
        const message = req.query.message;
        const password = req.query.password;
        if (password == passwordHash) {
            try {
                await client.sendMessage(`${phoneNumber}@c.us`, message);
                res.send('Message sent successfully');
            } catch (err) {
                console.error('Error sending message:', err);
                res.status(500).send('Error sending message');
            }
        } else {
            res.status(403).send('Unauthorized');
        }
    });


    app.get('/sendItjFlix', async (req, res) => {
        const phoneNumber = req.query.phoneNumber;
        const message = req.query.message;
        const password = req.query.password;
        if (password == passwordHash) {
            try {
                await client.sendMessage("919341818031-1633259190@g.us", message);
                userMsg = btoa("API Call By Admin");
                botMsg = btoa("Message from API:\n\n" + message);
                db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMsg, botMsg, phoneNumber);
                res.send('Message sent successfully');
            } catch (err) {
                console.error('Error sending message:', err);
                res.status(500).send('Error sending message');
            }
        } else {
            res.status(403).send('Unauthorized');
        }
    });

    app.get('/api', async (req, res) => {
        const phoneNumber = req.query.phoneNumber;
        const password = req.query.password;

        if (password === passwordHash) {
            try {
                const contact = await client.getContactById(`${phoneNumber}@c.us`);
                const profilePic = await client.getProfilePicUrl(`${phoneNumber}@c.us`);
                const about = await contact.getAbout();
                const name = contact.name || phoneNumber;
                const isMyContact = contact.isMyContact;

                res.send(JSON.stringify({ 'profilePic': profilePic || null, 'about': about, 'name': name, 'contact': isMyContact, 'data': contact }));
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.status(403).send('Unauthorized');
        }
    });

    app.get('/respond', async (req, res) => {
        const password = req.query.password;
        if (password === passwordHash) {
            try {
                await sendText("919065736393@c.us", "response --200 --active");
                res.send(JSON.stringify({ 'status': 200 }));
            } catch (err) {
                console.error('Error:', err);
                res.status(500).send('Internal Server Error');
            }
        } else {
            res.status(403).send('Unauthorized');
        }
    });

    async function shortenUrl(url) {
        const response = await fetch('http://tinyurl.com/api-create.php?url=' + encodeURIComponent(url));
        const shortUrl = await response.text();
        return shortUrl;
    }

    client.on('ready', () => {
        console.clear();
        const consoleText = './config/console.txt';
        fs.readFile(consoleText, 'utf-8', (err, data) => {
            if (err) {
                console.log(`[${moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss')}] Console Text not found!`.yellow);
                console.log(`[${moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss')}] ${config.name} is Already!`.green);
            } else {
                console.log(data.green);
                userMsg = btoa("Admin System Reebot");
                botMsg = btoa("Reboot Successfull");
                client.sendMessage('919341818031@c.us', "Hello Boss!\nI'm excited to inform you that I have been rebooted successfully.").then(() => {
                    db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMsg, botMsg, "919341818031");
                });
            }
        });
    });

    //Handle Incoming messages
    const greetings = ["hello", "hi", "hey", "hola", "howdy", "hiya", "yo", "hii", "helloo", "hellooo", "heyy", "hey there", "hi there", "hii there"];
    const userHelp = ["-help", "help"];
    const myFiles = ["-myfiles", "myfiles", "my files", "my documents", "files", "documents"];
    const instaUrlPattern = /(http(s)?:\/\/)?(www\.)?instagram.com\/(p\/[a-zA-Z0-9_-]+|reel\/[a-zA-Z0-9_-]+|stories\/[a-zA-Z0-9_-]+)(\?[a-zA-Z0-9_=]*)?/;
    const spotifyUrlPattern = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|artist|show)\/([a-zA-Z0-9]+)(?:\?[\w=&]+)?|(?:https?:\/\/)?spotify\.link\/([a-zA-Z0-9]+)(?:\?[\w=&]+)?$/;
    const ytUrlPattern = /(http(s)?:\/\/)?((w){3}.)?(youtu\.be\/([a-zA-Z0-9_-]{11})|youtube.com\/(watch\?v=([a-zA-Z0-9_-]{11})|embed\/([a-zA-Z0-9_-]{11})|v\/([a-zA-Z0-9_-]{11})|shorts\/([a-zA-Z0-9_-]{11})))/i;

    const helpMessage = "Kindly explore the provided URL to discover comprehensive information regarding all available features and their respective usage guidelines. \n\nhttps://itjbot.itjupiter.tech/docs/#";

    const welcomeMessage = "👋 Hello, I'm ITJ-BOT! How can I help you today? Here's what I can do:\n\nAnswer any of your questions 🤔\nTurn media into stickers and vice versa 🖼️\nDownload media from YouTube, Instagram, and Spotify 🎵\nAnd much more send ```help``` to know more. \n\nHow can I assist you today?";

    const terms = "Please visit the following URL to learn about our terms: \n\nhttps://itjbot.itjupiter.tech/terms/";

    async function sendText(to, text) {
        await client.sendMessage(to, text);
    }

    client.on('message', async (message) => {
        client.sendPresenceAvailable();

        const user = await client.getContactById(message.from);
        const isGroup = message.from.endsWith('@g.us') ? true : false;
        const chat = await client.getChatById(message.id.remote);
        const userMessage = message.body;
        const userId = user.id._serialized;
        const userNumber = user.number;
        const instaUrlMatch = userMessage.match(instaUrlPattern);
        const ytUrlMatch = userMessage.match(ytUrlPattern);
        const spotifyURLMatch = userMessage.match(spotifyUrlPattern);
        let isUser;
        try {
            const userData = await db.getUser(userNumber);
            isUser = true
            var userPlan = userData.plan;
            var userEmail = userData.email;
            var userSuspended = userData.suspended;
        } catch (error) {
            console.error('Error:', error.message);
            isUser = false;
        }

        if ((isGroup && config.groups) || !isGroup) {
            if (isUser) {
                if (userSuspended === 0) {
                    try {
                        await chat.sendSeen();
                        switch (message.type) {
                            case 'image':
                            case 'video':
                            case 'gif':
                                await sendText(userId, "Hold on..");
                                try {
                                    const media = await message.downloadMedia();
                                    client.sendMessage(message.from, media, {
                                        sendMediaAsSticker: true,
                                        stickerName: config.name,
                                        stickerAuthor: config.author
                                    })
                                } catch {
                                    await sendText(userId, "I'm sorry, I encountered an issue while handling your media. Rest assured, we're looking into the problem.");
                                }
                                break;
                            case 'sticker':
                                await sendText(userId, "Hold on..");
                                try {
                                    const media = await message.downloadMedia();
                                    client.sendMessage(message.from, media);
                                } catch (error) {
                                    console.error('Error downloading media:', error);
                                    await sendText(userId, "I'm sorry, I encountered an issue while handling your media. Rest assured, we're looking into the problem.");
                                }
                                break;
                            case 'document':
                                if (userPlan >= 2) {
                                    const document = await message.downloadMedia();
                                    if (document.mimetype === 'application/pdf' || document.mimetype.startsWith('image/')) {
                                        const fileNameWithoutExt = message.id.id;
                                        const filePath = `./userFiles/${fileNameWithoutExt}`;
                                        const originalFilename = document.filename;
                                        const fileSize = document.filesize;
                                        fs.writeFile(filePath, document.data, "base64", function (err) { if (err) { console.log(err); } });

                                        if (db.writeLogDocUpload(userId, fileNameWithoutExt, originalFilename, fileSize)) {
                                            await sendText(userId, "File upload successfull.\n\nSend ``` My files ``` to list your files.");
                                        }
                                    }
                                } else {
                                    await sendText(userId, "We apologize, but uploading documents is currently unavailable for you.\nKindly upgrade your plan:\n\nhttp://itjbot.itjupiter.tech/");
                                }
                                break;
                            case 'ptt':
                                if (userPlan >= 3) {
                                    chat.sendStateRecording();
                                    const fileName = message.id.id;
                                    const filePath = `./temp/${fileName}.ogg`;
                                    chat.sendStateTyping();
                                    const audio = await message.downloadMedia();
                                    const binaryData = Buffer.from(audio.data, 'base64');
                                    fs.writeFile(filePath, binaryData, function (err) { });
                                    const text = await ai.transcribeAudio(filePath);
                                    //console.log(text);
                                    try {
                                        const AIresponse = await ai.gpt3(userId, text);
                                        const userMsg = btoa("Voice: " + text);
                                        const botMsg = btoa(AIresponse);
                                        if (userPlan === 5) {
                                            async function sendAudio() {
                                                try {
                                                    const url = await textToSpeech(AIresponse);
                                                    if (url) {
                                                        const media = await MessageMedia.fromUrl(url);
                                                        client.sendMessage(message.from, media);
                                                    } else {
                                                        await sendText(userId, "ERROR 4xx");
                                                    }
                                                } catch (err) {
                                                    console.log('An error occurred in TEXT TO SPEECH API:', err.message);
                                                    await sendText(userId, "ERROR 5xx");
                                                }
                                            }
                                            sendAudio();
                                        } else {
                                            await sendText(userId, AIresponse);
                                        }

                                        db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMsg, botMsg, userNumber);
                                    } catch (error) {
                                        console.error('An error occurred:', error);
                                    }
                                } else {
                                    await sendText(userId, "We apologize, but responding to voice notes is currently unavailable for you.\nKindly upgrade your plan:\n\nhttp://itjbot.itjupiter.tech/");
                                }
                                break;
                            default:
                                //commands
                                if (userMessage.startsWith('-')) {
                                    let command = userMessage.substring(1).toLowerCase().split(" ")[0];
                                    const words = userMessage.split(" ");
                                    const cmdContent = words.slice(1).join(" ");
                                    const userMsg = btoa(userMessage);
                                    const botMsg = btoa("CMD RES");
                                    if (command === 'imagine') {
                                        if (userPlan === 5) {
                                            async function handleImagine() {
                                                try {
                                                    const url = await sd.imagine(cmdContent);
                                                    if (url) {
                                                        const media = await MessageMedia.fromUrl(url);
                                                        client.sendMessage(message.from, media);
                                                        db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMsg, botMsg, userNumber);
                                                    } else {
                                                        await sendText(userId, "ERROR 4xx");
                                                    }
                                                } catch (err) {
                                                    console.log('An error occurred in stablediffusion API:', err.message);
                                                    await sendText(userId, "ERROR 5xx");
                                                }
                                            }

                                            handleImagine();
                                        } else {
                                            await sendText(userId, "This feature is currently in beta testing and is available exclusively to our beta testers. If you're interested in becoming a beta tester, please send an email to support@itjupiter.tech");
                                        }
                                    } else if (command === 'mp3') {
                                        if (cmdContent.match(ytUrlPattern)) {
                                            await sendText(userId, "Let me fetch that YouTube audio for you...");
                                            userMsg = btoa(userMessage);
                                            botMsg = btoa("YouTube Audio Download Link");
                                            const url = cmdContent;
                                            async function ytAudio() {
                                                const downloadUrl = await getDownloadUrl(url, 'audio');
                                                await sendText(userId, `Here's your YouTube audio download link: ${await shortenUrl(downloadUrl)}`);
                                            }
                                            ytAudio();
                                        } else if (cmdContent.match(instaUrlPattern)) {
                                            await sendText(userId, "Just a moment while I fetch the post for you...");
                                            userMsg = btoa(userMessage);
                                            botMsg = btoa("Instagram Download Link");
                                            const url = cmdContent;
                                            async function igAudio() {
                                                const downloadUrl = await getDownloadUrl(url, 'audio');
                                                await sendText(userId, `Here's your instagram download link (Audio): ${await short(downloadUrl)}`);
                                            }
                                            igAudio();
                                        }
                                    } else {
                                        await sendText(userId, "Command Not Found !\n\nFind more about commands: https://itjbot.itjupiter.tech/docs/#commands");
                                    }
                                    //end
                                } else if (myFiles.includes(userMessage.toLowerCase())) {
                                    async function listFiles() {
                                        const files = await db.listFiles(userId);
                                        await sendText(userId, files);
                                    }
                                    listFiles();

                                } else if (spotifyURLMatch) {
                                    if (userPlan >= 2) {
                                        const postData = {
                                            url: userMessage,
                                            email: btoa(userEmail),
                                        };
                                        const apiUrl = 'https://sdl.itjupiter.tech/download';

                                        async function makePostRequest() {
                                            try {
                                                const response = await axios.post(apiUrl, postData, {
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                    },
                                                });

                                                if (response.data.response.status == 200) {
                                                    await sendText(userId, "Your request has been successfully submitted. You will receive the download link in your email shortly.\n\n You can also use our web UI to download songs at https://sdl.itjupiter.tech/.");
                                                    db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMessage, "--__--", userNumber);
                                                }

                                                console.log('Response:', response.data);
                                            } catch (error) {
                                                console.error('Error:', error);
                                            }
                                        }
                                        makePostRequest();

                                    } else {
                                        await sendText(userId, "We apologize, but downloading spotify content is currently unavailable for you.\nKindly upgrade your plan:\n\nhttp://itjbot.itjupiter.tech/")
                                    }
                                } else if (ytUrlMatch) {
                                    await sendText(userId, "Let me fetch that YouTube video for you...");
                                    userMsg = btoa(userMessage);
                                    botMsg = btoa("YouTube Video Download Link");
                                    const url = ytUrlMatch[0];
                                    async function ytVideo() {
                                        const downloadUrl = await getDownloadUrl(url, 'video');
                                        await sendText(userId, `Here's your YouTube video download link: ${await shortenUrl(downloadUrl)}`);
                                    }
                                    ytVideo();

                                } else if (instaUrlMatch) {
                                    await sendText(userId, "Just a moment while I fetch the post for you...");
                                    userMsg = btoa(userMessage);
                                    botMsg = btoa("Instagram Download Link");
                                    const url = instaUrlMatch[0] + '/';
                                    async function igVideo() {
                                        const downloadUrl = await getDownloadUrl(url, 'video');
                                        await sendText(userId, `Here's your instagram download link: ${await shortenUrl(downloadUrl)}`);
                                    }
                                    igVideo();
                                } else if (greetings.includes(userMessage.toLowerCase())) {
                                    userMsg = btoa(userMessage);
                                    botMsg = btoa("Default greeting message");
                                    await sendText(userId, welcomeMessage);
                                } else if (userHelp.includes(userMessage.toLowerCase())) {
                                    userMsg = btoa(userMessage);
                                    botMsg = btoa("Default help message");
                                    await sendText(userId, helpMessage);
                                } else {
                                    if (userMessage !== '') {
                                        const promtLeft = await db.isPromptLeft(userNumber);
                                        if (promtLeft === 1) {
                                            try {
                                                chat.sendStateTyping();
                                                const AIresponse = await ai.gpt3(userNumber, userMessage);
                                                const userMsg = btoa(userMessage);
                                                const botMsg = btoa(AIresponse);
                                                await sendText(userId, AIresponse);
                                                db.writeLog(moment().tz(config.timezone).format('MMM Do YYYY - HH:mm:ss'), userMsg, botMsg, userNumber);
                                            } catch (error) {
                                                console.error('An error occurred:', error);
                                            }
                                        } else {
                                            await sendText(userId, "Your allotted quota for prompts has been exhausted. To continue using our services, please consider upgrading your plan by visiting: https://itjbot.itjupiter.tech/");
                                        }
                                    }
                                }
                        }
                    } catch (error) {
                        console.error(error);
                    }

                    if (config.clearChat) {
                        const timeout = setTimeout(async () => {
                            await chat.clearMessages();
                            clearTimeout(timeout);
                        }, 10000);
                    }
                } else {
                    await sendText(userId, "Your account has been temporarily suspended for a policy violation. If you believe this suspension was in error, please don't hesitate to contact us at support@itjupiter.tech for further assistance. To learn more about this issue, click the link below.\n\nhttps://itjbot.itjupiter.tech/terms/account-suspension/");
                }

            } else {
                await sendText(userId, "To access ITJ-BOT, please complete your registration process by visiting the following URL:\n\nhttps://itjbot.itjupiter.tech/")
            }

        }
    });

    client.initialize();
    const port = 2222;
    const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

} catch (error) {
    Sentry.captureException(error);
    console.log(error);
    console.log("error");
}
