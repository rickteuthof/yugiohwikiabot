ROOT_URL = 'https://yugioh.wikia.com/'
var DEBUG = console.log

function capitalizeWord(word) {
    word = word.toLowerCase();
    var capitalised = word.charAt(0).toUpperCase() + word.slice(1)
    filterlist = [
        'the',
        'of'
    ]
    if (filterlist.indexOf(word) == -1) {
        return capitalised
    } else {
        return word
    }
}

function parseMsg(text) {
    text = text.toLowerCase()
    text = text.replace('blue eyes', 'Blue-Eyes')
    text = text.replace('odd eyes', 'Odd-Eyes')
    text = text.replace('azure eyes', 'Azure-Eyes')
    text = text.replace('galaxy eyes', 'Galaxy-Eyes')
    text = text.replace('red eyes', 'Red-Eyes')
    text = text.split(' ').map(capitalizeWord).join('_')
    return text
}

function getFile(data) {
    if (data.query == undefined) {
        return undefined
    }
    var images = Object.values(data.query.pages)[0].images
    if (images == undefined) {
        return undefined
    }
    for (var i = 0; i < images.length; i++) {
        var title = images[i].title
        if (!filterTitle(title)) {
            return title
        }
    }
}

function filterTitle(title) {
    filterList = [
        "File:Ambox notice.png",
        "File:CG Star.svg",
        "File:Rank Star.svg",
        "File:Pendulum Scale.png",
        "File:Continuous.svg",
        "File:Counter.svg",
        "File:WATER.svg",
        "File:EARTH.svg",
        "File:FIRE.svg",
        "File:WIND.svg",
        "File:DARK.svg",
        "File:LIGHT.svg",
        "File:DIVINE.svg"
    ]
    return filterList.indexOf(title) != -1
}

function getUrl(card, callback) {
    const https = require('https')
    query = 'action=query&prop=images&format=json&titles=' + card
    url = ROOT_URL + 'api.php?' + query
    https.get(url, function (res) {
        var body = ''
        res.on('data', function (chunk) {
            body += chunk
        })
        res.on('end', function () {
            json = JSON.parse(body)
            file = getFile(json)
            if (file != undefined) {
                var newUrl = ROOT_URL + file
                callback(newUrl)
            } else {
                callback(undefined)
            }
        })
    }).on('error', function (e) {
        console.log("Got an error: ", e)
    })
}

function readToken() {
    var fs = require('fs');
    var contents = fs.readFileSync('TOKEN', 'utf8');
    console.log(contents);
    return contents
}

function main() {
    const TeleBot = require('telebot');
    const token = readToken()
    const bot = new TeleBot(token);
    bot.start();
    bot.on(['/start', '/hello'], (msg) =>
        msg.reply.text('Welcome! Use /card <card name> to find cards!'));

    bot.on(/^\/card (.+)$/, (msg, props) => {
        const text = props.match[1];
        const chatId = msg.chat.id
        var card = parseMsg(text)
        getUrl(card, (response) => {
            if (response != undefined) {
                bot.sendMessage(chatId, response)
            } else {
                bot.sendMessage(chatId, "No url found.")
            }
        })
    });

    bot.on('inlineQuery', msg => {

        let query = msg.query;
        var card = parseMsg(query)
        console.log(card)
        // Create a new answer list object
        const answers = bot.answerList(msg.id, { cacheTime: 1 });
        getUrl(card, (response) => {
            if (response != undefined) {
                answers.addPhoto({
                    id: 'photo',
                    caption: card,
                    photo_url: response,
                    thumb_url: response
                });
                return bot.answerQuery(answers);
            }
        })
    });
}

main()