const express = require('express');
const router = express.Router();
const axios = require('axios');

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

module.exports = router;
