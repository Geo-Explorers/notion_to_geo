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




const ops = [
    {
      "type": "SET_TRIPLE",
      "triple": {
        "attribute": "LuBWqZAu6pz54eiJS5mLv8",
        "entity": "GdX9ex2aDVtzSHza68Cx26",
        "value": {
          "type": "TEXT",
          "value": "Vitalik initiates EIP on decentralization goals and L1 gas limits"
        }
      }
    },
    {
      "type": "CREATE_RELATION",
      "relation": {
        "id": "WMmxGYMsKuXwqqro3TNPUh",
        "type": "Jfmby78N4BCseZinBmdVov",
        "fromEntity": "D4ErjUNY13sYc4D6Xt5jaJ",
        "toEntity": "PnQsGwnnztrLNRCm9mcKKY",
        "index": "gAegPbw7.B"
      }
    }
  ];
  
  let spaceId = "TEST_SPACE";
  
  const updatedOps = ops.map(op => ({
    ...op,
    spaceId
  }));

  let newOps: Array<Op> = [];

  addOps = Triple.make({
    entityId: "TEST",
    attributeId: "TEST",
    value: {
        type: "TEST",
        value: "TEST",
    },
});
newOps.push(addOps);
spaceId = "TEST_SPACE2";
newOps = newOps.map(op => ({
    ...op,
    spaceId
  }));

  updatedOps.push(...newOps);

  console.log(updatedOps);
  
  const filteredOps = updatedOps.filter(op => op.spaceId === "TEST_SPACE");

  console.log(filteredOps);


  const opsWithoutSpaceId = filteredOps.map(({ spaceId, ...rest }) => rest);

  console.log(SystemIds.ROLE_PROPERTY);

