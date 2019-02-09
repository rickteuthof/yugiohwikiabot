const PIC_URL = 'https://ygoprodeck.com/pics/';
const PIC_SMALL_URL = 'https://ygoprodeck.com/pics_small/';

const PORT = 6401;

const express = require('express');
const download = require('download');
const moment = require('moment');
const fs = require('fs');
const path = require('path');



let app = express();


app.use((req, res, next) => {
    req.xip = req.headers['x-real-ip'];
    req.ua = req.headers['user-agent'] || '';

    console.log(moment().format("YYYY-MM-DD-HH-mm-ss"), req.xip, req.method, '"' + req.url + '"', '"' + req.ua + '"');
    next();
});


// Make sure no path traversal can happen
function safejoin() {
    let args = Array.from(arguments);

    let base = args.shift();
    return path.join.apply(null, [base].concat(args.map(path.normalize).map((x) => x.replace(/^(\.\.[\/\\])+/g, ''))));
}


function cache(dirs, urlbase) {
    if (!Array.isArray(dirs)) dirs = [dirs];

    return (req, res) => {

        let found = false;

        for (let dir of dirs) {
            let filename = path.resolve(safejoin(dir, req.params.filename));

            console.log("has file " + filename + " ?");
    
            if (fs.existsSync(filename)) {
                console.log("yes!");
    
                res.sendFile(filename);
                found = true;
                break;
            } else {
                console.log("no");
            }
        }

        if (!found) {
            let dir = dirs[0];
            let filename = path.resolve(safejoin(dir, req.params.filename));
    
            let url = urlbase + req.params.filename;
            console.log("download " + url + " to " + dir);
   
            let pre = moment();
            download(url, dir).then(() => {
                let post = moment();

                console.log("download " + url + " done after " + moment.duration(post.diff(pre)).as("seconds") + " seconds");
                res.sendFile(filename);
    
            }).catch((err) => {
                console.error(err);
    
                res.statusCode = 404;
                res.send("Failed to find: " + err);
            });
        }

    };
}


app.get('/pics/:filename', cache('dist/', PIC_URL));
app.get('/pics_small/:filename', cache(['dist/small/', 'dist/'], PIC_SMALL_URL));


app.get('/', (req, res) => {
    res.end("<h1>Nothing here</h1>");
});


app.listen(PORT, () => {
    console.log("Cache listening on port " + PORT);
});
