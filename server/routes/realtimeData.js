const express = require('express');
const router = express.Router();
const axios = require('axios');
const { setPriceChange } = require('../socket.js');

router.get('/', async (req, res) => {
    const { symbol, timeframe } = req.query;

    try {
        const response = await axios.get('https://api.binance.com/api/v3/klines', {
            params: {
                symbol: symbol,
                interval: timeframe,
            },
        });

        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        res.status(500).send({ error: 'Error fetching historical data' });
    }
});

router.post('/priceChange', (req, res) => {
    const { priceChange } = req.body;
    console.log(123, priceChange)
    setPriceChange(priceChange);
    res.send({ message: 'Price change updated successfully' });
});

module.exports = router;
