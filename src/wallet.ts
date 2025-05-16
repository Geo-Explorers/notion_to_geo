import { createWalletClient, http } from "viem";
import { TESTNET } from "./testnet";
import { config } from "./config";
import { privateKeyToAccount } from "viem/accounts";

export const wallet = (privateKey?: `0x${string}`) =>
  createWalletClient({
    account: privateKeyToAccount(privateKey || (config.pk as `0x${string}`)),
    chain: TESTNET,
    transport: http(config.rpc, { batch: true }),
  });
