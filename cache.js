PIC_URL = 'https://ygoprodeck.com/pics/'
const express = require('express')
let app = express()

app.on('/pics/:filename', (req, res) => {
    let filename = 'dist/' + req.params.filename;
    // todo prevent path traversal
    if (fs.fileExists(filename)) {
        res.sendFile(filename);
    } else {
        download(PIC_URL + req.params.filename, 'dist').then(() => {
            res.sendFile(filename);
        });
    }
});

app.listen(8080)