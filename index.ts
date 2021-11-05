import * as crypto from 'crypto';

class Transaction {
	constructor(
		public amount: number,
		public payer: string,
		public payee: string
	) {}

	toString() {
		return JSON.stringify(this);
	}
}

class Block {
	public nonce = Math.round(Math.random() * 10000000000);

	constructor(
		public previousHash: string,
		public transaction: Transaction,
		public ts = Date.now()
	) {}

	get hash() {
		const str = JSON.stringify(this);
		const hash = crypto.createHash('SHA256'); //  creates a Hash instances. Hash objects are not to be created directly using the new keyword
		hash.update(str).end(); // updates the hash content with the given data. 'utf8' is the default encoding. This is streamed so it can be called many times with new data
		return hash.digest('hex'); //If no encoding is provided, Buffer is returned.
	}
}

class Chain {
	public static instance = new Chain(); // there should be only 1 blockchain. This sets a singleton instance

	chain: Block[];

	constructor() {
		this.chain = [new Block('', new Transaction(5, 'genesis', 'firstPayee'))];
	}

	get lastBlock() {
		return this.chain[this.chain.length - 1];
	}

	mine(nonce: number) {
		let solution = 1;
		console.log('... mining ...');

		while (true) {
			const hash = crypto.createHash('MD5');
			hash.update((nonce + solution).toString()).end();

			const attempt = hash.digest('hex');

			if (attempt.substr(0, 4) === '0000') {
				console.log(`Solved! Solution: ${solution}`);
				return solution;
			}
			solution++;
		}
	}

	addBlock(
		transaction: Transaction,
		senderPublicKey: string,
		signature: Buffer
	) {
		const verifier = crypto.createVerify('SHA256');
		verifier.update(transaction.toString());

		const isValid = verifier.verify(senderPublicKey, signature);

		if (isValid) {
			const newBlock = new Block(this.lastBlock.hash, transaction);
			this.mine(newBlock.nonce);
			this.chain.push(newBlock);
		}
	}
}

class Wallet {
	public publicKey: string;
	public privateKey: string;

	constructor() {
		const keypair = crypto.generateKeyPairSync('rsa', {
			modulusLength: 2048,
			publicKeyEncoding: { type: 'spki', format: 'pem' },
			privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
		});
		this.privateKey = keypair.privateKey;
		this.publicKey = keypair.publicKey;
	}
	sendCrypto(amount: number, payeePublicKey: string) {
		const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

		const sign = crypto.createSign('SHA256');
		sign.update(transaction.toString()).end;

		const signature = sign.sign(this.privateKey);
		Chain.instance.addBlock(transaction, this.publicKey, signature);
	}
}

const bot_client_1 = new Wallet();
const bot_client_2 = new Wallet();
const bot_client_3 = new Wallet();

bot_client_1.sendCrypto(42, bot_client_2.publicKey);
bot_client_2.sendCrypto(21, bot_client_3.publicKey);
bot_client_3.sendCrypto(21, bot_client_1.publicKey);

console.log(Chain.instance);
