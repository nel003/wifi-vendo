import { create } from 'zustand';
import axios from 'axios';

interface SettingsState {
    appName: string;
    version: string;
    hasCoinslot: boolean;
    coinslotTimeout: number;
    maxUpload: number;
    maxDownload: number;
    loading: boolean;
    fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    appName: "OpenFi",
    version: "2.0",
    hasCoinslot: true,
    coinslotTimeout: 120,
    maxUpload: 20,
    maxDownload: 20,
    loading: true,
    fetchSettings: async () => {
        try {
            set({ loading: true });
            const res = await axios.get('/api/settings');
            const { app_name, app_version, has_coinslot, coinslot_timeout, max_upload, max_download } = res.data;
            set({
                appName: app_name,
                version: app_version,
                hasCoinslot: has_coinslot,
                coinslotTimeout: coinslot_timeout,
                maxUpload: max_upload,
                maxDownload: max_download,
                loading: false
            });
        } catch (error) {
            console.error("Failed to fetch settings", error);
            set({ loading: false });
        }
    }
}));
