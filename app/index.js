const express = require('express')
const app = express()
const port = 3000
const axios = require('axios')

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/ping', (req, res) => {
    res.send('Pong!')
})

app.get('/metar', (req, res) => {
    res.send('Metar')
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