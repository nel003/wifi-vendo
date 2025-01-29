import { exit } from "process";
import db from "./lib/database";

async function init() {
    try {
       await db.query('UPDATE vouchers SET used = 0;');
    } catch (error) {
        console.error(error);
    }
    exit();
}

init();