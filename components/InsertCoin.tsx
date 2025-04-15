import { userStore } from "@/store/user";
import { Button } from "./ui/button";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import captiveCheck from "@/utils/captiveCheck";

function InsertCoin({isOpen, setOpen, waitingForCoin, setWaitingForCoin}: {isOpen: boolean, setOpen: Dispatch<SetStateAction<boolean>>, waitingForCoin: boolean, setWaitingForCoin: Dispatch<SetStateAction<boolean>>,}) {
    const socketRef = useRef<WebSocket | null>(null);
    const [started, setStarted] = useState(false);
    const user = userStore(u => u.User);
    const setUser = userStore(u => u.setUser);
    const [coin, setCoin] = useState(0);
    const [timeleft, setTimeleft] = useState(100);
    const { toast } = useToast();
    const [startSound] = useState(new Audio("/start.mp3"));
    const [coinSound] = useState(new Audio("/coin.mp3"));
    const [doneSound] = useState(new Audio("/done.mp3"));

    async function relogin() {
        try {
            const res = await axios.get("/api/login", {
                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            });
            setUser(res.data);
        } catch (error) {
            console.log(error)
            alert("Samtingwung");
        }
    }

    useEffect(() => {
        if (!isOpen) {
            relogin();
            captiveCheck();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!socketRef.current) {
        socketRef.current = new WebSocket(`ws://${window.location.hostname}/api/coin`);

        socketRef.current.onopen = () => console.log("Connected to WebSocket");
        socketRef.current.onmessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            if(data.from == "server") {
                if(data.value == "inuse") {
                    toast({
                        title: "Wait for a moment",
                        description: "Someone is using the coinslot"
                    })
                }
            }

            if (data.from == "coinslot") {
                if (data.for == user?.mac && data.value == "isOpen") {
                    setStarted(true);
                    startSound.play();
                }
                if (data.for == user?.mac && data.value == "isClose") {
                    setStarted(false);
                    doneSound.play();
                    setOpen(false);
                }
            }

            if(data.from == "totalcoin") {
                if (data.for == user?.mac) {
                    setCoin(+data.value)
                    coinSound.play();
                    setWaitingForCoin(false);
                }
            }

            if(data.from == "notify" && data.for == user?.mac) {
                setWaitingForCoin(true);
            }

            if(data.from == "timer" && data.for == user?.mac) {
                setTimeleft(+data.timeleft)
            }


            console.log(data);
        }

        socketRef.current.onclose = () => {
            console.log("WebSocket closed");
        }
        socketRef.current.onerror = (error) => console.error("WebSocket error:", error);
        }

        return () => {
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, []);

    function send(t: string) {
        if(t == "stop" && started){
            socketRef.current?.send(JSON.stringify({"from": "user", "value": "stop"}));
            setOpen(false);
            return;
        }
        socketRef.current?.send(JSON.stringify({"from": "user", "value": "start"}));
    }

    return<div className="flex flex-col">
        <Progress value={timeleft} />
        <div className="grid place-items-center pt-8 pb-16">
            <h1 className="text-[6rem] font-bold">{coin}</h1>
        </div>
        <Button disabled={waitingForCoin} className="py-6" onClick={() => send(started ? "stop":"start")}>{waitingForCoin ? "Identifying Coin..." : started ? "Done":"Start"}</Button>
    </div>
}

export default InsertCoin;
