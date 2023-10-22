const axios = require('axios');
require('dotenv').config();

const apiUrl = process.env.DOWNLOAD_API_URL;

async function getDownloadUrl(url, type = 'video') {
    try {
        let isAudioOnly;
        if (type === 'audio') {
            isAudioOnly = true;
        } else if (type === 'video') {
            isAudioOnly = false;
        }

        const data = {
            url: url,
            isAudioOnly: isAudioOnly
        };

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        const response = await axios.post(apiUrl, data, { headers });

        if (response.status === 200) {
            return response.data.url ? response.data.url : "Ummm, I think there is something wrong with your URL, please try again.";
        } else {
            throw new Error("I'm sorry, but I couldn't find a suitable download link for that video. It might not be available for Public.");
        }

    } catch (err) {
        return err.message;
    }
}

module.exports = {getDownloadUrl};