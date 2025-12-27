"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react";
import { userStore } from "@/store/user";
import axios from "axios";
import { useToast } from "@/hooks/use-toast"
import { ErrorResponse } from "@/types/types";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { WifiHigh, X, Lock, Zap, ArrowRight, Ticket } from "lucide-react";
import InsertCoin from "./InsertCoin";
import captiveCheck from "@/utils/captiveCheck";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Voucher() {
    const setUser = userStore(store => store.setUser);
    const [voucher, setVoucher] = useState("");
    const { toast } = useToast();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [waitingForCoin, setWaitingForCoin] = useState(false);

    async function redeem(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const target = e.target as HTMLButtonElement;
        const originalText = target.innerText;
        target.innerText = "Processing...";
        target.disabled = true;
        try {
            const res = await axios({
                method: "POST",
                url: "/api/redeem",
                data: JSON.stringify({ voucher })
            });
            setUser(res.data.user);
            toast({
                title: "Success",
                description: "Voucher successfully redeemed.",
            });
            captiveCheck();
        } catch (error) {
            console.log(error);
            const err = error as ErrorResponse;
            toast({
                title: "Failed",
                description: err.response.data.msg,
            })
        }
        target.innerText = originalText;
        target.disabled = false;
    }

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl h-auto md:h-[500px] border-0 shadow-2xl overflow-hidden flex flex-col md:flex-row bg-white rounded-3xl">
                {/* Left Panel - Dark */}
                <div className="w-full md:w-5.5/12 bg-emerald-950 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">

                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-800 via-emerald-950 to-emerald-950 opacity-90 z-0"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl z-0"></div>

                    <div className="relative z-10">
                        <div className="h-12 w-12 bg-emerald-800/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-emerald-700/50 mb-8">
                            <WifiHigh className="text-white" size={24} />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                            Connect instantly.
                        </h1>
                        <p className="text-emerald-100/70 text-sm md:text-base leading-relaxed max-w-xs">
                            Enjoy high-speed internet access securely. Redeem your voucher code to get started.
                        </p>
                    </div>

                    <div className="relative z-10 hidden md:flex gap-6 mt-12">
                        <div className="flex items-center gap-2">
                            <Lock size={14} className="text-emerald-300/70" />
                            <span className="text-xs text-emerald-100/60 font-medium tracking-wide">Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-emerald-300/70" />
                            <span className="text-xs text-emerald-100/60 font-medium tracking-wide">Fast</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Light */}
                <div className="w-full md:w-6.5/12 bg-white p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Redeem Voucher</h2>
                        <p className="text-slate-500 text-sm mb-8">Enter the code provided on your receipt.</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1">
                                    Voucher Code
                                </label>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex justify-center items-center transition-all focus-within:ring-2 focus-within:ring-slate-950/10 focus-within:border-slate-300">
                                    <Ticket className="text-slate-400 ml-3 mr-2 shrink-0" size={20} />
                                    <Input
                                        type="text"
                                        placeholder="XXX-XXX"
                                        className="border-0 shadow-none focus-visible:ring-0 text-lg tracking-widest placeholder:tracking-normal w-full"
                                        value={voucher}
                                        onChange={(e) => setVoucher(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <Button
                                disabled={voucher.length < 6}
                                onClick={(e) => redeem(e)}
                                className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white font-medium rounded-xl shadow-lg shadow-slate-950/10 transition-all flex px-6 group"
                            >
                                <span>Redeem Access</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Button>

                            {/* <div className="pt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
                                <span>Need help? <a href="#" className="text-slate-900 font-semibold hover:underline">Contact Support</a></span>
                            </div> */}

                            {process.env.NEXT_PUBLIC_HAS_COINSLOT === "true" && (
                                <div className="text-center pt-2">
                                    <Drawer open={isDrawerOpen} onOpenChange={(v) => {
                                        if (waitingForCoin) {
                                            setIsDrawerOpen(true);
                                            return;
                                        }
                                        setIsDrawerOpen(v)
                                    }}>
                                        <DrawerTrigger asChild>
                                            <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
                                                Or pay with <span className="underline decoration-slate-300 underline-offset-2 font-bold">Coins</span>
                                            </button>
                                        </DrawerTrigger>
                                        <DrawerContent className="w-full grid place-items-center">
                                            <div className="w-full max-w-[450px]">
                                                <DrawerHeader className="flex justify-between items-center">
                                                    <DrawerTitle>Insert Coin</DrawerTitle>
                                                    <DrawerClose asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                            <X size={18} />
                                                        </Button>
                                                    </DrawerClose>
                                                </DrawerHeader>
                                                <DrawerFooter>
                                                    <div className="w-full">
                                                        <InsertCoin isOpen={isDrawerOpen} setOpen={setIsDrawerOpen} waitingForCoin={waitingForCoin} setWaitingForCoin={setWaitingForCoin} />
                                                    </div>
                                                </DrawerFooter>
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
