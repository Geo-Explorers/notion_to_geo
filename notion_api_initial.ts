import { Client } from "@notionhq/client";
import { walletAddress, TABLES, getConcatenatedPlainText } from './src/constants';

// Initializing a client
const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
})


//For news story:
//name, description, cover, publish date,
//LINK TO: maintainer(s), related people, related topics, sources, tags
//Create tables to show: Collections...

console.log("PAGE RESULTS")
const page = await notion.pages.retrieve({ page_id: "1af273e214eb809a97eec9fa398c36ba" });
//console.log(page)

const story_name = getConcatenatedPlainText(page.properties["Name"]?.title);
const story_description = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
const publish_date = page.properties["Publish date"]?.date?.start ?? "No publish date";

console.log("News story")
console.log("Name:", story_name);
console.log("Description:", story_description);
console.log("Publish date:", publish_date);

//Pull maintainers
//LINK TO MAINTAINERS
const maintainers = page.properties["Maintainers"].relation;
// If there's at least one maintainer:
if (maintainers.length > 0) {
  for (const maintainer of maintainers) {
    const maintainerPage = await notion.pages.retrieve({ page_id: maintainer.id });
    const name = getConcatenatedPlainText(maintainerPage.properties["Name"]?.title);

    console.log("\nMaintainer:", name);

    await new Promise(resolve => setTimeout(resolve, 200));
  }

}
//Note if "has_more" = true then there may be more than one page of these results. Will need to paginate then...

//Pull sources
//LINK TO SOURCES
const sources = page.properties["Sources"].relation;

for (const source of sources) {
    const sourcePage = await notion.pages.retrieve({ page_id: source.id });

    const name = getConcatenatedPlainText(sourcePage.properties["Name"]?.title);
    console.log("Source name:", name);

    //console.log(sourcePage.properties["Web URL"]?.url)
    //console.log(sourcePage.properties["Avatar"]?.files?.[0]?.file?.url ?? "NONE")
    console.log(sourcePage.properties["Source Type"]?.select?.name ?? "NONE")

    await new Promise(resolve => setTimeout(resolve, 200));
  }


//Pull collections
//ADD COLLECTIONS TO DATABLOCKS AT TOP OF NEWS STORY ENTITY
//GET QUOTES THAT SUPPORT CLAIMS AND RELATED PEOPLE
const collections = page.properties["Collections"].relation;

for (const collection of collections) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const collectionPage = await notion.pages.retrieve({ page_id: collection.id });
    const name = getConcatenatedPlainText(collectionPage.properties["Name"]?.title);
    console.log("\n\nCollection name:", name);

    const claims = collectionPage.properties["Claims"].relation;
    for (const claim of claims) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const claimPage = await notion.pages.retrieve({ page_id: claim.id });
        const name = getConcatenatedPlainText(claimPage.properties["Name"]?.title);
        console.log("\nClaim name:", name);

        const quotesSupporting = claimPage.properties["Quotes that support the claim"].relation;

        for (const quote of quotesSupporting) {
            await new Promise(resolve => setTimeout(resolve, 200));
            const quotePage = await notion.pages.retrieve({ page_id: quote.id });
            const name = getConcatenatedPlainText(quotePage.properties["Name"]?.title);
            console.log("Quotes that support:", name);
        }
    }

    //I NEED SOME SORT OF INTERNAL STORAGE TO MAP GEO IDs to things that I am writing in this go around...
    //COuld I just look back through my ops for an exact string and then pull the geo_id from there?
    //Essentially, check geo, if it doesnt exist, check my ops, if it doesnt exist, then write the required ops?
    //That sounds like a good strategy

  }



  //Publish sources first
  // - store key value pairs linking notion ID to geo ID
  //Then quotes supporting claims
  //Then claims
  //Then with all that published, I should be able to publish the full news story and the datatables!