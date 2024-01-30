
const axios = require('axios');


class Model {
    constructor(bearerToken, config) {
        this.bearerToken = bearerToken;
        this.config = config;
    }

    async sendMessage(text) {
        const headers = {
            Authorization: `Bearer ${this.bearerToken}`,
        };

        const jsonData = {
            type: 'text',
            text: text,
            includedContexts: ['global'],
            metadata: {},
        };

        try {
            const response = await axios.post(this.apiUrl, jsonData, { headers });
            return response.data.responses;
        } catch (error) {
            console.error('Error sending message to API:', error.message);
            throw error;
        }
    }
}


module.exports = Model;