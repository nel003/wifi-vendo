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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt, Trash2, ArrowUpRight } from "lucide-react";

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
                description: 'Failed to fetch transactions',
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
            toast({
                title: 'Success',
                description: 'Transaction history cleared',
            })
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to clear transactions',
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Transactions</h2>
                    <p className="text-slate-500">View and manage payment history.</p>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={transactions.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4" /> Clear History
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear All Transactions?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all transaction history data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={reset} className="bg-red-600 hover:bg-red-700">Delete All</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                                        No recent transactions.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions?.map((tran) => (
                                    <TableRow key={tran.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-mono text-xs text-slate-500">{tran.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 p-1.5 rounded-full">
                                                    <Receipt className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-slate-900">{tran.by || "Unknown Source"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-medium text-slate-900">
                                                {tran.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
                                            </span>
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

export default Transactions;