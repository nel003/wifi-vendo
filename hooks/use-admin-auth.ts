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
        // Init: Check if we have refresh token in LS but no user in store
        const storedRefresh = localStorage.getItem("refreshToken");
        if (storedRefresh && !adminUser) {
            refreshSession();
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Interceptor to attach Access Token
        const requestIntercept = adminApi.interceptors.request.use(
            (config) => {
                if (adminUser?.token) {
                    config.headers["Authorization"] = `Bearer ${adminUser.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Interceptor to handle 401 and Refresh
        const responseIntercept = adminApi.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    try {
                        const success = await refreshSession();
                        if (success && adminStore.getState().adminUser?.token) {
                            prevRequest.headers["Authorization"] = `Bearer ${adminStore.getState().adminUser?.token}`;
                            return adminApi(prevRequest);
                        }
                    } catch (refreshError) {
                        // fall through to logout
                    }
                    // Refresh failed
                    logout();
                    return Promise.reject(error);
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
        if (user.refreshToken) {
            localStorage.setItem("refreshToken", user.refreshToken);
        }
        setAdminUser(user);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        try {
            await axios.post("/api/admin/logout", { refreshToken }); // Send token to revoke
        } catch (e) {
            console.error("Logout failed", e);
        }
        localStorage.removeItem("refreshToken");
        setAdminUser(null as any);
        router.push("/admin/login");
    };

    const refreshSession = async (): Promise<boolean> => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) throw new Error("No refresh token");

            const res = await axios.post("/api/admin/refresh", { refreshToken });
            const newAdminUser = res.data as AdminUser;

            // Keep the refresh token if not returned (it usually isn't rotated on every access token refresh unless strict)
            // But if it is returned, update it.
            if (newAdminUser.refreshToken) {
                localStorage.setItem("refreshToken", newAdminUser.refreshToken);
            } else {
                newAdminUser.refreshToken = refreshToken;
            }

            setAdminUser(newAdminUser);
            return true;
        } catch (e) {
            return false;
        }
    }

    return { adminApi, login, logout, refreshSession, loading };
}
