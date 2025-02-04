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
  
export default function Page() {
    const [rates, setRates] = useState<Rate[] | []>([])
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [time, setTime] = useState(""); 

    const init = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/rates');
            setRates(res.data.sort((a: Rate, b: Rate) => a.price - b.price));
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }    
    }, [setRates, toast]);

    useEffect(() => {
        init();
    }, [init]);

    async function submit() {
        toast({
            title: 'Processing',
            description: 'Please wait while adding the rate',
        })
        try {
            await axios.post('/api/admin/rates', {
                name,
                price,
                time
            });
            toast({
                title: 'Success',
                description: 'Rate added successfully',
            })
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
            await axios.put('/api/admin/rates', {
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
            await axios.delete(`/api/admin/rates?id=${id}`);
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

    return(
        <>
            <div className="w-full">
                <div className="flex justify-between">
                    <h1 className="text-lg font-bold ml-[7px]">Rates</h1>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="ml-[7px]"><Plus/> New Rate</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Rate</DialogTitle>
                                <DialogDescription>
                                    Please check the details before submitting.
                                </DialogDescription>
                            </DialogHeader>
                            <div>
                                <div>
                                    <Label>Name</Label>
                                    <Input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="E.g 2 Hours" />
                                </div>
                                <div>
                                    <Label>Price</Label>
                                    <Input onChange={(e) => setPrice(e.target.value)} value={price} type="number" placeholder="E.g 10" />
                                </div>
                                <div>
                                    <Label>Time</Label>
                                    <Input onChange={(e) => setTime(e.target.value)} value={time} type="number" placeholder="In minutes. e.g 30" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button onClick={submit} disabled={name == "" || time == "" || price == ""}>Submit</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Table className="w-full">
                    <TableCaption>A list of rates.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rates.map((rate) => (
                            <TableRow key={rate.id}>
                                <TableCell>{rate.id}</TableCell>
                                <TableCell className="whitespace-nowrap">{rate.name}</TableCell>
                                <TableCell className="whitespace-nowrap">{rate.time}</TableCell>
                                <TableCell className="text-right">{rate.price}</TableCell>
                                <TableCell className="flex justify-end gap-3">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost">Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the rate.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction  onClick={() => del(rate.id.toString())}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                        </AlertDialog>
                                    <Dialog onOpenChange={() => {
                                        setName(rate.name);
                                        setPrice(rate.price.toString());
                                        setTime(rate.time.toString());
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button>Edit</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Modify Rate</DialogTitle>
                                                <DialogDescription>
                                                    Please check the details before submitting.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div>
                                                <div>
                                                    <Label>Name</Label>
                                                    <Input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="E.g 2 Hours" />
                                                </div>
                                                <div>
                                                    <Label>Price</Label>
                                                    <Input onChange={(e) => setPrice(e.target.value)} value={price} type="number" placeholder="E.g 10" />
                                                </div>
                                                <div>
                                                    <Label>Time</Label>
                                                    <Input onChange={(e) => setTime(e.target.value)} value={time} type="number" placeholder="In minutes. e.g 30" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button onClick={() => edit(rate.id)} disabled={name == "" || time == "" || price == ""}>Submit</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>   
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}