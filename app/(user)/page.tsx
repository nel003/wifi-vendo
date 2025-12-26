"use client";

import Voucher from "@/components/Voucher";
import Main from "@/components/Home";
import { userStore } from "@/store/user";

export default function Home() {
  const user = userStore(store => store.User);

  // return (<Main />);
  return (user?.timeout! > 0 ? <Main /> : <Voucher />);
}
