const { Client } = require("@notionhq/client")
import { walletAddress, TABLES } from './src/constants';


// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})


async function updateEditStatus(pageId: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      "Edit status": {
        multi_select: [
          { name: "Published" }
        ]
      }
    }
  });
}


await updateEditStatus("1de273e214eb808f94b4c2136b1b1a05")



//For news story:
//name, description, cover, publish date,
//LINK TO: maintainer(s), related people, related topics, sources, tags
//Create tables to show: Collections...

//const getConcatenatedPlainText = (textArray: any[]): string => {
//    return textArray.map(item => item.plain_text).join("");
//  };

//console.log("PAGE RESULTS")
//const page = await notion.pages.retrieve({ page_id: "1af273e214eb807eb6eac0285eef5824" });
//console.log(getConcatenatedPlainText(page.properties['Name'].title))