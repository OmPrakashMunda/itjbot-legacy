const axios = require('axios');

async function shortenUrl(longUrl) {
  try {
    const response = await axios.post('http://tinyurl.com/api-create.php', null, {
      params: {
        url: longUrl,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to create a shortened URL.');
    }
  } catch (error) {
    throw error;
  }
}

// Example usage:
const longUrl = 'https://www.example.com/very/long/url';
createShortenedUrl(longUrl)
  .then((shortUrl) => {
    console.log(`Shortened URL: ${shortUrl}`);
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
  });
