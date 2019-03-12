const Ganache = require(process.env.TEST_BUILD
  ? "../../../build/ganache.core." + process.env.TEST_BUILD + ".js"
  : "../../../index.js");
const Web3 = require("web3");
const Web3WsProvider = require("web3-providers-ws");

const intiailizeTestServer = (tests, provider = { name: "ganache", ws: true }, providerOptions = {}, port = 12345) => {
  describe("Server:", function() {
    const web3 = new Web3();
    let server;

    before("Initialize Ganache server", function(done) {
      switch (provider) {
        case "geth":
          server.listen(port, function() {
            web3.setProvider(new Web3.providers.HttpProvider("http://localhost:9711"));
            done();
          });
          break;
        case "parity":
          server.listen(port, function() {
            web3.setProvider(new Web3.providers.HttpProvider("http://localhost:9731"));
            done();
          });
          break;
        default:
          server = Ganache.server(providerOptions);
          if (provider["ws"] === true) {
            server.listen(port, function() {
              web3.setProvider(new Web3WsProvider("ws://localhost:" + port));
              done();
            });
          }
          break;
      }
    });

    after("Shutdown server", function(done) {
      server.close(done);
    });

    tests(web3);
  });
};

module.exports = intiailizeTestServer;
