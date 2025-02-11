"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { ErrorResponse } from "@/types/types"
import { adminStore } from "@/store/user"
import { useRouter } from "next/navigation"

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { toast } = useToast();
    const setAdmin = adminStore(u => u.setAdminUser);
    const router = useRouter();

    async function login() {
        try {
            toast({
                title: "Please wait",
                description: "Loggin in.."
            })
            const res = await axios.post("/api/admin/login", {
                username,
                password
            });
            setAdmin(res.data);
            toast({
                title: "Okay",
                description: "Loggin success"
            })
            axios.defaults.headers.common["Authorization"] = "Bearer "+res.data.token;
            axios.defaults.headers.common["Cache-Control"] = "no-cache, no-store, must-revalidate";
            axios.defaults.headers.common["Pragma"] = "no-cache";
            axios.defaults.headers.common["Expires"] = "0";
            router.push("/admin");
        } catch (error: any) {
            console.log(error)
            const err = error as ErrorResponse;
            toast({
                title: "Error",
                description: err.response.data.msg
            })
        }
    }
    
    return <>
        <div className="grid place-items-center w-screen h-[100dvh]">
            <Card className="min-w-[280px] max-w-[420px] w-full">
                <CardHeader>
                    <div className="w-full flex justify-center">
                        <Avatar>
                            <AvatarImage src="/favicon.ico" />
                            <AvatarFallback>AR</AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle className="text-center">Ariel WiFi</CardTitle>
                    <CardDescription className="text-center">Login to proceed</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label>Username</Label>
                    <Input onChange={(e) => setUsername(e.target.value)} value={username} type="text" placeholder="E.g admin123"/>
                    <Label>Password</Label>
                    <Input onChange={(e) => setPassword(e.target.value)} value={password}  type="password" placeholder="E.g admin!@123"/>
                </CardContent>
                <CardFooter>
                    <Button disabled={!username || !password} onClick={login} className="w-full">Login</Button>
                </CardFooter>
            </Card>
        </div>
    </>
}