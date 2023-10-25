const express = require('express')
const app = express()
const port = 3000
const axios = require('axios')
const {XMLParser} = require('fast-xml-parser')
const {decode} = require('metar-decoder')
const {createClient} = require('redis')
const {StatsD} = require('hot-shots')

const statsd = new StatsD({
    host: 'graphite',
    port: 8125,
    errorHandler: (error) => { console.log(error) } 
})

const redisClient = createClient({ url: 'redis://redis', port: 6379 })
    .on('error', err => console.log('Redis Client Error', err));

(async () => {
    await redisClient.connect();
    console.log('Connected to Redis');
})();

process.on('SIGTERM', async () => {
    await redisClient.quit();
})

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

app.get('/ping', async (req, res) => {
    const startTime = Date.now();
    res.send('Pong!');
    statsd.gauge('customMetric.ping', Date.now() - startTime);
})

app.get('/metar', async (req, res) => {
    const startTime = Date.now();
    try {
        const parser = new XMLParser();
        const stationCode = req.query.station;

        if (!stationCode)
            return res.status(400).send("Especifique el aeródromo con ?station={code}");

        const url = `https://aviationweather.gov/cgi-bin/data/metar.php?ids=${stationCode}&hours=0&format=xml&stationString=&hoursBeforeNow=1`;

        let response, decodedMetar;

        if (req.query.redis) {
            
            decodedMetar = await redisClient.get(stationCode);

            if (decodedMetar == null || decodedMetar == undefined) {

                const startRequestTime = Date.now();
                response = await axios.get(url);
                statsd.gauge('customMetric.metar_time_request', Date.now() - startRequestTime);

                //Convertimos el XML obtenido a JSON, por conveniencia
                xml = parser.parse(response.data);

                //Decodificamos el METAR
                decodedMetar = decode(xml.response.data.METAR.raw_text);
                
                await redisClient.set(stationCode, JSON.stringify(decodedMetar), {EX: 3});
            }

        } else {
            const startRequestTime = Date.now();
            response = await axios.get(url);
            statsd.gauge('customMetric.metar_time_request', Date.now() - startRequestTime);

            //Convertimos el XML obtenido a JSON, por conveniencia
            xml = parser.parse(response.data);
    
            //Decodificamos el METAR
            decodedMetar = decode(xml.response.data.METAR.raw_text);
        }

        res.send(decodedMetar);

    } catch (error) {
        res.status(500).send('Error al obtener datos');
    } finally {
        statsd.gauge('customMetric.metar', Date.now() - startTime);
    }
})

app.get('/spaceflight_news', async (req, res) => {
    const startTime = Date.now();
    try {
        let response, titles;

        const url = 'https://api.spaceflightnewsapi.net/v3/articles?_limit=5'

        if (req.query.redis) {
            
            titles = await redisClient.get('spaceflight_news');
            
            if (titles == null || titles == undefined) {
            
                const startRequestTime = Date.now();
                response = await axios.get(url);
                statsd.gauge('customMetric.spaceflight_news_time_request', Date.now() - startRequestTime);

                titles = response.data.map(item => item.title);
                await redisClient.set('spaceflight_news', JSON.stringify(titles), {EX: 5});
            
            }

        } else {
            const startRequestTime = Date.now();
            response = await axios.get(url);
            statsd.gauge('customMetric.spaceflight_news_time_request', Date.now() - startRequestTime);
            titles = response.data.map(item => item.title);
        }
        
        res.send(titles);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener datos');
    } finally {
        statsd.gauge('customMetric.spaceflight_news', Date.now() - startTime);
    }
})

app.get('/quote', async (req, res) => {
    const startTime = Date.now();
    try {

        const startRequestTime = Date.now();
        const response = await axios.get('https://api.quotable.io/random');
        statsd.gauge('customMetric.quote_time_request', Date.now() - startRequestTime);

        res.send({
            'content': response.data.content,
            'author': response.data.author
        })
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener datos');
    } finally {
        statsd.gauge('customMetric.quote', Date.now() - startTime);
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})