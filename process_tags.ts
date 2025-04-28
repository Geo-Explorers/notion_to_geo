import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber } from './src/constants';
import { searchEntities, searchOps, searchDataBlocks } from "./search_entities";

import { format, getWeek, getQuarter, parseISO } from "date-fns";

async function processDate(currentOps, parent_geo_id, tag_date: string): Promise<[Array<Op>, string]> {
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
    } else if (await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedDate, GEO_IDS.tagTypeId)) { //Search graphDB for web url
        dateGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedDate, GEO_IDS.tagTypeId)
    } else {
        dateGeoId = Id.generate();

        //Create Entity and set the name
        addOps = Triple.make({
            entityId: dateGeoId,
            attributeId: SystemIds.NAME_PROPERTY,
            value: {
                type: "TEXT",
                value: formattedDate,
            },
        });
        ops.push(addOps);

        //ADD TAG TYPE TO NEW DATE TAG ENTITY
        addOps = Relation.make({
            fromId: dateGeoId,
            toId: GEO_IDS.tagTypeId,
            relationTypeId: SystemIds.TYPES_PROPERTY,
        });
        ops.push(addOps);

        //ADD A TABLE FOR NEWS STORIES FOR DATE
        //CREATE THE DATA BLOCK
        position = Position.createBetween();
        blockOps = DataBlock.make({
            fromId: dateGeoId,
            sourceType: 'QUERY',
            name: longFormattedDate,
            position: position,
        });
        ops.push(...blockOps);
    
        //console.log(blockOps)
        blockId = blockOps[2].relation.toEntity;
        blockRelationId = blockOps[2].relation.id;
    
        filter = `{"where":{"spaces":["${GEO_IDS.cryptoNewsSpaceId}"],"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.newsStoryTypeId}"},{"attribute":"${GEO_IDS.tagsPropertyId}","is":"${dateGeoId}"}]}}`
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
            toId: SystemIds.LIST_VIEW,
            relationTypeId: SystemIds.VIEW_PROPERTY,
        });
        ops.push(addOps);

        addOps = Relation.make({
            fromId: blockRelationId,
            toId: GEO_IDS.publishDateId,
            relationTypeId: SystemIds.PROPERTIES,
        });
        ops.push(addOps);
    }

    if (dateGeoId) {
        //ADD DATE TAG TO PARENT ENTITY
        addOps = Relation.make({
            fromId: parent_geo_id,
            toId: dateGeoId,
            relationTypeId: GEO_IDS.tagsPropertyId,
        });
        ops.push(addOps);
    }

    return [ops, dateGeoId]
}


async function processWeek(currentOps, parent_geo_id, tag_date: string, dateGeoId): Promise<[Array<Op>, string]> {
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
    } else if (await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedWeek, GEO_IDS.tagTypeId)) { //Search graphDB for web url
        weekGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedWeek, GEO_IDS.tagTypeId)
    } else {
        weekGeoId = Id.generate();

        //Create Entity and set the name
        addOps = Triple.make({
            entityId: weekGeoId,
            attributeId: SystemIds.NAME_PROPERTY,
            value: {
                type: "TEXT",
                value: formattedWeek,
            },
        });
        ops.push(addOps);

        //ADD TAG TYPE TO NEW WEEK TAG ENTITY
        addOps = Relation.make({
            fromId: weekGeoId,
            toId: GEO_IDS.tagTypeId,
            relationTypeId: SystemIds.TYPES_PROPERTY,
        });
        ops.push(addOps);

        //Add quarter tag

        let quarterGeoId;
        if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedQuarter)) { //Search current ops for web url
            quarterGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedQuarter)
        } else if (await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedQuarter, GEO_IDS.tagTypeId)) { //Search graphDB for web url
            quarterGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedQuarter, GEO_IDS.tagTypeId)
        } else {
            quarterGeoId = Id.generate();

            //Create Entity and set the name
            addOps = Triple.make({
                entityId: quarterGeoId,
                attributeId: SystemIds.NAME_PROPERTY,
                value: {
                    type: "TEXT",
                    value: formattedQuarter,
                },
            });
            ops.push(addOps);

            //ADD TAG TYPE TO NEW WEEK TAG ENTITY
            addOps = Relation.make({
                fromId: quarterGeoId,
                toId: GEO_IDS.tagTypeId,
                relationTypeId: SystemIds.TYPES_PROPERTY,
            });
            ops.push(addOps);
        }
        if (quarterGeoId) {
            //ADD Quarter TAG TO Week ENTITY
            addOps = Relation.make({
                fromId: weekGeoId,
                toId: quarterGeoId,
                relationTypeId: GEO_IDS.tagsPropertyId,
            });
            ops.push(addOps);
        }

        


        //CREATE TOP NEWS STORIES THE DATA BLOCK
        blockOps = DataBlock.make({
            fromId: weekGeoId,
            sourceType: 'QUERY',
            name: "News stories of the week",
            position: "1RQgZNIZ.A",
        });
        ops.push(...blockOps);
    
        //console.log(blockOps)
        blockId = blockOps[2].relation.toEntity;
        blockRelationId = blockOps[2].relation.id;

        filter = `{"where":{"spaces":["${GEO_IDS.cryptoNewsSpaceId}"],"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.newsStoryTypeId}"}, {"attribute":"${GEO_IDS.tagsPropertyId}","is":"${GEO_IDS.newsStoryOfTheWeekTagId}"}, {"attribute":"${GEO_IDS.tagsPropertyId}","is":"${weekGeoId}"}]}}`
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
            toId: SystemIds.GALLERY_VIEW,
            relationTypeId: SystemIds.VIEW_PROPERTY,
        });
        ops.push(addOps);


        //CREATE Previous weeks THE DATA BLOCK
        blockOps = DataBlock.make({
            fromId: weekGeoId,
            sourceType: 'COLLECTION',
            name: "Previous news stories",
            position: "1RQgZNIZ.Z",
        });
        ops.push(...blockOps);
    
        //console.log(blockOps)
        blockId = blockOps[2].relation.toEntity;
        blockRelationId = blockOps[2].relation.id;

        let formattedPastWeek;
        for (let i = 1; i < 4; i++) {
            if ((weekNumber - i) < 1) {
                formattedPastWeek = `Week ${52 - (weekNumber-i)} of ${date.getFullYear() - 1}`;
            } else if ((weekNumber - i) < 10) {
                formattedPastWeek = `Week 0${weekNumber-i} of ${date.getFullYear()}`;
            } else {
                formattedPastWeek = `Week ${weekNumber-i} of ${date.getFullYear()}`;
            }

            let pastWeekGeoId = null;
            if (await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedPastWeek)) { //Search current ops for web url
                pastWeekGeoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", formattedPastWeek)
            } else if (await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedPastWeek, GEO_IDS.tagTypeId)) { //Search graphDB for web url
                pastWeekGeoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, formattedPastWeek, GEO_IDS.tagTypeId)
            }

            if (pastWeekGeoId) {
                position = Position.createBetween();
                addOps = Relation.make({
                    fromId: blockId,
                    toId: pastWeekGeoId,
                    relationTypeId: SystemIds.COLLECTION_ITEM_RELATION_TYPE,
                    position: position,
                });
                ops.push(addOps);
            }
        }
    
        filter = `{"where":{"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.tagTypeId}"}]}}`
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
            toId: SystemIds.GALLERY_VIEW,
            relationTypeId: SystemIds.VIEW_PROPERTY,
        });
        ops.push(addOps);



    }

    if (weekGeoId) {
        //ADD WEEK TAG TO PARENT ENTITY
        addOps = Relation.make({
            fromId: parent_geo_id,
            toId: weekGeoId,
            relationTypeId: GEO_IDS.tagsPropertyId,
        });
        ops.push(addOps);
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
        //CREATE THE DATA BLOCK
        blockOps = DataBlock.make({
            fromId: weekGeoId,
            sourceType: 'QUERY',
            name: longFormattedDate,
            position: position,
        });
        ops.push(...blockOps);
    
        //console.log(blockOps)
        blockId = blockOps[2].relation.toEntity;
        blockRelationId = blockOps[2].relation.id;
    
        filter = `{"where":{"spaces":["${GEO_IDS.cryptoNewsSpaceId}"],"AND":[{"attribute":"${SystemIds.TYPES_PROPERTY}","is":"${GEO_IDS.newsStoryTypeId}"},{"attribute":"${GEO_IDS.tagsPropertyId}","is":"${dateGeoId}"}]}}`
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
            toId: SystemIds.LIST_VIEW,
            relationTypeId: SystemIds.VIEW_PROPERTY,
        });
        ops.push(addOps);

        addOps = Relation.make({
            fromId: blockRelationId,
            toId: GEO_IDS.publishDateId,
            relationTypeId: SystemIds.PROPERTIES,
        });
        ops.push(addOps);
    }

    return [ops, weekGeoId]
}

export async function processTags(currentOps, parent_geo_id, tag_date: string): Promise<Array<Op>> {
//I SEND DATE IN HERE AND MANAGE IT IN HERE INSTEAD OF SENDING THE TAG STRING
//THEN FROM THAT DATE, I will know if I need to create a new data block in the week of tag
//I ALSO NEED TO ADD THE QX YYYY tag to the week of page.
    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

    console.log("TAG DATE STRING: ", tag_date)

    let dateGeoId: string;
    [addOps, dateGeoId] = await processDate(currentOps, parent_geo_id, tag_date);
    ops.push(...addOps)

    let weekGeoId: string;
    [addOps, weekGeoId] = await processWeek(currentOps, parent_geo_id, tag_date, dateGeoId);
    ops.push(...addOps)

    return ops
}


