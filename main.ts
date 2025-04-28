import * as fs from "fs";
import { Relation, Triple } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { processClaim } from "./process_claim";
import { testnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS, TESTNET_GEO_IDS } from './src/constants';
import { processNewsStory } from "./process_news_story";

const { Client } = require("@notionhq/client")



async function main() {
	// Once you have the ops you can publish them to IPFS and your space.

	const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

	// Initializing a client
	const notion = new Client({
		auth: process.env.NOTION_TOKEN,
	});


	//WRITE SCRIPT TO GO THROUGH ALL NEWS STORIES WITH A SPECIFIC STATUS
	//PROCESS News story

	const notionId = "145273e214eb8054b591d896a6300b4c";
	[addOps, geoId] = await processNewsStory(ops, notionId, notion);
	ops.push(...addOps);
	//console.log("Ops", addOps)
	console.log("Geo ID", geoId)

	console.log(ops.length)


	if (ops.length > 0) {
		let outputText;
		// Convert operations to a readable JSON format
		outputText = JSON.stringify(ops, null, 2);
		// Write to a text file
		fs.writeFileSync(`ops.txt`, outputText);

		const txHash = await publish({
			spaceId: TESTNET_GEO_IDS.spaceId,
			author: testnetWalletAddress,
			editName: "Upload story v1",
			ops: ops, // An edit accepts an array of Ops
		}, "TESTNET");

		console.log("Your transaction hash is:", txHash);
	}
}

main();

//To dos
// - Create authors, if needed?
// - Handle searches if we find multiple results? Could provide more filters to limit the chance of multiple results