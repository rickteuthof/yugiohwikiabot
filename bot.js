function capitalizeWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

function parseMsg(json) {
    text = json.text
    return text.split(' ').map(capitalizeWord).join(' ').replace(/ /g, '_')
}

function getFile(data) {
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
    const http = require('http')
    query = 'action=query&prop=images&format=json&titles=' + card
    mainUrl = 'http://yugioh.wikia.com/'
    url = mainUrl + 'api.php?' + query
    http.get(url, function (res) {
        var body = ''
        res.on('data', function (chunk) {
            body += chunk
        })
        res.on('end', function () {
            json = JSON.parse(body)
            file = getFile(json)
            if (file != undefined) {
                var newUrl = mainUrl + file
                callback(newUrl)
            } else {
                callback(undefined)
            }
        })
    }).on('error', function (e) {
        console.log("Got an error: ", e)
    })
}
function main() {
    const TelegramBot = require('node-telegram-bot-api')
    const token = '738257035:AAHiT2x1zpybzKU091qCdGUXeuW4FF0PPmI'
    const bot = new TelegramBot(token, { polling: true })

    bot.onText(/\/echo (.+)/, (msg, match) => {
        const chatId = msg.chat.id
        const resp = match[1]
        bot.sendMessage(chatId, resp)
    })

    bot.on('message', (msg) => {
        try {
            const chatId = msg.chat.id
            var card = parseMsg(msg)
            getUrl(card, (response) => {
                if (response != undefined) {
                    bot.sendMessage(chatId, response)
                } else {
                    bot.sendMessage(chatId, "No url found.")
                }
            })
        } catch (err) {
            console.log("Got an error: ", e)
        }
    })
}

main()