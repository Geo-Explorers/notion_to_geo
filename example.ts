import { TeableClient } from "./src/teable-client";
import { PROD_TABLE_IDS } from "./src/teable-meta";

const main = async () => {
  const teableClient = new TeableClient();
  const records = await teableClient.get_records(PROD_TABLE_IDS.Projects);
  const investments = await teableClient.get_records(
    PROD_TABLE_IDS.InvestmentRounds
  );

  console.log({ records, investments });
};

main();
