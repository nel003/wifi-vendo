"use client"
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/types/types";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Cpu, DollarSign, HardDrive, MemoryStick, Tickets, TicketSlash, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
                description: 'Failed to fetch dashboard data',
            })
        }
    }, [setDashItem, adminApi, toast]);

    useEffect(() => {
        init();
        const interval = setInterval(() => {
            init();
        }, 2000);
        return () => clearInterval(interval);
    }, [init]);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h2>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-1">
                {/* Total Earnings */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Earnings</CardTitle>
                        <div className="bg-emerald-100 p-1.5 rounded-md">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 mb-2">₱{dashItem?.sales || "0.00"}</div>
                        <div className="flex justify-start gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1">Voucher: <span className="text-slate-700">{dashItem?.v_earnings || 0}</span></span>
                            <span className="flex items-center gap-1">Coins: <span className="text-slate-700">{dashItem?.c_earnings || 0}</span></span>
                        </div>
                    </CardContent>
                </Card>

                {/* Available Rates */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Available Rates</CardTitle>
                        <div className="bg-amber-100 p-1.5 rounded-md">
                            <DollarSign className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{dashItem?.rate_count || 0}</div>
                    </CardContent>
                </Card>

                {/* Voucher Count */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Voucher Count</CardTitle>
                        <div className="bg-emerald-100 p-1.5 rounded-md">
                            <Tickets className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{dashItem?.voucher_count || 0}</div>
                    </CardContent>
                </Card>

                {/* Used Vouchers */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Used Vouchers</CardTitle>
                        <div className="bg-orange-100 p-1.5 rounded-md">
                            <TicketSlash className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{dashItem?.used_count || 0}</div>
                    </CardContent>
                </Card>

                {/* Client Count - Moved to its own card or a 5th column if space, or we can squeeze it.
                    The design shows 5 cards in the top row. Tailwind grid-cols-4 might wrap.
                    Let's adjust to be adaptable or use 5 columns on large screens.
                */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Client Count</CardTitle>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{dashItem?.client_count || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* System Status */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">System Status</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* CPU Usage */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-slate-500">CPU Usage</CardTitle>
                                <div className="text-3xl font-bold text-slate-900">{dashItem?.cpuUsage || 0}<span className="text-lg text-slate-400 font-medium ml-1">%</span></div>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Cpu className="h-5 w-5 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Progress value={dashItem?.cpuUsage || 0} className="h-2 mb-2" indicatorColor={getIndicatorColor(dashItem?.cpuUsage || 0)} />
                            <p className="text-xs text-slate-400 font-medium">Running smoothly</p>
                        </CardContent>
                    </Card>

                    {/* RAM Usage */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-slate-500">RAM Usage</CardTitle>
                                <div className="text-3xl font-bold text-slate-900">{dashItem?.ramUsage || 0}<span className="text-lg text-slate-400 font-medium ml-1">%</span></div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded-lg">
                                <MemoryStick className="h-5 w-5 text-purple-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Progress value={dashItem?.ramUsage || 0} className="h-2 mb-2" indicatorColor={getIndicatorColor(dashItem?.ramUsage || 0)} />
                            <p className="text-xs text-slate-400 font-medium">{dashItem?.ramText || "Loading..."}</p>
                        </CardContent>
                    </Card>

                    {/* Storage */}
                    <Card className="shadow-sm border-slate-100">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-medium text-slate-500">Storage</CardTitle>
                                <div className="text-3xl font-bold text-slate-900">{dashItem?.storageUsage || 0}<span className="text-lg text-slate-400 font-medium ml-1">%</span></div>
                            </div>
                            <div className="bg-pink-50 p-2 rounded-lg">
                                <HardDrive className="h-5 w-5 text-pink-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Progress value={dashItem?.storageUsage || 0} className="h-2 mb-2" indicatorColor={getIndicatorColor(dashItem?.storageUsage || 0)} />
                            <p className="text-xs text-slate-400 font-medium">{dashItem?.storageText || "Loading..."}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <footer className="mt-8 text-center text-xs text-slate-400 pb-4">
                &copy; 2024 Arns Wifi System. All rights reserved.
            </footer>
        </div>
    )
}

function getIndicatorColor(value: number) {
    if (value > 80) return "bg-rose-500";
    if (value > 50) return "bg-amber-500";
    return "bg-blue-500"; // Default nice blue for low usage
}