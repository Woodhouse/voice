'use strict';

const path = require('path');
const apiClass = require(path.join(__dirname, `lib`, `api.js`));
const speechClass = require(path.join(__dirname, `lib`, `speech.js`));
const broadcastClass = require(path.join(__dirname, `lib`, `broadcast.js`));
const listenerClass = require(path.join(__dirname, `lib`, `listener.js`));

const api = new apiClass();
const speech = new speechClass();
const listener = new listenerClass(api, speech);
const broadcast = new broadcastClass(api, listener);

