"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import moment from "moment-timezone";
import { userStore } from "@/store/user";
import { ChartNoAxesGantt, Coins, EllipsisVertical, Fingerprint, LaptopMinimal, Pause, Play, Router, Ticket, Unplug, Wifi, WifiHigh, X } from "lucide-react";
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
import { useEffect, useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import axios  from "axios";
import { ErrorResponse, Rate } from "@/types/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "./ui/button";
import InsertCoin from "./InsertCoin";
  
export default function Home() {

    const stats: Record<string, {text: string, textcolor: string, bgcolor: string}> = {
        "paus": {text: "Paused", textcolor: "text-yellow-300", bgcolor: "bg-yellow-300"},
        "test": {text: "Testing", textcolor: "text-yellow-300", bgcolor: "bg-yellow-300"},
        "dist": {text: "Disconnected", textcolor: "text-red-300", bgcolor: "bg-red-300"},
        "conn": {text: "Connected", textcolor: "text-green-300", bgcolor: "bg-green-300"},
    }

    const user = userStore(store => store.User);
    const setUser = userStore(store => store.setUser);
    const [voucher, setVoucher] = useState(""); 
    const { toast } = useToast();
    const timerRef = useRef<HTMLHeadingElement | null>(null);
    const timerIn = useRef<NodeJS.Timeout | null>(null);
    const [status, setStatus] = useState("test");
    const [rates, setRates] = useState<Rate[] | []>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    

    const loadRates = useCallback(async () => {
        try {
            const res = await axios.get('/api/rates');
            setRates(res.data)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }    
    }, [setRates, toast]);
    const test = useCallback(async () => {
        try {
            setStatus("test");
            await axios({
                method: "GET",
                url: `https://dns.google/resolve?name=google.com&_=${Date.now()}`,
                timeout: 5000
            });
            setStatus("conn");
        } catch (error) {
            console.log(error)
            setStatus("dist");
            toast({
                title: "No internet!",
                description:"Please click the three dots and click fix",
              })
        }
    }, [toast]);

    useEffect(() => {
        loadRates();
    }, [test, loadRates]);

    useEffect(() => {
        if(user?.paused){
            setStatus("paus");
        } else {
            test();
        }
    }, [user, test]);

    useEffect(() => {
        let timeout = user?.timeout;
        function updateCountdown() {
            if (!timerRef.current || !timeout) return;
            const duration = moment.duration(timeout, 'seconds');

            if (duration.asSeconds() <= 1) {
                timerRef.current.textContent = "00:00:00:00";
                clearInterval(timerIn.current!);
                timeout = undefined;
                if (user) setUser({ ...user, timeout: 0});
                return;
            }

            timerRef.current.textContent = `${String(duration.days()).padStart(2, "0")}:`
                + `${String(duration.hours()).padStart(2, "0")}:`
                + `${String(duration.minutes()).padStart(2, "0")}:`
                + `${String(duration.seconds()).padStart(2, "0")}`;
            if (!user?.paused) {
                timeout--;
            }
            }

        timerIn.current = setInterval(updateCountdown, 1000);
        updateCountdown();

        return () => {
            clearInterval(timerIn.current!)
            timeout = undefined;
        };
    }, [user, setUser]);
    
    async function redeem() {
        toast({
            title: "Redeeming...",
            description: "Please wait.",
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

    async function fix() {
        toast({
            title: "Fixing...",
            description: "Please wait for few seconds",
          });
        try {
            await axios.get("/api/fix");
            toast({
                title: "Done",
                description: "Check the status",
              })
            test();
        } catch (error) {
            console.log(error);
            const err = error as ErrorResponse;
            toast({
                title: "Failed",
                description: err?.response.data.msg || "",
              })
        }
    }

    async function playPause() {
        try {
            const url = "/api/"+(user?.paused ? "play":"pause");
            const res = await axios.get(url);
            setUser(res.data.user);

            toast({
                title: "Sucess",
                description: user?.paused ? "Time continued" : "Time paused"
              })
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
        <div className="grid place-items-center h-full w-screen bg-background">
        <div>
            <div className="w-full flex items-center flex-col">
                <div className="-mt-12 pb-12 flex gap-2">
                    <span className={`block h-2 w-2 ${stats[status].bgcolor} rounded-full mt-2`}></span>
                    <h1 className={`${stats[status].textcolor}`}>{stats[status].text}</h1>
                </div>
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

                <h1 className="text-center py-1 text-lg text-slate-500 mt-2">{user?.mac}</h1>
                <h1 ref={timerRef} style={{fontSize: "3rem"}} className="text-center py-1 text-lg text-slate-700 font-bold">
                    00:00:00:00
                </h1>

                <div className="w-full flex justify-center mt-6 gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <div className="p-3 bg-blue-50/60 rounded-full duration-150 transform hover:scale-125"><Ticket size={16} className="text-blue-600/60"/></div>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Redeem Voucher</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Your time will be extended.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid place-items-center pb-2">
                                {/* <h1 className="text-center py-1 text-lg text-slate-800">Voucher</h1> */}
                                <InputOTP inputMode="text" maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} onChange={(v) => setVoucher(v)} value={voucher}>
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
                            <AlertDialogFooter className="flex">
                                <AlertDialogCancel>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={redeem}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                        <DrawerTrigger asChild>
                            <div className="p-3 bg-green-50 rounded-full duration-150 transform hover:scale-125"><Coins size={16} className="text-green-600"/></div>
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
                    <div className="p-3 bg-slate-50 rounded-full duration-150 transform hover:scale-125" onClick={playPause}>{user?.paused ? <Play size={16} className="text-slate-600"/> : <Pause size={16} className="text-slate-600"/>}</div>
                    <Drawer>
                        <DrawerTrigger>
                            <div className="p-3 bg-yellow-50 rounded-full duration-150 transform hover:scale-125"><ChartNoAxesGantt size={16} className="text-yellow-600"/></div>   
                        </DrawerTrigger>
                        <DrawerContent className="w-full grid place-items-center">
                            <div className="w-full max-w-[450px]">
                                <DrawerHeader className="flex justify-between">
                                    <DrawerTitle>List of rates</DrawerTitle>
                                    <DrawerClose className="-mt-1">
                                        <X/>
                                    </DrawerClose>
                                </DrawerHeader>
                                <DrawerFooter>
                                    <div className="w-full">
                                        <Table className="w-full">
                                            <TableCaption>A list of rates.</TableCaption>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Time</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rates.map((rate) => (
                                                    <TableRow key={rate.id}>
                                                        <TableCell>{rate.price}</TableCell>
                                                        <TableCell>{+rate.time / 60} Hours</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </DrawerFooter>
                            </div>
                        </DrawerContent>
                    </Drawer>

                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className="p-3 bg-orange-50 rounded-full duration-150 transform hover:scale-125"><EllipsisVertical size={16} className="text-orange-600"/></div>   
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center">
                            <DropdownMenuLabel>Details - {(new Date(user?.expire_on || "").toDateString())}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem><Router/>{user?.ip}</DropdownMenuItem>
                            <DropdownMenuItem><LaptopMinimal/> {user?.device}</DropdownMenuItem>
                            <DropdownMenuItem><Fingerprint/> {user?.mac}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={fix}>
                                <Unplug />
                                No Internet? <span className="font-bold">Fix Here</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
            </div>
        </div>
        </div>
    );
}
