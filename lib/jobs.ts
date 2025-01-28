import { CronJob } from 'cron';
import db from "@/lib/database";
import { execSync } from "child_process";
import { RowDataPacket } from 'mysql2';

export const jobs = new Map<string, CronJob | null>();

export const createJob = async (name: string, date: string) => {
    console.log("Creating job ", date);
    try {
        jobs.set(name,  new CronJob(new Date(date), async () => {
            const [result] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE mac = ?;', [name]);
            if (result[0].expire_on != null && new Date(result[0].expire_on) <= new Date(Date.now())) {
                //Block internet
                console.log("Blocking internet for ", name);
                execSync(`iptables -D FORWARD -i enx00e0990026d3 -o end0 -m mac --mac-source ${name} -j ACCEPT`);
                jobs.get(name)?.stop();
                jobs.set(name, null);
            } else {
                console.log("Updating job for ", name);
                jobs.get(name)?.stop();
                createJob(name, result[0].expire_on);
            }
        }));
        jobs.get(name)?.start();
    } catch (error) {
        console.log(error);
    }
    
}
