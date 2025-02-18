import { IPFS, Relation, Triple } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { wallet } from "./src/wallet";
import { publish } from "./src/publish";

async function main() {
	// If you haven't deployed a personal space yet you can deploy one
	// by running deploySpace. This will return the spaceId. Make sure
	// you remember this.
	//
	// If you've already deployed a personal space and have the spaceId
	// you can skip this step.
	const spaceId = await deploySpace({
		spaceName: "YOUR SPACE NAME",
		initialEditorAddress: "YOUR WALLET ACCOUNT ADDRESS", // 0x...
	});

	console.log("Your spaceId is:", spaceId);

	// Once you have a personal space you can write data to it. Generate
	// ops for your data using Triple.make or Relation.make accordingly.
	const newTriple = Triple.make({
		attributeId: "...",
		entityId: "...",
		value: {
			type: "TEXT",
			value: "",
		},
	});

	const newRelation = Relation.make({
		fromId: "...",
		toId: "...",
		relationTypeId: "...",
	});

	// Publish your data to IPFS. Give the edit an appropriate name and pass it
	// any ops you want to publish together.
	const cid = await IPFS.publishEdit({
		name: "YOUR EDIT NAME",
		author: "YOUR WALLET ACCOUNT ADDRESS",
		ops: [newTriple, newRelation],
	});

	// Write to the smart contract using the above calldata. This returns a transaction hash.
	const txHash = await publish({
		spaceId,
		cid,
	});

	// If you've done these steps correctly then your data should be published to your personal space!
	// Check it out at the testnet explorer URL
}

main();
