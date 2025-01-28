"use client"

import Voucher from "@/components/Voucher";
import Main from "@/components/Home";
import { userStore } from "@/store/user";

export default function Home() {
  const user = userStore(store => store.User);

  return (user?.expire_on != null && new Date(user?.expire_on) > new Date(Date.now()) ? <Main/> : <Voucher/>);
}
