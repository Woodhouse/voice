'use strict';

const say = require(`say`);

class speech {
    speak(message) {
        say.speak(message);
    }
}

module.exports = speech;
