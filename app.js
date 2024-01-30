
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Controller = require('./controllers/controller.js');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const loginUrl = 'https://chatbots.tumela.shop/api/v1/auth/login/basic/default';
const loginData = {
    email: 'josphatndhlovu362@gmail.com',
    password: 'MyPassword12*',
};

const controller = new Controller(io, loginUrl, loginData);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
