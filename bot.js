const API_URL = 'https://db.ygoprodeck.com/api/v2/cardinfo.php';


//const PIC_URL = 'https://ygoprodeck.com/pics/';
//const PIC_SMALL_URL = 'https://ygoprodeck.com/pics_small/';
const PIC_URL = 'https://rick-6401.qwpoeriuty.xyz/pics/';
const PIC_SMALL_URL = 'https://rick-6401.qwpoeriuty.xyz/pics_small/';



const MAX_ITEMS = 50;

const https = require('https');
const fs = require('fs');
const TeleBot = require('telebot');

let caching = false;


/**
 * Search for a keyword in the ygoprodeck database
 */
function search(keyword) {

    console.log("search for " + keyword);

    return new Promise((resolve, reject) => {

        let query = '?fname=' + keyword;
        let url = API_URL + query;

        let req = https.get(url, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                resolve(JSON.parse(body));
            });
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
    return fs.readFileSync('TOKEN', 'utf8').toString().trim();
}


function main() {
    // Init bot
    const token = readToken();
    const bot = new TeleBot(token);

    // Start polling to accept commands
    bot.start();

    bot.getMe().then((data) => console.log("I am @" + data.username));

    // Simple greeting
    bot.on(['/start', '/hello'], (msg) => {
        console.log(msg.from);

        msg.reply.text('Welcome! Use the inline function to find cards!');
    });


    bot.on(['/forcecacheoff'], (msg) => {
        caching = false;
        msg.reply.text('Force-caching is now off');
    });

    bot.on(['/forcecacheon'], (msg) => {
        caching = true;
        msg.reply.text('Force-caching is now on');
    });


    // If used like @ygowikibot <query>
    bot.on('inlineQuery', (msg) => {

        console.log("issa query: ", msg.query);

        // Create a new answer list object
        const answers = bot.answerList(msg.id, {
            cacheTime: 1,
            cache_time: 1,
            isPersonal: true,
            is_personal: true,
        });

        // Search for the given query
        let query = msg.query;

        return search(query).then((response) => {

            // Don't continue if no response was given
            if (!(Array.isArray(response) && response.length > 0)) {
                return;
            }

            const items = response[0];

            // Show at most 10 items
            let length = Math.min(MAX_ITEMS, items.length);

            for (let i = 0; i < length; i++) {

                // Extract fields from item
                let cur = items[i];
                let id = cur.id;
                let filename = id + '.jpg';

                let urlsuffix = caching ? '?_=' + (+new Date()) : '';

                let url = PIC_URL + filename + urlsuffix;
                let small_url = PIC_SMALL_URL + filename + urlsuffix;

                let name = cur.name;
                let type = cur.type;
                let race = cur.race;
                let desc = cur.desc;
                let ban_tcg = cur.ban_tcg;
                caption = name + '\n' + race + ' / ' + type + '\n\n' + desc + '\n\n' + 'Ban status: ';
                caption += ban_tcg ? ban_tcg : 'Unlimited';

                // Generate photo object and prepare to get send
                answers.addPhoto({
                    id: id,
                    caption: caption,
                    photo_url: url,
                    thumb_url: small_url,
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
