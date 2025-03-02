"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
import { userStore } from "@/store/user";
import axios from "axios";
import { useToast } from "@/hooks/use-toast"
import { ErrorResponse } from "@/types/types";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
import { Wifi, WifiHigh, X } from "lucide-react";
import InsertCoin from "./InsertCoin";
  

export default function Voucher() {
    const setUser = userStore(store => store.setUser);
    const [voucher, setVoucher] = useState(""); 
    const { toast } = useToast();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    async function redeem(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const target = e.target as HTMLButtonElement;
        target.innerText = "REDEEMING...";
        target.disabled = true;
        try {
            const res = await axios({
                method: "POST",
                url: "/api/redeem",
                data: JSON.stringify({voucher})
            });
            setUser(res.data.user); 
            toast({
                title: "Success",
                description: "Voucher successfully redeemed.",
              });
        } catch (error) {
            console.log(error);
            const err = error as ErrorResponse;
            toast({
                title: "Failed",
                description: err.response.data.msg,
              })
        }
        target.innerText = "REDEEM";
        target.disabled = false;
    }

    return (
        <div className="grid place-items-center h-full w-screen bg-background">
        <div>
            <div className="w-full flex items-center flex-col">
            {/* <Avatar>
                    <AvatarImage src="/favicon.ico" />
                    <AvatarFallback>AR</AvatarFallback>
                </Avatar> */}
            <div className="bg-black aspect-square grid place-items-center rounded-full">
                <WifiHigh className="text-white p-2 mb-1" size={40}/>
            </div>
            <h1 className="font-bold text-md">WiFi Vendo</h1>
            <span className="hidden h-[1px] w-[75%] bg-foreground/30 mt-3 mb-2"></span>
            </div>

            <h1 className="text-center py-1 text-lg text-slate-800">Voucher</h1>
            <InputOTP inputMode="text" pattern={REGEXP_ONLY_DIGITS_AND_CHARS} maxLength={6} onChange={(v) => setVoucher(v)} value={voucher}>
            <InputOTPGroup>
                <InputOTPSlot className="p-0 xs:p-6" index={0} />
                <InputOTPSlot className="p-0 xs:p-6" index={1} />
                <InputOTPSlot className="p-0 xs:p-6" index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="w-2 h-2 bg-foreground rounded-full overflow-hidden" />
            <InputOTPGroup>
                <InputOTPSlot className="p-0 xs:p-6" index={3} />
                <InputOTPSlot className="p-0 xs:p-6" index={4} />
                <InputOTPSlot className="p-0 xs:p-6" index={5} />
            </InputOTPGroup>
            </InputOTP>

            <div className="w-full flex flex-col justify-center mt-4 gap-2">
                <Button disabled={!(voucher.length >= 6)} onClick={(e) => redeem(e)} className="p-0 xs:p-6">REDEEM</Button>

                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                        <Button variant="ghost" className="p-0 xs:p-6">Insert Coin</Button>
                    </DrawerTrigger>
                    <DrawerContent className="w-full grid place-items-center">
                        <div className="w-full max-w-[450px]">
                            <DrawerHeader className="flex justify-between">
                                <DrawerTitle>Insert Coin</DrawerTitle>
                                <DrawerClose className="-mt-1">
                                    <X/>
                                </DrawerClose>
                            </DrawerHeader>
                            <DrawerFooter>
                                <div className="w-full">
                                    <InsertCoin isOpen={isDrawerOpen} setOpen={setIsDrawerOpen}/>
                                </div>
                            </DrawerFooter>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
        </div>
    );
}
