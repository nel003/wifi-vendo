"use client"
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types/types";
import { useCallback, useEffect, useState } from "react";
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
import { useAdminAuth } from "@/hooks/use-admin-auth";

function Transactions() {
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[] | []>([])
    const { adminApi } = useAdminAuth();


    const init = useCallback(async () => {
        try {
            const res = await adminApi.get('/api/admin/transactions');
            setTransactions(res.data);
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }, [setTransactions, toast, adminApi]);

    useEffect(() => {
        init();
    }, [init]);

    async function reset() {
        try {
            await adminApi.delete('/api/admin/transactions');
            setTransactions([])
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to fetch rates',
            })
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-between">
                <h1 className="text-lg font-bold ml-[7px]">Transactions</h1>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline">Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={reset}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="w-full">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead>By</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions?.map((tran) => (
                            <TableRow key={tran.id}>
                                <TableCell>{tran.by}</TableCell>
                                <TableCell>{tran.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <span className="h-4"></span>
            </div>
        </div>
    )
}

export default Transactions;