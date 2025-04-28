import { Relation, SystemIds, Triple } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, buildGeoFilter } from './src/constants';
const { Client } = require("@notionhq/client")

import { searchEntities, searchEntitiesV1, searchDataBlocks, searchGetPublisherAvatar } from "./search_entities";

import { format, getWeek, parseISO } from "date-fns";

import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, PositionRange, Graph, Position} from "@graphprotocol/grc-20";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";



const ops: Array<Op> = [];
let addOps;
let geoId: string;

// Initializing a client
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

//[addOps, geoId] = await processSource("1af273e214eb80f58245cc895f7ec7ac", notion);
//console.log(await searchOps(addOps, "93stf6cgYvBsdPruRzq1KK", "URL", "https://decrypt.co/309060/elizabeth-warren-david-sacks-trump-crypto-policies"))

//const text = "Week 7 of 2025"
//console.log(await searchEntities(GEO_IDS.spaceId, SystemIds.NAME_PROPERTY, text, GEO_IDS.newsStoryTypeId))
//let data = await searchDataBlocks("BDuZwkjCg3nPWMDshoYtpS", GEO_IDS.blocksTypeId, "RrHLLhyF48EYLLnvHy5frG")
//console.log(data)


//SPACE: V7xhycK9fAEy7BmpnDGHTq; PROPERTY: LuBWqZAu6pz54eiJS5mLv8; searchText: Blockchain identity solutions and innovations; typeId: Cj7JSjWKbcdgmUjcLWNR4V}
console.log(await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, "TESTSEARCH", GEO_IDS.claimTypeId))