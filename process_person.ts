import { Id, Ipfs, SystemIds, Relation, Triple, DataBlock, Position, PositionRange, Graph } from "@graphprotocol/grc-20";
import { deploySpace } from "./src/deploy-space";
import { publish } from "./src/publish";
import { TABLES, getConcatenatedPlainText, GEO_IDS } from './src/constants';
import { format, parse } from 'date-fns';
import { searchEntities, searchOps } from "./search_entities";

export async function processPerson(authorId: string, notion: any): Promise<geoId> {

    let geoId: string;
    
    //Pull Data from notion
    await new Promise(resolve => setTimeout(resolve, 200));
    const page = await notion.pages.retrieve({ page_id: authorId });
    
    //Name
    const name = getConcatenatedPlainText(page.properties["Name"]?.title);
    //console.log("Person output:", page.properties["Name"]);
    console.log("Person name:", name);
    
    if (geoId = await searchEntities(GEO_IDS.cryptoSpaceId, SystemIds.NAME_PROPERTY, name, SystemIds.PERSON_TYPE)) { //Search graphDB for web url
        return geoId;
    } else {
        return null;
    }
}


