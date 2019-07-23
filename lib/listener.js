"use strict";

const path = require(`path`);
const player = require("play-sound")({});
const record = require("node-record-lpcm16");
const { Detector, Models } = require("snowboy");
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

    this.setupDetector();
    this.setupMic();
  }

  setupMic() {
    this.mic = record.start({
      threshold: 0,
      recordProgram: "arecord",
      device: config.device,
      sampleRateHertz: 16000
    });

    this.mic.on("error", err => {
      console.error("Mic error");
      console.error(err);
      this.mic.unpipe(this.detector);
      this.init();
    });

    this.mic.on("close", () => {
      this.setupMic();
    });

    this.mic.pipe(this.detector);
  }

  setupDetector() {
    const models = new Models();

    models.add({
      file: path.join(__dirname, `..`, `hotword.pmdl`),
      sensitivity: "0.5",
      hotword: `hey woodhouse`
    });

    this.detector = new Detector({
      resource: path.join(
        __dirname,
        "..",
        "node_modules",
        "snowboy",
        "resources",
        "common.res"
      ),
      models: models,
      audioGain: 2.0,
      applyFrontend: false
    });

    this.detector.on("hotword", () => {
      player.play(path.join(__dirname, `..`, `sounds`, `hotword.mp3`));
      this.mic.unpipe(this.detector);
      this.startStreamRecognizer();
    });

    this.detector.on("error", (error) => {
      console.error(error);
    });
  }

  startStreamRecognizer() {
    if (this.streamRecognizerListening) {
      return;
    }

    let hasResults = false;
    this.streamRecognizerListening = true;

    let timeout;

      const request = {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-GB"
        },
        singleUtterance: true,
        interimResults: true
      };

      const recognitionStream = client
        .streamingRecognize(request)
        .on("error", err => {
          console.error('Recognizer error');
          console.error(err);
          player.play(path.join(__dirname, `..`, `sounds`, `cancel.mp3`));
          endRecognitionStream();
        })
        .on("data", data => {
          if (data.results[0] && data.results[0].alternatives[0]) {
            hasResults = true;
            const result = data.results[0].alternatives[0].transcript;

            // Emit partial or final results and end the stream
            if (data.error) {
              player.play(path.join(__dirname, `..`, `sounds`, `cancel.mp3`));
              console.error(data.error)
              endRecognitionStream();
            } else if (data.results[0].isFinal) {
              if (result === "" || result === "cancel") {
                console.log("Cancelling");
                player.play(path.join(__dirname, `..`, `sounds`, `cancel.mp3`));
              } else {
                player.play(
                  path.join(__dirname, `..`, `sounds`, `success.mp3`),
                  () => {
                    console.log(`Speech recognised: ${result}`);
                    this.api.sendRequest(result).then(reply => {
                      this.speech.speak(reply);
                    });
                  }
                );
              }
              endRecognitionStream();
            } else {
              recognitionTimeout();
            }
          }
        });

        const recognitionTimeout = () => {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            player.play(path.join(__dirname, `..`, `sounds`, `cancel.mp3`));
            endRecognitionStream();
          }, 5000);
        }

        const endRecognitionStream = () => {
          clearTimeout(timeout);
          this.streamRecognizerListening = false;
          this.mic.unpipe(recognitionStream);
          this.mic.pipe(this.detector);
          recognitionStream.end();
        }

        this.mic.pipe(recognitionStream);
        recognitionTimeout();
  }
}

module.exports = listener;
