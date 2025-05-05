import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { TABLES, getConcatenatedPlainText, GEO_IDS, processNewRelation, processNewTriple, buildGeoFilter, createQueryDataBlock } from './src/constants';
import { hasBeenEdited, normalizeUrl, searchArticles, searchEntities, searchEntity, searchOps, searchUniquePublishers } from "./search_entities";
import { processTopic } from "./process_topic";
import { processProject } from "./process_project";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processPerson(currentOps, personId: string, notion: any, publisher?: string): Promise<[Array<Op>, geoId]> {

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: personId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    //console.log("Project page:", page.properties["Name"]);
    console.log("Project name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    console.log("Description:", desc);

    //Web URL
    const xLink = normalizeUrl(page.properties["X"]?.url ?? "NONE");

    // Avatar
    const avatar_url = page.properties["Avatar"]?.files?.[0]?.file?.url ?? "NONE"
    // Cover
    const cover_url = page.properties["Cover"]?.files?.[0]?.file?.url ?? "NONE"

    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, SystemIds.PERSON_TYPE)) { //Search current ops for web url
        return [ops, geoId]
    } else {
        geoId = await searchEntities(GEO_IDS.cryptoSpaceId, SystemIds.NAME_PROPERTY, name, SystemIds.PERSON_TYPE);
        let entityOnGeo;
        if (!geoId) {
            geoId = Id.generate();
        } else {
            entityOnGeo = await searchEntity(geoId);
            console.log("entity exists on geo")
        }

        if (await hasBeenEdited(currentOps, geoId)) {
            return [ops, geoId]
        } else {

            if (name != "NONE") {
                addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
                ops.push(...addOps);
            }

            //Write Description ops
            if (desc != "NONE") {
                addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
                ops.push(...addOps);
            }

            //Write X Link ops
            if (xLink != "NONE") {
                addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.xLinkPropertyId, xLink, "URL");
                ops.push(...addOps);
            }

            //Add person type
            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, SystemIds.PERSON_TYPE, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);

            //Write cover ops
            if (avatar_url != "NONE") {
                let geoProperties
                if (entityOnGeo) {
                    geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                        (item) => 
                            item.spaceId === GEO_IDS.cryptoNewsSpaceId &&
                            item.typeOfId === GEO_IDS.avatarPropertyId
                    );
                } else {
                    geoProperties = []
                }

                if (geoProperties.length < 1) {
                    // create an image
                    const { id: imageId, ops: createImageOps } = await Graph.createImage({
                        url: avatar_url,
                    });
                    ops.push(...createImageOps)

                    addOps = Relation.make({
                        fromId: geoId,
                        toId: imageId,
                        relationTypeId: GEO_IDS.avatarPropertyId, //AVATAR_PROPERTY 
                    });
                    ops.push(addOps);
                }
            }

            //Related people
            const people = page.properties["Related people"].relation;
            firstPosition = PositionRange.FIRST
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST)
            position = Position.createBetween(firstPosition, lastPosition)
            //position = INITIAL_RELATION_INDEX_VALUE;
            let relatedPersonGeoId;
            for (const person of people) { //for each quote
                [addOps, relatedPersonGeoId] = await processPerson([...currentOps, ...ops], person.id, notion);
                ops.push(...addOps);

                if (relatedPersonGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedPersonGeoId, GEO_IDS.relatedPeoplePropertyId, position);
                    ops.push(...addOps);
                }
            }


            //Related projects
            const projects = page.properties["Related projects"].relation;
            firstPosition = PositionRange.FIRST;
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
            position = Position.createBetween(firstPosition, lastPosition);
            //position = INITIAL_RELATION_INDEX_VALUE;
            let relatedProjectGeoId;
            for (const project of projects) { //for each quote
                [addOps, relatedProjectGeoId] = await processProject([...currentOps, ...ops], project.id, notion);
                ops.push(...addOps);

                if (relatedProjectGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedProjectGeoId, GEO_IDS.relatedProjectsPropertyId, position);
                    ops.push(...addOps);
                }
            }

            //Related topics
            const topics = page.properties["Related topics"].relation;
            firstPosition = PositionRange.FIRST;
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
            position = Position.createBetween(firstPosition, lastPosition);
            let relatedTopicGeoId;
            for (const topic of topics) { //for each quote
                relatedTopicGeoId = await processTopic(topic.id, notion);

                if (relatedTopicGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedTopicGeoId, SystemIds.RELATED_TOPICS_PROPERTY, position);
                    ops.push(...addOps);
                }
            }

            //IS PERSON AN AUTHOR?
            if ((publisher) || (await searchArticles(GEO_IDS.cryptoNewsSpaceId, geoId, GEO_IDS.authorsPropertyId))) { //Seach graph to see if they are author of any articles
                //Add a datatable with all their authored articles

                //Add quotes data block to source page
                const filter = buildGeoFilter(
                    [GEO_IDS.cryptoNewsSpaceId],
                    [
                    { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.articleTypeId },
                    { attribute: GEO_IDS.authorsPropertyId, is: geoId }
                    ]
                );
                if (entityOnGeo) {
                    const blocksOnEntity = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                        (item) => 
                            item.spaceId === GEO_IDS.cryptoSpaceId &&
                            item.typeOfId === SystemIds.BLOCKS &&
                            item.toEntity.name?.toLowerCase() === "Articles"?.toLowerCase()
                    );
                    if (blocksOnEntity.length < 1) {
                        addOps = createQueryDataBlock("Articles", geoId, filter, GEO_IDS.bulletListView, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                        ops.push(...addOps);
                    }
                } else {
                    addOps = createQueryDataBlock("Articles", geoId, filter, GEO_IDS.bulletListView, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                    ops.push(...addOps);
                }

                //Add role author
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.authorTypeId, GEO_IDS.rolesPropertyId, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);

                //Add all the publishers they posted for as "Published articles in". Note, need to make sure they havent been added before
                // use publisher input to this function.
                if (publisher){
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, publisher, GEO_IDS.publishedInPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);
                }
                const publisherList = await searchUniquePublishers(GEO_IDS.cryptoNewsSpaceId, geoId, GEO_IDS.authorsPropertyId);
                if (publisherList) {
                    for (const pub of publisherList) {
                        addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, pub, GEO_IDS.publishedInPropertyId, INITIAL_RELATION_INDEX_VALUE);
                        ops.push(...addOps);
                    }
                }

            }
            

            //Add minimum amount of info to run this code...

            //Add spaceId to each op
            let spaceId = GEO_IDS.cryptoSpaceId;
            const updatedOps = ops.map(op => ({
                ...op,
                spaceId
            }));
            console.log(updatedOps)
            console.error("CALLED WRONG FUNCTION")
            //If i have some ops with space id and some not will this work?
            return [updatedOps, geoId]
            

        }
    }
    

}





