import * as fs from "fs";
import { publish } from "./src/publish";
import { mainnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS } from './src/constants';
import { processNewsStory } from "./process_news_story";

const { Client } = require("@notionhq/client");

async function updateEditStatus(pageId: string, notion) {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Edit status": {
          multi_select: [
            { name: "Published" }
          ]
        }
      }
    });
  }

async function main() {
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let notionIds: Array<string> = [];

    // Initializing a client
    const notion = new Client({
        auth: process.env.NOTION_TOKEN,
    })

    const allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: TABLES.news_stories,
            filter: {
                property: "Edit status",
                multi_select: {
                    contains: "Ready to publish",
                },
            },
            start_cursor: startCursor,
            page_size: 100,
        });

        allResults.push(...response.results);

        hasMore = response.has_more;
        startCursor = response.next_cursor;

        // 💤 Optional delay before the next request
        if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    for (const story of allResults) {
        console.log("Notion ID", story.id);
        notionIds.push(story.id);
        [addOps, geoId] = await processNewsStory(ops, story.id, notion);
        ops.push(...addOps);
        console.log("Geo ID", geoId);
    }

    if (ops.length > 0) {
        let outputText;
        // Convert operations to a readable JSON format
        outputText = JSON.stringify(ops, null, 2);
        // Write to a text file
        fs.writeFileSync(`ops.txt`, outputText);
    }

    if (true) {
        const iso = new Date().toISOString();

        const txHash = await publish({
            spaceId: GEO_IDS.cryptoNewsSpaceId,
            author: mainnetWalletAddress,
            editName: `Upload news stories ${iso}`,
            ops: ops, // An edit accepts an array of Ops
        }, "MAINNET");

        console.log("Your transaction hash is:", txHash);
        console.log(iso);
        console.log(`Total stories: ${allResults.length}`);
        console.log("Number of ops published: ", ops.length)
    } else {
        console.log(ops)
    }

    console.log("Updating Story Statues on Notion")
    for (const notionID of notionIds) {
        await updateEditStatus(notionID, notion);
    }

}

main();
