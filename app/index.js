const express = require('express')
const app = express()
const port = 3000
const axios = require('axios');
const {XMLParser} = require('fast-xml-parser');
const {decode} = require('metar-decoder');

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/ping', (req, res) => {
    res.send('Pong!')
})

app.get('/metar', async (req, res) => {
    try {
        const parser = new XMLParser();
        const stationCode = req.query.station;
        if(!stationCode)
            return res.status(400).send("Especifique el aeródromo con ?station={code}");

        const response = await axios.get(`https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${stationCode}&hoursBeforeNow=1`);
        //Convertimos el XML obtenido a JSON, por conveniencia
        const parsed = parser.parse(response.data);
        //Decodificamos el METAR
        const decodedMetar = decode(parsed.response.data.METAR.raw_text);

        res.send(decodedMetar)
    } catch (error) {
        res.status(500).send('Error al obtener datos');
    }
})

app.get('/spaceflight_news', async (req, res) => {
    try {
        const response = await axios.get('https://api.spaceflightnewsapi.net/v3/articles?_limit=5');
        const titles = response.data.map(item => item.title);
        res.send(titles)
    } catch (e) {
        console.error(e);
        res.status(500).send('Error al obtener datos');
    }
})

app.get('/quote', async (req, res) => {
    try {
        const response = await axios.get('https://api.quotable.io/random');

        res.send({
            'content': response.data.content,
            'author': response.data.author
        })
    } catch (e) {
        console.error(e);
        res.status(500).send('Error al obtener datos');
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})