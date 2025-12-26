"use client"
import moment from "moment-timezone";
import { userStore } from "@/store/user";
import {
    Coins,
    EllipsisVertical,
    Fingerprint,
    LaptopMinimal,
    Pause,
    Play,
    Router,
    Ticket,
    Unplug,
    WifiHigh,
    X,
    Signal,
    History,
    Plus,
    Moon
} from "lucide-react";
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
import axios from "axios";
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
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Button } from "./ui/button";
import InsertCoin from "./InsertCoin";
import captiveCheck from "@/utils/captiveCheck";

export default function Home() {

    const stats: Record<string, { text: string, textcolor: string, bgcolor: string }> = {
        "paus": { text: "Paused", textcolor: "text-amber-600", bgcolor: "bg-amber-100" },
        "test": { text: "Testing", textcolor: "text-blue-600", bgcolor: "bg-blue-100" },
        "dist": { text: "Disconnected", textcolor: "text-rose-600", bgcolor: "bg-rose-100" },
        "conn": { text: "Connected", textcolor: "text-emerald-600", bgcolor: "bg-emerald-100" },
    }

    const user = userStore(store => store.User);
    const setUser = userStore(store => store.setUser);
    const [voucher, setVoucher] = useState("");
    const { toast } = useToast();

    // Timer Refs for individual segments
    const monthsRef = useRef<HTMLDivElement | null>(null);
    const daysRef = useRef<HTMLDivElement | null>(null);
    const hoursRef = useRef<HTMLDivElement | null>(null);
    const minutesRef = useRef<HTMLDivElement | null>(null);
    const secondsRef = useRef<HTMLDivElement | null>(null);
    const timerIn = useRef<NodeJS.Timeout | null>(null);

    const [status, setStatus] = useState("test");
    const [rates, setRates] = useState<Rate[] | []>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [waitingForCoin, setWaitingForCoin] = useState(false);


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
                description: "Please click the three dots and click fix",
            })
        }
    }, [toast]);

    useEffect(() => {
        loadRates();
    }, [test, loadRates]);

    useEffect(() => {
        if (user?.paused) {
            setStatus("paus");
        } else {
            test();
        }
    }, [user, test]);

    useEffect(() => {
        let timeout = user?.timeout;

        function updateSegment(ref: React.MutableRefObject<HTMLDivElement | null>, value: number) {
            if (ref.current) {
                ref.current.textContent = String(value).padStart(2, "0");
            }
        }

        function updateCountdown() {
            if (!timeout) return;
            const duration = moment.duration(timeout, 'seconds');

            if (duration.asSeconds() <= 1) {
                if (secondsRef.current) secondsRef.current.textContent = "00";
                clearInterval(timerIn.current!);
                timeout = undefined;
                if (user) setUser({ ...user, timeout: 0 });
                return;
            }

            // Update individual refs
            const months = duration.months();
            if (monthsRef.current) {
                // Only show/update if container exists (depends on render conditional)
                monthsRef.current.textContent = String(months).padStart(2, "0");
            }

            updateSegment(daysRef, duration.days());
            updateSegment(hoursRef, duration.hours());
            updateSegment(minutesRef, duration.minutes());
            updateSegment(secondsRef, duration.seconds());

            if (!user?.paused) {
                timeout--;
            }
        }

        timerIn.current = setInterval(updateCountdown, 1000);
        updateCountdown();

        return () => {
            clearInterval(timerIn.current!);
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
            captiveCheck();
            test();
        } catch (error) {
            console.log(error);
            const err = error as ErrorResponse;
            toast({
                title: "Failed",
                description: err.response.data.msg,
            })
        }
    }

    async function playPause() {
        try {
            const url = "/api/" + (user?.paused ? "play" : "pause");
            const res = await axios.get(url);
            setUser(res.data.user); // Optimistic update or wait for response? Logic seems to rely on response.

            toast({
                title: "Success",
                description: user?.paused ? "Time continued" : "Time paused"
            })
        } catch (error) {
            console.log(error);
            const err = error as ErrorResponse;
            toast({
                title: "Failed",
                description: err.response.data.msg,
            })
        }
    }

    // Helper to calculate initial visibility for months
    const showMonths = (user?.timeout || 0) >= 2629746; // approx 1 month

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 rounded-lg p-1.5 shadow-lg shadow-emerald-500/20">
                        <WifiHigh className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-slate-700 tracking-tight text-lg">WIFI VENDO</span>
                </div>

            </nav>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-sm overflow-hidden relative border border-slate-100">

                    {/* Top Accent */}
                    <div className="h-1.5 w-32 bg-emerald-400 mx-auto rounded-b-full opacity-80 absolute top-0 left-1/2 -translate-x-1/2"></div>

                    <div className="p-8 pt-10 flex flex-col items-center">

                        {/* Status Badge */}
                        <div className={`px-4 py-1.5 rounded-full ${stats[status].bgcolor} ${stats[status].textcolor} text-xs font-bold tracking-wider uppercase mb-8 flex items-center gap-2 shadow-sm`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats[status].bgcolor.replace("bg-", "bg-")}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'conn' ? 'bg-emerald-500' : stats[status].textcolor.replace("text-", "bg-")}`}></span>
                            </span>
                            {stats[status].text}
                        </div>

                        {/* Hero Icon */}
                        <div className="mb-6 relative">
                            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center relative z-10">
                                <WifiHigh size={40} className="text-emerald-500 transform scale-110" />
                            </div>
                            {/* Ripple Effect Layer 1 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-emerald-100 -z-0"></div>
                            {/* Ripple Effect Layer 2 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-slate-50 -z-10"></div>
                        </div>

                        {/* Network Name */}
                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">WiFi Vendo Public</h1>
                            <p className="text-slate-400 font-medium text-sm">Session Active</p>
                        </div>

                        {/* Timer Display */}
                        <div className="bg-slate-50 rounded-3xl p-6 w-full mb-10 border border-slate-100/50">
                            <div className="flex items-center justify-center gap-2 sm:gap-4 text-slate-900">
                                {showMonths && (
                                    <div className="flex flex-col items-center gap-1">
                                        <div ref={monthsRef} className="text-3xl sm:text-4xl font-black font-mono tracking-tighter leading-none">00</div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mon</span>
                                    </div>
                                )}
                                {showMonths && <span className="text-2xl font-light text-slate-300 pb-4">:</span>}

                                <div className="flex flex-col items-center gap-1">
                                    <div ref={daysRef} className="text-3xl sm:text-4xl font-black font-mono tracking-tighter leading-none">00</div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day</span>
                                </div>
                                <span className="text-2xl font-light text-slate-300 pb-4">:</span>

                                <div className="flex flex-col items-center gap-1">
                                    <div ref={hoursRef} className="text-3xl sm:text-4xl font-black font-mono tracking-tighter leading-none">00</div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hrs</span>
                                </div>
                                <span className="text-2xl font-light text-slate-300 pb-4">:</span>

                                <div className="flex flex-col items-center gap-1">
                                    <div ref={minutesRef} className="text-3xl sm:text-4xl font-black font-mono tracking-tighter leading-none">00</div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min</span>
                                </div>
                                <span className="text-2xl font-light text-slate-300 pb-4">:</span>

                                <div className="flex flex-col items-center gap-1">
                                    <div ref={secondsRef} className="text-3xl sm:text-4xl font-black text-emerald-500 font-mono tracking-tighter leading-none">00</div>
                                    <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">Sec</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between w-full px-2">

                            {/* Extend / Redeem */}
                            <div className="flex flex-col items-center gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" className="h-14 w-14 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-none border border-transparent transition-all">
                                            <Plus size={24} strokeWidth={2.5} />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Redeem Voucher</AlertDialogTitle>
                                            <AlertDialogDescription>Enter code to extend your session.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="grid place-items-center pb-4">
                                            <InputOTP inputMode="text" maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} onChange={(v) => setVoucher(v)} value={voucher}>
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                </InputOTPGroup>
                                                <InputOTPSeparator />
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={redeem}>Redeem</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                {process.env.NEXT_PUBLIC_HAS_COINSLOT === "true" && (
                                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                                        <DrawerTrigger asChild>
                                            {/* Optionally add a coin button here or merge functionality */}
                                            <span className="hidden"></span>
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <div className="mx-auto w-full max-w-sm">
                                                <DrawerHeader>
                                                    <DrawerTitle>Insert Coin</DrawerTitle>
                                                    <DrawerClose><X /></DrawerClose>
                                                </DrawerHeader>
                                                <div className="p-4"><InsertCoin isOpen={isDrawerOpen} setOpen={setIsDrawerOpen} waitingForCoin={waitingForCoin} setWaitingForCoin={setWaitingForCoin} /></div>
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                )}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Extend</span>
                            </div>


                            {/* Pause / Play */}
                            <div className="flex flex-col items-center gap-2">
                                <Button
                                    onClick={playPause}
                                    size="icon"
                                    className={`h-14 w-14 rounded-2xl ${user?.paused ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'} shadow-none border border-transparent transition-all`}
                                >
                                    {user?.paused ? <Play size={24} fill="currentColor" className="opacity-100" /> : <Pause size={24} fill="currentColor" className="opacity-100" />}
                                </Button>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{user?.paused ? "Resume" : "Pause"}</span>
                            </div>


                            {/* History / Rates */}
                            <div className="flex flex-col items-center gap-2">
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <Button size="icon" className="h-14 w-14 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-600 shadow-none border border-transparent transition-all">
                                            <History size={22} strokeWidth={2.5} />
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent>
                                        <div className="mx-auto w-full max-w-sm">
                                            <DrawerHeader>
                                                <DrawerTitle>Rates</DrawerTitle>
                                                <DrawerClose><X /></DrawerClose>
                                            </DrawerHeader>
                                            <div className="p-4">
                                                <Table>
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
                                                                <TableCell>{rate.name}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rates</span>
                            </div>


                            {/* More Options */}
                            <div className="flex flex-col items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 shadow-none border border-transparent transition-all">
                                            <EllipsisVertical size={24} strokeWidth={2.5} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                                        <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-2">Device Info</DropdownMenuLabel>
                                        <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer text-slate-600 font-medium">
                                            <Fingerprint className="mr-2 h-4 w-4 opacity-70" />
                                            <span>{user?.mac}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer text-slate-600 font-medium">
                                            <Router className="mr-2 h-4 w-4 opacity-70" />
                                            <span>{user?.ip}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-100 my-1" />
                                        <DropdownMenuItem onClick={fix} className="rounded-xl px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-semibold">
                                            <Unplug className="mr-2 h-4 w-4" />
                                            <span>Fix Connection</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">More</span>
                            </div>
                        </div>

                    </div>

                    {/* Footer / Device Info - REMOVED */}
                </div>
            </main>

            <footer className="p-6 text-center">
                {/* Optional footer content */}
            </footer>
        </div>
    );
}
