import { Relation, Triple } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";



async function main() {
	// If you haven't deployed a personal space yet you can deploy one
	// by running deploySpace. This will return the spaceId. Make sure
	// you remember this.
	//
	// If you've already deployed a personal space and have the spaceId
	// you can skip this step.
	const spaceId = await deploySpace({
		spaceName: "Notion Space",
		initialEditorAddress: "0x84713663033dC5ba5699280728545df11e76BCC1", // 0x...
	});

	console.log("Your spaceId is:", spaceId);

	// If you've done these steps correctly then your data should be published to your personal space!
	// Check it out at the testnet explorer URL
}

main();
