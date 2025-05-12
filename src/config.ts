import * as dotenv from "dotenv";

dotenv.config();

const PK = import.meta.env.VITE_PK;

if (!PK) {
  throw new Error("PK does not exist in environment");
}

const RPC = import.meta.env.VITE_RPC;

if (!RPC) {
  throw new Error("RPC does not exist in environment");
}

export const config = {
  pk: PK,
  rpc: RPC,
};

let PK_SW: `0x${string}` | undefined = undefined;

export const GET_PK_SW = (): `0x${string}` => {
  if (!PK_SW) {
    PK_SW = import.meta.env.VITE_PK_SW;
  }
  return PK_SW;
};

export const SET_PK_SW = (pk: `0x${string}`) => {
  PK_SW = pk;
};
