import express from 'express'
import dotenv from 'dotenv'
import axios from 'axios'
import * as https from "https";
import * as cheerio from 'cheerio'

dotenv.config()

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
const app = express()
const port = process.env.PORT || '3000'

app.get('/', async (req, res) => {
    try {
        const { data } = await axios.get('https://airechile.mma.gob.cl', {
            httpsAgent
        })
        const $ = cheerio.load(data)
        const response: any[] = []


        $('#wrapper').find('div[class="col-md-3 col-sm-6 col-full"]').each((idx, it) => {
            response.push({
                status: $(it).find('.label').text(),
                city: {
                    id: `${$(it).find('a[class="container-city"]').attr('href')}`.replace('https://airechile.mma.gob.cl/comunas/', ''),
                    name: $(it).find('.city-image').attr('alt'),
                    image: $(it).find('.city-image').attr('src'),
                },
            })
        })
        
        res.status(200).json(response)
    } catch (error){
        console.debug({ error })
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/medidas/:city', async (req, res) => {
    try {
        const { city } = req.params
        const { data } = await axios.get(`https://airechile.mma.gob.cl/comunas/${city}`, {
            httpsAgent
        })
        const $ = cheerio.load(data)
        const response: any[] = []

        $('.panel-medidas > .panel-body > .list-block > ul > li').each((idx, li) => {
            response.push({
                icon: $(li).find('.icon').attr('src'),
                medida: $(li).find('.item-inner > p').text(),
            })
        });

        res.status(200).json(response)
    } catch (error){
        console.debug({ error })
        res.status(500).json({ error: 'Internal server error' })
    }
});

app.listen(port, () => {
    console.log(`API listening on port ${port}`)
})