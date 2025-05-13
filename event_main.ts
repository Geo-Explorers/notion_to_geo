//Pull all the people, run process_people, then pull all the projects and run process projects

import * as fs from "fs";
import { publish } from "./src/publish";
import { mainnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS } from './src/constants';
import { processPerson } from "./event_process_people";
import { processProject } from "./event_process_project";

const { Client } = require("@notionhq/client");

async function main() {
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let notionIds: Array<string> = [];

    // Initializing a client
    const notion = new Client({
        auth: process.env.VITE_NOTION_TOKEN,
    })

    const allResults = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: TABLES.event_people,
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

    for (const person of allResults) {
        console.log("Notion ID", person.id);
        notionIds.push(person.id);
        [addOps, geoId] = await processPerson(ops, person.id, notion);
        ops.push(...addOps);
        console.log("Geo ID", geoId);
    }

    

    const allProjects = [];
    hasMore = true;
    startCursor = undefined;
    while (hasMore) {
        const response = await notion.databases.query({
            database_id: TABLES.event_projects,
            start_cursor: startCursor,
            page_size: 100,
        });

        allProjects.push(...response.results);

        hasMore = response.has_more;
        startCursor = response.next_cursor;

        // 💤 Optional delay before the next request
        if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    for (const project of allProjects) {
        console.log("Notion ID", project.id);
        notionIds.push(project.id);
        [addOps, geoId] = await processProject(ops, project.id, notion);
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

        const txHash = await publish({
            spaceId: GEO_IDS.cryptoSpaceId,
            author: mainnetWalletAddress,
            editName: `Upload people and projects for the ETHPrague event ${iso}`,
            ops: ops, // An edit accepts an array of Ops
        }, "MAINNET");

        console.log("Your transaction hash is:", txHash);
        console.log(iso);
        console.log(`Total stories: ${allResults.length}`);
        console.log("Number of ops published: ", ops.length)
    } else {
        console.log(ops)
    }

}

main();
