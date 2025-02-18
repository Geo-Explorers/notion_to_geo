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


	// Once you have the ops you can publish them to IPFS and your space.
	const txHash = await publish({
		spaceId,
		author: "YOUR WALLET ACCOUNT ADDRESS",
		editName: "YOUR EDIT NAME",
		ops: [newTriple, newRelation],
	});

	console.log("Your transaction hash is:", txHash);

	// If you've done these steps correctly then your data should be published to your personal space!
	// Check it out at the testnet explorer URL
}

main();
