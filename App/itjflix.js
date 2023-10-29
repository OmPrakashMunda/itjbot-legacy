const axios = require('axios');
const url = require('url');
const path = require('path');
const https = require('https');
const querystring = require('querystring');
const Seedr = require('seedr');
const seedr = new Seedr();
const fs = require('fs');
const { createReadStream } = fs;
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();
const { S3_KEY, S3_SECRET, S3_REGION, S3_BUCKET } = process.env;

const s3Client = new S3({
    region: S3_REGION,
    credentials: {
        accessKeyId: S3_KEY,
        secretAccessKey: S3_SECRET,
    },
});

async function tryToUpload(title_id, imdb_id, name, year) {
    try {
        const response = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${imdb_id}`);

        if (response.data.data && response.data.data.movie_count > 0) {
            const movies = response.data.data.movies;
            let chosenMovie = null;

            for (const movie of movies) {
                if (movie.torrents && movie.torrents.length >= 2) {
                    if (!chosenMovie) {
                        chosenMovie = movie;
                    } else {
                        // Compare 720p and 1080p torrents by seed count
                        const torrent720p = movie.torrents.find(torrent => torrent.quality === '720p');
                        const torrent1080p = movie.torrents.find(torrent => torrent.quality === '1080p');
                        const chosenTorrent720p = chosenMovie.torrents.find(torrent => torrent.quality === '720p');
                        const chosenTorrent1080p = chosenMovie.torrents.find(torrent => torrent.quality === '1080p');

                        if (torrent720p && torrent1080p && chosenTorrent720p && chosenTorrent1080p) {
                            if (torrent720p.seeds + torrent720p.peers > chosenTorrent720p.seeds + chosenTorrent720p.peers) {
                                chosenMovie = movie;
                            } else if (torrent1080p.seeds + torrent1080p.peers > chosenTorrent1080p.seeds + chosenTorrent1080p.peers) {
                                chosenMovie = movie;
                            }
                        }
                    }
                }
            }

            if (chosenMovie) {
                const chosenTorrent = chosenMovie.torrents.find(torrent => torrent.quality === '720p' || torrent.quality === '1080p');
                const magnet = `magnet:?xt=urn:btih:${chosenTorrent.hash}&dn=${movies[0].title_english}|${chosenTorrent.quality}`;
                const s3key = `${movies[0].title_english.replace(" ", "_")}_${movies[0].year}/${chosenTorrent.quality}_${movies[0].language}.mp4`;

                const uploadParams = {
                    Bucket: S3_BUCKET,
                    Key: s3key
                };

                try {
                    await seedr.login("itjupiter.om@gmail.com", "VBM@SRWm9gXfSs8");
                    const seedrVideos = await seedr.getVideos();
                    if (seedrVideos.length <= 0) {
                        await seedr.addMagnet(magnet);
                        let fileFound = false;
                        let timeoutFlag = 0;

                        while (!fileFound) {
                            const video = await seedr.getVideos();
                            if (timeoutFlag >= 60) {
                                await axios.get("https://api-wp-bot.itjupiter.tech/sendItjflix?message=Video not found within 5 minutes. It's possible that the magnet link has low seeds. Please check Seedr and delete any old files labeled as 'collecting seeds.' If the issue persists, consider using a new magnet link or contacting a senior developer. You can use the following credentials to log into Seedr.cc: 'om.prakash26304@gmail.com' and 'Seedr@om26'.&password=UAl6f2hDoDnRziDIUhDNiaBFbP3cTWb4eLWQr5xmliEJU8PBx2");
                                break;
                            } else {
                                timeoutFlag++;
                                if (video.length > 0) {
                                    fileFound = true;
                                    timeoutFlag = 0;

                                    let selectedVideo = null;
                                    for (let i = 0; i < video.length; i++) {
                                        const { id, fid, name, size } = video[i][0];
                                        if (size >= 400 * 1024 * 1024) {
                                            selectedVideo = { id, fid, name, size };
                                            break;
                                        }
                                    }

                                    const downloadUrl = await seedr.getFile(selectedVideo.id);
                                    const parsedUrl = url.parse(downloadUrl.url);
                                    const downloadPath = downloadUrl.name;
                                    const fileExtension = path.extname(downloadPath);
                                    const s3keyWithoutExtension = s3key.substring(0, s3key.lastIndexOf('.'));
                                    const updatedS3Key = `${s3keyWithoutExtension}${fileExtension}`;
                                    uploadParams.Key = updatedS3Key;
                                    const file = fs.createWriteStream(downloadPath);
                                    const request = https.get(parsedUrl, (response) => {
                                        response.pipe(file);
                                        response.on('end', async () => {
                                            try {
                                                await seedr.deleteFolder(selectedVideo.fid);
                                                const fileContent = fs.createReadStream(downloadPath);
                                                uploadParams.Body = fileContent;
                                                const uploadCommand = new PutObjectCommand(uploadParams);
                                                await s3Client.send(uploadCommand);

                                                fs.unlinkSync(downloadPath);
                                                const apiUrl = 'https://cms.itjflix.com/movies/upload_process.php';
                                                const postData = {
                                                    name: name,
                                                    title_id: title_id,
                                                    user_id: "24",
                                                    file_name: s3key,
                                                    lang: movies[0].language,
                                                    quality: chosenTorrent.quality,
                                                    imdb_id: imdb_id
                                                };
                                                const data = querystring.stringify(postData);
  
                                                const headers = {
                                                    'Content-Type': 'application/x-www-form-urlencoded'
                                                };
                                                axios.post(apiUrl, data, {headers})
                                                    .then((response) => {
                                                        return `Movie Upload successsful by protocol 01\nKindly aprove the uploaded video by visitingg the below URL:\n\nhttps://cms.itjflix.com/movies/edit/?uid=${response.data}`;
                                                    })
                                                    .catch((error) => {
                                                        console.error('Error:', error);
                                                    });
                                                

                                            } catch (error) {
                                                return `Error after file download: ${error.message}`;

                                            }
                                        });

                                        request.on('error', (error) => {
                                            return `Error downloading file: ${error.message}`;

                                        });
                                    });
                                } else {
                                    await new Promise(resolve => setTimeout(resolve, 5000));
                                }
                            }
                        }
                    } else {
                        return `"Error: Seedr is not empty; videos may mismatch after upload. Please contact a senior developer or check seedr.cc with the credentials 'om.prakash26304@gmail.com' and 'Seedr@om26'.`;
                    }
                } catch (error) {
                    console.log(error);
                    return `Error during download-upload operation: ${error.message}`;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

module.exports = { tryToUpload };