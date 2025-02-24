"use client";

import Voucher from "@/components/Voucher";
import Main from "@/components/Home";
import { userStore } from "@/store/user";
import moment from "moment-timezone";

export default function Home() {
  const user = userStore(store => store.User);

  // Convert dates to Asia/Manila timezone
  const expireOn = user?.expire_on ? moment.tz(user.expire_on, "Asia/Manila") : null;
  const now = moment.tz(Date.now(), "Asia/Manila");

  console.log("From DB (Asia/Manila):", expireOn?.format());
  console.log("From Local (Asia/Manila):", now.format());

  return (expireOn && expireOn.isAfter(now) ? <Main /> : <Voucher />);
}
