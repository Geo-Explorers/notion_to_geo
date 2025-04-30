import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS, processNewTriple, processNewRelation } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchEntity, searchOps } from "./search_entities";
import { processSource } from "./process_source";
import { processPerson } from "./process_person";
import { processProject } from "./process_project";
import { processTopic } from "./process_topic";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";

export async function processQuote(currentOps: Array<Op>, quoteId: string, notion: any): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: quoteId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    console.log("Quote name:", name);
    
    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, GEO_IDS.quoteTypeId)) { //Search current ops for web url
        return [ops, geoId];
    } else {

        geoId = await searchEntities(GEO_IDS.cryptoNewsSpaceId, SystemIds.NAME_PROPERTY, name, GEO_IDS.quoteTypeId);
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

        // Write Types ops
        addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, GEO_IDS.quoteTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
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
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, sourceGeoId, GEO_IDS.sourcesPropertyId, position);
                ops.push(...addOps);

            }
        }

        //Authors
        const authors = page.properties["Authors"].relation;
        let authorGeoId;
        for (const author of authors) { //for each quote
            authorGeoId = await processPerson(author.id, notion);

            if (authorGeoId) {
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, authorGeoId, GEO_IDS.authorsPropertyId, INITIAL_RELATION_INDEX_VALUE);
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
        //position = INITIAL_RELATION_INDEX_VALUE;
        let relatedProjectGeoId;
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
        //position = INITIAL_RELATION_INDEX_VALUE;
        let relatedTopicGeoId;
        for (const topic of topics) { //for each quote
            relatedTopicGeoId = await processTopic(topic.id, notion);

            if (relatedTopicGeoId) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(GEO_IDS.cryptoNewsSpaceId, entityOnGeo, geoId, relatedTopicGeoId, SystemIds.RELATED_TOPICS_PROPERTY, position);
                ops.push(...addOps);
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


