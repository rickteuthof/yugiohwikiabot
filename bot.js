API_URL = 'https://db.ygoprodeck.com/api/v2/cardinfo.php'
PIC_URL = 'https://ygoprodeck.com/pics/'


/**
 * Search for a keyword in the ygoprodeck database
 */
function search(keyword) {
    return new Promise((resolve, reject) => {
        const https = require('https');

        let query = '?fname=' + keyword;
        let url = API_URL + query;

        let req = https.get(url, (res) => {
            let body = '';

            res.on('data', (chunk) => { body += chunk; });

            res.on('end', () => { resolve(JSON.parse(body)); });

        });

        req.on('error', (err) => {
            console.error(err);
            reject(err);
        });
    });
}


/**
 * Read the bot token from a file to avoid accidentally uploading it to Github
 */
function readToken() {
    const fs = require('fs');
    return fs.readFileSync('TOKEN', 'utf8').toString();
}


function main() {
    // Init bot
    const TeleBot = require('telebot');
    const token = readToken();
    const bot = new TeleBot(token);

    // Start polling to accept commands
    bot.start();


    // Simple greeting
    bot.on(['/start', '/hello'], (msg) => {
        msg.reply.text('Welcome! Use the inline function to find cards!');
    });


    // If used like @ygowikibot <query>
    bot.on('inlineQuery', (msg) => {
        // Create a new answer list object
        const answers = bot.answerList(msg.id, { cacheTime: 60 });

        // Search for the given query
        let query = msg.query;
        return search(query).then((response) => {
            // Don't continue if no response was given
            if (!(Array.isArray(response) && response.length > 0)) {
                return;
            }

            const items = response[0];

            // Show at most 10 items
            let length = Math.min(10, items.length);

            for (let i = 0; i < length; i++) {
                // Extract fields from item
                let id = items[i].id;
                let name = items[i].name;
                let url = PIC_URL + id + '.jpg';

                // Generate photo object and prepare to get send
                answers.addPhoto({
                    id: id,
                    caption: name,
                    photo_url: url,
                    thumb_url: url,
                });
            }

            // DEBUG: Log answers
            console.log(answers);

            // Send all answers
            return bot.answerQuery(answers);
        });
    });
}


main();