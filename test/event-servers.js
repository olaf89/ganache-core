const assert = require("assert");
const { compile } = require("./helpers/contract/compileAndDeploy");
const initializeTestServer = require("./helpers/web3/initializeTestServer");
/*
const solc = require("solc");

const source =
  "                      \n" +
  "pragma solidity ^0.4.24;            \n" +
  "contract instance {                \n" +
  "  event ExampleEvent(uint indexed first, uint indexed second);   \n" +
  "                                    \n" +
  "  function triggerEvent(uint _first, uint _second) public { \n" +
  "    emit ExampleEvent(_first, _second);      \n" +
  "  }                                 \n" +
  "}";
*/

const logger = { log: function(message) {} };
const provider = { name: "ganache", ws: true };
const providerOptions = { logger, ws: true };
initializeTestServer(tests, provider, providerOptions);

function tests(web3) {
  let context;

  describe("events", function() {
    before("Setup accounts then compile and deploy test contract", async function() {
      this.timeout(10000);
      const accounts = await web3.eth.getAccounts();

      const mainContractName = "EventTest";
      const contractFileNames = [];
      const contractSubdirectory = "event";

      context = await compile(mainContractName, contractFileNames, contractSubdirectory);

      const instance = new web3.eth.Contract(context.abi);
      Object.assign(context, { accounts, instance });
      /*
      const result = solc.compile(source, 1);

      const abi = JSON.parse(result.contracts[":instance"].interface);
      instance = new web3.eth.Contract(abi);
      bytecode = "0x" + result.contracts[":instance"].bytecode;
      */
    });

    before(async function() {
      const { accounts, bytecode, instance } = context;
      await instance.deploy({ data: bytecode }).send({ from: accounts[0], gas: 3141592 });
    });

    it("should handle events properly via the data event handler", function(done) {
      const { accounts, instance } = context;

      const expectedValue = "1";

      const event = instance.events.ExampleEvent({ filter: { first: expectedValue } });

      const listener = function(result) {
        assert.strictEqual(result.returnValues.first, expectedValue);
        done();
      };

      event.once("data", listener);
      event.once("error", (err) => done(err));

      instance.methods.triggerEvent(1, 6).send({ from: accounts[0], gas: 3141592 });
    });

    // NOTE! This test relies on the events triggered in the tests above.
    it("grabs events in the past", function(done) {
      const { accounts, instance } = context;
      const expectedValue = "2";

      const event = instance.events.ExampleEvent({ filter: { first: expectedValue }, fromBlock: 0 });

      const listener = function(result) {
        assert.strictEqual(result.returnValues.first, expectedValue);
        done();
      };

      event.once("data", listener);

      instance.methods.triggerEvent(2, 6).send({ from: accounts[0], gas: 3141592 });
    });

    /*
    // NOTE! This test relies on the events triggered in the tests above.
    it("accepts an array of topics as a filter", function(done) {
      const expectedValueA = 3;
      const expectedValueB = 4;

      const event = instance.events.ExampleEvent({ filter: { first: [expectedValueA, expectedValueB] }, fromBlock: 0 });

      const waitingFor = {};
      waitingFor[expectedValueA] = true;
      waitingFor[expectedValueB] = true;

      const listener = function(result) {
        assert(waitingFor.hasOwnProperty(result.returnValues.first));
        delete waitingFor[result.returnValues.first];

        if (Object.keys(waitingFor).length === 0) {
          event.removeAllListeners();
          done();
        }
      };

      event.on("data", listener);

      event.once("error", (err) => {
        event.removeAllListeners();
        done(err);
      });

      instance.methods
        .triggerEvent(expectedValueA, 6)
        .send({ from: accounts[0], gas: 3141592 })
        .then((result) => {
          return instance.methods.triggerEvent(expectedValueB, 7).send({ from: accounts[0], gas: 3141592 });
        });
    });

    it("only returns logs for the expected address", function(done) {
      this.timeout(10000);
      const { bytecode, contract } = context;
      const expectedValue = "1";

      contract.deploy({ data: bytecode })
        .send({ from: accounts[0], gas: 3141592 })
        .then((newInstance) => {
          // TODO: ugly workaround - not sure why this is necessary.
          if (!newInstance._requestManager.provider) {
            newInstance._requestManager.setProvider(web3.eth._provider);
          }

          const event = newInstance.events.ExampleEvent({ filter: { first: expectedValue }, fromBlock: 0 });

          event.on("data", function(result) {
            assert(result.returnValues.first === expectedValue);
            // event.removeAllListeners()
            done();
          });

          instance.methods
            .triggerEvent(5, 6)
            .send({ from: accounts[0], gas: 3141592 })
            .then(() => {
              newInstance.methods.triggerEvent(expectedValue, 6).send({ from: accounts[0], gas: 3141592 });
            });
        });
    });

    // NOTE! This test relies on the events triggered in the tests above.
    it("should return logs with correctly formatted logIndex and transactionIndex", function(done) {
      const provider = web3.currentProvider;

      provider.send(
        {
          jsonrpc: "2.0",
          method: "eth_getLogs",
          params: [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              topics: [
                "0xc54307031d9aa93e0568c363be84a9400dce343fef6a2851d55662a6af1a29da",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000000000000000000000000000006"
              ]
            }
          ],
          id: new Date().getTime()
        },
        function(err, result) {
          if (err) {
            return done(err);
          }
          const logIndex = result.result[0].logIndex;
          const transactionIndex = result.result[0].transactionIndex;
          assert.strictEqual(logIndex, "0x0");
          assert.strictEqual(transactionIndex, "0x0");
          done();
        }
      );
    });

    it("always returns a change for every new block subscription when instamining", function(done) {
      const provider = web3.currentProvider;

      provider.send(
        {
          jsonrpc: "2.0",
          method: "eth_subscribe",
          params: ["newHeads"],
          id: new Date().getTime()
        },
        function(err, result) {
          if (err) {
            return done(err);
          }

          let listener = function(err, result) {
            if (result === undefined) {
              // If there's only one argument, it's the result, not an error
              result = err;
            } else if (err) {
              return done(err);
            }
            let firstChanges = result.params.result.hash;
            assert.strictEqual(firstChanges.length, 66); // Ensure we have a hash
            provider.removeAllListeners("data");
            done();
          };

          // can't use `once` here because Web3WsProvider only has `on` :-(
          provider.on("data", listener);

          web3.currentProvider.send(
            {
              jsonrpc: "2.0",
              method: "evm_mine",
              id: new Date().getTime()
            },
            function(err) {
              if (err) {
                done(err);
              }
            }
          );
        }
      );
    });

    // NOTE! This test relies on the events triggered in the tests above.
    it("ensures topics are respected in past events, using `event.get()` (exclusive)", function(done) {
      const unexpectedValue = 1337;
      const event = instance.events.ExampleEvent({ filter: { first: unexpectedValue }, fromBlock: 0 });

      // There should be no logs because we provided a different number.
      const listener = function(result) {
        assert.fail("Event should not have fired");
      };

      event.once("data", listener);

      instance.methods
        .triggerEvent(6, 6)
        .send({ from: accounts[0], gas: 3141592 })
        .then(() => {
          // have to finish somehow...
          setTimeout(() => {
            event.removeAllListeners();
            done();
          }, 250);
        });
    });

    // TODO: web3 1.0 drops fromBlock on a subscription request - stop skipping this when that is fixed
    it.skip("will not fire if logs are requested when fromBlock doesn't exist", function(done) {
      const event = instance.events.ExampleEvent({ fromBlock: 100000 });

      // fromBlock doesn't exist, hence no logs
      const listener = function(result) {
        assert.fail("Event should not have fired");
      };

      event.on("data", listener);

      instance.methods
        .triggerEvent(8, 6)
        .send({ from: accounts[0], gas: 3141592 })
        .then(() => {
          // have to finish somehow...
          setTimeout(() => {
            event.removeAllListeners();
            done();
          }, 250);
        });
    });
  */
  });
}
