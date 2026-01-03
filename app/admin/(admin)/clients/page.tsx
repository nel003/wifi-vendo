"use client"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast";
import { Clients } from "@/types/types";
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
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { CalendarIcon, Search, Smartphone, Edit2, Wifi, WifiOff } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export default function Page() {
    const [clients, setClients] = useState<Clients[] | []>([])
    const { toast } = useToast();
    const [label, setLabel] = useState("");
    const [date, setDate] = useState<Date>();
    const [filter, setFilter] = useState("");
    const { adminApi } = useAdminAuth();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offline'>('all');

    const init = useCallback(async () => {
        try {
            const res = await adminApi.get('/api/admin/clients?filter=' + filter, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            setClients(res.data)
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch clients',
            })
        }
    }, [setClients, toast, filter, adminApi]);

    useEffect(() => {
        init();
    }, [init]);

    async function edit(id: string | number, mac: string) {
        toast({
            title: 'Processing',
            description: 'Please wait while updating the client',
        })
        try {
            await adminApi.put('/api/admin/clients', {
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

    const filteredClients = clients.filter(client => {
        if (statusFilter === 'active') return client.active;
        if (statusFilter === 'offline') return !client.active;
        return true;
    });

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h2>
                    <p className="text-slate-500">Manage connected devices and vouchers.</p>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute top-2.5 left-2.5 text-slate-400 h-4 w-4" />
                    <Input
                        onChange={(e) => setFilter(e.target.value)}
                        value={filter}
                        placeholder="Search clients..."
                        className="pl-9 w-full md:w-[300px]"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Custom Tabs */}
                <div className="flex items-center space-x-1 border-b border-slate-200">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            statusFilter === 'all'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        All Clients
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            statusFilter === 'active'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setStatusFilter('offline')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium transition-colors border-b-2 hover:text-blue-600",
                            statusFilter === 'offline'
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300"
                        )}
                    >
                        Offline
                    </button>
                </div>

                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="p-0 hidden">
                        <CardTitle></CardTitle>
                        <CardDescription></CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead>Client Identity</TableHead>
                                    <TableHead className="hidden md:table-cell">Device Info</TableHead>
                                    <TableHead className="hidden md:table-cell">Expiry</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No clients found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((client) => (
                                        <TableRow key={client.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                {client.active ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                                                        <Wifi className="mr-1 h-3 w-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                                        <WifiOff className="mr-1 h-3 w-3" />
                                                        Offline
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{client.label || "No Label"}</span>
                                                    <span className="text-xs text-slate-500 font-mono">{client.mac}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex items-center text-slate-600">
                                                    <Smartphone className="mr-2 h-4 w-4 text-slate-400" />
                                                    {client.device}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-slate-600">
                                                {client.expire_on ? format(new Date(client.expire_on), "MMM d, yyyy h:mm a") : "N/A"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog onOpenChange={() => setLabel(client.label || "")}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Edit</span>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Client</DialogTitle>
                                                            <DialogDescription>
                                                                Update client label and expiration settings.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="grid gap-4 py-4">
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label htmlFor="name" className="text-right">
                                                                    Label
                                                                </Label>
                                                                <Input
                                                                    id="name"
                                                                    onChange={(e) => setLabel(e.target.value)}
                                                                    value={label}
                                                                    className="col-span-3"
                                                                    placeholder="e.g. John's Phone"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-4 items-center gap-4">
                                                                <Label className="text-right">
                                                                    Set Expiry
                                                                </Label>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant={"outline"}
                                                                            className={cn(
                                                                                "w-full justify-start text-left font-normal col-span-3",
                                                                                !date && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {date ? format(date, "PPP") : <span>Pick a new expiry date</span>}
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="flex min-w-full flex-col space-y-2 p-2" align="start">
                                                                        {/* <Select
                                                                            onValueChange={(value) =>
                                                                                setDate(addDays(new Date(), parseInt(value)))
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Quick Select" />
                                                                            </SelectTrigger>
                                                                            <SelectContent position="popper">
                                                                                <SelectItem value="1">1 Day</SelectItem>
                                                                                <SelectItem value="3">3 Days</SelectItem>
                                                                                <SelectItem value="7">7 Days</SelectItem>
                                                                                <SelectItem value="30">30 Days</SelectItem>
                                                                            </SelectContent>
                                                                        </Select> */}
                                                                        <div className="rounded-md border w-full">
                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={date}
                                                                                onSelect={setDate}
                                                                                className="rounded-md border shadow-sm w-full"
                                                                                captionLayout="dropdown"
                                                                            />
                                                                        </div>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button onClick={() => edit(client.id, client.mac)} type="submit">Save Changes</Button>
                                                            </DialogClose>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}