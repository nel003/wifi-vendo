const fs = require("fs");
const path = "/var/lib/dhcp/dhcpd.leases";

export async function getDeviceInfoFromIp(ip: string | undefined): Promise<{ mac: string | null, deviceName: string | null }> {
    if (!ip) {
        return { mac: null, deviceName: null };
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
            const deviceMatch = lease.match(/client-hostname "([^"]+)";/);
            if (macMatch || deviceMatch) {
              return resolve({
                mac: macMatch ? macMatch[1] : null,
                deviceName: deviceMatch ? deviceMatch[1] : null
              });
            }
          }
        }
        resolve({ mac: null, deviceName: null }); // Return null if no match is found
      });
    });
  }