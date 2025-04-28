const { Client } = require("@notionhq/client")
import { walletAddress, TABLES } from './src/constants';


// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const allResults = [];
let hasMore = true;
let startCursor = undefined;

while (hasMore) {
  const response = await notion.databases.query({
    database_id: TABLES.news_stories,
    filter: {
      property: "Edit status",
      multi_select: {
        contains: "Accepted",
      },
    },
    start_cursor: startCursor,
    page_size: 100,
  });

  allResults.push(...response.results);

  hasMore = response.has_more;
  startCursor = response.next_cursor;

  // 💤 Optional delay before the next request
  if (hasMore) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

for (const story of allResults) {
  console.log(`${story.id}`);
}
console.log(`Total stories: ${allResults.length}`);


