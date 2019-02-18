const assert = require("assert");
const bootstrap = require("./helpers/contract/bootstrap");

// Thanks solc. At least this works!
// This removes solc's overzealous uncaughtException event handler.
process.removeAllListeners("uncaughtException");

describe("eth_call", () => {
  const mainContract = "EstimateGas";
  const contractFilenames = [];
  const contractPath = "../../contracts/call/";
  const options = {};

  const services = bootstrap(mainContract, contractFilenames, options, contractPath);

  it("should use the block gas limit if no gas limit is specified", async() => {
    const { accounts, instance } = services;

    const name = "0x54696d"; // Byte code for "Tim"
    const description = "0x4120677265617420677579"; // Byte code for "A great guy"
    const value = 5;
    const status = await instance.methods.add(name, description, value).call({ from: accounts[0] });

    // this call uses more than the default transaction gas limit and will
    // therefore fail if the block gas limit isn't used for calls
    assert.strictEqual(status, true);
  });
});
