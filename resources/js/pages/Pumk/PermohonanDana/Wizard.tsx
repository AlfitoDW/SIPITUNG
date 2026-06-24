import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Upload, Trash2, AlertTriangle, Loader2, Lock, Eye, X, FileText, Plus, Pencil, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import DocPreviewModal from '@/components/DocPreviewModal';
import PegawaiCombobox from '@/components/PegawaiCombobox';
import type { PegawaiComboboxRefNama } from '@/components/PegawaiCombobox';
import { SkeletonPageHeader, SkeletonForm } from '@/components/skeletons';
import TambahPegawaiDialog from '@/components/TambahPegawaiDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import EditPegawaiDialog from './EditPegawaiDialog';

// ── Types ────────────────────────────────────────────────────────────────────

interface Pd {
    id: number; nomor_permohonan: string; judul_pekerjaan: string; keperluan: string;
    tanggal_mulai: string|null; tanggal_selesai: string|null; jam_pelaksanaan: string|null;
    tempat: string|null; tgl_pertanggungjawaban: string|null;
    kapokja_id: number|null; pic_keuangan_id: number|null;
    status: string; status_label: string; wizard_step: number;
    dja_program?: {nama:string}; dja_sasaran?: {nama:string}; dja_kro?: {kode:string;nama:string};
    dja_ro?: {nama:string}; dja_komponen?: {nama:string}; dja_kegiatan?: {kode:string;nama:string};
    kapokja?: {id:number;nama_lengkap:string}; pic_keuangan?: {id:number;nama_lengkap:string};
    no_sk?: string | null; tgl_sk?: string | null;
    no_st?: string | null; tgl_st?: string | null;
    dokumens: Dokumen[];
    lpj_file_path?: string | null; lpj_file_name?: string | null;
    lpj_uploaded_at?: string | null; lpj_uploaded_by_name?: string | null;
}
interface KapokjaItem {
    id: number;
    nama_lengkap: string;
    role: string;
    role_label: string;
    tim_kerja_kode: string | null;
    tim_kerja_nama: string | null;
}
interface PicItem     { id:number; nama_lengkap:string; }
interface Dokumen     { id:number; jenis_dokumen_id:number; nama_jenis:string; nama_file:string; path_file:string; }

type RefNama = PegawaiComboboxRefNama;

interface NominatifRow {
    item_id: number;
    ref_nama_id: number | string | null;
    nama: string;
    nip: string;
    nik: string;
    npwp: string;
    gol_ruang: string;
    nama_rekening: string;
    no_rekening: string;
    nama_bank: string;
    email: string;
    pph21_persen: string;
    jabatan: string;
    volume: string;
    satuan: string;
    harga_satuan: string;
    transport: string;
    uang_harian_vol: string;
    uang_harian_satuan: string;
    fullboard_vol: string;
    fullboard_satuan: string;
    fullday_vol: string;
    fullday_satuan: string;
    representasi: string;
    taksi_pp: string;
    tiket_pesawat: string;
    hotel: string;
}

interface RincianItem {
    id:number; kode_akun:string; nama_akun:string; nama_item:string;
    satuan:string; harga_satuan:number; harga_satuan_aktual:number;
    pagu_total:number; terpakai:number; sisa_anggaran:number;
    overbudget_amount?: number;
    status_anggaran?: 'overbudget' | 'habis' | 'tersedia' | 'belum_terpakai';
    volume_diminta:number; jumlah_permintaan:number;
    tipe_nominatif: 'honor' | 'perjadin' | 'non_nominatif';
    nominatif_count: number;
    nominatif: Array<{
        id: number;
        ref_nama_id: number | null;
        nama: string;
        nip: string | null; nik: string | null; npwp: string | null;
        gol_ruang: string | null; nama_rekening: string | null;
        no_rekening: string | null; nama_bank: string | null;
        email: string | null; pph21_persen: string;
        jabatan: string | null;
        volume: string; harga_satuan: string;
        transport: string; uang_harian_vol: string; uang_harian_satuan: string;
        fullboard_vol: string; fullboard_satuan: string;
        fullday_vol: string; fullday_satuan: string;
        representasi: string; taksi_pp: string; tiket_pesawat: string; hotel: string;
    }>;
}
interface Props {
    pd: Pd;
    kapokjaList: KapokjaItem[];
    picList: PicItem[];
    rincianBiaya: RincianItem[][];
    refNama: RefNama[];
    jenisDokumen: Record<string,string>;
}

const fmt = (n: number | string | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID').format(Number.isNaN(num) ? 0 : num);
};
const STEPS = ['Kegiatan','Waktu & PJ','Dokumen','Rincian Biaya'];

// ── Nominatif helpers ──────────────────────────────────────────────────────

function hitungPph21(status: string, gol: string | null, _npwp: string | null): number {
    if (status === 'Non-PNS' || status === 'P3K') return 2.5;
    if (!gol) return 0;
    const g = gol.toUpperCase();
    if (g.startsWith('IV')) return 15.0;
    if (g.startsWith('III')) return 5.0;
    return 0.0;
}

const JABATAN_OPTIONS_521213 = ['Honorarium Penanggungjawab', 'Honorarium Ketua', 'Honorarium Wakil Ketua', 'Honorarium Sekretariat', 'Honorarium Anggota'];
const JABATAN_OPTIONS_522151 = ['Honorarium Narasumber (Pejabat Eselon II)', 'Honorarium Narasumber (Pejabat Eselon III)', 'Honorarium Moderator', 'Honorarium Redaktur (Managing Editor)', 'Honorarium Penyunting/Editor', 'Honorarium Sekretariat', 'Honorarium Pembawa Acara'];

function getJabatanOptions(kodeAkun: string): string[] {
    if (kodeAkun === '521213') return JABATAN_OPTIONS_521213;
    if (kodeAkun === '522151') return JABATAN_OPTIONS_522151;
    return [];
}

function makeEmptyHonorRow(itemId: number, satuan: string, hargaDefault: number, kodeAkun: string, rowIndex: number = 0): NominatifRow {
    const jabatanOptions = getJabatanOptions(kodeAkun);
    let defaultJabatan = '';
    if (kodeAkun === '521213') {
        if (rowIndex === 0) defaultJabatan = jabatanOptions[1] ?? '';
        else if (rowIndex === 1) defaultJabatan = jabatanOptions[2] ?? '';
    } else if (kodeAkun === '522151') {
        defaultJabatan = jabatanOptions[0] ?? '';
    }
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: defaultJabatan, volume: '1', satuan: satuan, harga_satuan: String(hargaDefault),
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function makeEmptyPerjadinRow(itemId: number, satuan: string, hargaSatuan: number): NominatifRow {
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', satuan: satuan, harga_satuan: String(hargaSatuan),
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function rowFromExisting(nom: RincianItem['nominatif'][0], itemId: number): NominatifRow {
    const perjadinTotal =
        (parseFloat(String(nom.transport)) || 0) +
        ((parseFloat(String(nom.uang_harian_vol)) || 0) * (parseFloat(String(nom.uang_harian_satuan)) || 0)) +
        ((parseFloat(String(nom.fullboard_vol)) || 0) * (parseFloat(String(nom.fullboard_satuan)) || 0)) +
        ((parseFloat(String(nom.fullday_vol)) || 0) * (parseFloat(String(nom.fullday_satuan)) || 0)) +
        (parseFloat(String(nom.representasi)) || 0) +
        (parseFloat(String(nom.taksi_pp)) || 0) +
        (parseFloat(String(nom.tiket_pesawat)) || 0) +
        (parseFloat(String(nom.hotel)) || 0);
    const isGeneric = perjadinTotal === 0 && (parseFloat(String(nom.harga_satuan)) || 0) > 0;
    return {
        item_id: itemId, ref_nama_id: nom.ref_nama_id,
        nama: nom.nama, nip: nom.nip ?? '', nik: nom.nik ?? '',
        npwp: nom.npwp ?? '', gol_ruang: nom.gol_ruang ?? '',
        nama_rekening: nom.nama_rekening ?? '', no_rekening: nom.no_rekening ?? '',
        nama_bank: nom.nama_bank ?? '', email: nom.email ?? '',
        pph21_persen: nom.pph21_persen,
        jabatan: nom.jabatan ?? '',
        volume: isGeneric ? nom.volume : (perjadinTotal > 0 ? '1' : nom.volume),
        satuan: '',
        harga_satuan: isGeneric ? nom.harga_satuan : (perjadinTotal > 0 ? String(perjadinTotal) : nom.harga_satuan),
        transport: nom.transport, uang_harian_vol: nom.uang_harian_vol,
        uang_harian_satuan: nom.uang_harian_satuan,
        fullboard_vol: nom.fullboard_vol, fullboard_satuan: nom.fullboard_satuan,
        fullday_vol: nom.fullday_vol, fullday_satuan: nom.fullday_satuan,
        representasi: nom.representasi, taksi_pp: nom.taksi_pp,
        tiket_pesawat: nom.tiket_pesawat, hotel: nom.hotel,
    };
}

/** Normalize date string ke YYYY-MM-DD untuk <input type="date"> */
const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

/** Date input native dengan styling konsisten */
function DateInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
    return (
        <input
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className={cn(
                'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
        />
    );
}

// ── Step Indicator ───────────────────────────────────────────────────────────

function StepBar({ current, maxReached, onGoto }: {
    current: number;
    maxReached: number;
    onGoto: (step: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((label, i) => {
                const step     = i + 1;
                const done     = current > step;
                const active   = current === step;
                const canClick = step <= maxReached && step !== current;
                return (
                    <div key={step} className="flex items-center">
                        <button
                            type="button"
                            disabled={!canClick}
                            onClick={() => canClick && onGoto(step)}
                            className={cn(
                                'flex flex-col items-center gap-1 min-w-[72px] group',
                                canClick ? 'cursor-pointer' : 'cursor-default',
                            )}
                        >
                            <div className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                                done   && 'bg-emerald-500 border-emerald-500 text-white',
                                active && 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md',
                                !done && !active && 'bg-white border-gray-300 text-gray-400',
                                canClick && 'group-hover:scale-110 group-hover:shadow-md ring-2 ring-offset-1',
                                canClick && done && 'ring-emerald-300',
                                canClick && !done && 'ring-gray-200',
                            )}>
                                {done ? <CheckCircle2 className="w-5 h-5" /> : step}
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium text-center leading-tight transition-colors',
                                active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400',
                                canClick && 'underline underline-offset-2 decoration-dotted',
                            )}>{label}</span>
                        </button>
                        {i < STEPS.length - 1 && (
                            <div className={cn(
                                'h-0.5 w-12 mx-1 mb-4',
                                current > i + 1 ? 'bg-emerald-400' : 'bg-gray-200',
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Step 1: Review Kegiatan ──────────────────────────────────────────────────

function Step1({ pd, onNext }: { pd: Pd; onNext: () => void }) {
    const fields = [
        ['No. Permohonan', pd.nomor_permohonan],
        ['Program', pd.dja_program?.nama ?? '-'],
        ['Sasaran', pd.dja_sasaran?.nama ?? '-'],
        ['Klasifikasi Rincian Output [KRO]', pd.dja_kro ? `${pd.dja_kro.kode} — ${pd.dja_kro.nama}` : '-'],
        ['Rincian Output [RO]', pd.dja_ro?.nama ?? '-'],
        ['Komponen', pd.dja_komponen?.nama ?? '-'],
        ['Kegiatan', pd.dja_kegiatan ? `${pd.dja_kegiatan.kode} — ${pd.dja_kegiatan.nama}` : '-'],
        ['Judul Pekerjaan', pd.judul_pekerjaan ?? pd.keperluan],
    ];
    return (
        <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Informasi Kegiatan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                {fields.map(([label, val]) => (
                    <div key={label} className="grid grid-cols-5 gap-2 py-2 border-b border-gray-100 last:border-0">
                        <span className="col-span-2 text-sm text-gray-500 font-medium">{label}</span>
                        <span className="col-span-3 text-sm text-gray-800">{val}</span>
                    </div>
                ))}
                <div className="flex justify-end pt-4">
                    <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">Selanjutnya →</Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Step 2: Waktu & PJ ───────────────────────────────────────────────────────

function Step2({ pd, kapokjaList, picList, onPrev, onNext, readonly = false }: {
    pd: Pd; kapokjaList: KapokjaItem[]; picList: PicItem[];
    onPrev: () => void; onNext: () => void; readonly?: boolean;
}) {
    const [form, setFormRaw] = useState({
        tanggal_mulai:          toDateInput(pd.tanggal_mulai),
        tanggal_selesai:        toDateInput(pd.tanggal_selesai),
        jam_pelaksanaan:        pd.jam_pelaksanaan ?? '',
        kapokja_id:             pd.kapokja_id ? String(pd.kapokja_id) : '',
        tempat:                 pd.tempat ?? '',
        tgl_pertanggungjawaban: toDateInput(pd.tgl_pertanggungjawaban),
        pic_keuangan_id:        pd.pic_keuangan_id ? String(pd.pic_keuangan_id) : '',
    });
    const setForm = (field: string, value: string) => setFormRaw(prev => ({ ...prev, [field]: value }));
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        if (form.tanggal_mulai && form.tanggal_selesai && form.tanggal_selesai < form.tanggal_mulai) {
            setErrors({ tanggal_selesai: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.' });
            return;
        }
        setProcessing(true);
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step2`,
            form,
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onNext();
                },
                onError: (errs) => {
                    setProcessing(false);
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(errs)) {
                        flat[k] = String(v);
                    }
                    setErrors(flat);
                },
            },
        );
    };

    return (
        <form onSubmit={readonly ? (e) => e.preventDefault() : submit}>
            <Card>
                <CardHeader><CardTitle className="text-base font-semibold">Waktu dan Penanggung Jawab</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className={readonly ? 'pointer-events-none opacity-75 space-y-4' : 'space-y-4'}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm">Tanggal Pelaksanaan Awal <span className="text-red-500">*</span></Label>
                                <DateInput className="mt-1" value={form.tanggal_mulai} onChange={v => setForm('tanggal_mulai', v)} />
                                {errors.tanggal_mulai && <p className="text-xs text-red-500 mt-1">{errors.tanggal_mulai}</p>}
                            </div>
                            <div>
                                <Label className="text-sm">Tanggal Pelaksanaan Akhir <span className="text-red-500">*</span></Label>
                                <DateInput className="mt-1" value={form.tanggal_selesai} onChange={v => setForm('tanggal_selesai', v)} />
                                {errors.tanggal_selesai && <p className="text-xs text-red-500 mt-1">{errors.tanggal_selesai}</p>}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm">Waktu Pelaksanaan</Label>
                            <input type="time" className="mt-1 flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={form.jam_pelaksanaan}
                                onChange={e => setForm('jam_pelaksanaan', e.target.value)} />
                        </div>
                        <div>
                            <Label className="text-sm">Ketua Tim Kerja <span className="text-red-500">*</span></Label>
                            <Select value={form.kapokja_id} onValueChange={v => setForm('kapokja_id', v)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih Kapokja..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {kapokjaList.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            <div className="flex flex-col gap-0.5 py-0.5">
                                                <span className="font-medium">{u.nama_lengkap}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {u.role_label}
                                                    {u.tim_kerja_kode && (
                                                        <> · <span className="font-semibold text-foreground/70">[{u.tim_kerja_kode}]</span> {u.tim_kerja_nama}</>
                                                    )}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.kapokja_id && <p className="text-xs text-red-500 mt-1">{errors.kapokja_id}</p>}
                        </div>
                        <div>
                            <Label className="text-sm">Tempat Pelaksanaan</Label>
                            <Input className="mt-1" value={form.tempat}
                                onChange={e => setForm('tempat', e.target.value)}
                                placeholder="Alamat dan Kota Tempat Pelaksanaan (Sesuaikan)" />
                        </div>
                        <div>
                            <Label className="text-sm">Waktu Penyelesaian Pertanggungjawaban (sesuai RPD)</Label>
                            <DateInput className="mt-1 w-56" value={form.tgl_pertanggungjawaban} onChange={v => setForm('tgl_pertanggungjawaban', v)} />
                        </div>
                        <div>
                            <Label className="text-sm">PIC Keuangan <span className="text-red-500">*</span></Label>
                            <Select value={form.pic_keuangan_id} onValueChange={v => setForm('pic_keuangan_id', v)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih PIC Keuangan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {picList.map(u => (
                                        <SelectItem key={u.id} value={String(u.id)}>{u.nama_lengkap}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.pic_keuangan_id && <p className="text-xs text-red-500 mt-1">{errors.pic_keuangan_id}</p>}
                        </div>
                        {errors.general && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">{errors.general}</p>
                        )}
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" onClick={onPrev}>← Sebelumnya</Button>
                        {!readonly && (
                            <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Selanjutnya →
                            </Button>
                        )}
                        {readonly && (
                            <Button type="button" onClick={onNext} variant="outline">Selanjutnya →</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

// ── Step 3: Dokumen Pendukung ─────────────────────────────────────────────────

function Step3({ pd, jenisDokumen, onPrev, onNext, readonly = false }: { pd: Pd; jenisDokumen: Record<string,string>; onPrev: () => void; onNext: () => void; readonly?: boolean; }) {
    const [jenis, setJenis] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [previewDok, setPreviewDok] = useState<{ url: string; nama: string } | null>(null);

    const [noSk, setNoSk] = useState(pd.no_sk ?? '');
    const [tglSk, setTglSk] = useState(toDateInput(pd.tgl_sk));
    const [noSt, setNoSt] = useState(pd.no_st ?? '');
    const [tglSt, setTglSt] = useState(toDateInput(pd.tgl_st));

    const upload = () => {
        if (!jenis || !fileRef.current?.files?.[0]) return;
        if (jenis === '2' && (!noSk || !tglSk)) return;
        if (jenis === '3' && (!noSt || !tglSt)) return;

        const file = fileRef.current.files[0];
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 10 MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('jenis_dokumen_id', jenis);
        formData.append('file', fileRef.current.files[0]);
        if (jenis === '2') {
            formData.append('no_sk', noSk);
            formData.append('tgl_sk', tglSk);
        }
        if (jenis === '3') {
            formData.append('no_st', noSt);
            formData.append('tgl_st', tglSt);
        }
        router.post(
            `/pumk/permohonan-dana/${pd.id}/dokumen`,
            formData,
            {
                preserveState: true,
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setUploading(false);
                    setJenis('');
                    setNoSk('');
                    setTglSk('');
                    setNoSt('');
                    setTglSt('');
                    if (fileRef.current) fileRef.current.value = '';
                },
                onError: (errs: Record<string, string>) => {
                    setUploading(false);
                    toast.error(Object.values(errs)[0] ?? 'Gagal upload dokumen.');
                },
                onFinish: () => setUploading(false),
            },
        );
    };

    const hapus = (dokId: number) => {
        router.delete(
            `/pumk/permohonan-dana/${pd.id}/dokumen/${dokId}`,
            { preserveState: true, preserveScroll: true },
        );
    };

    const openPreview = (dok: Dokumen) => {
        const url = `/files/dokumen/${dok.id}`;
        setPreviewDok({ url, nama: dok.nama_file });
    };

    return (
        <>
            {previewDok && (
                <DocPreviewModal
                    url={previewDok.url}
                    nama={previewDok.nama}
                    onClose={() => setPreviewDok(null)}
                />
            )}
            <Card>
                <CardHeader><CardTitle className="text-base font-semibold">Dokumen Pendukung</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                    {!readonly && (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-sm">Pilih Jenis Dokumen</Label>
                                    <Select value={jenis} onValueChange={setJenis}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Pilih Jenis Dokumen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(jenisDokumen).map(([id, nama]) => (
                                                <SelectItem key={id} value={id}>{nama}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm">Pilih File</Label>
                                    <Input ref={fileRef} type="file" className="mt-1"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                                </div>
                            </div>

                            {jenis === '2' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-sm">Nomor Surat Keputusan <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={noSk}
                                            onChange={(e) => setNoSk(e.target.value)}
                                            placeholder="Contoh: 123/LL3/SK/2025"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Tanggal SK <span className="text-red-500">*</span></Label>
                                        <DateInput className="mt-1" value={tglSk} onChange={(v) => setTglSk(v)} />
                                    </div>
                                </div>
                            )}

                            {jenis === '3' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-sm">Nomor Surat Tugas <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={noSt}
                                            onChange={(e) => setNoSt(e.target.value)}
                                            placeholder="Contoh: 456/LL3/ST/2025"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Tanggal ST <span className="text-red-500">*</span></Label>
                                        <DateInput className="mt-1" value={tglSt} onChange={(v) => setTglSt(v)} />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={upload}
                                disabled={
                                    uploading ||
                                    !jenis ||
                                    !fileRef.current?.files?.[0] ||
                                    (jenis === '2' && (!noSk || !tglSk)) ||
                                    (jenis === '3' && (!noSt || !tglSt))
                                }
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Upload Dokumen
                            </Button>
                        </div>
                    )}

                    {pd.dokumens.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-gray-500 text-xs">
                                    <th className="text-left py-2 w-8">No</th>
                                    <th className="text-left py-2">Jenis Dokumen</th>
                                    <th className="text-left py-2">Nama File</th>
                                    <th className="text-center py-2 w-20">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pd.dokumens.map((dok, i) => (
                                    <tr key={dok.id} className="border-b last:border-0">
                                        <td className="py-2 text-gray-400">{i + 1}</td>
                                        <td className="py-2 font-medium">{dok.nama_jenis}</td>
                                        <td className="py-2 text-gray-600 truncate max-w-xs">{dok.nama_file}</td>
                                        <td className="py-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openPreview(dok)}
                                                    title="Lihat dokumen"
                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {!readonly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => hapus(dok.id)}
                                                        title="Hapus dokumen"
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-4">Belum ada dokumen diupload</p>
                    )}

                    <div className="flex justify-between pt-2">
                        <Button type="button" variant="outline" onClick={onPrev}>← Sebelumnya</Button>
                        <Button type="button" onClick={onNext} variant={readonly ? 'outline' : undefined} className={readonly ? '' : 'bg-blue-600 hover:bg-blue-700'}>Selanjutnya →</Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// ── Step 4: Rincian Biaya ─────────────────────────────────────────────────────

function Step4({ pd, rincianBiaya, refNama, onPrev, readonly = false, onOpenAddDialog, onOpenEditDialog }: {
    pd: Pd;
    rincianBiaya: RincianItem[][];
    refNama: RefNama[];
    onPrev: () => void;
    readonly?: boolean;
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
}) {
    const [volumes, setVolumes] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        rincianBiaya.flat().forEach(item => { init[item.id] = item.volume_diminta; });
        return init;
    });
    const [hargaSatuan, setHargaSatuan] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        rincianBiaya.flat().forEach(item => { init[item.id] = item.harga_satuan_aktual; });
        return init;
    });
    const [submitting, setSubmitting] = useState(false);

    const [expanded, setExpanded] = useState<Set<number>>(() => {
        const s = new Set<number>();
        rincianBiaya.flat().forEach(item => {
            if ((item.tipe_nominatif === 'honor' || item.tipe_nominatif === 'perjadin') && item.volume_diminta > 0) {
                s.add(item.id);
            }
        });
        return s;
    });

    const [nominatifRows, setNominatifRows] = useState<Record<number, NominatifRow[]>>(() => {
        const m: Record<number, NominatifRow[]> = {};
        rincianBiaya.flat().forEach(item => {
            if (item.nominatif.length > 0) {
                m[item.id] = item.nominatif.map(n => rowFromExisting(n, item.id));
            } else if (item.tipe_nominatif === 'honor' && item.volume_diminta > 0) {
                m[item.id] = [makeEmptyHonorRow(item.id, item.satuan, item.harga_satuan_aktual, item.kode_akun)];
            } else if (item.tipe_nominatif === 'perjadin' && item.volume_diminta > 0) {
                m[item.id] = [makeEmptyPerjadinRow(item.id, item.satuan, item.harga_satuan_aktual)];
            } else {
                m[item.id] = [];
            }
        });
        return m;
    });

    const toggleExpand = (itemId: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const setNomRow = (itemId: number, idx: number, field: keyof NominatifRow, val: string) => {
        setNominatifRows(prev => {
            const rows = [...(prev[itemId] ?? [])];
            if (!rows[idx]) return prev;
            rows[idx] = { ...rows[idx], [field]: val };
            return { ...prev, [itemId]: rows };
        });
    };

    const fillFromPegawai = (itemId: number, idx: number, nama: string, peg: RefNama | null) => {
        setNomRow(itemId, idx, 'nama', nama);
        setNomRow(itemId, idx, 'ref_nama_id', peg ? String(peg.id) : '');
        setNomRow(itemId, idx, 'nip', peg?.nip ?? '');
        setNomRow(itemId, idx, 'nik', peg?.nik ?? '');
        setNomRow(itemId, idx, 'npwp', peg?.npwp ?? '');
        setNomRow(itemId, idx, 'gol_ruang', peg?.gol_ruang ?? '');
        setNomRow(itemId, idx, 'nama_rekening', peg?.nama_rekening ?? '');
        setNomRow(itemId, idx, 'no_rekening', peg?.no_rekening ?? '');
        setNomRow(itemId, idx, 'nama_bank', peg?.nama_bank ?? '');
        setNomRow(itemId, idx, 'email', peg?.email ?? '');
        const pph = peg ? String(hitungPph21(peg.status_kepegawaian, peg.gol_ruang, peg.npwp)) : '0';
        setNomRow(itemId, idx, 'pph21_persen', pph);
    };

    const addRow = (item: RincianItem) => {
        const rows = nominatifRows[item.id] ?? [];
        const newRow = item.tipe_nominatif === 'honor'
            ? makeEmptyHonorRow(item.id, item.satuan, item.harga_satuan_aktual, item.kode_akun, rows.length)
            : makeEmptyPerjadinRow(item.id, item.satuan, item.harga_satuan_aktual);
        setNominatifRows(prev => ({ ...prev, [item.id]: [...(prev[item.id] ?? []), newRow] }));
    };

    const removeRow = (itemId: number, idx: number) => {
        setNominatifRows(prev => ({
            ...prev,
            [itemId]: (prev[itemId] ?? []).filter((_, i) => i !== idx),
        }));
    };

    // ── Perhitungan ────────────────────────────────────────────────────────

    const getHarga  = (item: RincianItem) => hargaSatuan[item.id] ?? item.harga_satuan;
    const getVol    = (item: RincianItem) => volumes[item.id] ?? 0;

    const nomVol = (item: RincianItem) => {
        const rows = nominatifRows[item.id] ?? [];
        return rows.reduce((s, r) => s + (parseFloat(r.volume) || 0), 0);
    };
    const nomJumlah = (item: RincianItem) => {
        const rows = nominatifRows[item.id] ?? [];
        return rows.reduce((s, r) => s + (parseFloat(r.volume) || 0) * (parseFloat(r.harga_satuan) || 0), 0);
    };

    const isNominatifItem = (item: RincianItem) => item.tipe_nominatif === 'honor' || item.tipe_nominatif === 'perjadin';

    const jumlah    = (item: RincianItem) => isNominatifItem(item) ? nomJumlah(item) : getVol(item) * getHarga(item);
    const volumeDisplay = (item: RincianItem) => isNominatifItem(item) ? nomVol(item) : getVol(item);
    const sisaDinamis = (item: RincianItem) => item.sisa_anggaran - jumlah(item);

    const totalAkun  = (group: RincianItem[]) => group.reduce((s, item) => s + jumlah(item), 0);
    const grandTotal = rincianBiaya.flat().reduce((s, item) => s + jumlah(item), 0);

    const NOMINATIF_TYPES = ['honor', 'perjadin'] as const;
    const itemsBelumNominatif = rincianBiaya.flat().filter(
        item =>
            NOMINATIF_TYPES.includes(item.tipe_nominatif as typeof NOMINATIF_TYPES[number]) &&
            nomJumlah(item) > 0 &&
            (nominatifRows[item.id] ?? []).length === 0,
    );

    const itemsOverBudget = rincianBiaya.flat().filter(
        item => jumlah(item) > item.sisa_anggaran,
    );

    const blockSubmit = itemsBelumNominatif.length > 0;
    const blockSave   = itemsOverBudget.length > 0;

    const buildItems = () => {
        const result: Array<{ dja_rincian_biaya_id: number; volume: number; harga_satuan: number; jumlah_permintaan: number }> = [];
        for (const item of rincianBiaya.flat()) {
            if (isNominatifItem(item)) {
                const rows = nominatifRows[item.id] ?? [];
                if (rows.length === 0) continue;
                const vol = nomVol(item);
                const jml = nomJumlah(item);
                if (jml <= 0) continue;
                result.push({ dja_rincian_biaya_id: item.id, volume: vol, harga_satuan: item.harga_satuan, jumlah_permintaan: jml });
            } else {
                const vol = getVol(item);
                if (vol <= 0) continue;
                result.push({ dja_rincian_biaya_id: item.id, volume: vol, harga_satuan: getHarga(item), jumlah_permintaan: vol * getHarga(item) });
            }
        }
        return result;
    };

    const buildNominatif = () => {
        const result: NominatifRow[] = [];
        for (const item of rincianBiaya.flat()) {
            if (!isNominatifItem(item)) continue;
            const rows = nominatifRows[item.id] ?? [];
            for (const row of rows) {
                result.push({ ...row, item_id: item.id });
            }
        }
        return result;
    };

    const saveAndSubmit = () => {
        setSubmitting(true);
        const payload = { items: buildItems(), nominatif: buildNominatif() };
         
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step4`,
            payload as any,
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    router.patch(
                        `/pumk/permohonan-dana/${pd.id}/submit`,
                        {},
                        {
                            preserveState: true,
                            preserveScroll: true,
                            onFinish: () => setSubmitting(false),
                        },
                    );
                },
                onError: (errs: Record<string, string>) => {
                    setSubmitting(false);
                    toast.error(Object.values(errs)[0] ?? 'Gagal menyimpan rincian biaya.');
                },
            },
        );
    };

    const save = () => {
        setSubmitting(true);
        const payload = { items: buildItems(), nominatif: buildNominatif() };
         
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step4`,
            payload as any,
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">Rincian Biaya</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                    Untuk honor/perjadin, isi data peserta langsung di sini. Jumlah permintaan akan dihitung otomatis.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overbudget Warning */}
                {(() => {
                    const allItems = rincianBiaya.flat();
                    const overbudgetCount = allItems.filter(i => i.status_anggaran === 'overbudget').length;
                    if (overbudgetCount === 0) return null;
                    const totalOverbudget = allItems
                        .filter(i => i.status_anggaran === 'overbudget')
                        .reduce((s, i) => s + (i.overbudget_amount ?? 0), 0);
                    return (
                        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                            <p className="text-sm font-semibold text-red-700">
                                {overbudgetCount} rincian biaya overbudget (total Rp {fmt(totalOverbudget)})
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Pagu revisi lebih kecil dari dana yang sudah terpakai. Tidak dapat mengajukan permohonan baru untuk item ini.
                            </p>
                        </div>
                    );
                })()}
                {rincianBiaya.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Tidak ada rincian biaya untuk kegiatan ini.</p>
                ) : (
                    rincianBiaya.map((group, gi) => {
                        const first = group[0];
                        return (
                            <div key={gi} className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {first.kode_akun} — {first.nama_akun}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                        Pagu: <span className="text-gray-700 font-bold">Rp {fmt(group.reduce((s, item) => s + Number(item.pagu_total ?? 0), 0))}</span>
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                <th className="text-left px-3 py-2">Uraian</th>
                                                <th className="text-right px-2 py-2 w-28">Pagu Anggaran</th>
                                                <th className="text-center px-2 py-2 w-20">Volume</th>
                                                <th className="text-center px-2 py-2 w-14">Sat.</th>
                                                <th className="text-right px-2 py-2 w-36">
                                                    Harga Satuan
                                                    <span className="block text-[10px] text-blue-500 font-normal">(SBM / lapangan)</span>
                                                </th>
                                                <th className="text-right px-2 py-2 w-28 text-orange-600">Terpakai</th>
                                                <th className="text-right px-2 py-2 w-32 text-blue-700">Jml Permintaan</th>
                                                <th className="text-right px-3 py-2 w-28 text-emerald-600">Sisa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.map(item => {
                                                const vol   = volumeDisplay(item);
                                                const harga = getHarga(item);
                                                const req   = jumlah(item);
                                                const sisa  = sisaDinamis(item);
                                                const over  = req > item.sisa_anggaran || item.status_anggaran === 'overbudget';
                                                const hargaBeda = !isNominatifItem(item) && harga < item.harga_satuan;
                                                const isOverbudget = item.status_anggaran === 'overbudget';
                                                const isHabis = item.status_anggaran === 'habis';
                                                const isNom = isNominatifItem(item);
                                                const rows = nominatifRows[item.id] ?? [];
                                                const isEx = expanded.has(item.id);

                                                return (
                                                    <tr key={item.id} className={cn('border-b last:border-0 align-top', over ? 'bg-red-50' : '', isOverbudget && 'bg-red-100', isNom && isEx && 'bg-amber-50/30')}>
                                                        <td className="px-3 py-2 text-gray-700 leading-snug" colSpan={isNom && isEx ? 8 : 1}>
                                                            {isNom && isEx ? (
                                                                /* Inline nominatif table */
                                                                <div>
                                                                    <button type="button" onClick={() => toggleExpand(item.id)}
                                                                        className="flex items-center gap-2 w-full text-left mb-2">
                                                                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                                                        <span className="font-medium text-sm">{item.nama_item}</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            · {rows.length} peserta · Rp {fmt(req)}
                                                                        </span>
                                                                    </button>
                                                                    {item.tipe_nominatif === 'honor' ? (
                                                                        <HonorNominatifTable
                                                                            item={item} rows={rows} refNama={refNama}
                                                                            onChange={(idx, f, v) => setNomRow(item.id, idx, f, v)}
                                                                            fillFromPegawai={(idx, n, p) => fillFromPegawai(item.id, idx, n, p)}
                                                                            onAdd={() => addRow(item)} onRemove={(idx) => removeRow(item.id, idx)}
                                                                            onOpenAddDialog={onOpenAddDialog} onOpenEditDialog={onOpenEditDialog}
                                                                        />
                                                                    ) : (
                                                                        <PerjadinNominatifTable
                                                                            item={item} rows={rows} refNama={refNama}
                                                                            onChange={(idx, f, v) => setNomRow(item.id, idx, f, v)}
                                                                            fillFromPegawai={(idx, n, p) => fillFromPegawai(item.id, idx, n, p)}
                                                                            onAdd={() => addRow(item)} onRemove={(idx) => removeRow(item.id, idx)}
                                                                            onOpenAddDialog={onOpenAddDialog} onOpenEditDialog={onOpenEditDialog}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5">
                                                                    {isNom ? (
                                                                        <button type="button" onClick={() => toggleExpand(item.id)} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                                                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                                            <span>{item.nama_item}</span>
                                                                        </button>
                                                                    ) : (
                                                                        <span>{item.nama_item}</span>
                                                                    )}
                                                                    {isOverbudget && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-semibold">Overbudget</span>}
                                                                    {isHabis && <span className="text-[10px] bg-gray-400 text-white px-1.5 py-0.5 rounded font-semibold">Habis</span>}
                                                                    {isNom && <span className="text-[10px] text-muted-foreground">· {rows.length} peserta</span>}
                                                                </div>
                                                            )}
                                                        </td>
                                                        {isNom && isEx ? null : (
                                                            <>
                                                                <td className="px-2 py-2 text-right text-gray-600 font-medium whitespace-nowrap">{fmt(item.pagu_total ?? 0)}</td>
                                                                <td className="px-2 py-2">
                                                                    {isNom ? (
                                                                        <span className="text-center block text-xs font-medium">{vol}</span>
                                                                    ) : (
                                                                        <input type="number" min={0} step="1" value={vol || ''} placeholder="0"
                                                                            onChange={e => setVolumes(v => ({ ...v, [item.id]: Number(e.target.value) }))}
                                                                            className="w-full text-center border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-400" />
                                                                    )}
                                                                </td>
                                                                <td className="px-2 py-2 text-center text-gray-500">{item.satuan}</td>
                                                                <td className="px-2 py-2">
                                                                    {isNom ? (
                                                                        <span className="block text-right text-xs">SBM: {fmt(item.harga_satuan)}</span>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <input type="number" min={0} step="1" value={harga || ''} placeholder="0"
                                                                                onChange={e => {
                                                                                    const val = Math.min(Number(e.target.value), item.harga_satuan);
                                                                                    setHargaSatuan(h => ({ ...h, [item.id]: val }));
                                                                                }}
                                                                                className={cn('w-full text-right border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-400', hargaBeda && 'border-amber-400 bg-amber-50')} />
                                                                            {hargaBeda && <span className="text-[10px] text-amber-600 text-right">SBM: {fmt(item.harga_satuan)}</span>}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-2 py-2 text-right text-orange-600 whitespace-nowrap">{fmt(item.terpakai ?? 0)}</td>
                                                                <td className={cn('px-2 py-2 text-right font-semibold whitespace-nowrap', over ? 'text-red-600' : 'text-blue-700')}>
                                                                    {fmt(req)}
                                                                    {over && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                                                </td>
                                                                <td className={cn('px-3 py-2 text-right whitespace-nowrap font-medium', sisa < 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                                    {fmt(Math.max(0, sisa ?? 0))}
                                                                    {sisa < 0 && <AlertTriangle className="w-3 h-3 inline ml-0.5" />}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 border-t">
                                                <td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                                    Total {first.kode_akun}:
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 whitespace-nowrap">
                                                    Rp {fmt(totalAkun(group))}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}

                {grandTotal > 0 && (
                    <div className="flex justify-end">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 px-5 py-3 text-right">
                            <p className="text-xs text-blue-600 mb-1">Total Permintaan</p>
                            <p className="text-lg font-bold tabular-nums text-blue-800">Rp {fmt(grandTotal)}</p>
                        </div>
                    </div>
                )}

                {itemsOverBudget.length > 0 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Jumlah permintaan melebihi sisa pagu anggaran</p>
                                <p className="text-xs text-red-700 mt-0.5">Item berikut melebihi sisa pagu yang tersedia:</p>
                                <ul className="mt-2 space-y-1.5">
                                    {itemsOverBudget.map(item => (
                                        <li key={item.id} className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-red-800">
                                                <span className="font-mono font-bold">[{item.kode_akun}]</span>{' '}{item.nama_item}
                                                <span className="block text-red-600 mt-0.5">Melebihi Rp {fmt(jumlah(item) - item.sisa_anggaran)}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {itemsBelumNominatif.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-800">Wajib isi daftar nominatif sebelum mengajukan</p>
                                <p className="text-xs text-amber-700 mt-0.5">Item honor/perjalanan dinas berikut membutuhkan data peserta:</p>
                                <ul className="mt-2 space-y-1.5">
                                    {itemsBelumNominatif.map(item => (
                                        <li key={item.id} className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-amber-800">
                                                <span className="font-mono font-bold">[{item.kode_akun}]</span>{' '}{item.nama_item}
                                            </span>
                                            <button type="button" onClick={() => !expanded.has(item.id) && toggleExpand(item.id)}
                                                className="shrink-0 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">
                                                → Isi Nominatif
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-2">
                    <Button type="button" variant="outline" onClick={onPrev}>← Sebelumnya</Button>
                    {!readonly && (
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={blockSave ? 0 : undefined}>
                                        <Button type="button" variant="outline" onClick={save} disabled={submitting || blockSave}>
                                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Simpan Rincian
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {blockSave && (
                                    <TooltipContent side="top" className="max-w-xs">
                                        Ada item yang melebihi sisa pagu. Perbaiki rincian biaya terlebih dahulu.
                                    </TooltipContent>
                                )}
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span tabIndex={(blockSubmit || blockSave) ? 0 : undefined}>
                                        <Button
                                            type="button"
                                            onClick={saveAndSubmit}
                                            disabled={submitting || blockSubmit || blockSave}
                                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Simpan &amp; Ajukan
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {blockSubmit && (
                                    <TooltipContent side="top" className="max-w-xs">
                                        Isi daftar nominatif untuk semua item honor/perjadin terlebih dahulu
                                    </TooltipContent>
                                )}
                                {blockSave && !blockSubmit && (
                                    <TooltipContent side="top" className="max-w-xs">
                                        Ada item yang melebihi sisa pagu. Perbaiki rincian biaya terlebih dahulu.
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Inline nominatif sub-tables ────────────────────────────────────────────────

function HonorNominatifTable({
    item, rows, refNama, onChange, fillFromPegawai, onAdd, onRemove, onOpenAddDialog, onOpenEditDialog,
}: {
    item: RincianItem;
    rows: NominatifRow[];
    refNama: RefNama[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    fillFromPegawai: (idx: number, nama: string, pegawai: RefNama | null) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
}) {
    const totalNom = rows.reduce((s, r) => s + (parseFloat(r.volume) || 0) * (parseFloat(r.harga_satuan) || 0), 0);
    const jabatanOptions = getJabatanOptions(item.kode_akun);

    return (
        <div className="rounded-lg border border-orange-200 overflow-hidden shadow-sm mt-2">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-orange-100 text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-orange-200/60">Nama</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-orange-200/60">Jabatan</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-orange-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-orange-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-orange-200/60">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-orange-200/60">Jumlah</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const vol = parseFloat(row.volume) || 0;
                            const harga = parseFloat(row.harga_satuan) || 0;
                            const jumlah = vol * harga;
                            return (
                                <tr key={idx} className="border-b last:border-0 even:bg-orange-50/30 hover:bg-amber-50/60">
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <PegawaiCombobox value={row.nama} options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                            onOpenEditDialog={onOpenEditDialog} />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        {jabatanOptions.length > 0 ? (
                                            <Select value={row.jabatan} onValueChange={v => onChange(idx, 'jabatan', v)}>
                                                <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                                                <SelectContent>{jabatanOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                                            </Select>
                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="number" min="0" step="0.5" value={row.volume}
                                            onChange={e => onChange(idx, 'volume', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="text" value={row.satuan || item.satuan}
                                            onChange={e => onChange(idx, 'satuan', e.target.value)} className="h-7 text-xs text-center" />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="number" min="0" value={row.harga_satuan || String(item.harga_satuan_aktual)}
                                            onChange={e => onChange(idx, 'harga_satuan', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold tabular-nums text-orange-700 border-r border-slate-100">{fmt(jumlah)}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <button onClick={() => onRemove(idx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-t-orange-200 bg-orange-50/60">
                            <td colSpan={5} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">Total:</td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-orange-700">{fmt(totalNom)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5">
                <Button variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1 text-orange-700 border-orange-300">
                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                </Button>
            </div>
        </div>
    );
}

function PerjadinNominatifTable({
    item, rows, refNama, onChange, fillFromPegawai, onAdd, onRemove, onOpenAddDialog, onOpenEditDialog,
}: {
    item: RincianItem;
    rows: NominatifRow[];
    refNama: RefNama[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    fillFromPegawai: (idx: number, nama: string, pegawai: RefNama | null) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
}) {
    const totalNom = rows.reduce((s, r) => s + (parseFloat(r.volume) || 0) * (parseFloat(r.harga_satuan) || 0), 0);

    return (
        <div className="rounded-lg border border-blue-200 overflow-hidden shadow-sm mt-2">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-blue-100 text-[10px] font-semibold text-blue-800 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-blue-200/60">Nama</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-blue-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-blue-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-blue-200/60">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-blue-200/60">Jumlah</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const vol = parseFloat(row.volume) || 0;
                            const harga = parseFloat(row.harga_satuan) || 0;
                            const jumlah = vol * harga;
                            return (
                                <tr key={idx} className="border-b last:border-0 even:bg-blue-50/30 hover:bg-sky-50/60">
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <PegawaiCombobox value={row.nama} options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                            onOpenEditDialog={onOpenEditDialog} />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="number" min="0" step="0.5" value={row.volume}
                                            onChange={e => onChange(idx, 'volume', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="text" value={row.satuan || item.satuan}
                                            onChange={e => onChange(idx, 'satuan', e.target.value)} className="h-7 text-xs text-center" />
                                    </td>
                                    <td className="px-2 py-1.5 border-r border-slate-100">
                                        <Input type="number" min="0" value={row.harga_satuan}
                                            onChange={e => onChange(idx, 'harga_satuan', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700 border-r border-slate-100">{fmt(jumlah)}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <button onClick={() => onRemove(idx)} className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-t-blue-200 bg-blue-50/60">
                            <td colSpan={4} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">Total:</td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700">{fmt(totalNom)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5">
                <Button variant="outline" size="sm" onClick={onAdd} className="h-7 text-xs gap-1 text-blue-700 border-blue-300">
                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                </Button>
            </div>
        </div>
    );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function Wizard({ pd, kapokjaList, picList, rincianBiaya, refNama: initialRefNama, jenisDokumen }: Props) {
    const { flash } = usePage<{ flash: { wizard_step?: number; error?: string; success?: string } }>().props;
    const initialStep = Math.max(1, Math.min(4, pd.wizard_step ?? 1));
    const [step, setStep] = useState<number>(initialStep);

    useEffect(() => {
        if (flash?.wizard_step && flash.wizard_step !== step) {
            setStep(flash.wizard_step);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash?.wizard_step]);

    const goToStep = (n: number) => setStep(n);

    const isEditable = pd.status === 'draft' || pd.status === 'rejected';
    const canUpload = pd.status !== 'dicairkan';

    const maxReached = isEditable ? Math.max(step, pd.wizard_step ?? 1) : 4;
    const isLoading = useNavigationLoading();

    // LPJ state
    const lpjFileRef = useRef<HTMLInputElement>(null);
    const [lpjUploading, setLpjUploading] = useState(false);
    const [lpjDeleting, setLpjDeleting] = useState(false);
    const [showDeleteLpj, setShowDeleteLpj] = useState(false);

    const handleLpjUpload = () => {
        if (!lpjFileRef.current?.files?.[0]) return;
        const file = lpjFileRef.current.files[0];
        if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran file maksimal 10 MB.'); return; }
        setLpjUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        router.post(`/pumk/permohonan-dana/${pd.id}/upload-lpj`, fd, {
            onSuccess: () => { setLpjUploading(false); toast.success('LPJ berhasil diupload.'); },
            onError: () => { setLpjUploading(false); toast.error('Gagal upload LPJ.'); },
        });
    };

    const handleLpjDelete = () => {
        setLpjDeleting(true);
        router.post(`/pumk/permohonan-dana/${pd.id}/hapus-lpj`, {}, {
            onSuccess: () => { setLpjDeleting(false); setShowDeleteLpj(false); toast.success('LPJ berhasil dihapus.'); },
            onError: () => { setLpjDeleting(false); toast.error('Gagal menghapus LPJ.'); },
        });
    };

    // RefNama state + dialogs
    const [refNama, setRefNama] = useState<RefNama[]>(initialRefNama);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDialogPrefill, setAddDialogPrefill] = useState('');
    const pendingSelectRef = useRef<((peg: RefNama) => void) | null>(null);

    const openAddDialog = (prefill: string, onSelect?: (peg: RefNama) => void) => {
        setAddDialogPrefill(prefill);
        pendingSelectRef.current = onSelect ?? null;
        setAddDialogOpen(true);
    };

    const handleNewPegawai = (peg: RefNama) => {
        setRefNama(prev => [...prev, peg].sort((a, b) => a.nama.localeCompare(b.nama)));
        if (pendingSelectRef.current) {
            pendingSelectRef.current(peg);
            pendingSelectRef.current = null;
        }
    };

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingPegawai, setEditingPegawai] = useState<RefNama | null>(null);

    const openEditDialog = (pegawai: RefNama) => {
        setEditingPegawai(pegawai);
        setEditDialogOpen(true);
    };

    const handleUpdatePegawai = (peg: RefNama) => {
        setRefNama(prev => prev.map(p => p.id === peg.id ? peg : p).sort((a, b) => a.nama.localeCompare(b.nama)));
        toast.success(`Data pegawai ${peg.nama} berhasil diperbarui.`);
    };

    const handleToggleStatusPegawai = (peg: RefNama) => {
        setRefNama(prev => prev.filter(p => p.id !== peg.id));
        toast.success(`Pegawai ${peg.nama} telah dinonaktifkan.`);
    };

    return (
        <AppLayout>
            <Head title={`Permohonan ${pd.nomor_permohonan}`} />
            {isLoading ? (
                <div className="p-4"><SkeletonPageHeader /><SkeletonForm /></div>
            ) : (
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-4">
                <div className="text-center space-y-1">
                    <Badge variant="outline" className="text-xs uppercase tracking-widest">
                        {isEditable ? 'Draft Permohonan Dana' : pd.status_label}
                    </Badge>
                    <h1 className="text-2xl font-bold tracking-tight">Pengajuan Pendanaan Kegiatan</h1>
                    <p className="text-sm text-muted-foreground">{pd.nomor_permohonan}</p>
                </div>

                {!isEditable && (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <Lock className="h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                            <strong>Permohonan sudah dalam proses persetujuan.</strong> Data tidak dapat diubah{canUpload && ', namun dokumen pendukung masih dapat diunggah'} ({pd.status_label}).
                        </span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {pd.status === 'dicairkan' && (
                    <Card className="border-emerald-200 bg-emerald-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-emerald-800">
                                <FileText className="h-4 w-4" /> Laporan Pertanggungjawaban (LPJ)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pd.lpj_file_path ? (
                                <>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <a href={`/files/lpj/${pd.id}`} target="_blank" rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline font-medium">
                                            {pd.lpj_file_name}
                                        </a>
                                        <span className="text-xs text-gray-500">
                                            Diupload oleh {pd.lpj_uploaded_by_name} pada{' '}
                                            {pd.lpj_uploaded_at ? new Date(pd.lpj_uploaded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </span>
                                    </div>
                                    <Button variant="outline" size="sm" disabled={lpjDeleting}
                                        onClick={() => setShowDeleteLpj(true)}
                                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" /> Hapus LPJ
                                    </Button>
                                    {showDeleteLpj && (
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-xs text-red-600">Yakin hapus LPJ?</span>
                                            <Button size="sm" variant="destructive" disabled={lpjDeleting} onClick={handleLpjDelete}>Ya</Button>
                                            <Button size="sm" variant="outline" onClick={() => setShowDeleteLpj(false)}>Batal</Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">Permohonan telah dicairkan. Silakan upload LPJ.</p>
                                    <div className="flex items-center gap-3">
                                        <Input ref={lpjFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="max-w-xs" />
                                        <Button size="sm" onClick={handleLpjUpload} disabled={lpjUploading}
                                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                                            {lpjUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            Upload LPJ
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <StepBar current={step} maxReached={maxReached} onGoto={goToStep} />

                {step === 1 && <Step1 pd={pd} onNext={() => goToStep(2)} />}
                {step === 2 && <Step2 key={`s2-${pd.tanggal_mulai}-${pd.kapokja_id}-${pd.pic_keuangan_id}`}
                    pd={pd} kapokjaList={kapokjaList} picList={picList} readonly={!isEditable}
                    onPrev={() => goToStep(1)} onNext={() => goToStep(3)} />}
                {step === 3 && <Step3 pd={pd} jenisDokumen={jenisDokumen} readonly={!canUpload} onPrev={() => goToStep(2)} onNext={() => goToStep(4)} />}
                {step === 4 && <Step4 pd={pd} rincianBiaya={rincianBiaya} refNama={refNama} readonly={!isEditable} onPrev={() => goToStep(3)}
                    onOpenAddDialog={openAddDialog} onOpenEditDialog={openEditDialog} />}
            </div>
            )}
            <TambahPegawaiDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onSuccess={handleNewPegawai} />
            {editingPegawai && (
                <EditPegawaiDialog open={editDialogOpen} onClose={() => { setEditDialogOpen(false); setEditingPegawai(null); }}
                    onSuccess={handleUpdatePegawai} onToggleStatus={handleToggleStatusPegawai} pegawai={editingPegawai} />
            )}
        </AppLayout>
    );
}
