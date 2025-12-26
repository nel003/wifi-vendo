import { adminStore } from "@/store/user";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUser } from "@/types/types";

// Create a dedicated axios instance for admin api calls
export const adminApi = axios.create({
    headers: {
        "Content-Type": "application/json",
    }
});

export function useAdminAuth() {
    const { adminUser, setAdminUser } = adminStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set up interceptor to attach token
        const requestIntercept = adminApi.interceptors.request.use(
            (config) => {
                if (adminUser?.token) {
                    config.headers["Authorization"] = `Bearer ${adminUser.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Set up interceptor to handle 401s (token expiry)
        const responseIntercept = adminApi.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    try {
                        // Attempt to refresh
                        const res = await axios.post("/api/admin/refresh");
                        const newUnknownUser = res.data;
                        const newAdminUser = {
                            ...newUnknownUser,
                            // Ensure we keep the structure consistent, assuming refresh returns full user + new token
                        } as AdminUser;

                        setAdminUser(newAdminUser);

                        prevRequest.headers["Authorization"] = `Bearer ${newAdminUser.token}`;
                        return adminApi(prevRequest);
                    } catch (refreshError) {
                        // Refresh failed (e.g. refresh token expired), logout
                        setAdminUser(null as any);
                        router.push("/admin/login");
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            adminApi.interceptors.request.eject(requestIntercept);
            adminApi.interceptors.response.eject(responseIntercept);
        }
    }, [adminUser, setAdminUser, router]);

    const login = async (user: AdminUser) => {
        setAdminUser(user);
    };

    const logout = async () => {
        try {
            await axios.post("/api/admin/logout");
        } catch (e) {
            console.error("Logout failed", e);
        }
        setAdminUser(null as any);
        router.push("/admin/login");
    };

    const refreshSession = async (): Promise<boolean> => {
        try {
            const res = await axios.post("/api/admin/refresh");
            const newAdminUser = res.data as AdminUser;
            setAdminUser(newAdminUser);
            return true;
        } catch (e) {
            return false;
        }
    }

    return { adminApi, login, logout, refreshSession };
}
