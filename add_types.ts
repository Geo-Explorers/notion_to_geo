import { Relation, Triple, SystemIds } from "@graphprotocol/grc-20";
import { publish } from "./src/publish";
import { walletAddress, GEO_IDS } from './src/constants';


const ops: Array<Op> = [];
let addOps;
let geoId: string;

geoId = "2bRefTLzdSbMQ12xj6co5L";
addOps = Relation.remove(geoId);
ops.push(addOps);

const txHash = await publish({
    spaceId: GEO_IDS.spaceId,
    author: walletAddress,
    editName: "Remove gallery",
    ops: ops, // An edit accepts an array of Ops
});

console.log("Your transaction hash is:", txHash);


