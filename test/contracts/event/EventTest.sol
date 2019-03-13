pragma solidity ^0.4.24;

contract EventTest {
  event ExampleEvent(uint indexed first, uint indexed second);

  function triggerEvent(uint _first, uint _second) public {
    emit ExampleEvent(_first, _second);
  }
}