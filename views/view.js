
const qrcode = require('qrcode-terminal');

class View {
    constructor(socket) {
        this.socket = socket;
    }

    displayMessage(message) {
        this.socket.emit('message', message);
    }

    displayQRCode(qrCodeData) {
        qrcode.generate(qrCodeData.qrCode, { small: true });
        
        this.socket.emit('qrCode', qrCodeData);
    }

    displayReadyMessage(message) {
        this.socket.emit('ready', message);
    }

    displayAuthenticatedMessage(message) {
        this.socket.emit('authenticated', message);
    }
}

module.exports = View;
