const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/ping', (req, res) => {
    res.send('Pong!')
})

app.get('/metar', (req, res) => {
    res.send('Metar')
})

app.get('/spaceflight_news', (req, res) => {
    res.send('Spaceflight news')
})

app.get('/quote', (req, res) => {
    res.send('Quote')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})