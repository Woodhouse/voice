'use strict';

const path = require(`path`);
const player = require('play-sound')({});
const Sonus = require(`sonus`);
const speech = require(`@google-cloud/speech`)({
        projectId: `woodhouse-bot`,
        keyFilename: path.join(__dirname, `..`, `keyfile.json`)
    });

class listener {
    constructor(api, speech) {
        this.api = api;
        this.speech = speech;
    }

    init() {
        console.log(`Initialising voice recognition`)
        const sonus = Sonus.init({
            hotwords: [
                {
                    file: path.join(__dirname, `..`, `hotword.pmdl`),
                    hotword: `woodhouse`
                }
            ],
            language: `en-GB`
        }, speech);

        Sonus.start(sonus);

        sonus.on(`hotword`, (index, keyword) => {
            player.play(path.join(__dirname, `..`, `sounds`, `hotword.mp3`));
        });

        sonus.on(`final-result`, (result) => {
            player.play(path.join(__dirname, `..`, `sounds`, `success.mp3`), () => {
                this.api.sendRequest(result).then((reply) => {
                    this.speech.speak(reply);
                });
            });
        });
    }
};

module.exports = listener;
