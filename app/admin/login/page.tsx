"use client"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { ErrorResponse } from "@/types/types"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useRouter } from "next/navigation"
import { Loader2, Lock, User, LogIn, Wifi } from "lucide-react"

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [appName, setAppName] = useState(process.env.NEXT_PUBLIC_APP_NAME || "WiFi Vendo");
    const { toast } = useToast();
    const { login: setAuthUser } = useAdminAuth();
    const router = useRouter();

    useEffect(() => {
        axios.get("/api/settings").then(res => {
            if (res.data.app_name) {
                setAppName(res.data.app_name);
            }
        }).catch(err => console.error(err));
    }, []);

    async function login(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("/api/admin/login", {
                username,
                password
            });

            // Login successful
            setAuthUser(res.data);

            toast({
                title: "Success",
                description: "Welcome back!",
            })

            router.push("/admin");
        } catch (error: any) {
            console.log(error)
            const err = error as ErrorResponse;
            toast({
                title: "Login Failed",
                description: err.response?.data?.msg || "Invalid credentials",
                variant: "destructive"
            })
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-sm shadow-lg border-slate-100">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Wifi className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        {appName}
                    </CardTitle>
                    <CardDescription>
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>
                <form onSubmit={login}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="username"
                                    className="pl-9"
                                    placeholder="Enter your username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    className="pl-9"
                                    placeholder="Enter your password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading || !username || !password}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
