import { Relation, SystemIds, Triple, type Op } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, buildGeoFilter, addSpace, filterOps, getSpaces, mainnetWalletAddress } from './src/constants';
import { Client } from "@notionhq/client";

import { searchEntities, searchEntitiesV1, searchDataBlocks, searchGetPublisherAvatar, searchEntity, searchUniquePublishers, searchArticles } from "./search_entities";

import { format, getWeek, parseISO } from "date-fns";

import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, PositionRange, Graph, Position} from "@graphprotocol/grc-20";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";
import { processNewsStory } from "./process_news_story";

import * as fs from "fs";
import { processTags } from "./process_tags";
import { processProject } from "./process_project_update";
import { processPerson } from "./process_person_update";
import { processTopic } from "./process_topic_update";



const ops: Array<Op> = [];
let addOps;
let geoId: string;

// Initializing a client
const notion = new Client({
    auth: process.env.VITE_NOTION_TOKEN,
});

//[addOps, geoId] = await processSource("1af273e214eb80f58245cc895f7ec7ac", notion);
//console.log(await searchOps(addOps, "93stf6cgYvBsdPruRzq1KK", "URL", "https://decrypt.co/309060/elizabeth-warren-david-sacks-trump-crypto-policies"))

//const text = "Week 7 of 2025"
//console.log(await searchEntities(GEO_IDS.spaceId, SystemIds.NAME_PROPERTY, text, GEO_IDS.newsStoryTypeId))
//let data = await searchDataBlocks("BDuZwkjCg3nPWMDshoYtpS", GEO_IDS.blocksTypeId, "RrHLLhyF48EYLLnvHy5frG")
//console.log(data)


//SPACE: V7xhycK9fAEy7BmpnDGHTq; PROPERTY: LuBWqZAu6pz54eiJS5mLv8; searchText: Blockchain identity solutions and innovations; typeId: Cj7JSjWKbcdgmUjcLWNR4V}
//console.log(await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, "TESTSEARCH", GEO_IDS.claimTypeId))

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

let topicId = "1ea273e214eb8045b5f3d8fd59e11743";

[addOps, geoId] = await processTopic([], topicId, notion)
ops.push(...addOps);


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
            author: mainnetWalletAddress,
            editName: `Upload Topic ${iso}`,
            ops: await filterOps(ops, space), // An edit accepts an array of Ops
        }, "MAINNET");

        console.log(`Your transaction hash for ${space} is:`, txHash);
        console.log(iso);
        
        console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
    } 
} else {
    const spaces = await getSpaces(ops);
    console.log("Spaces", spaces);
    for (const space of spaces) {
        console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
        console.log(await filterOps(ops, space))
    }
}
