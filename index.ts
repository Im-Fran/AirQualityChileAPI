import express from 'express'
import dotenv from 'dotenv'
import axios from 'axios'
import morgan from 'morgan'
import * as https from "https";
import * as cheerio from 'cheerio'

dotenv.config()

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
const app = express()
const port = process.env.PORT || '3000'
const cache: {
    [key: string]: {
        lastRequest: number,
        data?: any,
    }
} = {}

app.use(morgan('dev'))
app.get('/', async (req, res) => {
    cache.main = cache.main || {
        lastRequest: 0,
    }

    if((cache.main.lastRequest + 21600000) > new Date().getTime()){
        return res.status(200).json(cache.main.data)
    }

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

        cache.main = {
            lastRequest: new Date().getTime(),
            data: response,
        }
        res.status(200).json(response)
    } catch (error){
        console.debug({ error })
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.get('/medidas/:city', async (req, res) => {
    cache[req.params.city] = cache[req.params.city] || {
        lastRequest: 0,
    }

    if((cache[req.params.city].lastRequest + 21600000) > new Date().getTime()){
        return res.status(200).json(cache[req.params.city].data)
    }

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

        cache[req.params.city] = {
            lastRequest: new Date().getTime(),
            data: response,
        }
        res.status(200).json(response)
    } catch (error){
        console.debug({ error })
        res.status(500).json({ error: 'Internal server error' })
    }
});

app.listen(port, () => {
    console.log(`API listening on port ${port}`)
})
