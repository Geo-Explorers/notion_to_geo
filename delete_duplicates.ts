import * as fs from "fs";
import { publish } from "./src/publish";
import { mainnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS, getSpaces, filterOps, addSpace } from './src/constants';
import { searchEntity } from "./search_entity";
import { Relation, Triple} from "@graphprotocol/grc-20";

async function deleteEntity (id: string) {
    let current_state;
    let triples;
    let relations;
    const ops: Array<Op> = [];
    let addOps;
    current_state = await searchEntity(id);

    let toProperty = "Qx8dASiTNsxxP3rJbd4Lzd";
    let fromProperty = "RERshk4JoYoMC17r1qAo9J";
    let relationTypeProperty = "3WxYoAVreE4qFhkDUs5J3q";
    let indexProperty = "WNopXUYxsSsE51gkJGWghe";
    let propertiesDeletedByDeleteRelationFunction = [toProperty, fromProperty, relationTypeProperty, indexProperty]


    //delete all triples and relationsByFromVersionId of duplicate
    triples = current_state?.triples?.nodes;
    //console.log(triples);
    for (const triple of triples) {
        if (!triple.attributeId.includes(propertiesDeletedByDeleteRelationFunction)) {
            addOps = Triple.remove({
                entityId: id,
                attributeId: triple.attributeId
            });
            ops.push(await addSpace(addOps, triple.spaceId));
        }   
    }

    relations = current_state?.relationsByFromVersionId?.nodes;
    for (const relation of relations) {
        addOps = Relation.remove(relation.entityId);
        ops.push(await addSpace(addOps, relation.spaceId));
        
        if (relation.typeOfId == "QYbjCM6NT9xmh2hFGsqpQX") {
            //console.log(relation?.toEntity?.id);
            addOps = await deleteEntity(relation?.toEntity?.id);
            ops.push(...addOps);
        }

        addOps = await deleteEntity(relation?.entityId);
        ops.push(...addOps);

    }

    return ops;

}

function parseEntityIds(input: string): string[] {
    return input
      .split(',')
      .map(id => id.trim().replace(/^["']|["']$/g, '')) // trim then remove surrounding quotes
      .filter(id => id.length > 0);
  }
  

export async function delete_duplicates(privateKey: `0x${string}`, walletAddress: string, entity_to_keep: string, duplicates: string) {
    const ops: Array<Op> = [];
    let addOps;
    let current_state;
    let references;

    entity_to_keep = entity_to_keep.trim().replace(/^["']|["']$/g, '');
    
    for (const duplicate of parseEntityIds(duplicates)) {
        current_state = await searchEntity(duplicate);
        //console.log(current_state?.relationsByToVersionId?.nodes);

        //Get all relationsByToVersionId
        references = current_state?.relationsByToVersionId?.nodes;
        for (const reference of references) {
            //recreate each relation with new to_id: entity_to_keep
            //add appropriate spaceId to each ops  
            addOps = Relation.make({
                fromId: reference.fromEntityId,
                toId: entity_to_keep,
                relationTypeId: reference.typeOfId,
                position: reference.index,
            });
            ops.push(await addSpace(addOps, reference.spaceId));


            //delete old relation
            addOps = Relation.remove(reference.entityId);
            ops.push(await addSpace(addOps, reference.spaceId));

            //NOTE IN THE NEW DATA MODEL, I COULD JUST REUSE THE OLD RELATION ENTITY ID
            addOps = await deleteEntity(reference.entityId);
            ops.push(...addOps);
        }

        addOps = await deleteEntity(duplicate);
        ops.push(...addOps);
    }

    if (ops.length > 0) {
        let outputText;
        // Convert operations to a readable JSON format
        outputText = JSON.stringify(ops, null, 2);
        // Write to a text file
        fs.writeFileSync(`ops.txt`, outputText);
    }
        
    //publish ops by iterating each spaceId
    if ((ops.length > 0) && (true)) {
        const iso = new Date().toISOString();
        let txHash;
        const spaces = await getSpaces(ops);

        for (const space of spaces) { 
            txHash = await publish({
                spaceId: space,
                author: walletAddress,
                editName: `Remove duplicates for ${entity_to_keep} (Duplicates: ${duplicates}) on date ${iso}`,
                ops: await filterOps(ops, space), // An edit accepts an array of Ops
            }, "MAINNET", privateKey);
            
    
            console.log(`Your transaction hash for ${space} is:`, txHash);
            console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
        }   
    } else {
        const spaces = await getSpaces(ops);
        console.log("Spaces", spaces);
        for (const space of spaces) {
            console.log(`Number of ops published in ${space}: `, (await filterOps(ops, space)).length)
            //console.log(await filterOps(ops, space))
        }
    }
}