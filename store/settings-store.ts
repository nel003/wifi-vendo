import { create } from 'zustand';
import axios from 'axios';

interface SettingsState {
    appName: string;
    version: string;
    hasCoinslot: boolean;
    coinslotTimeout: number;
    loading: boolean;
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    appName: "WiFi Vendo",
    version: "2.0",
    hasCoinslot: true,
    coinslotTimeout: 120,
    loading: true,
    fetchSettings: async () => {
        try {
            set({ loading: true });
            const res = await axios.get('/api/settings');
            const { app_name, app_version, has_coinslot, coinslot_timeout } = res.data;
            set({
                appName: app_name,
                version: app_version,
                hasCoinslot: has_coinslot,
                coinslotTimeout: coinslot_timeout,
                loading: false
            });
        } catch (error) {
            console.error("Failed to fetch settings", error);
            set({ loading: false });
        }
    }
}));
