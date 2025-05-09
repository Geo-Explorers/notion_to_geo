import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS, buildGeoFilter, createQueryDataBlock, processNewTriple, processNewRelation, addSpace } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps, searchGetPublisherAvatar, searchEntity, normalizeUrl, hasBeenEdited, searchOpsForPublisherAvatar } from "./search_entities";
import { processPerson } from "./process_person";
import { processPublisher } from "./process_publisher";
import { processProject } from "./process_project";
import { processTopic } from "./process_topic";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processPost(currentOps: Array<Op>, postId: string, notion: any): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    const currSpaceId = GEO_IDS.cryptoSpaceId;
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: postId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    //console.log("Source name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    //console.log("Description:", desc);
    //Description
    const abstract = getConcatenatedPlainText(page.properties["Abstract"]?.rich_text);
    //console.log("Description:", desc);

    // Publish date
    //const publish_date = sourcePage.properties["Publish date"]?.date?.start ?? "NONE";
    const publish_date = page.properties["Publish date"]?.date?.start 
    ? new Date(page.properties["Publish date"].date.start).toISOString().split("T")[0] + "T00:00:00.000Z": "NONE";
    //console.log("Publish date:", publish_date);

    //Web URL
    const web_url = normalizeUrl(page.properties["Web URL"]?.url ?? "NONE");
    
    //Discussion link
    const discussion_link = normalizeUrl(page.properties["Discussion link"]?.url ?? "NONE");
    
    if (geoId = await searchOps(currentOps, GEO_IDS.webURLId, "URL", web_url, GEO_IDS.improvementProposalTypeId)) { //Search current ops for web url
        return [ops, geoId]
    } else {
        geoId = await searchEntities(currSpaceId, GEO_IDS.webURLId, web_url, GEO_IDS.improvementProposalTypeId);
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
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
                ops.push(...addOps);
            }

            //Write Description ops
            if (desc != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
                ops.push(...addOps);
            }

            //Write Description ops
            if (abstract != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.abstractPropertyId, abstract, "TEXT");
                ops.push(...addOps);
            }

            //Write publish date ops
            if (publish_date != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.publishDateId, publish_date, "TIME", "MMMM d, yyyy");
                ops.push(...addOps);
            }
            
            //Write web URL ops
            if (web_url != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.webURLId, web_url, "URL");
                ops.push(...addOps);
            }
            //Write web URL ops
            if (discussion_link != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.discussionLinkPropertyId, discussion_link, "URL");
                ops.push(...addOps);
            }

            addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, GEO_IDS.improvementProposalTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);
            
            //Network
            let networkAvater = null;
            const networks = page.properties["Network"].relation;
            let networkGeoId;
            for (const network of networks) { //for each quote
                [addOps, networkGeoId] = await processProject([...currentOps, ...ops], network.id, notion);
                ops.push(...addOps);

                if (networkGeoId) {
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, networkGeoId, GEO_IDS.networkPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);

                    //TODO - What if publisher isnt on geo yet? Need to search ops as well... NOTE THESE WOULD BE THE CRYPTO SPACE OPS
                    networkAvater = await searchGetPublisherAvatar(GEO_IDS.cryptoSpaceId, GEO_IDS.avatarPropertyId, networkGeoId);
                    if (!networkAvater) {
                        //Search crypto space Ops for image id
                        networkAvater = await searchOpsForPublisherAvatar([...currentOps, ...ops], networkGeoId)
                    }
                }
            }

            //TODO - CHECK IF THERE IS ALREADY AN AVATAR...
            //Also, what if I created tbe 
            //Write avatar ops
            let geoProperties;
            if (entityOnGeo) {
                geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                    (item) => 
                        item.spaceId === currSpaceId &&
                        item.typeOfId === GEO_IDS.avatarPropertyId
                );
            } else {
                geoProperties = [];
            }
            if ((networkAvater) && (geoProperties.length < 1)) {
                addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, networkAvater, GEO_IDS.avatarPropertyId, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);
            }


            

            //Authors
            const authors = page.properties["Authors"].relation;
            let authorGeoId;
            for (const author of authors) {
                [addOps, authorGeoId] = await processPerson([...currentOps, ...ops], author.id, notion);
                ops.push(...addOps);
                

                if (authorGeoId) {
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, authorGeoId, GEO_IDS.authorsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);
                }
            }

            //Related people
            const people = page.properties["Related people"].relation;
            firstPosition = PositionRange.FIRST;
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
            position = Position.createBetween(firstPosition, lastPosition);
            //position = INITIAL_RELATION_INDEX_VALUE;
            let relatedPersonGeoId;
            for (const person of people) { //for each quote
                [addOps, relatedPersonGeoId] = await processPerson([...currentOps, ...ops], person.id, notion);
                ops.push(...addOps);

                if (relatedPersonGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, relatedPersonGeoId, GEO_IDS.relatedPeoplePropertyId, position);
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
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, relatedProjectGeoId, GEO_IDS.relatedProjectsPropertyId, position);
                    ops.push(...addOps);
                }
            }

            //Related topics
            const topics = page.properties["Related topics"].relation;
            firstPosition = PositionRange.FIRST;
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
            position = Position.createBetween(firstPosition, lastPosition);
            //position = INITIAL_RELATION_INDEX_VALUE;
            let relatedTopicGeoId;
            for (const topic of topics) { //for each quote
                relatedTopicGeoId = await processTopic(topic.id, notion);

                if (relatedTopicGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedTopicGeoId, GEO_IDS.relatedTopicsPropertyId, position);
                    ops.push(...addOps);
                }
            }
        }
        return [await addSpace(ops, currSpaceId), geoId];

    }
}


