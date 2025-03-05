const { execSync } = require("child_process");
const interfaceName = process.env.INTERFACE || "";

export async function activeLease(): Promise<string[]> {
    try {
        const output = execSync(`ip neigh show dev ${interfaceName}`, { encoding: "utf-8" });

        return output
            .split("\n")
            .filter((line: string) => line.includes("REACHABLE"))
            .map((line: string) => line.split(" ")[2])
            .filter((mac: string) => mac); 
    } catch (_) {
        return [];
    }
}
