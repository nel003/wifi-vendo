const { execSync } = require("child_process");
const interfaceName = "enx00e0990026d3";

export async function activeLease(): Promise<string[]> {
    try {
        const output = execSync(`ip neigh show dev ${interfaceName}`, { encoding: "utf-8" });

        return output
            .split("\n")
            .filter((line: string) => line.includes("REACHABLE")) // Filter REACHABLE entries
            .map((line: string) => line.split(" ")[2]) // Extract MAC addresses
            .filter((mac: string) => mac); // Remove empty values
    } catch (_) {
        return [];
    }
}
