import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps } from "./search_entities";
import { processQuote } from "./process_quote";
import { processPerson } from "./process_person";
import { processTags } from "./process_tags";
import { processProject } from "./process_project";
import { processTopic } from "./process_topic";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";


export async function processClaim(currentOps: Array<Op>, claimId: string, notion: any): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: claimId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    console.log("Claim name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    //console.log("Description:", desc);

    // Publish date
    //const publish_date = sourcePage.properties["Publish date"]?.date?.start ?? "NONE";
    const event_date = page.properties["Date (news event only)"]?.date?.start 
    ? new Date(page.properties["Date (news event only)"].date.start).toISOString().split("T")[0] + "T00:00:00.000Z": "NONE";
    //console.log("Date (news event only):", event_date);

    //HANDLE TAGS (BOTH DATE AND WEEK XX OF YEAR)
    const tag_date = page.properties["Date (news event only)"]?.date?.start ?? "NONE";
    console.log("Tag date:", tag_date)
    
    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, GEO_IDS.claimTypeId)) {
        return [ops, geoId]
    } else if (geoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, name, GEO_IDS.claimTypeId)) { //Search graphDB for web url
        //Is the name set? Obviously, thats what we searched for

        //Do we have a description from notion?
        //If so, is the description set?

        //Do we have an event date from notion?
        //If so, is the event date set?
        //If not, make sure to set it and add news event type

        //Are all the appropriate quotes supporting set?
        //Are all the appropriate related people set?
        //Are all the appropriate related projects set?
        //Are all the appropriate related topics set?
        
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
        if (event_date != "NONE") {
            //Create Entity and set the name
            addOps = Triple.make({
                entityId: geoId,
                attributeId: GEO_IDS.eventDatePropertyId, 
                value: {
                    type: "TIME",
                    value: event_date,
                    options: {
                        format: "MMMM d, yyyy",
                    }
                },
            });
            ops.push(addOps);
        }
        // Write Types ops
        
        addOps = Relation.make({
            fromId: geoId,
            toId: GEO_IDS.claimTypeId,
            relationTypeId: SystemIds.TYPES_PROPERTY,
        });
        ops.push(addOps);

        if (event_date != "NONE") {
            addOps = Relation.make({
                fromId: geoId,
                toId: GEO_IDS.newsEventTypeId,
                relationTypeId: SystemIds.TYPES_PROPERTY,
            });
            ops.push(addOps);
        }
        

        //Quotes that support the claim
        const quotesSupporting = page.properties["Quotes that support the claim"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE;
        let quoteGeoId;
        for (const quote of quotesSupporting) { //for each quote
            [addOps, quoteGeoId] = await processQuote([...currentOps, ...ops], quote.id, notion);
            ops.push(...addOps);

            position = Position.createBetween(position, lastPosition);
            //position = Position.createBetween(position, PositionRange.LAST);
            addOps = Relation.make({
                fromId: geoId,
                toId: quoteGeoId,
                relationTypeId: GEO_IDS.quotesSupportingPropertyId,
                position: position,
            });
            ops.push(addOps);
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

        if (tag_date != "NONE") {
            addOps = await processTags([...currentOps, ...ops], geoId, tag_date);
            ops.push(...addOps);
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
    
    //SEARCH FOR AND / OR CREATE THE APPROPRIATE TAGS


}


