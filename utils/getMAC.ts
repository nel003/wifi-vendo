const fs = require("fs");
const path = "/var/lib/dhcp/dhcpd.leases";

export async function getMacFromIp(ip: string | undefined): Promise<string | null> {
    if (!ip) {
        return null
    }
    return new Promise((resolve, reject) => {
      fs.readFile(path, "utf-8", (err: any, data: string) => {
        if (err) {
          return reject(`Error reading lease file: ${err.message}`);
        }
  
        const leases = data.split("lease "); // Split by lease entries
        for (const lease of leases) {
          if (lease.startsWith(ip)) {
            const macMatch = lease.match(/hardware ethernet ([a-f0-9:]{17});/i);
            if (macMatch) {
              return resolve(macMatch[1]); // Return the MAC address
            }
          }
        }
        resolve(null); // Return null if no match is found
      });
    });
  }
