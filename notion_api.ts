import * as fs from "fs";
import { publish } from "./src/publish";
import { mainnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS, getSpaces, filterOps } from './src/constants';
import { processNewsStory } from "./process_news_story";
import type { Op } from "@graphprotocol/grc-20";
import { Client } from "@notionhq/client";

//Create process to only publish create triple names for all people and projects Then in a subsequent transaction send the rest of the ops
// - Make sure to only create name triples for main entities. Dont do this for any enities with type block.
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function prioritizeItem(arr: string[], target: string): string[] {
    const index = arr.indexOf(target);
    if (index > -1) {
      // Remove it from its current position
      arr.splice(index, 1);
      // Add it to the front
      arr.unshift(target);
    }
    return arr;
  }

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

export async function import_notion_articles(privateKey: `0x${string}`, walletAddress: string) {
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

    if ((ops.length > 0) && (true)) {
        const iso = new Date().toISOString();
        let txHash;
        const spaces = await getSpaces(ops);
        prioritizeItem(spaces, GEO_IDS.cryptoSpaceId); // prioritize crypto space transaction

        for (const space of spaces) { 
            txHash = await publish({
                spaceId: space,
                author: walletAddress,
                editName: `Upload news stories ${iso}`,
                ops: await filterOps(ops, space), // An edit accepts an array of Ops
            }, "MAINNET", privateKey);
    
            console.log(`Your transaction hash for ${space} is:`, txHash);
            console.log(iso);
            
            console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
        }   
        console.log(`Total stories: ${allResults.length}`);
    } else {
        const spaces = await getSpaces(ops);
        console.log("Spaces", spaces);
        for (const space of spaces) {
            console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
            console.log(await filterOps(ops, space))
        }
    }

    console.log("Updating Story Statuses on Notion")
    for (const notionID of notionIds) {
        await updateEditStatus(notionID, notion);
    }

}
