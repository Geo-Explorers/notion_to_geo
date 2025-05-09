import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, processNewRelation, processNewTriple, addSpace } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchEntity, searchOps } from "./search_entities";
import { processPerson } from "./process_person";
import { processSource } from "./process_source";
import { processPublisher } from "./process_publisher";
import { processClaim } from "./process_claim";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";

type Claim = {
    id: string;
  };

async function getPublishDate(claimId: string, notion): Promise<Date | null> {
    const page = await notion.pages.retrieve({ page_id: claimId });

    // Assuming "Date (news event only)" is a date property
    const dateProp = page.properties["Date (news event only)"];

    if (dateProp?.type === "date" && dateProp.date?.start) {
        return new Date(dateProp.date.start);
    }

    return null;
}

export async function sortClaimsByPublishDate(claims: Claim[], order: string, notion): Promise<Claim[]> {
    const claimsWithDates = await Promise.all(
      claims.map(async (claim) => {
        const date = await getPublishDate(claim.id, notion);
        return { ...claim, date };
      })
    );
  
    // Sort: most recent dates first, undated claims at the end
    if (order == "Ascending") {
        claimsWithDates.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime(); // ascending order
          });
    } else {
        claimsWithDates.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return b.date.getTime() - a.date.getTime(); // descending order
          });
    }
    
  
    // Remove the 'date' field before returning
    return claimsWithDates.map(({ date, ...rest }) => rest);
  }

export async function processCollection(currentOps: Array<Op>, geo_id: string, collectionId: string, collectionPosition, notion, parentEntityOnGeo, currSpaceId: string, reset_position?: boolean): Promise<Array<Op>> {
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
    const timeline = page.properties["Timeline?"]?.checkbox;
    const order = page.properties["Sort direction"]?.select?.name
    const view = page.properties["View"]?.select?.name
    console.log("\n\nCollection name:", name);

    let entityOnGeo;
    let relationEntityOnGeo;
    if (parentEntityOnGeo) {
        const collectionsOnEntity = parentEntityOnGeo?.relationsByFromVersionId?.nodes.filter(
            (item) => 
                item.spaceId === currSpaceId &&
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
    } else if ((relationEntityOnGeo) &&(reset_position)) {
        addOps = Triple.make({
            entityId: blockRelationId,
            attributeId: SystemIds.RELATION_INDEX,
            value: {
                type: "TEXT",
                value: collectionPosition,
            },
        });
        ops.push(addOps);

    }

    //Add claims to collection item
    let claims = page.properties["Claims"].relation;
    let filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.claimTypeId}"}]}}`
    console.log("number of claims", claims.length)
    if (timeline) {
        claims = await sortClaimsByPublishDate(claims, order, notion)
        filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.newsEventTypeId}"}]}}`
        console.log("TIMELINE - number of claims", claims.length)
    }
    let claimGeoId;
    firstPosition = PositionRange.FIRST;
    lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
    position = Position.createBetween(firstPosition, lastPosition);
    for (const claim of claims) {

        [addOps, claimGeoId] = await processClaim([...currentOps, ...ops], claim.id, notion);
        ops.push(...addOps);

        if (claimGeoId) {
            position = Position.createBetween(position, lastPosition);
            addOps = await processNewRelation(currSpaceId, entityOnGeo, blockId, claimGeoId, SystemIds.COLLECTION_ITEM_RELATION_TYPE, position, true);
            ops.push(...addOps);
        }

    } 

    //Add appropriate filter
    //let filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.claimTypeId}"}]}}`
    addOps = await processNewTriple(currSpaceId, entityOnGeo, blockId, SystemIds.FILTER, filter, "TEXT");
    ops.push(...addOps);

    let viewId;
    if (view == "Table") {
        viewId = SystemIds.TABLE_VIEW;
    } else if (view == "List") {
        viewId = SystemIds.LIST_VIEW;
    } else if (view == "Gallery") {
        viewId = SystemIds.GALLERY_VIEW;
    } else {
        viewId = GEO_IDS.bulletListView;
    }

    //Make it a bulleted list
    addOps = await processNewRelation(currSpaceId, relationEntityOnGeo, blockRelationId, viewId, SystemIds.VIEW_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
    ops.push(...addOps);

    return await addSpace(ops, currSpaceId);
}