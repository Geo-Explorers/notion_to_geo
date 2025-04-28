import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps } from "./search_entities";
import { processPerson } from "./process_person";
import { processSource } from "./process_source";
import { processPublisher } from "./process_publisher";
import { processClaim } from "./process_claim";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processCollection(currentOps: Array<Op>, geo_id: string, collectionId: string, collectionPosition, notion): Promise<Array<Op>> {
    const ops: Array<Op> = [];    
    let addOps;
    let firstPosition;
    let lastPosition;
    let position;

    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: collectionId });
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    console.log("\n\nCollection name:", name);

    //CREATE THE DATA BLOCK
    let blockOps = DataBlock.make({
        fromId: geo_id,
        sourceType: 'COLLECTION',
        name: name,
        position: collectionPosition,
    });
    ops.push(...blockOps);

    //console.log(blockOps)
    let blockId = blockOps[2].relation.toEntity;
    let blockRelationId = blockOps[2].relation.id;

    const claims = page.properties["Claims"].relation;
    let claimGeoId;
    firstPosition = PositionRange.FIRST;
    lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
    position = Position.createBetween(firstPosition, lastPosition);
    //position = INITIAL_RELATION_INDEX_VALUE;
    for (const claim of claims) {

        [addOps, claimGeoId] = await processClaim([...currentOps, ...ops], claim.id, notion);
        ops.push(...addOps);


        position = Position.createBetween(position, lastPosition);
        //position = Position.createBetween(position, PositionRange.LAST)
        if (claimGeoId) {
            addOps = Relation.make({
                fromId: blockId,
                toId: claimGeoId,
                relationTypeId: SystemIds.COLLECTION_ITEM_RELATION_TYPE,
                position: position,
            });
            ops.push(addOps);
        }

    } 

    
    let filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.claimTypeId}"}]}}`
    addOps = Triple.make({
        entityId: blockId,
        attributeId: SystemIds.FILTER,
        value: {
            type: "TEXT",
            value: filter,
        },
    });

    ops.push(addOps);

    //Set view to TABLE_VIEW -- for list view use SystemIds.LIST_VIEW
    addOps = Relation.make({
        fromId: blockRelationId,
        toId: GEO_IDS.bulletListView, //bulletted list view
        relationTypeId: SystemIds.VIEW_PROPERTY,
    });
    ops.push(addOps);

    return ops;
}