import * as dotenv from "dotenv";

dotenv.config();

const PK = import.meta.env.VITE_PK;

const RPC = import.meta.env.VITE_RPC;

export const config = {
  pk: PK,
  rpc: RPC,
};

let PK_SW: `0x${string}` | undefined = undefined;

export const GET_PK_SW = (): `0x${string}` => {
  return PK_SW || import.meta.env.VITE_PK_SW;
};

export const SET_PK_SW = (pk: `0x${string}`) => {
  PK_SW = pk;
};
