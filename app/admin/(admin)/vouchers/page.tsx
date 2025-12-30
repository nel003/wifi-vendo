"use client"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast";
import { Rate, Voucher } from "@/types/types";
import { Plus, Ticket, Trash2, Copy, Check, Timer, Coins } from "lucide-react";
import { useCallback, useEffect, useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAdminAuth } from "@/hooks/use-admin-auth";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function Page() {
    const [rates, setRates] = useState<Rate[] | []>([])
    const [vouchers, setVouchers] = useState<Voucher[] | []>([])
    const { toast } = useToast();
    const [rate, setRate] = useState("");
    const { adminApi } = useAdminAuth();

    const [modal, setModal] = useState(false);
    const [createdVoucher, setCreatedVoucher] = useState("");
    const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');

    const initRates = useCallback(async () => {
        try {
            const res = await adminApi.get('/api/admin/rates');
            setRates(res.data)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }, [setRates, toast, adminApi]);

    const initVouchers = useCallback(async () => {
        try {
            const res = await adminApi.get('/api/admin/vouchers');
            const newArr = res.data.map((v: Voucher) => ({ ...v, hidden: true }));
            setVouchers(newArr)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch vouchers',
            })
        }
    }, [setVouchers, toast, adminApi]);

    useEffect(() => {
        initRates();
        initVouchers();
    }, [initRates, initVouchers]);

    async function submit() {
        toast({
            title: 'Processing',
            description: 'Please wait while creating the voucher',
        })
        try {
            const res = await adminApi.post('/api/admin/vouchers', {
                rate
            });
            toast({
                title: 'Success',
                description: 'Voucher added successfully',
            })
            initVouchers();
            setCreatedVoucher(res.data.voucher);
            setModal(true);
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to create voucher',
            });
        }
    }


    async function del(id: string | number) {
        toast({
            title: 'Processing',
            description: 'Please wait while deleting the voucher',
        })
        try {
            await adminApi.delete(`/api/admin/vouchers?id=${id}`);
            toast({
                title: 'Success',
                description: 'Voucher deleted successfully',
            })
            initVouchers();
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to delete voucher',
            });
        }
    }

    const filteredVouchers = vouchers.filter(v => {
        if (filter === 'unused') return !v.used;
        if (filter === 'used') return v.used;
        return true;
    });

    const copyToClipboard = () => {
        navigator.clipboard.writeText(createdVoucher);
        toast({
            title: "Copied!",
            description: "Voucher code copied to clipboard.",
        });
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Vouchers</h2>
                    <p className="text-slate-500">Generate and manage access vouchers.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full md:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Create Voucher
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Voucher</DialogTitle>
                            <DialogDescription>
                                Select a rate plan to generate a new voucher code.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Rate Plan</Label>
                                <Select onValueChange={(value) => setRate(value)}>
                                    <SelectTrigger className="w-full col-span-3">
                                        <SelectValue placeholder="Select a rate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rates.map((rate) => (
                                            <SelectItem key={rate.id} value={rate.id.toString()}>{rate.name} - {rate.price}PHP</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={submit} disabled={rate == ""}>Generate</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col gap-4">
                {/* Tabs */}
                <div className="flex items-center space-x-1 border-b border-slate-200">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            filter === 'all'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        All Vouchers
                    </button>
                    <button
                        onClick={() => setFilter('unused')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            filter === 'unused'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        Unused
                    </button>
                    <button
                        onClick={() => setFilter('used')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            filter === 'used'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        Used
                    </button>
                </div>

                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="p-0 hidden">
                        <CardTitle></CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Voucher Code</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVouchers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            No vouchers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVouchers.map((vouch) => (
                                        <TableRow key={vouch.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-slate-500">{vouch.id}</TableCell>
                                            <TableCell>
                                                <div
                                                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                                                    onClick={() => setVouchers(vouchers.map(v => ({ ...v, hidden: v.id === vouch.id ? !v.hidden : v.hidden })))}
                                                >
                                                    <Ticket className="h-4 w-4 text-slate-400" />
                                                    <span className={cn("font-mono font-medium", vouch.hidden ? "text-slate-400" : "text-slate-900 tracking-wider")}>
                                                        {vouch.hidden ? "••••••••" : vouch.voucher}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-4 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <Coins className="h-3 w-3" /> {vouch.price.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="h-3 w-3" /> {vouch.time}m
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {vouch.used ? (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                        Used
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                        Unused
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Voucher?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this voucher? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => del(vouch.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modal} onOpenChange={(o) => setModal(o)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Voucher Created</DialogTitle>
                        <DialogDescription className="text-center">
                            Your new voucher is ready to use.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                        <div className="text-4xl font-mono font-bold tracking-widest text-blue-600 bg-blue-50 px-6 py-3 rounded-lg border border-blue-100 border-dashed">
                            {createdVoucher ? `${createdVoucher.slice(0, 3)} ${createdVoucher.slice(3, 6)}` : "..."}
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button type="button" variant="secondary" onClick={() => setModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}