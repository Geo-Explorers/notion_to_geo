import { getChecksumAddress } from "@graphprotocol/grc-20";

type DeploySpaceOptions = {
	initialEditorAddress: string;
	spaceName: string;
	network?: "MAINNET" | "TESTNET";
};

export async function deploySpace(options: DeploySpaceOptions) {
	const result = await fetch("https://api-testnet.grc-20.thegraph.com/deploy", {
		method: "POST",
		body: JSON.stringify({
			initialEditorAddress: getChecksumAddress(options.initialEditorAddress),
			spaceName: options.spaceName,
			network: options.network ?? "MAINNET",
		}),
	});

	const { spaceId } = await result.json();
	return spaceId;
}
