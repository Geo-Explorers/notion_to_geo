type Result = {
	id: string;
	name: string | null;
};

export async function fuzzySearch(searchTerm: string): Promise<Result[]> {
	const response = await fetch(`https://api-testnet.grc-20.thegraph.com/search?q=${searchTerm}`);
	// add network=TESTNET to search testnet
	// const response = await fetch(`https://api-testnet.grc-20.thegraph.com/search?q=${searchTerm}&network=TESTNET`);
	const { results } = await response.json();
	return results;
}

console.log(JSON.stringify(await fuzzySearch("gen"), null, 2));
