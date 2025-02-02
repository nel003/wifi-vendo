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
import axios, { AxiosError } from "axios";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
  import { addDays, format } from "date-fns"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export default function Page() {
    const [clients, setClients] = useState<Clients[] | []>([])
    const { toast } = useToast();
    const [label, setLabel] = useState("");
    const [date, setDate] = useState<Date>();
    
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

    async function edit(id: string | number, mac: string) {
        toast({
            title: 'Processing',
            description: 'Please wait while updating the cllient',
        })
        try {
            await axios.put('/api/admin/clients', {
                id,
                label,
                mac,
                expiry: date
            });
            toast({
                title: 'Success',
                description: 'Client updated successfully',
            })
            init();
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to update client',
            });
        }
    }
    
    return(
        <>
            <div className="w-full">
                <div className="flex justify-between">
                    <h1 className="text-lg font-bold ml-[7px]">Clients</h1>
                </div>
                <Table className="w-full">
                    <TableCaption>A list of cliens.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>MAC</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Label</TableHead>
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
                                <TableCell>{client.label}</TableCell>                         
                                <TableCell className="text-right">{new Date(client.expire_on).toLocaleString()}</TableCell>
                                <TableCell className="flex justify-end w-[200px] gap-3">
                                    <Dialog onOpenChange={() => setLabel(client.label || "")}>
                                        <DialogTrigger asChild>
                                            <Button>Edit</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                            <DialogTitle>Edit client</DialogTitle>
                                            <DialogDescription>
                                                Make changes to your client here. Click save when you're done.
                                            </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">
                                                Label
                                                </Label>
                                                <Input
                                                onChange={(e) => setLabel(e.target.value)}
                                                value={label}
                                                className="col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="username" className="text-right">
                                                Set expiry
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[280px] justify-start text-left font-normal",
                                                            !date && "text-muted-foreground"
                                                        )}
                                                        >
                                                        <CalendarIcon />
                                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
                                                        <Select
                                                        onValueChange={(value) =>
                                                            setDate(addDays(new Date(), parseInt(value)))
                                                        }
                                                        >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem value="1">1 Day</SelectItem>
                                                            <SelectItem value="3">3 Days</SelectItem>
                                                            <SelectItem value="7">7 Days</SelectItem>
                                                        </SelectContent>
                                                        </Select>
                                                        <div className="rounded-md border">
                                                        <Calendar mode="single" selected={date} onSelect={setDate} />
                                                        </div>
                                                    </PopoverContent>
                                                    </Popover>
                                            </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button onClick={() => edit(client.id, client.mac)} type="submit">Save changes</Button>
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