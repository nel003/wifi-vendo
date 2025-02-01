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
import { Clients, Rate } from "@/types/types";
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

export default function Page() {
    const [clients, setClients] = useState<Clients[] | []>([])
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [time, setTime] = useState(""); 

    const init = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/clients');
            setClients(res.data)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch clients',
            })
        }    
    }, [setClients, toast]);

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
                    <TableCaption>A list of cliens.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>MAC</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead className="text-right">Expires</TableHead>
                            <TableHead className=" w-[200px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell>{client.id}</TableCell>                         
                                <TableCell>{client.mac}</TableCell>
                                <TableCell>{client.device}</TableCell>                         
                                <TableCell className="text-right">{new Date(client.expire_on).toLocaleString()}</TableCell>
                                <TableCell className="flex justify-end w-[200px] gap-3">
                                    <Button variant="ghost">Delete</Button>
                                    <Button>Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    )
}