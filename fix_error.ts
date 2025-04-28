import { Relation, Triple, SystemIds } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { walletAddress, TABLES, getConcatenatedPlainText, spaceId } from './src/constants';
const { Client } = require("@notionhq/client")


const ops: Array<Op> = [];
let addOps;
let geoId: string;

//Create Entity and set the name
addOps = Triple.make({
    entityId: "Rv5f1Q1NpMp84nsTd3ermY",
    attributeId: SystemIds.NAME_PROPERTY,
    value: {
        type: "TEXT",
        value: "Test space",
    },
});
ops.push(addOps);

const txHash = await publish({
    spaceId: "A5LA9Ya1NYWJBqmn1ewvUL",
    author: walletAddress,
    editName: "Test source",
    ops: ops, // An edit accepts an array of Ops
});

console.log("Your transaction hash is:", txHash);


