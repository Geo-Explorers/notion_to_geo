import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { TABLES, getConcatenatedPlainText, GEO_IDS, processNewRelation, processNewTriple, buildGeoFilter, createQueryDataBlock } from './src/constants';
import { hasBeenEdited, normalizeUrl, searchArticles, searchEntities, searchEntity, searchOps, searchUniquePublishers } from "./search_entities";
import { processProject } from "./event_process_project";
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
    console.log("Person name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    console.log("Description:", desc);

    //Geo ID
    geoId = getConcatenatedPlainText(page.properties["Geo ID"]?.rich_text);
    console.log("Geo ID:", geoId);

    //Web URL
    const xLink = normalizeUrl(page.properties["X"]?.url ?? "NONE");
    // Avatar
    const avatar_url = page.properties["Avatar"]?.files?.[0]?.file?.url ?? "NONE"
    // Cover
    const cover_url = page.properties["Cover"]?.files?.[0]?.file?.url ?? "NONE"

    if (geoId == "NONE") {
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
                    addOps = await processNewTriple(GEO_IDS.cryptoSpaceId, entityOnGeo, geoId, SystemIds.NAME_PROPERTY, name, "TEXT");
                    ops.push(...addOps);
                }
    
                //Write Description ops
                if (desc != "NONE") {
                    addOps = await processNewTriple(GEO_IDS.cryptoSpaceId, entityOnGeo, geoId, SystemIds.DESCRIPTION_PROPERTY, desc, "TEXT");
                    ops.push(...addOps);
                }
    
                //Write X Link ops
                if (xLink != "NONE") {
                    addOps = await processNewTriple(GEO_IDS.cryptoSpaceId, entityOnGeo, geoId, GEO_IDS.xLinkPropertyId, xLink, "URL");
                    ops.push(...addOps);
                }
    
                //Add person type
                addOps = await processNewRelation(GEO_IDS.cryptoSpaceId, entityOnGeo, geoId, SystemIds.PERSON_TYPE, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);
    
                //Write avatar ops
                if (avatar_url != "NONE") {
                    let geoProperties
                    if (entityOnGeo) {
                        geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                            (item) => 
                                item.spaceId === GEO_IDS.cryptoSpaceId &&
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

                //Write cover ops
                if (cover_url != "NONE") {
                    let geoProperties
                    if (entityOnGeo) {
                        geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                            (item) => 
                                item.spaceId === GEO_IDS.cryptoSpaceId &&
                                item.typeOfId === SystemIds.COVER_PROPERTY
                        );
                    } else {
                        geoProperties = []
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
                    }
                }
    
    
                //Related projects
                const projects = page.properties["Works at"].relation;
                firstPosition = PositionRange.FIRST;
                lastPosition = Position.createBetween(firstPosition, PositionRange.LAST);
                position = Position.createBetween(firstPosition, lastPosition);
                //position = INITIAL_RELATION_INDEX_VALUE;
                let worksAtGeoId;
                for (const project of projects) { //for each quote
                    [addOps, worksAtGeoId] = await processProject([...currentOps, ...ops], project.id, notion);
                    ops.push(...addOps);
    
                    if (worksAtGeoId) {
                        position = Position.createBetween(position, lastPosition);
                        addOps = await processNewRelation(GEO_IDS.cryptoSpaceId, entityOnGeo, geoId, worksAtGeoId, GEO_IDS.worksAtPropertyId, position);
                        ops.push(...addOps);
                    }
                }
    
            }
        }

    }
    return [ops, geoId]
    

}





