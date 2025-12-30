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
import { Rate } from "@/types/types";
import { Plus, Timer, Coins, Edit, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth";
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
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Page() {
    const [rates, setRates] = useState<Rate[] | []>([])
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [time, setTime] = useState("");
    const { adminApi } = useAdminAuth();

    const init = useCallback(async () => {
        try {
            const res = await adminApi.get('/api/admin/rates');
            setRates(res.data.sort((a: Rate, b: Rate) => a.price - b.price));
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }, [setRates, toast, adminApi]);

    useEffect(() => {
        init();
    }, [init]);

    async function submit() {
        toast({
            title: 'Processing',
            description: 'Please wait while adding the rate',
        })
        try {
            await adminApi.post('/api/admin/rates', {
                name,
                price,
                time
            });
            toast({
                title: 'Success',
                description: 'Rate added successfully',
            })
            setName("");
            setPrice("");
            setTime("");
            init();
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to add rate',
            });
        }
    }

    async function edit(id: string | number) {
        toast({
            title: 'Processing',
            description: 'Please wait while updating the rate',
        })
        try {
            await adminApi.put('/api/admin/rates', {
                id,
                name,
                price,
                time
            });
            toast({
                title: 'Success',
                description: 'Rate updated successfully',
            })
            init();
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to update rate',
            });
        }
    }

    async function del(id: string) {
        toast({
            title: 'Processing',
            description: 'Please wait while deleting the rate',
        })
        try {
            await adminApi.delete(`/api/admin/rates?id=${id}`);
            toast({
                title: 'Success',
                description: 'Rate deleted successfully',
            })
            init();
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to delete rate',
            });
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Rates</h2>
                    <p className="text-slate-500">Manage pricing and time allocations.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="w-full md:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> New Rate
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Rate</DialogTitle>
                            <DialogDescription>
                                Create a new pricing tier.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Name</Label>
                                <Input onChange={(e) => setName(e.target.value)} value={name} className="col-span-3" placeholder="e.g. 1 Hour Promo" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Price</Label>
                                <div className="relative col-span-3">
                                    <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                                    <Input onChange={(e) => setPrice(e.target.value)} value={price} type="number" className="pl-7" placeholder="10" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Time (min)</Label>
                                <Input onChange={(e) => setTime(e.target.value)} value={time} type="number" className="col-span-3" placeholder="60" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={submit} disabled={name == "" || time == "" || price == ""}>Create Rate</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-100 shadow-sm">
                <CardHeader className="p-0 hidden">
                    <CardTitle></CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Rate Name</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No rates configured.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rates.map((rate) => (
                                    <TableRow key={rate.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono text-xs text-slate-500">{rate.id}</TableCell>
                                        <TableCell>
                                            <span className="font-medium text-slate-900">{rate.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-slate-600">
                                                <Timer className="mr-2 h-4 w-4 text-slate-400" />
                                                {rate.time} mins
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                {rate.price.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            <Dialog onOpenChange={() => {
                                                setName(rate.name);
                                                setPrice(rate.price.toString());
                                                setTime(rate.time.toString());
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Rate</DialogTitle>
                                                        <DialogDescription>
                                                            Modify pricing details.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">Name</Label>
                                                            <Input onChange={(e) => setName(e.target.value)} value={name} className="col-span-3" />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">Price</Label>
                                                            <div className="relative col-span-3">
                                                                <span className="absolute left-3 top-2.5 text-slate-500">₱</span>
                                                                <Input onChange={(e) => setPrice(e.target.value)} value={price} type="number" className="pl-7" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">Time</Label>
                                                            <Input onChange={(e) => setTime(e.target.value)} value={time} type="number" className="col-span-3" />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button onClick={() => edit(rate.id)} disabled={name == "" || time == "" || price == ""}>Save Changes</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Rate?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove the <span className="font-semibold text-slate-900">{rate.name}</span> rate.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => del(rate.id.toString())} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
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
    )
}