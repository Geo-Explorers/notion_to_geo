import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS, getWeekNumber, processNewRelation, processNewTriple } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchEntity, searchOps } from "./search_entities";
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

    // Event date - If news event type
    const event_date = page.properties["Date (news event only)"]?.date?.start 
    ? new Date(page.properties["Date (news event only)"].date.start).toISOString().split("T")[0] + "T00:00:00.000Z": "NONE";

    //HANDLE TAGS (BOTH DATE AND WEEK XX OF YEAR)
    const tag_date = page.properties["Date (news event only)"]?.date?.start ?? "NONE";
    console.log("Tag date:", tag_date)
    
    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, GEO_IDS.claimTypeId)) {
        return [ops, geoId]
    } else {
        geoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, name, GEO_IDS.claimTypeId)
        let entityOnGeo;
        if (!geoId) {
            geoId = Id.generate();
        } else {
            entityOnGeo = await searchEntity(geoId);
            console.log("entity exists on geo")
        }

        if (name != "NONE") {
            addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
            ops.push(...addOps);
        }

            //Write Description ops
        if (desc != "NONE") {
            addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
            ops.push(...addOps);
        }

        // Write Types ops
        addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.claimTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
        ops.push(...addOps);
        
        //Write publish date ops
        if (event_date != "NONE") {
            addOps = await processNewTriple(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.eventDatePropertyId, event_date, "TIME", "MMMM d, yyyy");
            ops.push(...addOps);

            addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.newsEventTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);
        }

        //Quotes that support the claim
        const quotesSupporting = page.properties["Quotes that support the claim"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        let quoteGeoId: string;
        for (const quote of quotesSupporting) { //for each quote
            [addOps, quoteGeoId] = await processQuote([...currentOps, ...ops], quote.id, notion);
            ops.push(...addOps);

            if (quoteGeoId) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, quoteGeoId, GEO_IDS.quotesSupportingPropertyId, position);
                ops.push(...addOps);
            }
        }

        //Related people
        const people = page.properties["Related people"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        let relatedPersonGeoId: string;
        for (const person of people) { //for each quote
            relatedPersonGeoId = await processPerson(person.id, notion);

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
        let relatedProjectGeoId: string;
        for (const project of projects) { //for each quote
            relatedProjectGeoId = await processProject(project.id, notion);

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
        let relatedTopicGeoId: string;
        for (const topic of topics) { //for each quote
            relatedTopicGeoId = await processTopic(topic.id, notion);

            if (relatedTopicGeoId) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedTopicGeoId, SystemIds.RELATED_TOPICS_PROPERTY, position);
                ops.push(...addOps);
            }
        }

        if (tag_date != "NONE") { // TODO - NOTE SHOULD REALLY CHECK IF THE RIGHT TAGS ARE THERE FIRST... CANT JUST ASSUME THEY WERE SET RIGHT INITIAILLY
            if (!entityOnGeo) {
                addOps = await processTags([...currentOps, ...ops], geoId, tag_date);
                ops.push(...addOps);
            }
        }

        return [ops, geoId];

    }
}