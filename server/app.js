const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);
const { initSocketIO } = require('./socket'); // Импортируем функцию initSocketIO
const realtimeDataRoute = require('./routes/realtimeData'); // Импортируйте новый маршрут

// Инициализируем Socket.IO с переданным сервером
const io = initSocketIO(server);

// Используйте CORS middleware
app.use(cors());

// Middleware для обработки JSON-запросов
app.use(express.json());

// Middleware для обработки URL-кодированных запросов
app.use(express.urlencoded({ extended: false }));

app.use('/api/realtime', realtimeDataRoute);

// Экспортируем сервер, чтобы его можно было использовать в других файлах
module.exports = server;
