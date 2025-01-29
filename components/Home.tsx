"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userStore } from "@/store/user";
import { ChartNoAxesGantt, EllipsisVertical, LaptopMinimal, Router, Ticket, Unplug, X } from "lucide-react";
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
  
export default function Home() {

    const stats: Record<string, {text: string, textcolor: string, bgcolor: string}> = {
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
    const [rates, setRates] = useState<Rate[] | []>([])
    

    const loadRates = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/rates');
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
        setStatus("test");
        try {
            await axios({
                method: "GET",
                url: "https://httpbin.org/get",
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
        test();
        loadRates();
    }, [test, loadRates]);

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
                if (user) {
                    setUser({...user, 'expire_on': null});
                }
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


    console.log(user);
    return (
        <div className="grid place-items-center h-[100dvh] bg-background">
        <div>
            <div className="w-full flex items-center flex-col">
                <div className="-mt-12 pb-12 flex gap-2">
                    <span className={`block h-2 w-2 ${stats[status].bgcolor} rounded-full mt-2`}></span>
                    <h1 className={`${stats[status].textcolor}`}>{stats[status].text}</h1>
                </div>
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
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={redeem}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>


                    <Drawer>
                        <DrawerTrigger>
                            <div className="p-3 bg-blue-50 rounded-full duration-150 transform hover:scale-125"><ChartNoAxesGantt size={16} className="text-blue-600"/></div>   
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
                            <div className="p-3 bg-yellow-50 rounded-full duration-150 transform hover:scale-125"><EllipsisVertical size={16} className="text-yellow-600"/></div>   
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="center">
                            <DropdownMenuLabel>Details - {(new Date(user?.expire_on || "").toDateString())}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem><Router/>{user?.ip}</DropdownMenuItem>
                            <DropdownMenuItem><LaptopMinimal/> {user?.mac}</DropdownMenuItem>
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