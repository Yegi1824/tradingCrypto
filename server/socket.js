const axios = require('axios');
const WebSocket = require('ws');
const klineDataCache = new Map();

function initSocketIO(server) {
    const io = require('socket.io')(server);
    const connections = new Map();

    // Настройка сокета для обмена данными между сервером и клиентом
    io.on('connection', (socket) => {
        console.log('Клиент подключен');

        socket.on('changeSymbol', ({symbol, interval, priceChange}) => {
            // Закрываем предыдущий websocket, если он существует
            if (connections.has(socket.id)) {
                const prevWs = connections.get(socket.id);
                prevWs.on('close', () => {
                    // Создаем новый websocket после закрытия предыдущего
                    setTimeout(() => {
                        const startTime = new Date().getTime();
                        previousClosePrice = null;
                        // Создаем новый websocket после закрытия предыдущего
                        const realtimeWs = subscribeToRealtimeData(socket, symbol, interval, startTime, priceChange);
                        connections.set(socket.id, realtimeWs);
                    }, 500); // Увеличьте задержку, например, до 500 мс
                });
                prevWs.terminate(); // Замените метод close() на terminate()
            } else {
                setTimeout(() => {
                    const startTime = new Date().getTime();
                    previousClosePrice = null;
                    // Создаем новый websocket после закрытия предыдущего
                    const realtimeWs = subscribeToRealtimeData(socket, symbol, interval, startTime, priceChange);
                    connections.set(socket.id, realtimeWs);
                }, 500); // Увеличьте задержку, например, до 500 мс
            }
        });


        socket.on("requestData", async ({symbol, interval, priceChange}) => {
            console.log('priceChange-->', priceChange)
            const historicalData = await fetchBinanceData(symbol, interval);
            const manipulatedData = manipulateData(historicalData, symbol, priceChange);
            socket.emit("chartData", manipulatedData);
            socket.prevCandleClose = manipulatedData[manipulatedData.length - 1][4];
            socket.priceChangeStartTime = new Date().getTime();

            // Закрываем предыдущий websocket, если он существует
            if (connections.has(socket.id)) {
                const prevWs = connections.get(socket.id);
                prevWs.on('close', () => {
                    const startTime = new Date().getTime();
                    previousClosePrice = null;
                    // Создаем новый websocket после закрытия предыдущего
                    const realtimeWs = subscribeToRealtimeData(socket, symbol, interval, startTime, priceChange);
                    connections.set(socket.id, realtimeWs);
                });
                prevWs.terminate(); // Замените метод close() на terminate()
            } else {
                const startTime = new Date().getTime();
                previousClosePrice = null;
                const realtimeWs = subscribeToRealtimeData(socket, symbol, interval, startTime, priceChange);
                connections.set(socket.id, realtimeWs);
            }
        });


        socket.on('disconnect', () => {
            console.log('Клиент отключен');

            // Закрываем WebSocket при отключении клиента
            if (connections.has(socket.id)) {
                const ws = connections.get(socket.id);
                ws.close();
                connections.delete(socket.id);
            }
        });
    });

    return io;
}

function getPriceChangeFactor(startTime, duration, initialPriceChange) {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - startTime;
    if (elapsedTime >= 2 * duration) {
        console.log(1, 0)
        return 0;
    } else if (elapsedTime <= duration) {
        console.log(2, (elapsedTime / duration) * initialPriceChange)
        return (elapsedTime / duration) * initialPriceChange;
    } else {
        console.log(3, initialPriceChange - ((elapsedTime - duration) / duration) * initialPriceChange)
        return initialPriceChange - ((elapsedTime - duration) / duration) * initialPriceChange;
    }
}

let previousClosePrice = null;

function handleMessage(socket, message, symbol, startTime, duration, initialPriceChange) { //Вариант, в котором свочи правильно отображаются после закрытия
    const parsedMessage = JSON.parse(message);
    const klineData = parsedMessage.k;

    const priceChangeFactor = getPriceChangeFactor(startTime, duration, initialPriceChange);

    if (symbol === 'BTCUSDT') {
        const closePrice = parseFloat(klineData.c);
        const newClosePrice = closePrice * (1 + priceChangeFactor);
        klineData.c = newClosePrice.toFixed(8);

        if (klineData.x) {
            if (previousClosePrice !== null) {
                klineData.o = previousClosePrice.toFixed(8);
            }
            previousClosePrice = newClosePrice;
        } else {
            const openPrice = parseFloat(klineData.o);
            const newOpenPrice = openPrice * (1 + priceChangeFactor);
            klineData.o = newOpenPrice.toFixed(8);
        }

        // Рассчитываем новые значения для фитиля свечи
        const highPrice = parseFloat(klineData.h);
        const newHighPrice = highPrice * (1 + priceChangeFactor);
        klineData.h = newHighPrice.toFixed(8);

        const lowPrice = parseFloat(klineData.l);
        const newLowPrice = lowPrice * (1 + priceChangeFactor);
        klineData.l = newLowPrice.toFixed(8);
    }

    klineDataCache.set(symbol, klineData);
    socket.emit('realtimeData', klineData);
}

/*function handleMessage(socket, message, symbol, startTime, duration, initialPriceChange) {
    const parsedMessage = JSON.parse(message);
    const klineData = parsedMessage.k;
    console.log('klineData', klineData)

    const priceChangeFactor = getPriceChangeFactor(startTime, duration, initialPriceChange);

    if (symbol === 'BTCUSDT') {
        const closePrice = parseFloat(klineData.c);
        const newClosePrice = closePrice * (1 + priceChangeFactor);
        klineData.c = newClosePrice.toFixed(8);

        if (!socket.previousClosePrice) {
            socket.previousClosePrice = parseFloat(klineData.o);
        }

        const openPrice = socket.previousClosePrice;
        const newOpenPrice = openPrice * (1 + priceChangeFactor);
        klineData.o = newOpenPrice.toFixed(8);

        if (klineData.x) {
            socket.previousClosePrice = newClosePrice;
        }

        const highPrice = parseFloat(klineData.h);
        const newHighPrice = highPrice * (1 + priceChangeFactor);
        klineData.h = newHighPrice.toFixed(8);

        /!*const lowPrice = parseFloat(klineData.l);
        const newLowPrice = lowPrice * (1 + priceChangeFactor);*!/
        klineData.l = socket.previousClosePrice.toFixed(8);
    }

    socket.emit('realtimeData', klineData);
}*/

function subscribeToRealtimeData(socket, symbol, interval, startTime, initialPriceChange) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log(`WebSocket opened for ${symbol} @ ${interval}`);
    });

    const duration = 2 * 60 * 1000; // 5 минут в миллисекундах
    ws.on('message', (message) => {
        handleMessage(socket, message, symbol, startTime, duration, initialPriceChange);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${symbol} @ ${interval}:`, error);
    });

    return ws;
}


async function fetchBinanceData(symbol, interval) {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
            symbol,
            interval,
        },
    });

    return response.data;
}

function manipulateData(data, symbol, priceChange) {
    let adjustedClosePrices = [];

    return data.map((candle, index) => {
        const closePrice = parseFloat(candle[4]);
        const newClosePrice = closePrice * (1 + priceChange);

        adjustedClosePrices[index] = newClosePrice.toFixed(8);

        if (index > 0) {
            candle[1] = adjustedClosePrices[index - 1];
        }

        candle[4] = adjustedClosePrices[index];
        return candle;
    });
}


function lerp(start, end, factor) {
    return start + factor * (end - start);
}

// Экспортируем функцию initSocketIO, которая будет вызвана в index.js с сервером в качестве аргумента
module.exports = initSocketIO;
