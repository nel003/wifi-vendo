const fs = require("fs");
const path = "/var/lib/misc/dnsmasq.leases";

export async function getDeviceInfoFromIp(ip: string | undefined): Promise<{ mac: string | null, deviceName: string | null }> {
    if (!ip) {
        return { mac: null, deviceName: null };
    }
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf-8", (err: any, data: string) => {
            if (err) {
                return reject(`Error reading lease file: ${err.message}`);
            }

            const lines = data.split("\n");
            for (const line of lines) {
                const parts = line.split(" ");
                if (parts.length >= 5 && parts[2] === ip) { // Check if IP matches
                    return resolve({
                        mac: parts[1], // MAC address
                        deviceName: parts[3] !== "*" ? parts[3] : null // Hostname (if available)
                    });
                }
            }
            resolve({ mac: null, deviceName: null }); // Return null if no match is found
        });
    });
}
