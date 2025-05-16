import { Client } from "@notionhq/client";
import { walletAddress, TABLES } from './src/constants';
import * as fs from "fs";


// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const fileContent = fs.readFileSync('ops.txt', 'utf-8');

const ops = JSON.parse(fileContent);

console.log(ops);

// Step 1: Get all toEntity IDs from disqualifying CREATE_RELATION ops
const disqualifiedEntities = new Set(
  ops
    .filter(op =>
      op.type === "CREATE_RELATION" &&
      op.relation.type === "QYbjCM6NT9xmh2hFGsqpQX"
    )
    .map(op => op.relation.toEntity)
);

// Step 2: Filter SET_TRIPLE ops where entity is not in the disqualified set
const validSetTripleOps = ops.filter(op =>
  op.type === "SET_TRIPLE" &&
  !disqualifiedEntities.has(op.triple.entity)
);

//console.log(validSetTripleOps);
//console.log(ops);


