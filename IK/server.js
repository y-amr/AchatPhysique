const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const buyIKrequest = require('./main_IK');
const fs = require('fs');

app.use(bodyParser.json());

app.post('/api/buyIKrequest', async (req, res) => {
    try {
        const currentHour = new Date();

        buyIKrequest(currentHour); // ici on passe le body de la requête en paramètres à runPuppeteer
        res.send('runPuppeteer a été exécuté');
    } catch (err) {
        res.status(500).send(err.toString());
    }
});

app.post('/api/logs', (req, res) => {
    try {
        const logFile = fs.readFileSync('./log.txt', 'utf8');
        const logLines = logFile.split('\n');
        const linesToShow = req.query.lines || 15; // use query parameter instead of body parameter
        const lastLines = logLines.slice(-linesToShow);
        const response = lastLines.join('\n');
        res.send(response);
    } catch (err) {
        res.status(500).send(err.toString());
    }
});
app.listen(3000, () => {
    console.log('Server écoute sur le port 3000');
});