const fs = require("fs");
const path = "/var/lib/misc/dnsmasq.leases";

export async function activeLease(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf-8", (err: any, data: string) => {
            if (err) {
                return reject(`Error reading lease file: ${err.message}`);
            }

            const macList = [];

            const lines = data.split("\n");
            for (const line of lines) {
                const parts = line.split(" ");
                macList.push(parts[1])
            }
            resolve(macList);
        });
    });
}
