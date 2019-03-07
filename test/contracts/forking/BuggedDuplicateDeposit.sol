pragma solidity ^0.4.2;

library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }


    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
}

contract BuggedDuplicateDeposit {
    using SafeMath for uint;

    mapping(address => uint256) internal balances;
    mapping(address => mapping(uint => bool)) internal usedNonces;
    
 
    function deposit(address _beneficiary) public payable {
        balances[_beneficiary] = balances[_beneficiary].add(msg.value);
    }
    
    function balanceOf(address _owner) public view returns (uint balance){
        return balances[_owner];
    }

    function() external payable {
        deposit(msg.sender);
    }
}
