import { Client } from "@notionhq/client";
import { walletAddress, TABLES, getConcatenatedPlainText } from './src/constants';

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})


//For news story:
//name, description, cover, publish date,
//LINK TO: maintainer(s), related people, related topics, sources, tags
//Create tables to show: Collections...

console.log("PAGE RESULTS")
const page = await notion.pages.retrieve({ page_id: "17c273e214eb80ae92a5c88ab47bb106" });
//console.log(page)

const story_name = getConcatenatedPlainText(page.properties["Name"]?.title);
const story_description = getConcatenatedPlainText(page.properties["Description"]?.rich_text);
const publish_date = page.properties["Publish date"]?.date?.start ?? "No publish date";

console.log("News story")
console.log("Name:", story_name);
console.log("Description:", story_description);
console.log("Publish date:", publish_date);


const newsStoryOfTheDay = page.properties["News story of the day"]?.checkbox;
const newsStoryOfTheWeek = page.properties["News story of the week"]?.checkbox;

console.log("Week: ", newsStoryOfTheWeek);
