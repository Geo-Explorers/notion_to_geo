# Hackathon Template

This is a template for the GRC-20 hackathon. It contains basic scaffolding for being able to deploy spaces, create ops, and publish edits to the knowledge graph.

## Getting Started

### Prerequisites

- Node.js
- npm
- An ethereum wallet with testnet ETH on the Geogenesis Testnet

### Installation

```bash
npm install
```

## Workflow

Writing data to the knowledge graph requires a few steps:

1. Deploying a personal space
2. Generating ops for triples and relations
3. Publishing an edit to IPFS
4. Publishing the edit to your space's smart contract