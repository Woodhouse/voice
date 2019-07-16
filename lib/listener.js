"use strict";

const path = require(`path`);
const player = require("play-sound")({});
const Sonus = require(`sonus`);
const speech = require(`@google-cloud/speech`);
const client = new speech.SpeechClient({
  keyFilename: path.join(__dirname, `..`, `keyfile.json`)
});
const config = require("../config.json");

class listener {
  constructor(api, speech) {
    this.api = api;
    this.speech = speech;
  }

  init() {
    console.log(`Initialising voice recognition`);
    const sonus = Sonus.init(
      {
        hotwords: [
          {
            file: path.join(__dirname, `..`, `hotword.pmdl`),
            hotword: `hey woodhouse`
          }
        ],
        language: `en-GB`,
        recordProgram: "arecord",
        device: config.device
      },
      client
    );

    Sonus.start(sonus);

    sonus.on(`hotword`, (index, keyword) => {
      console.log("Hotword detected");
      player.play(path.join(__dirname, `..`, `sounds`, `hotword.mp3`));
    });

    sonus.on(`final-result`, result => {
      player.play(path.join(__dirname, `..`, `sounds`, `success.mp3`), () => {
        if (result === "" || result === "cancel") {
          console.log("Cancelling");
          return;
        }

        console.log(`Speech recognised: ${result}`);
        this.api.sendRequest(result).then(reply => {
          this.speech.speak(reply);
        });
      });
    });

    sonus.on(`error`, err => {
      console.error(err);
    });
  }
}

module.exports = listener;
