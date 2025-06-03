import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import {TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, processNewTriple, processNewRelation, addSpace } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps, searchNewsStory, searchEntity, hasBeenEdited, cleanText } from "./search_entities";
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
    const currSpaceId = GEO_IDS.cryptoNewsSpaceId;
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: storyId });
    
    //Name
    const name = cleanText(getConcatenatedPlainText(page.properties["Name"]?.title));
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
    } else {

        geoId = await searchNewsStory(currSpaceId, name, publish_date);
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
        
            //Write name ops
            if (name != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
                ops.push(...addOps);
            }

            const collections = page.properties["Collections"].relation;
            firstPosition = PositionRange.FIRST;
            lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
            position = Position.createBetween(firstPosition, lastPosition);
            for (const collection of collections) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processCollection([...currentOps, ...ops], geoId, collection.id, position, notion, entityOnGeo, currSpaceId, true);
                ops.push(...addOps)
            }
            
            
            

            //Write Description ops
            if (desc != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
                ops.push(...addOps);
            }

            //Write publish date ops
            if (publish_date != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.publishDateId, publish_date, "TIME", "MMMM d, yyyy");
                ops.push(...addOps);
            }

            //Add news story type...
            addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, GEO_IDS.newsStoryTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);
            

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

                if (sourceGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, sourceGeoId, GEO_IDS.sourcesPropertyId, position);
                    ops.push(...addOps);
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
            let relatedTopicGeoId;
            for (const topic of topics) { //for each quote
                relatedTopicGeoId = await processTopic(topic.id, notion);

                if (relatedTopicGeoId) {
                    position = Position.createBetween(position, lastPosition);
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, relatedTopicGeoId, GEO_IDS.relatedTopicsPropertyId, position);
                    ops.push(...addOps);
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
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, maintainerGeoId, GEO_IDS.maintainersPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);
                }
            }

            // STILL NEED TO ADD TAGS
            // Parse input into Date object
            let dateGeoId;
            let weekGeoId;
            if (tag_date != "NONE") { // TODO - NOTE SHOULD REALLY CHECK IF THE RIGHT TAGS ARE THERE FIRST... CANT JUST ASSUME THEY WERE SET RIGHT INITIAILLY
                [addOps, dateGeoId, weekGeoId] = await processTags([...currentOps, ...ops], tag_date);
                ops.push(...addOps);
                if (dateGeoId) {
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, dateGeoId, GEO_IDS.tagsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);
                }
                if (weekGeoId) {
                    addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, weekGeoId, GEO_IDS.tagsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                    ops.push(...addOps);
                }
            }

            if (newsStoryOfTheDay) {
                addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, GEO_IDS.newsStoryOfTheDayTagId, GEO_IDS.tagsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);
            }

            if (newsStoryOfTheWeek) {
                addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, GEO_IDS.newsStoryOfTheWeekTagId, GEO_IDS.tagsPropertyId, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);

                

            }

            //Write cover ops
            if (cover_url != "NONE") {
                let geoProperties
                if (entityOnGeo) {
                    geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                        (item) => 
                            item.spaceId === currSpaceId &&
                            item.typeOfId === SystemIds.COVER_PROPERTY
                    );
                } else {
                    geoProperties = [];
                }

                if (geoProperties.length < 1) {
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

                    //Add as cover of week tag if it is a news story of the week
                    if (newsStoryOfTheWeek) { // TODO - CHECK IF THERE IS ALREADY A COVER AND REMOVE THE RELATION IF SO....
                        if (weekGeoId) {
                            let weekEntityOnGeo = await searchEntity(weekGeoId);
                            let geoProperties;
                            if (weekEntityOnGeo) {
                                geoProperties = weekEntityOnGeo?.relationsByFromVersionId?.nodes.filter(
                                    (item) => 
                                        item.spaceId === currSpaceId &&
                                        item.typeOfId === GEO_IDS.avatarPropertyId
                                );
                            } else {
                                geoProperties = [];
                            }
                            if (geoProperties.length < 1) {
                                addOps = Relation.make({
                                    fromId: weekGeoId,
                                    toId: imageId,
                                    relationTypeId: SystemIds.COVER_PROPERTY, //AVATAR_PROPERTY 
                                });
                                ops.push(addOps);
                            }
                        }
                    }
                }
            }

            // ADD DRAFT TAG
            //addOps = Relation.make({
            //    fromId: geoId,
            //    toId: GEO_IDS.draftTypeId,
            //    relationTypeId: SystemIds.TYPES_PROPERTY,
            //});
            //ops.push(addOps);
        }

        return [await addSpace(ops, currSpaceId), geoId];
        
    }

}