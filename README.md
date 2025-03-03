# Hackathon Template

This is a template for the GRC-20 hackathon. It contains basic scaffolding for being able to deploy spaces, create ops, and publish edits to the knowledge graph.

## Getting Started

### Prerequisites

- Node.js
- npm
- An ethereum wallet with testnet ETH on the Geogenesis Testnet.

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root of the project and add your wallet private key and RPC URL. See `.env.example` for an example.

## Workflow

Writing data to the knowledge graph requires a few steps:

1. Deploying a personal space
2. Generating ops for triples and relations
3. Publishing an edit to IPFS
4. Publishing the edit to your space's smart contract

This template has a `main.ts` file in the root of the project that contains the full workflow.

### Deploying a space

You can deploy spaces programmatically using the API. This repo has a `deploySpace` function that wraps the GRC-20 library's deploy steps. If you already have a personal space and know the space id you can skip this step.

```ts
import { deploySpace } from '.src/deploy-space';

const editorAddress = 'YOUR WALLET ADDRESS';
const spaceName = 'Example Name';

const spaceId = await deploySpace({
  spaceName,
  initialEditorAddress: editorAddress,
  network: 'TESTNET', // Optionally specify the network, defaults to MAINNET
})
```

### Generating ops

The GRC-20 library has a `Triple` and `Relation` API that can be used to generate ops for triples and relations.

```ts
import {
  type CreateRelationOp,
  type DeleteRelationOp,
  type DeleteTripleOp,
  Relation,
  type SetTripleOp,
  Triple,
} from '@graphprotocol/grc-20';

const setTripleOp: SetTripleOp = Triple.make({
  entityId: 'id of entity',
  attributeId: 'id of attribute',
  value: {
    type: 'TEXT', // TEXT | NUMBER | URL | TIME | POINT | CHECKBOX,
    value: 'hello world',
  },
});

const deleteTripleOp: DeleteTripleOp = Triple.remove({
  entityId: 'id of entity',
  attributeId: 'id of attribute',
});

const setRelationOp: CreateRelationOp = Relation.make({
  fromId: 'id of from entity',
  relationTypeId: 'id of relation type',
  toId: 'id of to entity',
});

const deleteRelationOp: DeleteRelationOp = Relation.remove('id of relation');
```

### Publishing ops

Once you have the ops you want to deploy, you'll need to package them into an `Edit`. An `Edit` represents a collection
of ops logically grouped together. This works similar to a pull request in git. An Edit is posted onto IPFS and given a content identifier (CID) pointing to the edit in the IPFS network.

Once you have the CID you can publish it to your space's smart contract. This requires writing a transaction with your wallet to the Geogenesis testnet.

This template exposes a `publish` function that wraps the IPFS publishing and smart contract publishing steps. You can find the code in `src/publish.ts`.

Make sure you've populated a `.env` file locally with your wallet's private key and Geogenesis testnet RPC URL.

```ts
import { Op } from '@graphprotocol/grc-20';
import { publish } from './src/publish';

const ops: Op[] = [...]; // An edit accepts an array of Ops

const txHash = await publish({
  spaceId: 'YOUR SPACE ID',
  ops: ops,
  author: 'YOUR WALLET ADDRESS',
  editName: 'EDIT NAME',
});
```

