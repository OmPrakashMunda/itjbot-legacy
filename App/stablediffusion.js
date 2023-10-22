const axios = require('axios');
const keys = [
    'OXlbrNSs9NVsvoHCP4uRuE9sF8eUCjsa0rkJlM26d2bY1aGqvucgxANBBb3o'
];

async function getRandomKey(keys) {
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
}

async function imagine(prompt) {
    let successURL = null;

    const randomKey = await getRandomKey(keys);

    const payload = {
        key: randomKey,
        prompt: `ultra realistic portrait ((${prompt}))`,
        negative_prompt: '((out of frame)), ((extra fingers)), mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), (((tiling))), ((tile)), ((fleshpile)), ((ugly)), (((abstract))), blurry, ((bad anatomy)), ((bad proportions)), ((extra limbs)), cloned face, glitchy, ((extra breasts)), ((double torso)), ((extra arms)), ((extra hands)), ((mangled fingers)), ((missing breasts)), (missing lips), ((ugly face)), ((fat)), ((extra legs))',
        width: '512',
        height: '512',
        samples: '1',
        num_inference_steps: '20',
        seed: null,
        guidance_scale: 7.5,
        safety_checker: 'no',
        multi_lingual: 'no',
        panorama: 'no',
        self_attention: 'no',
        upscale: 'no',
        webhook: null,
        track_id: null,
        safety_checker_type: null,
    };

    try {
        const response = await axios.post(
            'https://stablediffusionapi.com/api/v3/text2img',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.status === 'success') {
            successURL = response.data.output[0];
        }
    } catch (error) {
        console.log(`Error with key ${randomKey}: ${error.message}`);
    }

    return successURL;
}

module.exports = {imagine};
