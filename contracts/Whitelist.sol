// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <8.10.0;

contract Whitelist {
    address admin;
    bytes32 merkleTreeRoot;

    constructor() public {
        admin = msg.sender;
    }

    function setMerkleTreeRoot(bytes32 value) public {
        require(msg.sender == admin, "Not authorized");
        merkleTreeRoot = value;
    }

    function getMerkleTreeRoot() public view returns (bytes32) {
        return merkleTreeRoot;
    }

    function verify(bytes32[] memory proof) public view returns (bool) {
        bytes32 currentHash = keccak256(abi.encode(msg.sender));
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 fact = proof[i];
            currentHash = currentHash > fact
                ? hash(currentHash, fact)
                : hash(fact, currentHash);
        }

        return currentHash == merkleTreeRoot;
    }

    function hash(bytes32 left, bytes32 right) private pure returns (bytes32 value)
    {
        assembly {
            mstore(0x00, left)
            mstore(0x20, right)
            value := keccak256(0x00, 0x40)
        }
    }
}
