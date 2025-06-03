import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { TABLES, getConcatenatedPlainText, GEO_IDS, processNewTriple, processNewRelation, buildGeoFilter, createQueryDataBlock, addSpace } from './src/constants';
import { cleanText, hasBeenEdited, normalizeUrl, searchArticles, searchEntities, searchEntity, searchOps } from "./search_entities";
import { processTopic } from "./process_topic";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";

export async function processProject(currentOps, projectId: string, notion: any, publisher?: string): Promise<[Array<Op>, string]> {

    const ops: Array<Op> = [];
    const currSpaceId = GEO_IDS.cryptoSpaceId;
    let addOps;
    let geoId: string;
    let firstPosition;
    let lastPosition;
    let position;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: projectId });
    
    //Name
    const name = cleanText(getConcatenatedPlainText(page.properties["Name"]?.title));
    //console.log("Project page:", page.properties["Name"]);
    console.log("Project name:", name);

    //Description
    const desc = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
    console.log("Description:", desc);

    //Web URL
    const website = normalizeUrl(page.properties["Website"]?.url ?? "NONE");
    const xLink = normalizeUrl(page.properties["X"]?.url ?? "NONE");

    // Avatar
    const avatar_url = page.properties["Avatar"]?.files?.[0]?.file?.url ?? "NONE"
    // Cover
    const cover_url = page.properties["Cover"]?.files?.[0]?.file?.url ?? "NONE"

    if (geoId = await searchOps(currentOps, SystemIds.NAME_PROPERTY, "TEXT", name, SystemIds.PROJECT_TYPE)) { //Search current ops for web url
        return [ops, geoId]
    } else {
        geoId = await searchEntities(currSpaceId, SystemIds.NAME_PROPERTY, name, SystemIds.PROJECT_TYPE);
        let entityOnGeo;
        if (!geoId) {
            geoId = Id.generate();
        } else {
            entityOnGeo = await searchEntity(geoId);
            console.log("entity exists on geo")
        }

        if ((!entityOnGeo) && ((name == "NONE") || ((desc == "NONE") && (avatar_url == "NONE")))) {
            return [ops, null]
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

            //Write Website ops
            if (website != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.websitePropertyId, website, "URL");
                ops.push(...addOps);
            }

            //Write X Link ops
            if (xLink != "NONE") {
                addOps = await processNewTriple(currSpaceId, entityOnGeo, geoId, GEO_IDS.xLinkPropertyId, xLink, "URL");
                ops.push(...addOps);
            }

            //Add project type...
            addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, SystemIds.PROJECT_TYPE, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
            ops.push(...addOps);

            //Write cover ops
            if (cover_url != "NONE") {
                let geoProperties;
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
                }
            }

            //Write avatar ops
            if (avatar_url != "NONE") {
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

            //IS PROJECT A PUBLISHER?
            if ((publisher) || (await searchArticles(GEO_IDS.cryptoNewsSpaceId, geoId, GEO_IDS.publisherPropertyId))) { //Seach graph to see if they are publisher of any articles
                //Add a datatable with all their published articles
                const filter = buildGeoFilter(
                    [GEO_IDS.cryptoNewsSpaceId],
                    [
                    { attribute: SystemIds.TYPES_PROPERTY, is: GEO_IDS.articleTypeId },
                    { attribute: GEO_IDS.publisherPropertyId, is: geoId }
                    ]
                );
                if (entityOnGeo) {
                    const blocksOnEntity = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
                        (item) => 
                            item.spaceId === currSpaceId &&
                            item.typeOfId === SystemIds.BLOCKS &&
                            ((item.toEntity.name?.toLowerCase() === "Published articles"?.toLowerCase()) || (item.toEntity.name?.toLowerCase() === "Articles"?.toLowerCase()))
                    );
                    if (blocksOnEntity.length < 1) {
                        addOps = createQueryDataBlock("Published articles", geoId, filter, SystemIds.LIST_VIEW, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                        ops.push(...addOps);
                    }
                } else {
                    addOps = createQueryDataBlock("Published articles", geoId, filter, SystemIds.LIST_VIEW, INITIAL_RELATION_INDEX_VALUE, [GEO_IDS.relatedProjectsPropertyId]);
                    ops.push(...addOps);
                }

                //Add company type
                addOps = await processNewRelation(currSpaceId, entityOnGeo, geoId, SystemIds.COMPANY_TYPE, SystemIds.TYPES_PROPERTY, INITIAL_RELATION_INDEX_VALUE);
                ops.push(...addOps);

                //If editorial team on notion process them and add them to a collection...

            }

            return [await addSpace(ops, currSpaceId), geoId]
        }
    }
    

}


