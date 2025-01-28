"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userStore } from "@/store/user";
import { EllipsisVertical, Ticket } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
  } from "@/components/ui/input-otp"
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import axios  from "axios";
import { ErrorResponse } from "@/types/types";

export default function Home() {
    const user = userStore(store => store.User);
    const setUser = userStore(store => store.setUser);
    const [voucher, setVoucher] = useState(""); 
    const { toast } = useToast();
    const timerRef = useRef<HTMLHeadingElement | null>(null);
    const timerIn = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const expireOn = user?.expire_on ? new Date(user.expire_on) : null;
        console.log(user?.expire_on);
        console.log("Counting down");

        
        function updateCountdown() {
            if (!timerRef.current || !expireOn || !timerIn.current) {
                return;
                
            }

            const timeDiff = expireOn.getTime() - Date.now();

            if (timeDiff <= 0) {
                timerRef.current.textContent = '00:00:00:00';
                clearInterval(timerIn.current);
                return;
            }

            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            timerRef.current.textContent = 
            `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        timerIn.current  = setInterval(updateCountdown, 1000);
        updateCountdown();

        return () => {
            if (timerIn.current) {
                clearInterval(timerIn.current);
            }
        }

    }, [user]);

    async function redeem() {
        toast({
            title: "Redeeming...",
            description: "Voucher successfully redeemed.",
          });
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
                description: err?.response.data.msg || "",
              })
        }
    }


    console.log(user);
    return (
        <div className="grid place-items-center h-screen bg-background">
        <div>
            <div className="w-full flex items-center flex-col">
            <Avatar>
                <AvatarImage src="/favicon.ico" />
                <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <h1 className="font-bold text-md">WiFi</h1>
            <span className="block h-[1px] w-[75%] bg-foreground/30 mt-3 mb-2"></span>
            </div>

            <h1 className="text-center py-1 text-lg text-slate-500">{user?.mac}</h1>
            <h1 ref={timerRef} style={{fontSize: "3rem"}} className="text-center py-1 text-lg text-slate-700 font-bold">
                00:00:00:00
            </h1>

            <div className="w-full flex justify-center mt-4 gap-2">
                <AlertDialog>
                    <AlertDialogTrigger>
                        <div className="p-3 bg-green-50 rounded-full duration-150 transform hover:scale-125"><Ticket size={16} className="text-green-600"/></div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Redemm Voucher</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your time will be extended.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid place-items-center pb-2">
                            {/* <h1 className="text-center py-1 text-lg text-slate-800">Voucher</h1> */}
                            <InputOTP maxLength={6} onChange={(v) => setVoucher(v)} value={voucher}>
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
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={redeem}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="p-3 bg-yellow-50 rounded-full duration-150 transform hover:scale-125"><EllipsisVertical size={16} className="text-yellow-600"/></div>
            </div>
        </div>
        </div>
    );
}