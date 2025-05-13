import { Client } from "@notionhq/client";
import { walletAddress, TABLES } from './src/constants';


// Initializing a client
const notion = new Client({
  auth: process.env.VITE_NOTION_TOKEN,
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





    // Step 1: Get all toEntity IDs from disqualifying CREATE_RELATION ops
    const disqualifiedEntities = new Set(
        ops
        .filter(op =>
            op.type === "CREATE_RELATION" &&
            op.relation.type === "QYbjCM6NT9xmh2hFGsqpQX"
        )
        .map(op => op.relation.toEntity)
    );
    
    // Step 2: Filter SET_TRIPLE ops where entity is not in the disqualified set
    const validSetTripleOps = ops.filter(op =>
        op.type === "SET_TRIPLE" &&
        !disqualifiedEntities.has(op.triple.entity)
    );

    if ((validSetTripleOps.length > 0) && (true)) {
        const iso = new Date().toISOString();
        let txHash;
        const spaces = await getSpaces(validSetTripleOps);
        prioritizeItem(spaces, GEO_IDS.cryptoSpaceId); // prioritize crypto space transaction

        for (const space of spaces) { 
            txHash = await publish({
                spaceId: space,
                author: mainnetWalletAddress,
                editName: `Upload Name entities ${iso}`,
                ops: await filterOps(validSetTripleOps, space), // An edit accepts an array of Ops
            }, "MAINNET");
    
            console.log(`Your NAME OPS transaction hash for ${space} is:`, txHash);
            console.log(iso);
            
            console.log(`Number of NAME OPS published in ${space}: `, (await filterOps(validSetTripleOps, space)).length)
        }   
    }

    await wait(60000);