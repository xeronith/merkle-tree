import { utils } from 'ethers';

const
    TypeBytes32 = "bytes32",
    TypeAddress = "address",

    WrapInArray = e => {
        return Array.isArray(e) ? e : [e];
    },

    Keccak256Hash = (data, type) => {
        data = WrapInArray(data);
        type = WrapInArray(type);

        data = data.map(datum =>
            typeof datum !== 'string' ?
                JSON.stringify(datum) :
                datum);

        data = utils.defaultAbiCoder.encode(type, data);
        return utils.keccak256(data);
    }

class LeafNode {
    constructor(data) {
        this.data = data;
        this.hash = Keccak256Hash(data, TypeAddress);
    }
}

class BranchNode {
    constructor(leftChild, rightChild) {
        this.leftChild = leftChild;
        this.rightChild = rightChild;
        this.hash = Keccak256Hash(leftChild.hash > rightChild.hash ?
            [leftChild.hash, rightChild.hash] :
            [rightChild.hash, leftChild.hash], [TypeBytes32, TypeBytes32]);

        rightChild.parent = this;
        rightChild.leftSibling = leftChild;
        rightChild.isRightChild = true;

        leftChild.parent = this;
        leftChild.rightSibling = rightChild;
        leftChild.isLeftChild = true;
    }
}

export default class MerkleTree {
    constructor(items) {
        this.mapping = {};
        let nodes = items.map(data => {
            let node = new LeafNode(data);
            this.mapping[node.hash] = node;
            return node;
        });

        while (nodes.length > 1) {
            nodes = this.GenerateNodes(nodes);
        }

        this.root = nodes[0];
    }

    GenerateNodes(nodes) {
        const result = [];
        while (nodes.length > 1) {
            const first = nodes.shift();
            const second = nodes.shift();
            result.push(new BranchNode(first, second));
        }

        if (nodes.length == 1) {
            const last = nodes.shift();
            result.push(new BranchNode(last, last));
        }

        return result;
    }

    Root() {
        return this.root.hash;
    }

    ExtractProof(item) {
        let hash = Keccak256Hash(item, TypeAddress);

        let result = [];
        if (this.mapping[hash]) {
            let currentNode = this.mapping[hash];

            currentNode.isLeftChild ?
                result.push(currentNode.rightSibling.hash) :
                result.push(currentNode.leftSibling.hash)

            while (currentNode.parent && currentNode.parent != this.root) {
                currentNode.parent.isLeftChild ?
                    result.push(currentNode.parent.rightSibling.hash) :
                    result.push(currentNode.parent.leftSibling.hash)

                currentNode = currentNode.parent;
            }
        }

        return result;
    }

    VerifyClaim(proof, claim, root) {
        let currentHash = Keccak256Hash(claim, TypeAddress);
        proof.forEach(fact =>
            currentHash = Keccak256Hash(currentHash > fact ?
                [currentHash, fact] :
                [fact, currentHash],
                [TypeBytes32, TypeBytes32]));

        if (currentHash === root) {
            return true;
        }

        return false;
    }
}
