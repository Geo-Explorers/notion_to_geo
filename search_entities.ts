import { SystemIds } from "@graphprotocol/grc-20";
import { GEO_IDS } from "./src/constants";

//UPDATE QUERY URL
const mainnet_query_url = "https://hypergraph.up.railway.app/graphql";
const testnet_query_url = "https://geo-conduit.up.railway.app/graphql";
const QUERY_URL = mainnet_query_url;

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

export const normalizeUrl = (url: string) =>
    url.endsWith('/') ? url.slice(0, -1) : url;


export async function searchOps(ops: Array<Ops>, property: string, propType: string, searchText: string, typeId: string | null = null) {
    
    let match;
    if (propType == "URL") {
        match = ops.find(op =>
            op.type === "SET_TRIPLE" &&
            op.triple.attribute === property &&
            op.triple.value?.type === propType &&
            normalizeUrl(op.triple.value?.value) === normalizeUrl(searchText)
        );
    } else {
        match = ops.find(op =>
            op.type === "SET_TRIPLE" &&
            op.triple.attribute === property &&
            op.triple.value?.type === propType &&
            op.triple.value?.value?.toLowerCase() === searchText?.toLowerCase()
        );
    }
    

    

    if (match) {
        if (typeId) {
            const matchType = ops.find(op =>
                op.type === "CREATE_RELATION" &&
                op.relation.fromEntity === match.triple.entity &&
                op.relation.type === SystemIds.TYPES_PROPERTY &&
                op.relation.toEntity === typeId
            );
            if (matchType) {
                return match.triple.entity
            } else {
                return null
            }

        } else {
            return match.triple.entity;
        }
    } else {
        return null
    }
}

export async function hasBeenEdited(ops: Array<Ops>, entityId: string): Promise<boolean> {
    
    let match;
    match = ops.find(op =>
        op.type === "SET_TRIPLE" &&
        op.triple.entity === entityId
    );

    if (match) {
        return true;
    }

    match = ops.find(op =>
        op.type === "CREATE_RELATION" &&
        op.relation.fromEntity === entityId
    );

    if (match) {
        return true;
    } else {
        return false;
    }
}

export async function searchOpsV1(ops: Array<Ops>, property: string, propType: string, searchText: string) {
    
    const match = ops.find(op =>
        op.type === "SET_TRIPLE" &&
        op.triple.attribute === property &&
        op.triple.value?.type === propType &&
        op.triple.value?.value === searchText
    );

    if (match) {
        return match.triple.entity;
    } else {
        return null
    }
}




export async function searchEntities(space: string, property: string, searchText: string, typeId: string | null = null) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;
    
    if (typeId) {
        query = `
            query GetEntities(
                $space: String!
                $property: String!
                $searchText: String!
                $typeId: String!
                $typesPropertyId: String!
            ) {
                entities(
                filter: {
                    currentVersion: {
                        version: {
                            versionSpaces: {
                                some: { spaceId: { equalTo: $space } }
                            }
                            triples: {
                                some: {
                                    attributeId: { equalTo: $property }
                                    textValue: { equalToInsensitive: $searchText }
                                }
                            }
                        }
                    }
                    relationsByFromEntityId: {
                        some: {
                            toEntityId: { equalTo: $typeId }
                            typeOfId: { equalTo: $typesPropertyId }
                        }
                    }
                }
                ) {
                nodes {
                    currentVersion {
                        version {
                            name
                            entityId
                        }
                    }
                }
                }
            }
        `;

        variables = {
            space: space,
            property: property,
            searchText: searchText,
            typeId: typeId,
            typesPropertyId: SystemIds.TYPES_PROPERTY
        };
    } else {
        query = `
            query GetEntities(
                $space: String!
                $property: String!
                $searchText: String!
            ) {
                entities(
                filter: {
                    currentVersion: {
                        version: {
                            versionSpaces: {
                            some: { spaceId: { equalTo: $space } }
                            }
                            triples: {
                            some: {
                                attributeId: { equalTo: $property }
                                textValue: { equalToInsensitive: $searchText }
                            }
                            }
                        }
                    }
                }
                ) {
                nodes {
                    currentVersion {
                        version {
                            name
                            entityId
                        }
                    }
                }
                }
            }
        `;

        variables = {
            space: space,
            property: property,
            searchText: searchText,
        };
    }

    const data = await fetchWithRetry(query, variables);
    
    if (data?.data?.entities?.nodes.length == 1) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
        return data?.data?.entities?.nodes?.[0]?.currentVersion?.version?.entityId;
    } else {
        return null
    }
}






export async function searchDataBlocks(space: string, typeId: string, fromEntity: string, dateString: string | null = null) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;
    
    if (dateString) {
        query = `
            query GetEntities(
                $typeId: String!
                $space: String!
                $fromEntity: String!
                $dateString: String!
            ) {
                relations(
                    filter: {
                        typeOfId: { equalTo: $typeId }
                    fromVersion: {
                        currentVersions: {
                            some: {
                                version: {
                                    relationsByFromVersionId: {
                                        some: { fromEntityId: { equalTo: $fromEntity } }
                                    }
                                    versionSpaces: {
                                        some: { spaceId: { equalTo: $space } }
                                    }
                                }
                            }
                        }
                    }
                        toEntity: {
                            name: { includesInsensitive: $dateString }
                        }
                    }
                ) {
                    edges {
                        node {
                            fromEntity {
                                id
                            }
                            typeOfId
                            entity {
                                id
                            }
                            index
                            spaceId
                            toEntity {
                                name
                            }
                        }
                    }
                }
            }
            
        `;

        variables = {
            typeId: typeId,
            space: space,
            fromEntity: fromEntity,
            dateString: dateString
        };
    } else {
        query = `
            query GetEntities(
                $typeId: String!
                $space: String!
                $fromEntity: String!
            ) {
                relations(
                    filter: {
                    typeOfId: { equalTo: $typeId }
                    fromVersion: {
                        currentVersions: {
                        some: {
                            version: {
                            relationsByFromVersionId: {
                                some: { fromEntityId: { equalTo: $fromEntity } }
                            }
                            versionSpaces: {
                                some: { spaceId: { equalTo: $space } }
                            }
                            }
                        }
                        }
                    }
                    }
                ) {
                    edges {
                    node {
                        index
                        toEntity {
                            name
                        }
                    }
                    }
                }
                }
            
        `;

        variables = {
            typeId: typeId,
            space: space,
            fromEntity: fromEntity
        };
    }

    const data = await fetchWithRetry(query, variables);
  
    //const response = await fetch(QUERY_URL, {
    //  method: "POST",
    //  headers: {
    //    "Content-Type": "application/json",
    //  },
    //  body: JSON.stringify({
    //    query,
    //    variables
    //  }),
    //});
  
    //if (!response.ok) {
    //  console.log("searchDataBlocks")
    //  console.log(`SPACE: ${space}; fromEntity: ${fromEntity}; dateString: ${dateString}; typeId: ${typeId}}`)
    //  throw new Error(`HTTP error! Status: ${response.status}`);
    //}
  
    //const data = await response.json();

    if (dateString) {
        if (data?.data?.relations?.edges.length > 0) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
            return true;
        } else {
            return false;
        }
    } else {
        if (data?.data?.relations?.edges.length > 0) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
            return data?.data?.relations?.edges;
        } else {
            return null;
        }
    }   
}

  



export async function searchNewsStory(space: string, searchText: string, searchDate: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;

    query = `
        query GetEntities(
            $space: String!
            $searchText: String!
            $searchDate: String!
        ) {
            entities(
            filter: {
                currentVersion: {
                    version: {
                        versionSpaces: {
                            some: { spaceId: { equalTo: $space } }
                        }
                        and: [
                            {
                                triples: {
                                    some: {
                                        attributeId: { equalTo: "LuBWqZAu6pz54eiJS5mLv8" }
                                        textValue: {
                                            equalToInsensitive: $searchText
                                        }
                                    }
                                }
                            },
                            {
                                triples: {
                                    some: {
                                        attributeId: { equalTo: "KPNjGaLx5dKofVhT6Dfw22" }
                                        textValue: {
                                            equalToInsensitive: $searchDate
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
                relationsByFromEntityId: {
                    some: {
                        toEntityId: { equalTo: "VKPGYGnFuaoAASiAukCVCX" }
                        typeOfId: { equalTo: "Jfmby78N4BCseZinBmdVov" }
                    }
                }
            }
            ) {
            nodes {
                id
                name
            }
            }
        }
    `;

    variables = {
        space: space,
        searchText: searchText,
        searchDate: searchDate,
    };

    const data = await fetchWithRetry(query, variables);

    //const response = await fetch(QUERY_URL, {
    //  method: "POST",
    //  headers: {
    //    "Content-Type": "application/json",
    //  },
    //  body: JSON.stringify({
    //    query,
    //    variables
    //  }),
    //});
  
    //if (!response.ok) {
    //  console.log("searchNewsStory")
    //  console.log(`SPACE: ${space}; searchText: ${searchText}; searchDate: ${searchDate}}`)
    //  throw new Error(`HTTP error! Status: ${response.status}`);
    //}
  
    //const data = await response.json();
    
    if (data?.data?.entities?.nodes.length == 1) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
        return data?.data?.entities?.nodes?.[0]?.id;
    } else {
        return null
    }
}




export async function searchGetPublisherAvatar(space: string, typeId: string, fromEntity: String) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;
    
    query = `
        query GetEntities(
            $typeId: String!
            $space: String!
            $fromEntity: String!
        ) {
            relations(
                filter: {
                    typeOfId: { equalTo: $typeId }
                    fromVersion: {
                        currentVersions: {
                            some: {
                                version: {
                                    relationsByFromVersionId: {
                                        some: { fromEntityId: { equalTo: $fromEntity } }
                                    }
                                    versionSpaces: {
                                        some: { spaceId: { equalTo: $space } }
                                    }
                                }
                            }
                        }
                    }
                }
            ) {
                edges {
                    node {
                        fromEntity {
                            id
                        }
                        typeOfId
                        entity {
                            id
                        }
                        index
                        spaceId
                        toEntity {
                            id
                        }
                    }
                }
            }
        }
        
    `;

    variables = {
        typeId: typeId,
        space: space,
        fromEntity: fromEntity,
    };

    const data = await fetchWithRetry(query, variables);
  
    //const response = await fetch(QUERY_URL, {
    //  method: "POST",
    //  headers: {
    //    "Content-Type": "application/json",
    //  },
    //  body: JSON.stringify({
    //    query,
    //    variables
    //  }),
    //});
  
    //if (!response.ok) {
    //  console.log("searchGetPublisherAvatar")
    //  console.log(`SPACE: ${space}; typeId: ${typeId}; fromEntity: ${fromEntity}}`)
    //  throw new Error(`HTTP error! Status: ${response.status}`);
    //}
  
    //const data = await response.json();

    if (data?.data?.relations?.edges.length > 0) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
        return data?.data?.relations?.edges?.[0].node?.toEntity?.id;
    } else {
        return false;
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
                        toEntity {
                            name
                        }
                        entityId
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


export async function searchArticles(space: string, toEntity: string, typeOfId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;

    query = `
        query GetEntities(
            $space: String!
            $toEntity: String!
            $typeOfId: String!
            $typesPropertyId: String!
        ) {
            entities(
            filter: {
                currentVersion: {
                    version: {
                        versionSpaces: {
                            some: { spaceId: { equalTo: $space } }
                        }
                    }
                }
                relationsByFromEntityId: {
                    some: {
                        toEntityId: { equalTo: $toEntity }
                        typeOfId: { equalTo: $typeOfId }
                        fromEntity: {
                        relationsByFromEntityId: {
                            some: {
                                toEntityId: { equalTo: "M5uDP7nCw3nvfQPUryn9gx" }
                                typeOfId: { equalTo: $typesPropertyId }
                            }
                        }
                    }
                    }
                }
            }
            ) {
            nodes {
                id
                name
            }
            }
        }
    `;

    variables = {
        space: space,
        toEntity: toEntity,
        typeOfId: typeOfId,
        typesPropertyId: SystemIds.TYPES_PROPERTY
    };

    const data = await fetchWithRetry(query, variables);
    
    if (data?.data?.entities?.nodes.length > 0) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS
        return true;
    } else {
        return false
    }
}


export async function searchUniquePublishers(space: string, toEntity: string, typeOfId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;

    query = `
        query GetEntities(
            $space: String!
            $toEntity: String!
            $typeOfId: String!
            $typesPropertyId: String!
        ) {
            entities(
            filter: {
                currentVersion: {
                    version: {
                        versionSpaces: {
                            some: { spaceId: { equalTo: $space } }
                        }
                    }
                }
                relationsByFromEntityId: {
                    some: {
                        toEntityId: { equalTo: $toEntity }
                        typeOfId: { equalTo: $typeOfId }
                        fromEntity: {
                        relationsByFromEntityId: {
                            some: {
                                toEntityId: { equalTo: "M5uDP7nCw3nvfQPUryn9gx" }
                                typeOfId: { equalTo: $typesPropertyId }
                            }
                        }
                    }
                    }
                }
            }
            ) {
            nodes {
                id
                name
                relationsByFromEntityId(
                    filter: {
                    fromVersion: {
                        currentVersions: {
                        some: {
                            entity: {
                            relationsByFromEntityId: {
                                some: { typeOfId: { equalTo: "Lc4JrkpMUPhNstqs7mvnc5" } }
                            }
                            }
                        }
                        }
                    }
                    }
                    condition: { typeOfId: "Lc4JrkpMUPhNstqs7mvnc5" }
                ) {
                    nodes {
                    typeOfId
                    toEntityId
                    }
                }
                }
            }
        }

    `;

    variables = {
        space: space,
        toEntity: toEntity,
        typeOfId: typeOfId,
        typesPropertyId: SystemIds.TYPES_PROPERTY
    };

    const data = await fetchWithRetry(query, variables);
    
    if (data?.data?.entities?.nodes.length > 0) { //NOTE NEED TO HANDLE IF THERE ARE MANY RESULTS

        const uniqueToEntityIds = [
            ...new Set(
                data?.data?.entities?.nodes?.flatMap(item =>
                item.relationsByFromEntityId?.nodes?.map(rel => rel.toEntityId) || []
            )
            )
        ];

        return uniqueToEntityIds;
    } else {
        return [];
    }
}




export async function searchOpsForPublisherAvatar(ops: Array<Ops>, publisherGeoId: string) {
    
    let match;
    match = ops.find(op =>
        op.type === "CREATE_RELATION" &&
        op.relation.fromEntity === publisherGeoId &&
        op.relation.type === GEO_IDS.avatarPropertyId
    );

    if (match) {
        return match.relation.toEntity;
    } else {
        return null
    }
}