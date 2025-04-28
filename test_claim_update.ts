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

const mainnet_query_url = "https://hypergraph.up.railway.app/graphql";
const testnet_query_url = "https://geo-conduit.up.railway.app/graphql";
const QUERY_URL = mainnet_query_url;

export async function processNewTriple(entityOnGeo: any, geoId: string, propertyId: string, propertyValue: string, valueType: any, format: string | null = null): Promise<Array<Op>> {
    let geoPropertyValue;
    let geoProperties;
    const ops: Array<Op> = [];
    let addOps;

    if (entityOnGeo) {
        geoProperties = entityOnGeo?.triples?.nodes.filter(
            (item) => item.attributeId === propertyId
        );
        if (geoProperties.length > 0) { //Note if it is greater than 1, we may be dealing with a multi space entity and I need to make sure I am in the correct space...
            geoPropertyValue = geoProperties?.[0]?.textValue
            console.log("Current description: ", geoPropertyValue)
            if (propertyValue != geoPropertyValue) {
                if (format) {
                    addOps = Triple.make({
                        entityId: geoId,
                        attributeId: propertyId,
                        value: {
                            type: valueType,
                            value: propertyValue,
                            options: {
                                format: format,
                            }
                        },
                    });
                    ops.push(addOps);

                } else {
                    addOps = Triple.make({
                        entityId: geoId,
                        attributeId: propertyId,
                        value: {
                            type: valueType,
                            value: propertyValue,
                        },
                    });
                    ops.push(addOps);
                }
                
            }
        }

    } else {
        //Create Entity and set the name
        if (format) {
            addOps = Triple.make({
                entityId: geoId,
                attributeId: propertyId,
                value: {
                    type: valueType,
                    value: propertyValue,
                    options: {
                        format: format,
                    }
                },
            });
            ops.push(addOps);
        } else {
            addOps = Triple.make({
                entityId: geoId,
                attributeId: propertyId,
                value: {
                    type: valueType,
                    value: propertyValue,
                },
            });
            ops.push(addOps);
        }
    }

    return ops
}


export async function processNewRelation(entityOnGeo: any, geoId: string, toEntityId: string, propertyId: string, position?: string): Promise<Array<Op>> {
    let geoProperties;
    const ops: Array<Op> = [];
    let addOps;

    if (entityOnGeo) {
        geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
            (item) => 
                item.typeOfId === propertyId &&
                item.toEntityId === toEntityId
        );
        console.log(geoProperties)
        if (geoProperties.length == 0) {
            addOps = Relation.make({
                fromId: geoId,
                toId: toEntityId,
                relationTypeId: propertyId,
                position: position,
            });
            ops.push(addOps);
        }
    } else {
        addOps = Relation.make({
            fromId: geoId,
            toId: toEntityId,
            relationTypeId: propertyId,
            position: position,
        });
        ops.push(addOps);
    }

    return ops
}


async function fetchWithRetry(query: string, variables: any, retries = 3, delay = 200) {
    for (let i = 0; i < retries; i++) {
        const response = await fetch(QUERY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });

        if (response.ok) {
            return await response.json();
        }

        if (i < retries - 1) {
            // Optional: only retry on certain error statuses
            if (response.status === 502 || response.status === 503 || response.status === 504) {
                await new Promise(resolve => setTimeout(resolve, delay * (2 ** i))); // exponential backoff
            } else {
                break; // for other errors, don’t retry
            }
        } else {
            console.log("searchEntities");
            console.log(`SPACE: ${variables.space}; PROPERTY: ${variables.property}; searchText: ${variables.searchText}; typeId: ${variables.typeId}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    }
}

export async function searchEntity(entityId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;

    query = `
        query GetEntity(
            $entityId: String!
        ) {
            entity(id: $entityId) {
                id
                name
                currentVersion {
                version {
                    triples {
                    nodes {
                        valueType
                        attributeId
                        textValue
                        spaceId
                    }
                    }
                    relationsByFromVersionId {
                    nodes {
                        fromEntityId
                        fromVersionId
                        toEntityId
                        typeOfId
                        spaceId
                    }
                    }
                }
                }
            }
        }
    `;

    variables = {
        entityId: entityId,
    };

    const data = await fetchWithRetry(query, variables);
    
    return data?.data?.entity?.currentVersion?.version;
}


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
            addOps = await processNewTriple(entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
            ops.push(...addOps);
        }

         //Write Description ops
        if (desc != "NONE") {
            addOps = await processNewTriple(entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
            ops.push(...addOps);
        }
        
        //Write publish date ops
        if (event_date != "NONE") {
            addOps = await processNewTriple(entityOnGeo, geoId, GEO_IDS.eventDatePropertyId, event_date, "TIME", "MMMM d, yyyy");
            ops.push(...addOps);

            addOps = await processNewRelation(entityOnGeo, geoId, GEO_IDS.newsEventTypeId, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);
        }

        //Quotes that support the claim
        const quotesSupporting = page.properties["Quotes that support the claim"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE;
        let quoteGeoId: string;
        for (const quote of quotesSupporting) { //for each quote
            [addOps, quoteGeoId] = await processQuote([...currentOps, ...ops], quote.id, notion);
            ops.push(...addOps);

            if (entityOnGeo) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(entityOnGeo, geoId, quoteGeoId, GEO_IDS.quotesSupportingPropertyId, position);
                ops.push(...addOps);
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
                addOps = await processNewRelation(entityOnGeo, geoId, relatedPersonGeoId, GEO_IDS.relatedPeoplePropertyId, position);
                ops.push(...addOps);
            }
        }

        //Related projects
        const projects = page.properties["Related projects"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE;
        let relatedProjectGeoId: string;
        for (const project of projects) { //for each quote
            relatedProjectGeoId = await processProject(project.id, notion);

            if (relatedProjectGeoId) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(entityOnGeo, geoId, relatedProjectGeoId, GEO_IDS.relatedProjectsPropertyId, position);
                ops.push(...addOps);
            }
        }

        //Related topics
        const topics = page.properties["Related topics"].relation;
        firstPosition = PositionRange.FIRST;
        lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
        position = Position.createBetween(firstPosition, lastPosition);
        //position = INITIAL_RELATION_INDEX_VALUE;
        let relatedTopicGeoId: string;
        for (const topic of topics) { //for each quote
            relatedTopicGeoId = await processTopic(topic.id, notion);

            if (relatedTopicGeoId) {
                position = Position.createBetween(position, lastPosition);
                addOps = await processNewRelation(entityOnGeo, geoId, relatedTopicGeoId, SystemIds.RELATED_TOPICS_PROPERTY, position);
                ops.push(...addOps);
            }
        }

        if (tag_date != "NONE") { // NOTE SHOULD REALLY CHECK IF THE RIGHT TAGS ARE THERE FIRST... CANT JUST ASSUME THEY WERE SET RIGHT INITIAILLY
            if (!entityOnGeo) {
                addOps = await processTags([...currentOps, ...ops], geoId, tag_date);
                ops.push(...addOps);
            }
        }

        console.log(ops)
        return [ops, geoId];

    }
    
    //SEARCH FOR AND / OR CREATE THE APPROPRIATE TAGS


}

const { Client } = require("@notionhq/client");
// Initializing a client
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});
const ops: Array<Op> = [];

const claimId = "1e0273e214eb80b2bb9deee31abdd17c";
await processClaim(ops, claimId, notion);
