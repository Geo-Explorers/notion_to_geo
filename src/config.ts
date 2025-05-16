import * as dotenv from "dotenv";

dotenv.config();

const PK = process.env.PK;

const RPC = process.env.RPC;

export const config = {
  pk: PK,
  rpc: RPC,
};
