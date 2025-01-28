import { execSync } from 'child_process';

export function flushRules(mac: string) {
  try {
    const output = execSync(`iptables -L FORWARD -v -n --line-numbers | grep '${mac}'`).toString();
    const lines = output.split("\n").reverse();

    lines.forEach((line) => {
      if (line.includes(mac)) {
        const match = line.match(/^(\d+)\s+/);
        if (match) {
          const lineNumber = match[1];
          console.log(`Deleting rule for MAC ${mac} at line number ${lineNumber}`);
          execSync(`sudo iptables -D FORWARD ${lineNumber}`);
        }
      }
    });

    console.log(`All FORWARD rules for MAC ${mac} have been flushed.`);
  } catch (error) {
    console.log("Error flushing FORWARD rules:", error);
  }
}

