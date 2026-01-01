"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { adminStore } from "@/store/user";
import { Loader2, Users, Lock, Settings } from "lucide-react"
import axios from "axios";

export default function SettingsPage() {
    const { adminApi } = useAdminAuth();
    const { toast } = useToast();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(false);
    const { adminUser, setAdminUser } = adminStore();

    // Password state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Profile state
    const [name, setName] = useState(adminStore.getState().adminUser?.name || "");
    const [username, setUsername] = useState(adminStore.getState().adminUser?.username || "");
    const [email, setEmail] = useState(adminStore.getState().adminUser?.email || "");

    // App Settings State
    const [appName, setAppName] = useState("");
    const [coinslotTimeout, setCoinslotTimeout] = useState("");
    const [hasCoinslot, setHasCoinslot] = useState(false);
    const [maxUpload, setMaxUpload] = useState("");
    const [maxDownload, setMaxDownload] = useState("");
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        if (adminUser) {
            setName(adminUser.name);
            setUsername(adminUser.username);
            setEmail(adminUser.email);
        }
    }, [adminUser]);

    useEffect(() => {
        // Fetch public settings to populate form
        axios.get("/api/settings", {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        }).then(res => {
            setAppName(res.data.app_name);
            setCoinslotTimeout(String(res.data.coinslot_timeout || "120"));
            setHasCoinslot(res.data.has_coinslot);
            setMaxUpload(String(res.data.max_upload || "1024"));
            setMaxDownload(String(res.data.max_download || "1024"));
            setSettingsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch settings", err);
            setSettingsLoading(false);
        });
    }, []);

    async function updateSettings(e: React.FormEvent) {
        e.preventDefault();
        setConfigLoading(true);
        try {
            await adminApi.post("/api/admin/settings/update", {
                app_name: appName,
                coinslot_timeout: Number(coinslotTimeout),
                has_coinslot: hasCoinslot,
                max_upload: Number(maxUpload),
                max_download: Number(maxDownload)
            });
            toast({
                title: "Success",
                description: "App configuration updated successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update settings",
                variant: "destructive"
            });
        } finally {
            setConfigLoading(false);
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const res = await adminApi.put("/api/admin/profile", {
                name,
                username,
                email
            });

            // Update local store with new user data and token
            setAdminUser(res.data);

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.msg || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setProfileLoading(false);
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        setPasswordLoading(true);
        try {
            await adminApi.post("/api/admin/change-password", {
                oldPassword,
                newPassword
            });

            toast({
                title: "Success",
                description: "Password updated successfully",
            });

            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.msg || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-6 w-full h-full">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Settings */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-slate-900">Profile Information</CardTitle>
                            <CardDescription>Update your account details.</CardDescription>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <form onSubmit={handleProfileUpdate}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={profileLoading} className="w-full sm:w-auto">
                                {profileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Password Settings */}
                <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-slate-900">Change Password</CardTitle>
                            <CardDescription>Update your administrator password.</CardDescription>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <Lock className="h-5 w-5 text-amber-600" />
                        </div>
                    </CardHeader>
                    <form onSubmit={handleChangePassword}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="old-password">Current Password</Label>
                                <Input
                                    id="old-password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={passwordLoading} className="w-full sm:w-auto">
                                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* App Configuration */}
            <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-slate-900">App Configuration</CardTitle>
                        <CardDescription>Manage global application settings.</CardDescription>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                        <Settings className="h-5 w-5 text-slate-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updateSettings} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="appName">App Name</Label>
                                <Input
                                    id="appName"
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                    placeholder="WiFi Vendo"
                                    disabled={settingsLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coinslotTimeout">Coinslot Timeout (seconds)</Label>
                                <Input
                                    id="coinslotTimeout"
                                    type="number"
                                    value={coinslotTimeout}
                                    onChange={(e) => setCoinslotTimeout(e.target.value)}
                                    placeholder="120"
                                    disabled={settingsLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxUpload">Max Upload Speed (Mbps)</Label>
                                <Input
                                    id="maxUpload"
                                    type="number"
                                    value={maxUpload}
                                    onChange={(e) => setMaxUpload(e.target.value)}
                                    placeholder="20"
                                    disabled={settingsLoading}
                                />
                                <p className="text-xs text-slate-500">Total Vendo Upload Capacity (Shared between all clients).</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxDownload">Max Download Speed (Mbps)</Label>
                                <Input
                                    id="maxDownload"
                                    type="number"
                                    value={maxDownload}
                                    onChange={(e) => setMaxDownload(e.target.value)}
                                    placeholder="20"
                                    disabled={settingsLoading}
                                />
                                <p className="text-xs text-slate-500">Total Vendo Download Capacity (Shared between all clients).</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Coin Slot</Label>
                                <div className="text-sm text-muted-foreground">
                                    Enable or disable physical coin slot functionality
                                </div>
                            </div>
                            <Switch
                                checked={hasCoinslot}
                                onCheckedChange={setHasCoinslot}
                                disabled={settingsLoading}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={configLoading || settingsLoading} className="w-full sm:w-auto">
                                {configLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Configuration & Reboot
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
