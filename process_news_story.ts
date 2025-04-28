import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps, searchNewsStory } from "./search_entities";
import { processPerson } from "./process_person";
import { processProject } from "./process_project";
import { processTopic } from "./process_topic";
import { processSource } from "./process_source";
import { processPublisher } from "./process_publisher";
import { processCollection } from "./process_collection";
import { processTags } from "./process_tags";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processNewsStory(currentOps: Array<Op>, storyId: string, notion: any): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: storyId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    console.log("News Story name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    console.log("Description:", desc);

    // Publish date
    const publish_date = page.properties["Publish date"]?.date?.start 
    ? new Date(page.properties["Publish date"].date.start).toISOString().split("T")[0] + "T00:00:00.000Z": "NONE";
    console.log("Publish date:", publish_date);

    // Cover
    const cover_url = page.properties["Cover"]?.files?.[0]?.file?.url ?? "NONE"

    //HANDLE TAGS (BOTH DATE AND WEEK XX OF YEAR)
    const tag_date = page.properties["Publish date"]?.date?.start ?? "NONE";
    console.log("Tag date:", tag_date)

    const newsStoryOfTheDay = page.properties["News story of the day"]?.checkbox;
    const newsStoryOfTheWeek = page.properties["News story of the week"]?.checkbox;
    
    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, GEO_IDS.newsStoryTypeId)) { //Search current ops for web url
        return [ops, geoId]
    } else if (geoId = await searchNewsStory(GEO_IDS.cryptoNewsSpaceId, name, publish_date)) { //Search graphDB for web url
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


        const collections = page.properties["Collections"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE
        for (const collection of collections) {
            //position = Position.createBetween(position, PositionRange.LAST)
            position = Position.createBetween(position, lastPosition);
            addOps = await processCollection([...currentOps, ...ops], geoId, collection.id, position, notion);
            ops.push(...addOps)
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

        //Write avatar ops
        if (cover_url != "NONE") {
            // create an image
            const { id: imageId, ops: createImageOps } = await Graph.createImage({
                url: cover_url,
            });

            ops.push(...createImageOps)

            addOps = Relation.make({
                fromId: geoId,
                toId: imageId,
                relationTypeId: SystemIds.COVER_PROPERTY, //AVATAR_PROPERTY 
            });
            ops.push(addOps);
        }
        //WRITE TYPE OPS
        addOps = Relation.make({
            fromId: geoId,
            toId: GEO_IDS.newsStoryTypeId,
            relationTypeId: SystemIds.TYPES_PROPERTY,
        });
        ops.push(addOps);
        

        //Sources
        const sources = page.properties["Sources"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE;
        let sourceGeoId;
        for (const source of sources) { //for each quote
            [addOps, sourceGeoId] = await processSource([...currentOps, ...ops], source.id, notion);
            ops.push(...addOps);

            position = Position.createBetween(position, lastPosition);
            //position = Position.createBetween(position, PositionRange.LAST)
            addOps = Relation.make({
                fromId: geoId,
                toId: sourceGeoId,
                relationTypeId: GEO_IDS.sourcesPropertyId,
                position: position,
            });
            ops.push(addOps);
        }

        //Related people
        const people = page.properties["Related people"].relation;
        firstPosition = PositionRange.FIRST
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST)
        position = Position.createBetween(firstPosition, lastPosition)
        //position = INITIAL_RELATION_INDEX_VALUE;
        let relatedPersonGeoId;
        for (const person of people) { //for each quote
            relatedPersonGeoId = await processPerson(person.id, notion);

            if (relatedPersonGeoId) {
                position = Position.createBetween(position, lastPosition);
                //position = Position.createBetween(position, PositionRange.LAST)
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
        let relatedTopicGeoId;
        for (const topic of topics) { //for each quote
            relatedTopicGeoId = await processTopic(topic.id, notion);

            if (relatedTopicGeoId) {
                position = Position.createBetween(position, lastPosition);
                //position = Position.createBetween(position, PositionRange.LAST)
                addOps = Relation.make({
                    fromId: geoId,
                    toId: relatedTopicGeoId,
                    relationTypeId: SystemIds.RELATED_TOPICS_PROPERTY,
                    position: position,
                });
                ops.push(addOps);
            }
        }

        //Maintainers
        const maintainers = page.properties["Maintainers"].relation;
        let maintainerGeoId;
        for (const maintainer of maintainers) { //for each quote
            await new Promise(resolve => setTimeout(resolve, 200));
            const maintainerPage = await notion.pages.retrieve({ page_id: maintainer.id });
            maintainerGeoId = getConcatenatedPlainText(maintainerPage.properties["Geo ID"]?.rich_text);
            console.log("MAINTAINER: ", maintainerGeoId)
            if (maintainerGeoId != "NONE") {
                addOps = Relation.make({
                    fromId: geoId,
                    toId: maintainerGeoId,
                    relationTypeId: GEO_IDS.maintainersPropertyId,
                });
                ops.push(addOps);
            }
        }

        //Publisher
        const publishers = page.properties["Publishers"].relation;
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
            }
        }
        // STILL NEED TO ADD TAGS
        // Parse input into Date object
        if (tag_date != "NONE") {
            addOps = await processTags([...currentOps, ...ops], geoId, tag_date);
            ops.push(...addOps);
        }

        if (newsStoryOfTheDay) {
            //WRITE Story of the day TAG
            addOps = Relation.make({
                fromId: geoId,
                toId: GEO_IDS.newsStoryOfTheDayTagId,
                relationTypeId: GEO_IDS.tagsPropertyId,
            });
            ops.push(addOps);
        }

        if (newsStoryOfTheWeek) {
            //WRITE Story of the week TAG
            addOps = Relation.make({
                fromId: geoId,
                toId: GEO_IDS.newsStoryOfTheWeekTagId,
                relationTypeId: GEO_IDS.tagsPropertyId,
            });
            ops.push(addOps);
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