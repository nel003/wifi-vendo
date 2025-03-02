"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton"
import { userStore } from "@/store/user";

export default function Userlayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    const setUser = userStore(store => store.setUser);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function req() {
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
            setLoading(false);
        }

        req();
    }, [setUser]);

    return loading ? (
        <div className="grid place-items-center h-screen w-screen">
            <div className="flex flex-col items-center">
                <Skeleton className="w-[3rem] h-[3rem] rounded-full" />
                <Skeleton className="w-[3rem] h-[1.5rem] rounded-sm my-2" />
                <Skeleton className="w-[10rem] h-[1px] rounded-sm my-2" />
                <Skeleton className="w-[6rem] h-[1.2rem] rounded-sm my-2" />
                <div className="flex gap-2">
                    <Skeleton className="w-[7rem] h-[3rem] rounded-sm" />
                    <Skeleton className="w-2 h-2 rounded-full my-auto" />
                    <Skeleton className="w-[7rem] h-[3rem] rounded-sm" />
                </div>
                <Skeleton className="w-[7rem] h-[2.5rem] rounded-sm mt-3"/>
            </div>
        </div>
    ) : (
        <div>
            {children}
        </div>
    )
}
