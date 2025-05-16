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
                                    id
                                }
                                entityId
                            }
                        }
                        relationsByToVersionId {
                            nodes {
                                toEntityId
                                typeOfId
                                spaceId
                                fromEntityId
                                fromEntity {
                                    name
                                }
                                entityId
                                index
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