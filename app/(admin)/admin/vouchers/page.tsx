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
import axios from "axios";
import { Plus } from "lucide-react";
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
  
export default function Page() {
    const [rates, setRates] = useState<Rate[] | []>([])  
    const [vouchers, setVouchers] = useState<Voucher[] | []>([])  
    const { toast } = useToast();
    const [rate, setRate] = useState("");

    const [modal, setModal] = useState(false);  
    const [vocuher, setVoucher] = useState("");  

    const initRates = useCallback(async () => {
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

    const initVouchers = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/vouchers');
            setVouchers(res.data)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch vouchers',
            })
        }    
    }, [setVouchers, toast]);

    useEffect(() => {
        initRates();
        initVouchers();
    }, [initRates, initVouchers]);

    async function submit() {
        toast({
            title: 'Processing',
            description: 'Please wait while adding the rate',
        })
        try {
            const res = await axios.post('/api/admin/vouchers', {
                rate
            });
            toast({
                title: 'Success',
                description: 'Voucher added successfully',
            })
            initVouchers();
            setVoucher(res.data.voucher);
            setModal(true);
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to create voucher',
            });
        }
    }

    return(
        <>
            <div className="w-full">
                <div className="flex justify-between">
                    <h1 className="text-lg font-bold ml-[7px]">Voucher</h1>
                    <Dialog>
                        <DialogTrigger>
                            <Button variant="outline" className="ml-[7px]"><Plus/>Create Voucher</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Vouchers</DialogTitle>
                                <DialogDescription>
                                    Please check the details before submitting.
                                </DialogDescription>
                            </DialogHeader>
                            <div>
                                <div>
                                    <Label>Rate</Label>
                                    <Select onValueChange={(value) => setRate(value)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a rate" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rates.map((rate) => (
                                                <SelectItem key={rate.id} value={rate.id.toString()}>{rate.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button onClick={submit} disabled={rate == ""}>Submit</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Table className="w-full">
                    <TableCaption>A list of vouchers.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Voucher</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Used</TableHead>
                            <TableHead className=" w-[200px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vouchers.map((vouch) => (
                            <TableRow key={vouch.id}>
                                <TableCell>{vouch.id}</TableCell>
                                <TableCell>{vouch.voucher}</TableCell>
                                <TableCell>{vouch.time}</TableCell>
                                <TableCell className="text-right">{vouch.used}</TableCell>
                                <TableCell className="flex justify-end w-[200px] gap-3">
                                    <Button variant="ghost">Delete</Button>
                                    <Button>Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={modal} onOpenChange={(o) => setModal(o)}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle className="text-center">Voucher Created</DialogTitle>
                    <DialogDescription className="text-center">
                        Voucher has been created successfully. Here is the voucher code.
                    </DialogDescription>
                    <div className="py-12">
                        <h1 className="text-center w-full text-5xl">{vocuher.slice(0, 3)} - {vocuher.slice(3, 6)}</h1>
                    </div>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    )
}