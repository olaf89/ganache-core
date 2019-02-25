const assert = require("assert");
const bootstrap = require("../helpers/contract/bootstrap");
const randomInteger = require("../helpers/utils/generateRandomInteger");

describe.skip("Specifying a sender gas limit greater than block gas limitations", function() {
  const SEED_RANGE = 1000000;
  let context;

  before("compile source", async function() {
    this.timeout(10000);

    const contractRef = {
      contractFiles: ["BlockGasLimit"],
      contractSubdirectory: "gas"
    };

    const seed = randomInteger(SEED_RANGE);
    const ganacheProviderOptions = {
      blockTime: 2,
      seed
    };

    context = await bootstrap(contractRef, ganacheProviderOptions);
  });

  const iterations = 10 ** 6;
  const clientGasLimit = 10 ** 8;

  it.only("should generate a block gas limit error when calling a 'view' function", async function() {
    const { instance, web3 } = context;

    const block = await web3.eth.getBlock("latest");

    assert(clientGasLimit > block.gasLimit);
    assert(clientGasLimit < Number.MAX_SAFE_INTEGER);

    // Attempt to run an expensive view function
    await instance.methods.expensiveOperation(iterations).call({ gas: clientGasLimit });
  });

  it("should generate a block gas limit error when calling a 'pure' function", async function() {
    const { instance, web3 } = context;

    const block = await web3.eth.getBlock("latest");

    assert(clientGasLimit > block.gasLimit);
    assert(clientGasLimit < Number.MAX_SAFE_INTEGER);

    // Attempt to run an expensive pure function
    await instance.methods.pureExpensiveOperation(iterations).call({ gas: clientGasLimit });
  });
});
