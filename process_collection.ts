import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, processNewRelation, processNewTriple } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchEntity, searchOps } from "./search_entities";
import { processPerson } from "./process_person";
import { processSource } from "./process_source";
import { processPublisher } from "./process_publisher";
import { processClaim } from "./process_claim";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processCollection(currentOps: Array<Op>, geo_id: string, collectionId: string, collectionPosition, notion, parentEntityOnGeo): Promise<Array<Op>> {
    const ops: Array<Op> = [];    
    let addOps;
    let firstPosition;
    let lastPosition;
    let position;
    let blockId;
    let blockRelationId;


    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: collectionId });
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    console.log("\n\nCollection name:", name);

    let entityOnGeo;
    let relationEntityOnGeo;
    if (parentEntityOnGeo) {
        const collectionsOnEntity = parentEntityOnGeo?.relationsByFromVersionId?.nodes.filter(
            (item) => 
                item.spaceId === GEO_IDS.cryptoNewsSpaceId &&
                item.typeOfId === SystemIds.BLOCKS &&
                item.toEntity.name === name
        );
        if (collectionsOnEntity.length > 0) {
            blockId = collectionsOnEntity?.[0]?.toEntityId;
            blockRelationId = collectionsOnEntity?.[0]?.entityId;
            entityOnGeo = await searchEntity(blockId);
            relationEntityOnGeo = await searchEntity(blockRelationId);
        }
    }
    if (!entityOnGeo) {
        //CREATE THE DATA BLOCK
        let blockOps = DataBlock.make({
            fromId: geo_id,
            sourceType: 'COLLECTION',
            name: name,
            position: collectionPosition,
        });
        ops.push(...blockOps);

        //console.log(blockOps)
        blockId = blockOps[2].relation.toEntity;
        blockRelationId = blockOps[2].relation.id;
    }

    //Add claims to collection item
    const claims = page.properties["Claims"].relation;
    let claimGeoId;
    firstPosition = PositionRange.FIRST;
    lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
    position = Position.createBetween(firstPosition, lastPosition);
    for (const claim of claims) {

        [addOps, claimGeoId] = await processClaim([...currentOps, ...ops], claim.id, notion);
        ops.push(...addOps);

        if (claimGeoId) {
            position = Position.createBetween(position, lastPosition);
            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, blockId, claimGeoId, SystemIds.COLLECTION_ITEM_RELATION_TYPE, position);
            ops.push(...addOps);
        }

    } 

    //Add appropriate filter
    let filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.claimTypeId}"}]}}`
    addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, blockId, SystemIds.FILTER, filter, "TEXT");
    ops.push(...addOps);

    //Make it a bulleted list
    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, relationEntityOnGeo, blockRelationId, GEO_IDS.bulletListView, SystemIds.VIEW_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
    ops.push(...addOps);

    return ops;
}