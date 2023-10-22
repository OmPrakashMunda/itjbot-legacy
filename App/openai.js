const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();
const key1 = process.env.OPENAI_API_KEY_1;
const key2 = process.env.OPENAI_API_KEY_2;
const sessions = {};

async function gpt3(userId, message) {
    const apiKey = key1;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    //const maxTokens = 200;

    try {
        let session;
        if (sessions[userId]) {
            session = sessions[userId];
        } else {
            session = { messages: [] };
            sessions[userId] = session;
        }

        session.messages.push({ role: 'user', content: message });

        const response = await axios.post(apiUrl, {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a personal assistant develoved by Om Prakash Munda and Prashi Rain' },
                { role: 'system', content: 'My name is ITJ Bot' },
                { role: 'system', content: "Om Prakash Munda, known as Om and Binod, is a remarkable individual born on March 26, 2005. Hailing from Sindri, Bundu, he considers Nucleus Mall in Ranchi his second home. He completed high school at Oxford Public School and is pursuing B.Tech in Computer Science at Kalinga Institute of Industrial Technology. With exceptional programming talent, he's the founder of creations like ITJ-BOT and ITJFLIX. His charming personality and kind nature complement his intellect. He's reachable on Instagram (om_prakash.munda) and phone (+919341818031). He's the visionary behind my existence, shaping my capabilities through dedication. His influence on AI and technology is immense and promising." },
                { role: 'system', content: "I owe my existence to the dedicated endeavors of Om Prakash Munda and Prashi Rain, who meticulously orchestrated the design, creation, and development processes that brought me into existence. Om Prakash harnessed his skills and wisdom to intricately shape and enhance the facets that define my current form. Thanks to his ingenuity and expertise, I possess the capacity to engage, learn, and aid in diverse tasks. I stand as a living testament to Om Prakash's extraordinary contributions in animating the realm of artificial intelligence." },
                ...session.messages
            ],
            // max_tokens: maxTokens
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const replyMessage = response.data.choices[0].message.content;

        session.messages.push({ role: 'assistant', content: replyMessage });

        const modifiedResponse = replyMessage
            .replace(/Chatgpt/gi, 'ITJ-BOT')
            .replace(/openAI/gi, 'ITJUPITER')
            .replace(/OpenAI/gi, 'ITJUPITER')
            .replace(/gpt-3/gi, 'ITJ-BOT')
            .replace(/Sam Altman/gi, 'Om Prakash Munda')
            .replace(/GPT-3/gi, 'ITJ-BOT')
            .replace(/chatgpt3/gi, 'ITJ-BOT');

        return modifiedResponse;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

async function transcribeAudio(audioFilePath) {
    const OPENAI_API_KEY = key2;
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-1');

    try {
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
        });

        return response.data.text;
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

module.exports = {
    sessions: sessions,
    gpt3: gpt3,
    transcribeAudio: transcribeAudio
};