"use client"
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/types/types";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Cpu, DollarSign, HardDrive, MemoryStick, Tickets, TicketSlash, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export default function Page() {
    const { toast } = useToast();
    const [dashItem, setDashItem] = useState<Dashboard | null>(null);
    const { adminApi } = useAdminAuth();

    const init = useCallback(async () => {
        try {
            const res = await adminApi.get("api/admin/dashboard");
            setDashItem(res.data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }, [setDashItem, adminApi]);


    useEffect(() => {
        init();
    }, [init]);

    return (
        <>
            <h1 className="text-lg font-bold ml-[7px]"> Dashboard</h1>
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(320px,_1fr))] p-2 gap-4">
                <div className="border rounded-md p-6 relative">
                    <span className="text-slate-600">Total Earnings</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">₱{dashItem?.sales?.toLocaleString()}</h1>
                        <TrendingUp className="mt-2 text-green-400" size={40} />
                    </div>
                    <div className="absolute bottom-[1.1rem] flex gap-2">
                        <div className="text-xs text-gray-400">
                            Voucher: <span className="text-gray-600">₱{dashItem?.v_earnings?.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            Coins: <span className="text-gray-600">₱{dashItem?.c_earnings?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                {/* ... other cards (kept brief for this edit, assume user wants to keep them) ... */}
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Available Rates</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.rate_count}</h1>
                        <DollarSign className="mt-2 text-yellow-400" size={40} />
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Voucher Count</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.voucher_count}</h1>
                        <Tickets className="mt-2 text-green-400" size={40} />
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Used Vouchers</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.used_count}</h1>
                        <TicketSlash className="mt-2 text-yellow-400" size={40} />
                    </div>
                </div>
                <div className="border rounded-md p-6">
                    <span className="text-slate-600">Client Count</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2">{dashItem?.client_count}</h1>
                        <Users className="mt-2 text-blue-400" size={40} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2">
                <div className="border rounded-md p-6">
                    <h2 className="text-lg font-bold mb-4">Sales Analytics (Last 7 Days)</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashItem?.chart_data || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(str) => new Date(str).toLocaleDateString()}
                                    formatter={(value: number) => [`₱${value}`, 'Sales']}
                                />
                                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="border rounded-md p-6">
                    <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
                    <div className="overflow-auto max-h-[300px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-2">Time</th>
                                    <th className="px-4 py-2">Device</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashItem?.recent_transactions?.map((tx: any) => (
                                    <tr key={tx.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-4 py-2">{new Date(tx.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{tx.by}</td>
                                        <td className="px-4 py-2 text-right font-bold text-green-600">₱{tx.amount}</td>
                                    </tr>
                                ))}
                                {!dashItem?.recent_transactions?.length && (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No recent transactions</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <h1 className="text-lg font-bold ml-[7px]">System Status</h1>
            <div className="grid grid-cols-[repeat(auto-fit,_minmax(320px,_1fr))] p-2 gap-4">
                {/* ... keep system status cards ... */}
                <div className={`rounded-md p-6 ${dashItem && dashItem?.cpuUsage > 0 ? 'bg-green-50' : ''} ${dashItem && dashItem?.cpuUsage > 45 ? 'bg-yellow-50' : ''} ${dashItem && dashItem?.cpuUsage > 75 ? 'bg-red-50' : ''}`}>
                    <span className="text-slate-600">CPU</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.cpuUsage}%</h1>
                        <Cpu className="mt-2 text-slate-300" size={40} />
                    </div>
                </div>
                <div className={`rounded-md p-6 ${dashItem && dashItem?.ramUsage > 0 ? 'bg-green-50' : ''} ${dashItem && dashItem?.ramUsage > 45 ? 'bg-yellow-50' : ''} ${dashItem && dashItem?.ramUsage > 75 ? 'bg-red-50' : ''}`}>
                    <span className="text-slate-600">RAM</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.ramUsage}%</h1>
                        <MemoryStick className="mt-2 text-slate-300" size={40} />
                    </div>
                </div>
                <div className={`rounded-md p-6 ${dashItem && dashItem?.storageUsage > 0 ? 'bg-green-50' : ''} ${dashItem && dashItem?.storageUsage > 45 ? 'bg-yellow-50' : ''} ${dashItem && dashItem?.storageUsage > 75 ? 'bg-red-50' : ''}`}>
                    <span className="text-slate-600">Storage</span>
                    <div className="flex justify-between">
                        <h1 className="text-3xl font-bold pt-2 text-slate-700">{dashItem?.storageUsage}%</h1>
                        <HardDrive className="mt-2 text-slate-300" size={40} />
                    </div>
                </div>
            </div>
        </>
    )
}