import { Client } from "@notionhq/client";
import { walletAddress, TABLES } from './src/constants';
import * as fs from "fs";
import { searchEntities } from "./search_entities";


// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const space = "SgjATMbm41LX6naizMqBVd";
const property = "LuBWqZAu6pz54eiJS5mLv8";
const searchText = "Coinbase";
const typeId = "9vk7Q3pz7US3s2KePFQrJT";

console.log(await searchEntities(space, property, searchText, typeId))

//console.log(validSetTripleOps);
//console.log(ops);


