"use client"
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton"
import { userStore } from "@/store/user";
import { useSettingsStore } from "@/store/settings-store";

export default function Userlayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const setUser = userStore(store => store.setUser);
    const fetchSettings = useSettingsStore(store => store.fetchSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function req() {
            try {
                // Fetch settings in parallel
                fetchSettings();

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
    }, [setUser, fetchSettings]);

    return loading ? (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 pt-10 flex flex-col items-center border border-slate-100 relative overflow-hidden">
                {/* Top Accent Skeleton */}
                <Skeleton className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-32 rounded-b-full bg-slate-200" />

                {/* Status Badge Skeleton */}
                <Skeleton className="h-6 w-24 rounded-full mb-8" />

                {/* Hero Icon Skeleton */}
                <Skeleton className="h-24 w-24 rounded-full mb-6" />

                {/* Network Name Skeleton */}
                <div className="text-center mb-10 space-y-2 w-full flex flex-col items-center">
                    <Skeleton className="h-8 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/3 rounded" />
                </div>

                {/* Timer Display Skeleton */}
                <Skeleton className="w-full h-32 rounded-3xl mb-10" />

                {/* Action Buttons Skeleton */}
                <div className="flex items-center justify-between w-full px-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="h-14 w-14 rounded-2xl" />
                            <Skeleton className="h-3 w-10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ) : (
        <div>
            {children}
        </div>
    )
}
