import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Upload, Trash2, AlertTriangle, Loader2, Lock, Eye, X, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import DocPreviewModal from '@/components/DocPreviewModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

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
interface RincianItem {
    id:number; kode_akun:string; nama_akun:string; nama_item:string;
    satuan:string; harga_satuan:number; harga_satuan_aktual:number;
    pagu_total:number; terpakai:number; sisa_anggaran:number;
    volume_diminta:number; jumlah_permintaan:number;
    tipe_nominatif: 'honor' | 'perjadin' | 'non_nominatif';
    nominatif_count: number;   // jumlah baris nominatif yang sudah diisi
}
interface Props {
    pd: Pd;
    kapokjaList: KapokjaItem[];
    picList: PicItem[];
    rincianBiaya: RincianItem[][];  // grouped by akun
    jenisDokumen: Record<string,string>;
}

const fmt = (n: number | string | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID').format(Number.isNaN(num) ? 0 : num);
};
const STEPS = ['Kegiatan','Waktu & PJ','Dokumen','Rincian Biaya'];

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
    // Inisialisasi dari pd — key di parent memastikan ini fresh setiap pd berubah
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
        // Gunakan router.patch Inertia — data pasti tersimpan ke DB sebelum onSuccess
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step2`,
            form,
            {
                preserveState: true,    // jaga step wizard, jangan reset ke awal
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onNext();           // advance ke step 3
                },
                onError: (errs) => {
                    setProcessing(false);
                    // Inertia returns { field: 'message' } on 422
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
                    {/* Fields — dinonaktifkan saat readonly, tombol navigasi tetap bisa diklik */}
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

                    {/* Navigasi — SELALU bisa diklik, bahkan saat readonly */}
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

    // SK / ST fields
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
                    {/* Upload area — disembunyikan saat readonly */}
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

                            {/* Fields SK — muncul saat jenis 2 */}
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

                            {/* Fields ST — muncul saat jenis 3 */}
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

                    {/* Daftar dokumen */}
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
                                                {/* Tombol preview — selalu tampil */}
                                                <button
                                                    type="button"
                                                    onClick={() => openPreview(dok)}
                                                    title="Lihat dokumen"
                                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {/* Tombol hapus — hanya saat tidak readonly */}
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

function Step4({ pd, rincianBiaya, onPrev, readonly = false }: { pd: Pd; rincianBiaya: RincianItem[][]; onPrev: () => void; readonly?: boolean; }) {
    const [volumes, setVolumes] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        rincianBiaya.flat().forEach(item => { init[item.id] = item.volume_diminta; });
        return init;
    });
    // Harga satuan bisa diubah PUMK — default dari DJA (harga_satuan_aktual sudah terisi nilai tersimpan atau DJA)
    const [hargaSatuan, setHargaSatuan] = useState<Record<number, number>>(() => {
        const init: Record<number, number> = {};
        rincianBiaya.flat().forEach(item => { init[item.id] = item.harga_satuan_aktual; });
        return init;
    });
    const [submitting, setSubmitting] = useState(false);

    const getHarga  = (item: RincianItem) => hargaSatuan[item.id] ?? item.harga_satuan;
    const getVol    = (item: RincianItem) => volumes[item.id] ?? 0;
    const jumlah    = (item: RincianItem) => getVol(item) * getHarga(item);
    // Sisa dinamis = sisa_anggaran (dari server, sudah exclude PD ini) - jumlah yang sedang diminta
    const sisaDinamis = (item: RincianItem) => item.sisa_anggaran - jumlah(item);

    const totalAkun  = (group: RincianItem[]) => group.reduce((s, item) => s + jumlah(item), 0);
    const grandTotal = rincianBiaya.flat().reduce((s, item) => s + jumlah(item), 0);

    const buildItems = () =>
        rincianBiaya.flat()
            .filter(item => getVol(item) > 0)
            .map(item => ({
                dja_rincian_biaya_id: item.id,
                volume:               getVol(item),
                harga_satuan:         getHarga(item),
                jumlah_permintaan:    jumlah(item),
            }));

    // Item honor/perjadin yang volume > 0 tapi belum ada nominatif
    const NOMINATIF_TYPES = ['honor', 'perjadin'] as const;
    const itemsBelumNominatif = rincianBiaya.flat().filter(
        item =>
            NOMINATIF_TYPES.includes(item.tipe_nominatif as typeof NOMINATIF_TYPES[number]) &&
            getVol(item) > 0 &&
            item.nominatif_count === 0,
    );

    // Item yang melebihi sisa pagu (semua item, termasuk non-nominatif)
    const itemsOverBudget = rincianBiaya.flat().filter(
        item => jumlah(item) > item.sisa_anggaran,
    );

    const blockSubmit = itemsBelumNominatif.length > 0;
    const blockSave   = itemsOverBudget.length > 0;

    const saveAndSubmit = () => {
        setSubmitting(true);
        // PATCH step4 dulu (simpan rincian), lalu di onSuccess langsung PATCH submit.
        // preserveState:true agar step state di React tidak hilang di tengah chain.
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step4`,
            { items: buildItems() },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    // step4 tersimpan — sekarang ajukan
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
        router.patch(
            `/pumk/permohonan-dana/${pd.id}/step4`,
            { items: buildItems() },
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
                    Harga satuan dapat disesuaikan dengan kondisi di lapangan. Jumlah permintaan dan sisa anggaran dihitung otomatis.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {rincianBiaya.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Tidak ada rincian biaya untuk kegiatan ini.</p>
                ) : (
                    rincianBiaya.map((group, gi) => {
                        const first = group[0];
                        return (
                            <div key={gi} className="border rounded-lg overflow-hidden">
                                {/* Header akun */}
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
                                                const vol   = getVol(item);
                                                const harga = getHarga(item);
                                                const req   = vol * harga;
                                                const sisa  = sisaDinamis(item);
                                                const over  = req > item.sisa_anggaran;
                                                const hargaBeda = harga < item.harga_satuan; // di bawah SBM
                                                return (
                                                    <tr key={item.id} className={cn('border-b last:border-0 align-top', over ? 'bg-red-50' : '')}>
                                                        <td className="px-3 py-2 text-gray-700 leading-snug">
                                                            {item.nama_item}
                                                        </td>
                                                        {/* Pagu Anggaran */}
                                                        <td className="px-2 py-2 text-right text-gray-600 font-medium whitespace-nowrap">
                                                            {fmt(item.pagu_total ?? 0)}
                                                        </td>
                                                        {/* Volume */}
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number" min={0} step="1"
                                                                value={vol || ''}
                                                                placeholder="0"
                                                                onChange={e => setVolumes(v => ({ ...v, [item.id]: Number(e.target.value) }))}
                                                                className="w-full text-center border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-400"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center text-gray-500">{item.satuan}</td>
                                                        {/* Harga Satuan — editable */}
                                                        <td className="px-2 py-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <input
                                                                    type="number" min={0} step="1"
                                                                    value={harga || ''}
                                                                    placeholder="0"
                                                                    onChange={e => {
                                                                        const val = Math.min(Number(e.target.value), item.harga_satuan);
                                                                        setHargaSatuan(h => ({ ...h, [item.id]: val }));
                                                                    }}
                                                                    className={cn(
                                                                        'w-full text-right border rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-400',
                                                                        hargaBeda && 'border-amber-400 bg-amber-50',
                                                                    )}
                                                                />
                                                                {hargaBeda && (
                                                                    <span className="text-[10px] text-amber-600 text-right">
                                                                        SBM: {fmt(item.harga_satuan)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        {/* Terpakai (dari PD lain) */}
                                                        <td className="px-2 py-2 text-right text-orange-600 whitespace-nowrap">
                                                            {fmt(item.terpakai ?? 0)}
                                                        </td>
                                                        {/* Jumlah Permintaan */}
                                                        <td className={cn('px-2 py-2 text-right font-semibold whitespace-nowrap', over ? 'text-red-600' : 'text-blue-700')}>
                                                            {fmt(req)}
                                                            {over && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                                                        </td>
                                                        {/* Sisa dinamis */}
                                                        <td className={cn('px-3 py-2 text-right whitespace-nowrap font-medium', sisa < 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                            {fmt(Math.max(0, sisa ?? 0))}
                                                            {sisa < 0 && <AlertTriangle className="w-3 h-3 inline ml-0.5" />}
                                                        </td>
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

                {/* Banner over-budget */}
                {itemsOverBudget.length > 0 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">
                                    Jumlah permintaan melebihi sisa pagu anggaran
                                </p>
                                <p className="text-xs text-red-700 mt-0.5">
                                    Item berikut melebihi sisa pagu yang tersedia:
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                    {itemsOverBudget.map(item => (
                                        <li key={item.id} className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-red-800">
                                                <span className="font-mono font-bold">[{item.kode_akun}]</span>{' '}
                                                {item.nama_item}
                                                <span className="block text-red-600 mt-0.5">
                                                    Melebihi Rp {fmt(jumlah(item) - item.sisa_anggaran)}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner wajib nominatif */}
                {itemsBelumNominatif.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-800">
                                    Wajib isi daftar nominatif sebelum mengajukan
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Item honor/perjalanan dinas berikut membutuhkan data peserta (nominatif):
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                    {itemsBelumNominatif.map(item => (
                                        <li key={item.id} className="flex items-center justify-between gap-3">
                                            <span className="text-xs text-amber-800">
                                                <span className="font-mono font-bold">[{item.kode_akun}]</span>{' '}
                                                {item.nama_item}
                                            </span>
                                            <a
                                                href={`/pumk/permohonan-dana/${pd.id}/nominatif`}
                                                className="shrink-0 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap"
                                            >
                                                → Isi Nominatif
                                            </a>
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

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function Wizard({ pd, kapokjaList, picList, rincianBiaya, jenisDokumen }: Props) {
    const { flash } = usePage<{ flash: { wizard_step?: number; error?: string; success?: string } }>().props;
    // Inisialisasi dari wizard_step tersimpan di DB agar reload halaman tidak reset ke step 1.
    // wizard_step di DB menyimpan step terakhir yang berhasil dilalui (1–4).
    // Setelah step 2 sukses, DB akan bernilai 3, jadi kita mulai di step 3, dll.
    const initialStep = Math.max(1, Math.min(4, pd.wizard_step ?? 1));
    const [step, setStep] = useState<number>(initialStep);

    // Override dari flash server (misalnya: server minta balik ke step 2 karena error)
    useEffect(() => {
        if (flash?.wizard_step && flash.wizard_step !== step) {
            setStep(flash.wizard_step);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash?.wizard_step]);

    const goToStep = (n: number) => setStep(n);

    const isEditable = pd.status === 'draft' || pd.status === 'rejected';

    // Step tertinggi yang bisa dijangkau:
    // - Saat readonly (sudah disubmit): semua step bisa dikunjungi bebas (maxReached=4)
    // - Saat draft/edit: hanya sampai wizard_step yang tersimpan di DB
    const maxReached = isEditable ? Math.max(step, pd.wizard_step ?? 1) : 4;

    return (
        <AppLayout>
            <Head title={`Permohonan ${pd.nomor_permohonan}`} />
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-4">
                {/* Header */}
                <div className="text-center space-y-1">
                    <Badge variant="outline" className="text-xs uppercase tracking-widest">
                        {isEditable ? 'Draft Permohonan Dana' : pd.status_label}
                    </Badge>
                    <h1 className="text-2xl font-bold tracking-tight">Pengajuan Pendanaan Kegiatan</h1>
                    <p className="text-sm text-muted-foreground">{pd.nomor_permohonan}</p>
                </div>

                {/* Banner terkunci — tampil bila sudah disubmit */}
                {!isEditable && (
                    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        <Lock className="h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                            <strong>Permohonan sudah dikunci.</strong> Data tidak dapat diubah karena permohonan sedang dalam proses persetujuan ({pd.status_label}).
                        </span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                <StepBar current={step} maxReached={maxReached} onGoto={goToStep} />

                {step === 1 && <Step1 pd={pd} onNext={() => goToStep(2)} />}
                {/* key={pd.tanggal_mulai + pd.kapokja_id + pd.pic_keuangan_id} agar form Step2
                    selalu diinisialisasi ulang dengan nilai terbaru dari server setelah reload. */}
                {step === 2 && <Step2 key={`s2-${pd.tanggal_mulai}-${pd.kapokja_id}-${pd.pic_keuangan_id}`}
                    pd={pd} kapokjaList={kapokjaList} picList={picList} readonly={!isEditable}
                    onPrev={() => goToStep(1)} onNext={() => goToStep(3)} />}
                {step === 3 && <Step3 pd={pd} jenisDokumen={jenisDokumen} readonly={!isEditable} onPrev={() => goToStep(2)} onNext={() => goToStep(4)} />}
                {step === 4 && <Step4 pd={pd} rincianBiaya={rincianBiaya} readonly={!isEditable} onPrev={() => goToStep(3)} />}
            </div>
        </AppLayout>
    );
}
