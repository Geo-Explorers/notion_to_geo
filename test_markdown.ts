import { Relation, SystemIds, Triple } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, buildGeoFilter, addSpace, filterOps, getSpaces, mainnetWalletAddress } from './src/constants';
const { Client } = require("@notionhq/client")

import { searchEntities, searchEntitiesV1, searchDataBlocks, searchGetPublisherAvatar, searchEntity, searchUniquePublishers, searchArticles } from "./search_entities";

import { add, format, getWeek, parseISO } from "date-fns";

import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, PositionRange, Graph, Position, TextBlock} from "@graphprotocol/grc-20";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";
import { processNewsStory } from "./process_news_story";

import * as fs from "fs";
import { processTags } from "./process_tags";
import { processProject } from "./process_project_update";
import { processPerson } from "./process_person_update";
import { processTopic } from "./process_topic_update";


export const createContent = (entityId: string, content: string[]) => {
    const ops = [];
    for(let i = 0; i < content.length; i++) {
        const position = Position.createBetween();
        let blockOps = TextBlock.make({
            fromId: entityId,
            text: content[i],
            position,
        });
        ops.push(...blockOps);
    }
    return ops;
}


const ops: Array<Op> = [];
let addOps;
let geoId: string;

const filepath = "articles.json";
const jsonString = await fs.readFileSync(filepath, 'utf-8');
const data = JSON.parse(jsonString);

console.log(data['https://eips.ethereum.org/EIPS/eip-2537'].body_text);

geoId = "NzYDQ5iw8hkpBJ54HfEztX";



addOps = createContent(geoId, data['https://eips.ethereum.org/EIPS/eip-2537']?.body_text?.split("\n\n"))
ops.push(...addOps);

console.log(ops)

const txHash = await publish({
    spaceId: "2kQ2tonEmBsXFphVay2b1x",
    author: mainnetWalletAddress,
    editName: `Test markdown import`,
    ops: ops, // An edit accepts an array of Ops
}, "MAINNET");

console.log(`Your transaction hash is:`, txHash);