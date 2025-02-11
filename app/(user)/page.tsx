"use client"

import Voucher from "@/components/Voucher";
import Main from "@/components/Home";
import { userStore } from "@/store/user";

export default function Home() {
  const user = userStore(store => store.User);

  console.log("From DB: ", new Date(user?.expire_on || ""))
  console.log("From Local: ", new Date(Date.now()))

  return (user?.expire_on != null && new Date(user?.expire_on) > new Date(Date.now()) ? <Main/> : <Voucher/>);
}
