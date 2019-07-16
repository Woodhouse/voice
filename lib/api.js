"use strict";

const https = require(`https`);
const bluebird = require(`bluebird`);
const path = require(`path`);
const fs = bluebird.promisifyAll(require(`fs`));
const evilDns = require(`evil-dns`);
const concat = require(`concat-stream`);
const config = require(path.join(__dirname, `..`, `config.json`));

let ca;
let key;
let cert;
let coreInstance;

bluebird
  .all([
    fs.readFileAsync(path.join(__dirname, `..`, `certs`, `root-ca.crt.pem`), {
      encoding: `UTF8`
    }),
    fs.readFileAsync(path.join(__dirname, `..`, `certs`, `client.key.pem`), {
      encoding: `UTF8`
    }),
    fs.readFileAsync(path.join(__dirname, `..`, `certs`, `client.crt.pem`), {
      encoding: `UTF8`
    })
  ])
  .then(files => {
    [ca, key, cert] = files;
  });

class api {
  sendRequest(message) {
    return new bluebird((resolve, reject) => {
      const request = https.request(
        {
          host: coreInstance.hostname,
          port: coreInstance.port,
          path: `/`,
          method: `POST`,
          ca: ca,
          key: key,
          cert: cert,
          headers: {
            "x-auth-key": config.apiKey
          }
        },
        function(response) {
          response.pipe(
            concat(body => {
              resolve(body.toString("UTF8"));
            })
          );
        }
      );

      request.write(`${coreInstance.name} ${message}`);
      request.end();
    });
  }

  setProperties({ ip, apiPort, domain, name, id }) {
    coreInstance = {
      hostname: `${id}.${domain}`,
      port: apiPort,
      ip,
      name
    };

    evilDns.add(coreInstance.hostname, ip);
  }
}

module.exports = api;
