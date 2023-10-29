const axios = require('axios');
const querystring = require('querystring');
const apiUrl = 'https://cms.itjflix.com/movies/upload_process.php';
const postData = {
    name: 'The Gangster, the Cop, the Devil',
    title_id: '56313',
    user_id: '24',
    file_name: 'The_Gangster, the Cop, the Devil_2019/720p_ko.mp4',
    lang: 'ko',
    quality: '720p',
    imdb_id: 'tt10208198'
};


const data = querystring.stringify(postData);
  
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
};

axios.post(apiUrl, data, { headers })
  .then((response) => {
    console.log(response);
    console.log("Movie Upload successful by protocol 01:", response.data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
