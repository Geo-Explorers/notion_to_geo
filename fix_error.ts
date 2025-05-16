import { Relation, Triple, SystemIds, Id } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import {
  TABLES,
  getConcatenatedPlainText,
  mainnetWalletAddress,
} from "./src/constants";

import { type Op } from "@graphprotocol/grc-20";

export const fn = async (pk: `0x${string}`) => {
  try {
    const ops: Array<Op> = [];
    let addOps;
    let geoId = Id.generate();

    console.log({ geoId });

    //Create Entity and set the name
    addOps = Triple.make({
      entityId: geoId,
      attributeId: SystemIds.NAME_PROPERTY,
      value: {
        type: "TEXT",
        value: "Test space",
      },
    });

    console.log({ addOps });

    ops.push(addOps);

    console.log({ ops });

    const txHash = await publish(
      {
        spaceId: "LncJR48rLVpLGLCm9eaZeW",
        author: "0xdA54464De464ad6D538d4aa5589aAf91dD9FFAb8",
        editName: "Test source",
        ops: ops, // An edit accepts an array of Ops
      },
      "MAINNET",
      pk
    );

    console.log("Your transaction hash is:", txHash);
    return txHash;
  } catch (error) {
    console.error("Error processing articles:", error);
    throw error;
  }
};
