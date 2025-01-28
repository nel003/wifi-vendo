import { execSync } from 'child_process';

export function checkRule(rule: string): boolean {
    try {
        const command = `iptables -L FORWARD -v -n --line-numbers | grep '${rule}'`;
        const stdout = execSync(command, { encoding: 'utf8' });

        if (!stdout) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Rule does not exist:', error);
        return false;
    }
}

checkRule("b0:3c:dc:82:bf:13");