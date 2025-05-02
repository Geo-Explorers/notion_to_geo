import { DataBlock, Relation, SystemIds, Triple } from "@graphprotocol/grc-20";
import { INITIAL_RELATION_INDEX_VALUE } from "@graphprotocol/grc-20/constants";

export const testnetWalletAddress = "0x84713663033dC5ba5699280728545df11e76BCC1";
export const mainnetWalletAddress = "0x0A77FD6b13d135426c25E605a6A4F39AF72fD967";

export const GEO_IDS = {
  //Space IDs
  cryptoNewsSpaceId: "BDuZwkjCg3nPWMDshoYtpS",
  cryptoSpaceId: "SgjATMbm41LX6naizMqBVd",

  draftTypeId: "5rtNCuvTUghFtMDhFYvfYB", 
  newsStoryOfTheDayTagId: "M8KF4D9sADRiug5RLhfGhY",
  newsStoryOfTheWeekTagId: "KwaMjDaWwvCX8uD938T7qW",

  blocksTypeId: "QYbjCM6NT9xmh2hFGsqpQX",

  bulletListView: "2KQ8CHTruSetFbi48nsHV3",

  xLinkPropertyId: "2eroVfdaXQEUw314r5hr35",
  websitePropertyId: "WVVjk5okbvLspwdY1iTmwp",
  rolesPropertyId: "JkzhbbrXFMfXN7sduMKQRp",
  authorTypeId: "", //NEED TO CREATE THIS
  publishedInPropertyId: "", //NEED TO CREATE THIS

  //News story IDs
  newsStoryTypeId: "VKPGYGnFuaoAASiAukCVCX",
  maintainersPropertyId: "Vtmojxf3rDL9VaAjG9T2NH",
  tagsPropertyId: "5d9VVey3wusmk98Uv3v5LM",
  tagTypeId: "UnP1LtXV3EhrhvRADFcMZK",

  //Source Property IDs
  articleTypeId: "M5uDP7nCw3nvfQPUryn9gx",
  postTypeId: "X7KuZJQewaCiCy9QV2vjyv",

  webURLId: "93stf6cgYvBsdPruRzq1KK",
  webArchiveURLId: "BTNv9aAFqAzDjQuf4u2fXK",
  publishDateId: "KPNjGaLx5dKofVhT6Dfw22",
  avatarPropertyId: "399xP4sGWSoepxeEnp3UdR",
  publisherPropertyId: "Lc4JrkpMUPhNstqs7mvnc5",
  publisherTypeId: "BGCj2JLjDjqUmGW6iZaANK",

  //Claim Property IDs
  claimTypeId: "KeG9eTM8NUYFMAjnsvF4Dg",
  newsEventTypeId: "QAdjgcq9nD7Gv98vn2vrDd",
  eventDatePropertyId: "BBA1894NztMD9dWyhiwcsU",
  quotesSupportingPropertyId: "quotesThatSupportClaims",

  //Quote property IDs
  quoteTypeId: "XGsAzMuCVXPtV8e6UfMLd",
  sourcesPropertyId: "A7NJF2WPh8VhmvbfVWiyLo",
  authorsPropertyId: "JzFpgguvcCaKhbQYPHsrNT",
  relatedPeoplePropertyId: "Cc3AZqRReWs3Zk2W5ALtyw",
  relatedProjectsPropertyId: "EcK9J1zwDzSQPTnBRcUg2A",
  relatedTopicsPropertyId: "GrojMdwbutDvrciUgcL2e4",
  topicTypeId: "Cj7JSjWKbcdgmUjcLWNR4V",
}

export const TESTNET_GEO_IDS = {
  //Space IDs
  spaceId: "V7xhycK9fAEy7BmpnDGHTq", // UPDATE
  cryptoNewsSpaceId: "V7xhycK9fAEy7BmpnDGHTq", // UPDATE
  cryptoSpaceId: "V7xhycK9fAEy7BmpnDGHTq", // "SgjATMbm41LX6naizMqBVd",

  draftTypeId: "", // NEED TO CREATE
  newsStoryOfTheDayTagId: "", // NEED TO CREATE
  newsStoryOfTheWeekTagId: "KwaMjDaWwvCX8uD938T7qW", // NEED TO CREATE

  blocksTypeId: "QYbjCM6NT9xmh2hFGsqpQX",
  rolesPropertyId: "JkzhbbrXFMfXN7sduMKQRp",

  //News story IDs
  newsStoryTypeId: "VKPGYGnFuaoAASiAukCVCX",
  maintainersPropertyId: "Vtmojxf3rDL9VaAjG9T2NH",
  tagsPropertyId: "5d9VVey3wusmk98Uv3v5LM",
  tagTypeId: "UnP1LtXV3EhrhvRADFcMZK",

  //Source Property IDs
  articleTypeId: "M5uDP7nCw3nvfQPUryn9gx",
  postTypeId: "X7KuZJQewaCiCy9QV2vjyv",

  webURLId: "93stf6cgYvBsdPruRzq1KK",
  publishDateId: "KPNjGaLx5dKofVhT6Dfw22",
  avatarPropertyId: "399xP4sGWSoepxeEnp3UdR",
  publisherPropertyId: "Lc4JrkpMUPhNstqs7mvnc5",
  publisherTypeId: "BGCj2JLjDjqUmGW6iZaANK",

  //Claim Property IDs
  claimTypeId: "KeG9eTM8NUYFMAjnsvF4Dg",
  newsEventTypeId: "QAdjgcq9nD7Gv98vn2vrDd",
  eventDatePropertyId: "BBA1894NztMD9dWyhiwcsU",
  quotesSupportingPropertyId: "quotesThatSupportClaims",

  //Quote property IDs
  quoteTypeId: "XGsAzMuCVXPtV8e6UfMLd",
  sourcesPropertyId: "A7NJF2WPh8VhmvbfVWiyLo",
  authorsPropertyId: "JzFpgguvcCaKhbQYPHsrNT",
  relatedPeoplePropertyId: "Cc3AZqRReWs3Zk2W5ALtyw",
  relatedProjectsPropertyId: "EcK9J1zwDzSQPTnBRcUg2A",
  relatedTopicsPropertyId: "GrojMdwbutDvrciUgcL2e4",
  topicTypeId: "Cj7JSjWKbcdgmUjcLWNR4V",
}


export const TABLES = {

    // Base tables
    topics: "14a5173d8df04b888a25c4a45e43c30d",
    people: "d9d9905a7c684676bb0db749c1cde860",
    tags: "243a94d34ce84c86babfb829b9b773be",

    projects: "fe303122283a4dff9b201d9cbd767798",
    publishers: "119273e214eb8002a55ceebc75db7f81",

    sources: "bdfe7fb576754e4ebc2e7d199c9d9bdd",
    claims: "b63cff922b0c452eba0b564c76c118d0",
    quotes: "49896bc9a8d044beab58b481b770587e",

    // Workflow-specific
    events: "893c080621ba4def8207572121770c8e",
    news_stories: "1172ee24b79c4cec8166fcd50094f5a5",
    news_topics: "154759ec665048a7a703e0110e7e6ee0",
    podcasts: "286a354da1204170b392c6b4ee7c2957",
    interviews: "af1ba67a8c264245bd16de15a59417bf",
    collections: "19d9123a42a2485ab0a00669dec55b47",

    // Internal
    relations: "a8d545b2949b45ce80f7394f2318b577",
    internal_tags: "081c345a97924403a3a213530a19f146",
    scraping_tasks: "cdd30a78704546af8bb7bb9f5a69dfb0",

    // Schema
    schema_db: "c3c1f11b3fe54e468b4de8e3b8ef861f",
    attributes: "a0bd1b8c663d48daa07cbee8bea236dd",
    attr_values: "12f273e214eb80be919fd180e5999cfc",

    // Imports
    root_data_projects: "12f273e214eb800ba2add9f3b4ab9934",
    root_data_people: "12f273e214eb80be97b5d8d756520e94",
    stands_with_crypto: "12f273e214eb802a85a1dde17ae20ebd",

    keyword_list: "12f273e214eb800b8457feef2f6431e8",
    keyword_quote: "12f273e214eb805fa860f2c7b3feb524",
    keyword_claim: "12f273e214eb80d39b4dfc70d72b3c6f",

    keywords: "145273e214eb8081b7f3f36d97e5138f",

    test_sources: "175273e214eb8055b708e89cbb4f3a66"
}


export const getConcatenatedPlainText = (textArray?: any[]): string => {
    if (!Array.isArray(textArray) || textArray.length === 0) {
      return "NONE";
    }
  
    return textArray
      .map(item => item?.plain_text ?? "")
      .join("")
      .trim() || "NONE";
  };

// Calculate ISO week number
export function getWeekNumber(date: Date): number {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}



type AttributeFilter = {
  attribute: string;
  is: string;
};

export function buildGeoFilter(
  spaceIds: string[],
  attributeFilters: AttributeFilter[]
): string  {
  const filter = {
    where: {
      spaces: spaceIds,
      AND: attributeFilters
    }
  };
  return JSON.stringify(filter, null, 2);
}


export function createQueryDataBlock(name: string, fromEntity: string, filter: string, view: string = SystemIds.TABLE_VIEW, position?: string, columns?: string[]): Array<Op> {
  //ADD A TABLE FOR Sources showing all quotes that have use this source
  //CREATE THE DATA BLOCK
  let blockOps;
  const ops: Array<Op> = [];
  let addOps;
  let blockId;
  let blockRelationId;

  blockOps = DataBlock.make({
      fromId: fromEntity,
      sourceType: 'QUERY',
      name: name,
      position: position,
  });
  ops.push(...blockOps);

  //console.log(blockOps)
  blockId = blockOps[2].relation.toEntity;
  blockRelationId = blockOps[2].relation.id;

  addOps = Triple.make({
      entityId: blockId,
      attributeId: SystemIds.FILTER,
      value: {
          type: "TEXT",
          value: filter,
      },
  });

  ops.push(addOps);

  
  //Set view to TABLE_VIEW -- for list view use SystemIds.LIST_VIEW
  addOps = Relation.make({
      fromId: blockRelationId,
      toId: view,
      relationTypeId: SystemIds.VIEW_PROPERTY,
  });
  ops.push(addOps);


  if (columns) {
    for (const column of columns) {
      addOps = Relation.make({
          fromId: blockRelationId,
          toId: column,
          relationTypeId: SystemIds.PROPERTIES,
      });
      ops.push(addOps);
    }
  }

  return ops;
}



export async function processNewTriple(spaceId: string, entityOnGeo: any, geoId: string, propertyId: string, propertyValue: string, valueType: any, format: string | null = null): Promise<Array<Op>> {
    //WHEN I PROCESS A NEW RELATION OR TRIPLE, I SHOULD SEND THE OPS AND MAKE SURE THAT I AM NOT RECREATING ANYTHING THAT I SHOULDNT...
    let geoPropertyValue;
    let geoProperties;
    const ops: Array<Op> = [];
    let addOps;

    if (entityOnGeo) {
        geoProperties = entityOnGeo?.triples?.nodes.filter(
            (item) => 
                item.spaceId === spaceId &&
                item.attributeId === propertyId
        );
        if (geoProperties.length > 0) { //Note if it is greater than 1, we may be dealing with a multi space entity and I need to make sure I am in the correct space...
            geoPropertyValue = geoProperties?.[0]?.textValue
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

export async function processNewRelation(spaceId: string, entityOnGeo: any, geoId: string, toEntityId: string, propertyId: string, position?: string): Promise<Array<Op>> {
    let geoProperties;
    const ops: Array<Op> = [];
    let addOps;

    if (entityOnGeo) {
        geoProperties = entityOnGeo?.relationsByFromVersionId?.nodes.filter(
            (item) => 
                item.spaceId === spaceId &&
                item.typeOfId === propertyId &&
                item.toEntityId === toEntityId
        );
        //console.log(geoProperties)
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
