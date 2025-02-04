"use client"
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/types/types";
import axios from "axios";
import { Cpu, DollarSign, HardDrive, MemoryStick, Tickets, TicketSlash, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";


export default function Page() {
    const {toast} = useToast();
    const [dashItem, setDashItem] = useState<Dashboard | null>(null);
    const init = useCallback(async () => {
        try {
            const res = await axios.get("api/admin/dashboard");
            setDashItem(res.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }, [setDashItem]);
    

    useEffect(() => {
        init();
    }, [init]);

    return(
        <>
            <h1 className="text-lg font-bold ml-[7px]"> Dashboard</h1>
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(320px,_1fr))] p-2 gap-4">
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Total Sales</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.sales}</h1>
                        <TrendingUp className="mt-2 text-green-400" size={40}/>
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Available Rates</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.rate_count}</h1>
                        <DollarSign className="mt-2 text-yellow-400" size={40}/>
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Voucher Count</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.voucher_count}</h1>
                        <Tickets className="mt-2 text-green-400" size={40}/>
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Used Vouchers</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.used_count}</h1>
                        <TicketSlash className="mt-2 text-yellow-400" size={40}/>
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Client Count</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.client_count}</h1>
                        <Users className="mt-2 text-blue-400" size={40}/>
                    </div>
                </div>
            </div>

            <h1 className="text-lg font-bold ml-[7px]">System Status</h1>
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(320px,_1fr))] p-2 gap-4">
                <div className={`rounded-md p-6 ${dashItem && dashItem?.cpuUsage > 0 ? 'bg-green-50':''} ${dashItem && dashItem?.cpuUsage > 45 ? 'bg-yellow-50':''} ${dashItem && dashItem?.cpuUsage > 75 ? 'bg-red-50':''}`}>
                    <span className="text-slate-600">CPU</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.cpuUsage}%</h1>
                        <Cpu className="mt-2 text-slate-300" size={40}/>
                    </div>
                </div>
                <div className={`rounded-md p-6 ${dashItem && dashItem?.ramUsage > 0 ? 'bg-green-50':''} ${dashItem && dashItem?.ramUsage > 45 ? 'bg-yellow-50':''} ${dashItem && dashItem?.ramUsage > 75 ? 'bg-red-50':''}`}>
                    <span className="text-slate-600">RAM</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.ramUsage}%</h1>
                        <MemoryStick className="mt-2 text-slate-300" size={40}/>
                    </div>
                </div>
                <div className={`rounded-md p-6 ${dashItem && dashItem?.storageUsage > 0 ? 'bg-green-50':''} ${dashItem && dashItem?.storageUsage > 45 ? 'bg-yellow-50':''} ${dashItem && dashItem?.storageUsage > 75 ? 'bg-red-50':''}`}>
                    <span className="text-slate-600">Storage</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.storageUsage}%</h1>
                        <HardDrive className="mt-2 text-slate-300" size={40}/>
                    </div>
                </div>
            </div>
        </>
    )
}