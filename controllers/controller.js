
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const Model = require('../models/model.js');
const View = require('../views/view.js');
const MessageController = require('./messageController.js');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
});


class Controller {
    constructor(io, loginUrl, loginData) {
        this.io = io;
        this.loginUrl = loginUrl;
        this.loginData = loginData;

        this.initialize();
    }

    async initialize() {
        // const client = new Client({
        //     authStrategy: new LocalAuth(),
        // });

        this.model = new Model('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Impvc3BoYXRuZGhsb3Z1MzYyQGdtYWlsLmNvbSIsInN0cmF0ZWd5IjoiZGVmYXVsdCIsInRva2VuVmVyc2lvbiI6MSwiaXNTdXBlckFkbWluIjpmYWxzZSwiaWF0IjoxNzA1MjQ0MTM3LCJleHAiOjE3MDUyNDc3MzcsImF1ZCI6ImNvbGxhYm9yYXRvcnMifQ.Kbmf8kQH086VwOzCikpTRtBZOkBi81emJUOS1H_-n14', require('../src/config/config.json'));
        this.view = new View(this.io);
        this.messageController = new MessageController(
            this.model,
            null,
            this.markAsRead.bind(this),
            this.replyMessage.bind(this)
        );

        this.io.on('connection', (socket) => {
            console.log('Socket Connected');
            this.view.displayMessage('Geenerating QR Code soon!');
            this.generateAndEmitQRCode(socket);

            socket.on('disconnect', () => {
                console.log('Socket Disconnected');
            });
        });

        client.on('ready', () => {
            console.log('Client is ready!');
            this.view.displayReadyMessage('Verrification Done, Whatsapp Synced Successuly');
        });

        client.on('authenticated', async (session) => {
            console.log('Verrification Done, Whatsapp Synced Successuly');
        });

        client.on('message', (message) => {
            this.messageController.message = message;
            this.messageController.handleIncomingMessage();
        });

        client.initialize();
    }

    async generateAndEmitQRCode(socket) {

        const qrCodeData = await this.generateQRCode();

        this.view.displayQRCode(qrCodeData);

    }

    async generateQRCode() {

        return new Promise((resolve) => {

            client.on('qr', (qrCode) => {

                console.log('QR Code generated :) Scan to connect on http://localhost:3000');
                resolve({ qrCode });
            });


        });
    }

    async loginAndFetchToken() {
        try {
            const loginResponse = await axios.post(this.loginUrl, this.loginData);
            return loginResponse.data.payload.jwt;
        } catch (error) {
            console.error('Error during login:', error.message);
            throw error;
        }
    }

    markAsRead() {
        if (this.messageController.message) {
            this.messageController.message.getChat().then((chat) => {
                chat.sendSeen();
            });
        }
    }

    async replyMessage(messageText) {
        if (this.messageController.message) {

            await client.sendMessage(this.messageController.message.from, messageText, { sendMediaAsDocument: true }).then((sentMessage) => {
            }).catch((error) => {
                console.error('Error sending message:', error.message);
            });
        }
    }
}

module.exports = Controller;
