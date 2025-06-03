import { Client } from "@notionhq/client";
import { walletAddress, TABLES } from './src/constants';
import * as fs from "fs";
import { searchEntities } from "./search_entities";
import { processNewsStory } from "./process_news_story";
import type { Op } from "@graphprotocol/grc-20";


// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const ops: Array<Op> = [];
let addOps;
let geoId: string;
let notionIds: Array<string> = [];

const story_id = "207273e214eb80959c63f167a3ff0356";

[addOps, geoId] = await processNewsStory(ops, story_id, notion);
ops.push(...addOps);
console.log("Geo ID", geoId);


if (ops.length > 0) {
    let outputText;
    // Convert operations to a readable JSON format
    outputText = JSON.stringify(ops, null, 2);
    // Write to a text file
    fs.writeFileSync(`ops.txt`, outputText);
}

