'use strict';

const dgram = require(`dgram`);
const path = require('path');
const bluebird = require(`bluebird`);
const config = require(path.join(__dirname, `..`, `config.json`));

class broadcast {
    constructor(api, listener) {
        this.api = api;
        this.listener = listener;

        this.socket = bluebird.promisifyAll(dgram.createSocket({
            type: 'udp4',
            reuseAddr: true
        }));

        this.socket.bindAsync(9600).then(() => {
            this.socket.setBroadcast(true);
        });

        this.socket.on('message', this.messageRecieved.bind(this));

        this.detectedCore = false;
    }

    messageRecieved(datagram) {
        datagram = datagram.toString();

        try {
            datagram = JSON.parse(datagram);

            if (typeof datagram !== 'object') {
                return;
            }
        } catch(e) {
            return;
        }

        if (datagram.source && datagram.source === 'woodhouse-core' && datagram.message.id === config.coreId) {
            this.api.setProperties(datagram.message);

            if (!this.detectedCore) {
                this.detectedCore = true;
                this.listener.init();
            }
        }
    }
};

module.exports = broadcast;
