export interface UnitKerja {
    id: number;
    nama: string;
    kode: string;
    status: 'active' | 'inactive';
}

export interface KategoriKegiatan {
    id: number;
    nama: string;
    deskripsi: string;
    status: 'active' | 'inactive';
}

export interface JenisAnggaran {
    id: number;
    nama: string;
    kode: string;
    sumberDana: string;
    status: 'active' | 'inactive';
}

export interface TimKerja {
    id: number;
    nama: string;
    kode: string;
}

export interface ManagementAccount {
    id: number;
    nama_lengkap: string;
    nip: string | null;
    username: string;
    email: string;
    role: 'super_admin' | 'pimpinan' | 'bendahara' | 'ketua_tim_kerja';
    pimpinan_type: 'kabag_umum' | 'ppk' | null;
    tim_kerja_id: number | null;
    is_active: boolean;
}


export interface TahunAnggaran {
    id: number;
    tahun: number;
    label: string;
    is_active: boolean;
    is_default: boolean;
}

export interface TemplateDokumen {
    id: number;
    nama: string;
    fileName: string;
    fileType: string;
    status: 'active' | 'inactive';
}
