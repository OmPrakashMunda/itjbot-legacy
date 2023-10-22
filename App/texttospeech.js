const axios = require("axios").default;
require('dotenv').config();
const apiKey = process.env.TEXT_TO_SPEECH_API_KEY;
async function textToSpeech(text){
    const options = {
        method: "POST",
        url: "https://api.edenai.run/v2/audio/text_to_speech",
        headers: {
          authorization: `Bearer ${apiKey}`,
        },
        data: {
          show_original_response: false,
          fallback_providers: "",
          providers: "amazon",
          language: "en",
          text: text,
          option: "FEMALE",
        },
      };
      
      try {
        const response = await axios.request(options);
        const audioResourceUrl = response.data.amazon.audio_resource_url;
        console.log(audioResourceUrl);
        return audioResourceUrl;
      } catch (error) {
        console.log(error);
        throw error; 
      }
}

module.exports = {textToSpeech};