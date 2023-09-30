const express = require('express')
const app = express()
const port = 3000
const axios = require('axios')
const {XMLParser} = require('fast-xml-parser')
const {decode} = require('metar-decoder')
const {createClient} = require('redis')

const redisClient = createClient({ url: 'redis://redis', port: 6379 })
    .on('error', err => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
})();

process.on('SIGTERM', async () => {
    await redisClient.quit();
})

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

        if (!stationCode)
            return res.status(400).send("Especifique el aeródromo con ?station={code}");

        const url = `https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=${stationCode}&hoursBeforeNow=1`;

        let response, decodedMetar;

        if (req.query.redis) {
            
            decodedMetar = await redisClient.get(stationCode);

            if (decodedMetar == null || decodedMetar == undefined) {

                response = await axios.get(url);

                //Convertimos el XML obtenido a JSON, por conveniencia
                xml = parser.parse(response.data);

                //Decodificamos el METAR
                decodedMetar = decode(xml.response.data.METAR.raw_text);
                
                await redisClient.set(stationCode, JSON.stringify(decodedMetar));
            }

        } else {
            response = await axios.get(url);
            //Convertimos el XML obtenido a JSON, por conveniencia
            xml = parser.parse(response.data);
    
            //Decodificamos el METAR
            decodedMetar = decode(xml.response.data.METAR.raw_text);
        }

        res.send(decodedMetar);

    } catch (error) {
        res.status(500).send('Error al obtener datos');
    }
})


app.get('/spaceflight_news', async (req, res) => {
    try {
        let titles;

        if (req.query.redis) {
            
            titles = await redisClient.get('spaceflight_news');
            
            if (titles == null || titles == undefined) {
            
                const response = await axios.get('https://api.spaceflightnewsapi.net/v3/articles?_limit=5');
                titles = response.data.map(item => item.title);
                await redisClient.set('spaceflight_news', JSON.stringify(titles));
            
            }

        } else {
            const response = await axios.get('https://api.spaceflightnewsapi.net/v3/articles?_limit=5');
            titles = response.data.map(item => item.title);
        }
        
        res.send(titles);

    } catch (error) {
        console.error(error);
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

        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener datos');
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})