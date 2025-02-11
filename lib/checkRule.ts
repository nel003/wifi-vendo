import { execSync } from 'child_process';

export function checkRule(mac: string): boolean {
    try {
        const command = "ipset list allowed_macs";
        const stdout = execSync(command, { encoding: 'utf8' });

        return stdout.toLowerCase().includes(mac);
    } catch (_) {
        console.log('Rule does not exist');
        return false;
    }
}