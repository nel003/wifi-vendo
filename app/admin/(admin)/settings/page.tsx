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
import { Loader2 } from "lucide-react"
import axios from "axios";

export default function SettingsPage() {
    const { adminApi } = useAdminAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
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
    const [appVersion, setAppVersion] = useState("");
    const [hasCoinslot, setHasCoinslot] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        // Fetch public settings to populate form
        axios.get("/api/settings").then(res => {
            setAppName(res.data.app_name);
            setAppVersion(res.data.app_version);
            setHasCoinslot(res.data.has_coinslot);
            setSettingsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch settings", err);
            setSettingsLoading(false);
        });
    }, []);

    async function updateSettings(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.post("/api/admin/settings/update", {
                app_name: appName,
                app_version: appVersion,
                has_coinslot: hasCoinslot
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
            setLoading(false);
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
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
            setLoading(false);
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

        setLoading(true);
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
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                        Update your account details.
                    </CardDescription>
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
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Password Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your administrator password here.
                    </CardDescription>
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
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            {/* App Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>App Configuration</CardTitle>
                    <CardDescription>Manage global application settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={updateSettings} className="space-y-4">
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
                            <Label htmlFor="appVersion">Version</Label>
                            <Input
                                id="appVersion"
                                value={appVersion}
                                onChange={(e) => setAppVersion(e.target.value)}
                                placeholder="2.0"
                                disabled={settingsLoading}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Coin Slot</Label>
                                <div className="text-sm text-muted-foreground">
                                    Enable or disable coin slot functionality
                                </div>
                            </div>
                            <Switch
                                checked={hasCoinslot}
                                onCheckedChange={setHasCoinslot}
                                disabled={settingsLoading}
                            />
                        </div>
                        <Button type="submit" disabled={loading || settingsLoading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
