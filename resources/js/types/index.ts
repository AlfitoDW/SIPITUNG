export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    tahun_anggaran: { id: number; tahun: number; label: string } | null;
    [key: string]: unknown;
};
