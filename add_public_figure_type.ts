import * as fs from "fs";
import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { processSource } from "./process_source";
import { processClaim } from "./process_claim";
import { mainnetWalletAddress, TABLES, getConcatenatedPlainText, GEO_IDS } from './src/constants';
import { processNewsStory } from "./process_news_story";


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

async function searchEntities(space: string, personTypeId: string, publicFigureTypeId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    let query;
    let variables;

    query = `
        query GetEntities(
            $space: String!
            $personTypeId: String!
            $publicFigureTypeId: String!
            $typesPropertyId: String!
        ) {
            entities(
                filter: {
                currentVersion: {
                    version: {
                        versionSpaces: { some: { spaceId: { equalTo: $space } } }
                    }
                }
                    relationsByFromEntityId: {
                        some: {
                            toEntityId: { equalTo: $personTypeId }
                            typeOfId: { equalTo: $typesPropertyId }
                        }
                        none: {
                            toEntityId: { equalTo: $publicFigureTypeId }
                            typeOfId: { equalTo: $typesPropertyId }
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
        personTypeId: personTypeId,
        publicFigureTypeId: publicFigureTypeId,
        typesPropertyId: SystemIds.TYPES_PROPERTY
    };

    const data = await fetchWithRetry(query, variables);
    
    return data?.data?.entities?.nodes
}



async function main() {
	// Once you have the ops you can publish them to IPFS and your space.

    const ops: Array<Op> = [];
    let addOps;
    let geoId: string;

    const spaceId = "SgjATMbm41LX6naizMqBVd";
    const personType = SystemIds.PERSON_TYPE;
    const publicFigureTypeId = "CtGgopfwJsdSfB7YXSKoTP";
    const people = await searchEntities(spaceId, personType, publicFigureTypeId)

    for (const person of people) {
        console.log(person.id)
        if (ops.length == 0) {
            addOps = Relation.make({
                fromId: person.id,
                toId: publicFigureTypeId,
                relationTypeId: SystemIds.TYPES_PROPERTY,
            });
            ops.push(addOps);
        }
    }

	if (ops.length > 0) {
		let outputText;
		// Convert operations to a readable JSON format
		outputText = JSON.stringify(ops, null, 2);
		// Write to a text file
		fs.writeFileSync(`ops.txt`, outputText);

		const txHash = await publish({
			spaceId: spaceId,
			author: mainnetWalletAddress,
			editName: "Test Public figure Type",
			ops: ops, // An edit accepts an array of Ops
		}, "MAINNET");

		console.log("Your transaction hash is:", txHash);
	}
    
}

main();

//To dos
// - Create authors, if needed?
// - Handle searches if we find multiple results? Could provide more filters to limit the chance of multiple results