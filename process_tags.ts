import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, processNewTriple, processNewRelation, buildGeoFilter, createQueryDataBlock } from './src/constants';
import { searchEntities, searchOps, searchDataBlocks, searchEntity, hasBeenEdited } from "./search_entities";

import { format, getWeek, getQuarter, parseISO } from "date-fns";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";





//TODO - Update process tags to follow checking if it was created on geo already and updating anything that is needed...
async function processDate(currentOps, tag_date: string): Promise<[Array<Op>, string]> {
    let position;
    let blockOps;
    let blockId;
    let blockRelationId;
    let filter;

    // Example ISO string
    const date = parseISO(tag_date); // or new Date(2025, 0, 9) if manually
    
    // 1. Long formatted date: "Thursday, January 9, 2025"
    const longFormattedDate = format(date, "EEEE, MMMM d, yyyy");
    
    // 2. Short formatted date: "01/09/2025"
    const formattedDate = format(date, "MM/dd/yyyy");
    
    // 3. Week formatted: "Week 2 of 2025"
    const weekNumber = getWeek(date);
    let formattedWeek;
    if (weekNumber < 10) {
        formattedWeek = `Week 0${weekNumber} of ${date.getFullYear()}`;
    } else {
        formattedWeek = `Week ${weekNumber} of ${date.getFullYear()}`;
    }
    
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

    //Does date tag exist?
    let dateGeoId: string;
    if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedDate)) { //Search current ops for web url
        dateGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedDate)
    } else {
        dateGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedDate, GEO_IDS.tagTypeId);
        let entityOnGeo;
        if (!dateGeoId) {
            dateGeoId = Id.generate();
        } else {
            entityOnGeo = await searchEntity(dateGeoId);
            console.log("entity exists on geo")
        }

        if (await hasBeenEdited(currentOps, dateGeoId)) {
            return [ops, dateGeoId]
        } else {
            if (formattedDate) {
                addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, dateGeoId, SystemIds.NAME_PROPERTY, formattedDate, "TEXT");
                ops.push(...addOps);
            }
    
            //ADD TAG TYPE TO NEW DATE TAG ENTITY
            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, dateGeoId, GEO_IDS.tagTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);
    
            //Add quotes data block to source page
            const filter = buildGeoFilter(
                [GEO_IDS.cryptoNewsSpaceId],
                [
                    { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.newsStoryTypeId },
                    { attribute: GEO_IDS.tagsPropertyId, is: dateGeoId }
                ]
            );
            if (entityOnGeo) {
                const blocksOnEntity = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                    (item) => 
                        item.spaceId === GEO_IDS.cryptoNewsSpaceId &&
                        item.typeOfId === SystemIds.BLOCKS &&
                        item.toEntity.name === longFormattedDate
                );
                if (blocksOnEntity.length < 1) {
                    addOps = createQueryDataBlock(longFormattedDate, dateGeoId, filter, SystemIds.LIST_VIEW, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                    ops.push(...addOps);
                }
            } else {
                addOps = createQueryDataBlock(longFormattedDate, dateGeoId, filter, SystemIds.LIST_VIEW, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                ops.push(...addOps);
            }
    
        }
    
        return [ops, dateGeoId]

    }
             
}


async function processWeek(currentOps, tag_date: string, dateGeoId): Promise<[Array<Op>, string]> {
    let position;
    let blockOps;
    let blockId;
    let blockRelationId;
    let filter;

    
    // Example ISO string
    const date = parseISO(tag_date); // or new Date(2025, 0, 9) if manually
    
    // 1. Long formatted date: "Thursday, January 9, 2025"
    const longFormattedDate = format(date, "EEEE, MMMM d");
    
    // 2. Short formatted date: "01/09/2025"
    const formattedDate = format(date, "MM/dd/yyyy");
    
    // 3. Week formatted: "Week 2 of 2025"
    const weekNumber = getWeek(date);
    let formattedWeek;
    if (weekNumber < 10) {
        formattedWeek = `Week 0${weekNumber} of ${date.getFullYear()}`;
    } else {
        formattedWeek = `Week ${weekNumber} of ${date.getFullYear()}`;
    }
    // 4. Quarter formatted: "Q1 2025"
    const quarter = getQuarter(date);
    const formattedQuarter = `Q${quarter} ${date.getFullYear()}`;
    
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

    //Does week tag exist?
    let weekGeoId: string;
    if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedWeek)) { //Search current ops for web url
        weekGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedWeek)
    } else {
        weekGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedWeek, GEO_IDS.tagTypeId)
        //ONCE I FIND THE ENTITIES GEO ID, THEN I CAN SEARCH THE OPS FOR THE VARIOUS THINGS...
        let entityOnGeo;
        if (!weekGeoId) {
            weekGeoId = Id.generate();
        } else {
            entityOnGeo = await searchEntity(weekGeoId);
            console.log("entity exists on geo")
        }

        if (await hasBeenEdited(currentOps, weekGeoId)) {
            return [ops, weekGeoId]
        } else {


            if (formattedWeek) {
                addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, weekGeoId, SystemIds.NAME_PROPERTY, formattedWeek, "TEXT");
                ops.push(...addOps);
            }

            //ADD TAG TYPE TO NEW DATE TAG ENTITY
            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, weekGeoId, GEO_IDS.tagTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);

            //CREATE TOP NEWS STORIES THE DATA BLOCK
            let filter = buildGeoFilter(
                [GEO_IDS.cryptoNewsSpaceId],
                [
                    { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.newsStoryTypeId },
                    { attribute: GEO_IDS.tagsPropertyId, is: GEO_IDS.newsStoryOfTheWeekTagId },
                    { attribute: GEO_IDS.tagsPropertyId, is: weekGeoId }
                ]
            );
            
            if (entityOnGeo) {
                const blocksOnEntity = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                    (item) => 
                        item.spaceId === GEO_IDS.cryptoNewsSpaceId &&
                        item.typeOfId === SystemIds.BLOCKS &&
                        item.toEntity.name === "News stories of the week"
                );
                if (blocksOnEntity.length < 1) {
                    addOps = createQueryDataBlock("News stories of the week", weekGeoId, filter, SystemIds.GALLERY_VIEW, "1RQgZNIZ.A", undefined);
                    ops.push(...addOps);
                }
            } else {
                addOps = createQueryDataBlock("News stories of the week", weekGeoId, filter, SystemIds.GALLERY_VIEW, "1RQgZNIZ.A", undefined);
                ops.push(...addOps);
            }




            let blockId;
            let blockRelationId;
            let collectionEntityOnGeo;
            let relationEntityOnGeo;
            if (entityOnGeo) {
                const collectionsOnEntity = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                    (item) => 
                        item.spaceId === GEO_IDS.cryptoNewsSpaceId &&
                        item.typeOfId === SystemIds.BLOCKS &&
                        item.toEntity.name === "Previous news stories"
                );
                if (collectionsOnEntity.length > 0) {
                    blockId = collectionsOnEntity?.[0]?.toEntityId;
                    blockRelationId = collectionsOnEntity?.[0]?.entityId;
                    collectionEntityOnGeo = await searchEntity(blockId);
                    relationEntityOnGeo = await searchEntity(blockRelationId);
                }
            }
            if (!collectionEntityOnGeo) {
                //CREATE THE DATA BLOCK
                let blockOps = DataBlock.make({
                    fromId: weekGeoId,
                    sourceType: 'COLLECTION',
                    name: "Previous news stories",
                    position: "1RQgZNIZ.Z",
                });
                ops.push(...blockOps);
        
                //console.log(blockOps)
                blockId = blockOps[2].relation.toEntity;
                blockRelationId = blockOps[2].relation.id;
            }
        
            let formattedPastWeek;
            for (let i = 1; i < 4; i++) {
                if ((weekNumber - i) < 1) {
                    formattedPastWeek = `Week ${52 - (weekNumber-i)} of ${date.getFullYear() - 1}`;
                } else if ((weekNumber - i) < 10) {
                    formattedPastWeek = `Week 0${weekNumber-i} of ${date.getFullYear()}`;
                } else {
                    formattedPastWeek = `Week ${weekNumber-i} of ${date.getFullYear()}`;
                }
                console.log("FORMATTED PAST WEEK: ", formattedPastWeek)

                let pastWeekGeoId = null;
                if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedPastWeek)) { //Search current ops for web url
                    pastWeekGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedPastWeek)
                } else if (await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedPastWeek, GEO_IDS.tagTypeId)) { //Search graphDB for web url
                    pastWeekGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedPastWeek, GEO_IDS.tagTypeId)
                }

                console.log("FORMATTED PAST WEEK GEO ID: ", pastWeekGeoId)

                if (pastWeekGeoId) {
                    position = Position.createBetween();
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, collectionEntityOnGeo, blockId, pastWeekGeoId, SystemIds.COLLECTION_ITEM_RELATION_TYPE, position);
                    ops.push(...addOps);
                }
            }
        
            //Add appropriate filter
            filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.tagTypeId}"}]}}`
            addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, collectionEntityOnGeo, blockId, SystemIds.FILTER, filter, "TEXT");
            ops.push(...addOps);
        
            //Make it a bulleted list
            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, relationEntityOnGeo, blockRelationId, SystemIds.GALLERY_VIEW, SystemIds.VIEW_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);


            //Add quarter tag
            let quarterGeoId;
            if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedQuarter)) { //Search current ops for web url
                quarterGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedQuarter)
            } else {
                quarterGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedQuarter, GEO_IDS.tagTypeId)
                let quarterEntityOnGeo;
                if (!quarterGeoId) {
                    quarterGeoId = Id.generate();
                } else {
                    quarterEntityOnGeo = await searchEntity(quarterGeoId);
                    console.log("entity exists on geo")
                }

                if (formattedQuarter) {
                    addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, quarterEntityOnGeo, quarterGeoId, SystemIds.NAME_PROPERTY, formattedQuarter, "TEXT");
                    ops.push(...addOps);
                }

                //ADD TAG TYPE TO NEW DATE TAG ENTITY
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, quarterEntityOnGeo, quarterGeoId, GEO_IDS.tagTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);
            }
            if (quarterGeoId) {
                //ADD Quarter TAG TO Week ENTITY
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, weekGeoId, quarterGeoId, GEO_IDS.tagsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);
            }
        }



    }

    //DOES DATE TABLE ALREADY EXIST?
    let dataTableId;
    if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", longFormattedDate)) { //Search current ops for web url
        dataTableId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", longFormattedDate)
    } else if (await searchDataBlocks(GEO_IDS.cryptoNewsSpaceId, GEO_IDS.blocksTypeId, weekGeoId, longFormattedDate)) { //Search graphDB for web url
        dataTableId = await searchDataBlocks(GEO_IDS.cryptoNewsSpaceId, GEO_IDS.blocksTypeId, weekGeoId, longFormattedDate)
    } else {
        //THIS LOGIC IS QUITE DIFFICULT TO PARSE... I WILL HAVE TO HANDLE POTENTIALLY CREATING MULTIPLE IN ONE GO
        //What if monday was created previously?
        //How do I position tuesday?
        //Could I just give each day a set index?
        //let data = await searchDataBlocks(GEO_IDS.cryptoNewsSpaceId, GEO_IDS.blocksTypeId, parent_geo_id)
        
        if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Sunday") {
            position = "1RQgZNIZ.P";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Monday") { 
            position = "1RQgZNIZ.N";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Tuesday") { 
            position = "1RQgZNIZ.L";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Wednesday") { 
            position = "1RQgZNIZ.J";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Thursday") { 
            position = "1RQgZNIZ.H";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Friday") { 
            position = "1RQgZNIZ.F";
        } else if (date.toLocaleDateString("en-US", {weekday: "long"}) == "Saturday") { 
            position = "1RQgZNIZ.D";
        }

        let filter = buildGeoFilter(
            [GEO_IDS.cryptoNewsSpaceId],
            [
                { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.newsStoryTypeId },
                { attribute: GEO_IDS.tagsPropertyId, is: dateGeoId }
            ]
        );
        addOps = createQueryDataBlock(longFormattedDate, weekGeoId, filter, SystemIds.LIST_VIEW, position, [GEO_IDS.relatedProjectsPropertyId]);
        ops.push(...addOps);

    }

    return [ops, weekGeoId]
}


export async function processTags(currentOps, tag_date: string): Promise<[Array<Op>, string, string]> {
//I SEND DATE IN HERE AND MANAGE IT IN HERE INSTEAD OF SENDING THE TAG STRING
//THEN FROM THAT DATE, I will know if I need to create a new data block in the week of tag
//I ALSO NEED TO ADD THE QX YYYY tag to the week of page.
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

    console.log("TAG DATE STRING: ", tag_date)

    let dateGeoId: string;
    [addOps, dateGeoId] = await processDate(currentOps, tag_date);
    ops.push(...addOps)

    let weekGeoId: string;
    [addOps, weekGeoId] = await processWeek(currentOps, tag_date, dateGeoId);
    ops.push(...addOps)

    return [ops, dateGeoId, weekGeoId];
}





