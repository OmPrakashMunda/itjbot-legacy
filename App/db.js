const mysql = require('mysql');
require('dotenv').config();
const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const db = process.env.DB;

var connection;

function handleDisconnect() {
    connection = mysql.createConnection({
        host: host,
        user: user,
        password: pass,
        database: db
    });

    connection.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();


async function writeLog(timestamp, user_msg, bot_msg, user_number) {
    const query = `INSERT INTO logs (timestamp, user_msg, bot_msg, user_number) VALUES ('${timestamp}', '${user_msg}', '${bot_msg}', '${user_number}')`;
    connection.query(query, (err, result) => {
        if (err) {
            console.log('Error writing log to MySQL:');
            return;
        }
    });
}

async function writeLogDocUpload(user, uid, filename, filesize) {
    const query = `INSERT INTO docs (user, uid, filename, filesize) VALUES ('${user}', '${uid}', '${filename}', '${filesize}')`;
    connection.query(query, (err, result) => {
        if (err) {
            console.log('Error writing log to MySQL:' + err);
            return false;
        }
        return true;
    });
}

async function listFiles(user) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT filename FROM docs WHERE user = ?';

        connection.query(query, [user], (error, results) => {
            if (error) {
                console.error('Error fetching filenames from the SQL table:', error);
                return 'Error fetching filenames. Please try again later.';
            }

            if (results.length === 0) {
                return 'No files found.';
            }

            const fileNames = results.map((row, index) => `${index + 1}. ${row.filename}`);
            const fileList = fileNames.join('\n');

            resolve('Your files:\n' + fileList);
        });
    });
}


async function getUser(user) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE number = ?';

        connection.query(query, [user], (error, results) => {
            if (error) {
                console.error('Error fetching user data from the SQL table:', error);
                reject(error);
                return;
            }

            if (results.length === 0) {
                const notFoundError = new Error('User Not Found.');
                reject(notFoundError);
                return;
            }

            resolve(results[0]);
        });
    });
}

function isPromptLeft(userNumber) {
    const promptCountQuery = `
            SELECT COUNT(*) AS prompt_count
            FROM logs
            WHERE user_number = ?
            AND date_time BETWEEN (
                SELECT date_time
                FROM users
                WHERE number = ?
            ) AND (
                SELECT DATE_ADD(date_time, INTERVAL 30 DAY)
                FROM users
                WHERE number = ?
            )
        `;

    const userPlanQuery = 'SELECT plan FROM users WHERE number = ?';

    return new Promise((resolve, reject) => {
        connection.query(promptCountQuery, [userNumber, userNumber, userNumber], (error1, promptCountResults) => {
            if (error1) {
                reject(error1);
                return;
            }

            connection.query(userPlanQuery, [userNumber], (error2, userPlanResults) => {
                if (error2) {
                    reject(error2);
                    return;
                }

                const promptCount = promptCountResults[0] ? promptCountResults[0].prompt_count : 0;
                const userPlan = userPlanResults[0] ? parseInt(userPlanResults[0].plan) : null;

                let result = 0;

                /*
                case: 1 -- Free user
                case: 2 -- Silver Users
                case: 3 -- Gold Users
                case: 4 -- Platinum Users (Not available for public)
                case: 5 -- Platinum Beta Testers (Not available for public)
                */

                switch (userPlan) {
                    case 1:
                        if (promptCount < 90) {
                            result = 1;
                        }
                        break;
                    case 2:
                        if (promptCount < 500) {
                            result = 1;
                        } else {
                            result = 2;
                        }
                        break;
                    case 3:
                        result = 1;
                        break;
                    case 4:
                        result = 1;
                        break;
                    case 5:
                        result = 1;
                        break;
                }

                resolve(result);
            });
        });
    });
}


module.exports = {
    writeLog: writeLog,
    writeLogDocUpload: writeLogDocUpload,
    listFiles: listFiles,
    getUser: getUser,
    isPromptLeft: isPromptLeft
};