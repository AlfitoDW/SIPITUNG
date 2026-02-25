export type UserRole = 'super_admin' | 'ketua_tim_kerja' | 'pimpinan' | 'bendahara';
export type PimpinanType = 'kabag_umum' | 'ppk';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    role: UserRole;
    pimpinan_type?: PimpinanType;
    tim_kerja_id?: number;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
