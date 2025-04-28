import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS, buildGeoFilter, createQueryDataBlock } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps, searchGetPublisherAvatar } from "./search_entities";
import { processPerson } from "./process_person";
import { processPublisher } from "./process_publisher";
import { processProject } from "./process_project";
import { processTopic } from "./process_topic";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processSource(currentOps: Array<Op>, sourceId: string, notion: any): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: sourceId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    //console.log("Source name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    //console.log("Description:", desc);

    // Publish date
    //const publish_date = sourcePage.properties["Publish date"]?.date?.start ?? "NONE";
    const publish_date = page.properties["Publish date"]?.date?.start 
    ? new Date(page.properties["Publish date"].date.start).toISOString().split("T")[0] + "T00:00:00.000Z": "NONE";
    //console.log("Publish date:", publish_date);

    //Web URL
    const web_url = page.properties["Web URL"]?.url ?? "NONE";
    //console.log("Web URL:", web_url);

    //Web Archive URL
    const web_archive_url = page.properties["Web archive URL"]?.url ?? "NONE";

    const sourceType = page.properties["Source Type"]?.select?.name ?? "NONE"
    let typeId = null;
    if (sourceType == "Article") {
        typeId = GEO_IDS.articleTypeId;
    } else if (sourceType == "Post"){
        typeId = GEO_IDS.postTypeId;
    }

    // Avatar
    const avatar_url = page.properties["Avatar"]?.files?.[0]?.file?.url ?? "NONE"
    
    if (geoId = await searchOps(currentOps, GEO_IDS.webURLId, "URL", web_url, typeId)) { //Search current ops for web url
        return [ops, geoId]
    } else if (geoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, GEO_IDS.webURLId, web_url, typeId)) { //Search graphDB for web url
        return [ops, geoId]
    } else {
        //WRITE OPS IF NECESSARY
        geoId = Id.generate();
        
        //Write name ops
        if (name != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: SystemIds.NAME_PROPERTY,
                value: {
                    type: "TEXT",
                    value: name,
                },
            });
            ops.push(addOps);
        }

        //Write Description ops
        if (desc != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: SystemIds.DESCRIPTION_PROPERTY,
                value: {
                    type: "TEXT",
                    value: desc,
                },
            });
            ops.push(addOps);
        }

        //Write publish date ops
        if (publish_date != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: GEO_IDS.publishDateId, 
                value: {
                    type: "TIME",
                    value: publish_date,
                    options: {
                        format: "MMMM d, yyyy",
                    }
                },
            });
            ops.push(addOps);
        }
        
        //Write web URL ops
        if (web_url != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: GEO_IDS.webURLId,
                value: {
                    type: "URL",
                    value: web_url,
                },
            });
            ops.push(addOps);
        }

        //Write web Archive URL ops
        if (web_archive_url != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: GEO_IDS.webArchiveURLId,
                value: {
                    type: "URL",
                    value: web_archive_url,
                },
            });
            ops.push(addOps);
        }


        //Add quotes data block to source page
        const filter = buildGeoFilter(
            [GEO_IDS.cryptoNewsSpaceId],
            [
              { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.quoteTypeId },
              { attribute: GEO_IDS.sourcesPropertyId, is: geoId }
            ]
        );
        addOps = createQueryDataBlock("Highlighed quotes", geoId, filter, GEO_IDS.bulletListView, INITIAL_RELATION_INDEX_VALUE, undefined);
        ops.push(...addOps);


        //Publisher
        let publisherAvater = null;
        const publishers = page.properties["Publisher"].relation;
        let publisherGeoId;
        for (const publisher of publishers) { //for each quote
            publisherGeoId = await processPublisher(publisher.id, notion);

            if (publisherGeoId) {
                addOps = Relation.make({
                    fromId: geoId,
                    toId: publisherGeoId,
                    relationTypeId: GEO_IDS.publisherPropertyId,
                });
                ops.push(addOps);

                publisherAvater = await searchGetPublisherAvatar(GEO_IDS.cryptoSpaceId, GEO_IDS.avatarPropertyId, publisherGeoId)
            }
        }

        //TODO - Change to pull the avatar from the publisher
        //Write avatar ops
        if (publisherAvater) {
            addOps = Relation.make({
                fromId: geoId,
                toId: publisherAvater,
                relationTypeId: GEO_IDS.avatarPropertyId, //AVATAR_PROPERTY 
            });
            ops.push(addOps);
        } else if (avatar_url != "NONE") {
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
        // Write Types ops
        if (typeId) {
            addOps = Relation.make({
                fromId: geoId,
                toId: typeId,
                relationTypeId: SystemIds.TYPES_PROPERTY,
            });
            ops.push(addOps);
        } else {
            addOps = Relation.make({
                fromId: geoId,
                toId: GEO_IDS.articleTypeId,
                relationTypeId: SystemIds.TYPES_PROPERTY,
            });
            ops.push(addOps);
        }

        // TODO - Add related projects
        //Authors
        const authors = page.properties["Authors"].relation;
        let authorGeoId;
        for (const author of authors) { //for each quote
            authorGeoId = await processPerson(author.id, notion);

            if (authorGeoId) {
                addOps = Relation.make({
                    fromId: geoId,
                    toId: authorGeoId,
                    relationTypeId: GEO_IDS.authorsPropertyId,
                });
                ops.push(addOps);
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
            relatedPersonGeoId = await processPerson(person.id, notion);

            if (relatedPersonGeoId) {
                position = Position.createBetween(position, lastPosition);
                //position = Position.createBetween(position, PositionRange.LAST);
                addOps = Relation.make({
                    fromId: geoId,
                    toId: relatedPersonGeoId,
                    relationTypeId: GEO_IDS.relatedPeoplePropertyId,
                    position: position,
                });
                ops.push(addOps);
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
            relatedProjectGeoId = await processProject(project.id, notion);

            if (relatedProjectGeoId) {
                position = Position.createBetween(position, lastPosition);
                //position = Position.createBetween(position, PositionRange.LAST);
                addOps = Relation.make({
                    fromId: geoId,
                    toId: relatedProjectGeoId,
                    relationTypeId: GEO_IDS.relatedProjectsPropertyId,
                    position: position,
                });
                ops.push(addOps);
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
                //position = Position.createBetween(position, PositionRange.LAST);
                addOps = Relation.make({
                    fromId: geoId,
                    toId: relatedTopicGeoId,
                    relationTypeId: SystemIds.RELATED_TOPICS_PROPERTY,
                    position: position,
                });
                ops.push(addOps);
            }
        }

        // ADD DRAFT TAG
        //addOps = Relation.make({
        //    fromId: geoId,
        //    toId: GEO_IDS.draftTypeId,
        //    relationTypeId: SystemIds.TYPES_PROPERTY,
        //});
        //ops.push(addOps);

        return [ops, geoId];

    }
    


}


