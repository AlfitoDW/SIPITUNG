export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type FlashMessages = {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    tahun_anggaran: { id: number; tahun: number; label: string } | null;
    tahun_anggaran_list: { id: number; tahun: number; label: string }[];
    flash: FlashMessages;
    [key: string]: unknown;
};
