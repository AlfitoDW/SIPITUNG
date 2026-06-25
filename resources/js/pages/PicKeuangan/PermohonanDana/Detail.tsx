import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle2, Download, FileText, Calendar,
    User, MapPin, ClipboardList, Banknote, Eye,
    Printer, XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DocPreviewModal from '@/components/DocPreviewModal';
import InfoRow from '@/components/InfoRow';
import Step1Informasi from '@/components/PermohonanDanaDetail/Step1Informasi';
import Step2Waktu from '@/components/PermohonanDanaDetail/Step2Waktu';
import Step3Dokumen from '@/components/PermohonanDanaDetail/Step3Dokumen';
import RincianBiayaTable from '@/components/RincianBiayaTable';
import { SkeletonDetailPage } from '@/components/skeletons';
import StepBar from '@/components/StepBar';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Pd {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    judul_pekerjaan: string | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    jam_pelaksanaan: string | null;
    tempat: string | null;
    tgl_pertanggungjawaban: string | null;
    total_anggaran: string | number;
    status: string;
    status_label: string;
    catatan_katim: string | null;
    catatan_penolakan: string | null;
    created_by_name: string | null;
    created_at: string;
    submitted_at: string | null;
    // approval actors & timestamps
    katim_approved_by: number | null;
    katim_approved_at: string | null;
    katim_approved_by_name: string | null;
    kabag_approved_by: number | null;
    kabag_approved_at: string | null;
    kabag_approved_by_name: string | null;
    ppk_approved_by: number | null;
    ppk_approved_at: string | null;
    ppk_approved_by_name: string | null;
    pic_approved_by: number | null;
    pic_approved_at: string | null;
    pic_approved_by_name: string | null;
    dicairkan_by: number | null;
    dicairkan_at: string | null;
    dicairkan_by_name: string | null;
    rejected_at: string | null;
    rejected_at_step: string | null;
    dibuka_kunci_by_name: string | null;
    dibuka_kunci_at: string | null;
    alasan_pembukaan_kunci: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
    bukti_bayar_path: string | null;
    bukti_bayar_uploaded_at: string | null;
    bukti_bayar_uploaded_by_name: string | null;
    lpj_file_path: string | null;
    lpj_file_name: string | null;
    lpj_uploaded_at: string | null;
    lpj_uploaded_by_name: string | null;
    dja_program?: { nama: string } | null;
    dja_sasaran?: { nama: string } | null;
    dja_kro?: { kode: string; nama: string } | null;
    dja_ro?: { nama: string } | null;
    dja_komponen?: { nama: string } | null;
    dja_kegiatan?: { kode: string; nama: string } | null;
    kapokja?: { id: number; nama_lengkap: string } | null;
    pic_keuangan?: { id: number; nama_lengkap: string } | null;
    items: {
        id: number; kode_akun: string | null; uraian: string;
        volume: string; satuan: string; harga_satuan: string; total: string;
        pagu_total: string | number; sbm: string | number;
        terpakai: string | number; sisa_anggaran: string | number;
        nominatif?: Array<{
            id: number; nama: string; nip: string | null; nik: string | null;
            npwp: string | null; gol_ruang: string | null;
            nama_rekening: string | null; no_rekening: string | null;
            nama_bank: string | null; email: string | null;
            pph21_persen: string | number; jabatan: string | null;
            volume: string | number; harga_satuan: string | number;
            jumlah_bruto: string | number; jumlah_pajak: string | number;
            jumlah_diterima: string | number;
            transport: string | number; uang_harian_jumlah: string | number;
            fullboard_jumlah: string | number; fullday_jumlah: string | number;
            representasi: string | number; taksi_pp: string | number;
            tiket_pesawat: string | number; hotel: string | number;
            jumlah_perjadin: string | number;
        }>;
    }[];
    dokumens: {
        id: number; nama_jenis: string; nama_file: string; path_file: string;
    }[];
}

interface Props { pd: Pd; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isNaN(num) ? 0 : num);
};

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const STEPS = ['Informasi Kegiatan', 'Waktu & PJ', 'Dokumen', 'Rincian Biaya'] as const;

const statusMeta = (s: string) => {
    if (s === 'submitted')      return { cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' };
    if (s === 'katim_approved') return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'kabag_approved') return { cls: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
    if (s === 'ppk_approved')   return { cls: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' };
    if (s === 'pic_approved')   return { cls: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', dot: 'bg-fuchsia-500' };
    if (s === 'rejected')       return { cls: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500' };
    if (s === 'dicairkan')      return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    return { cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
};




// ── Main ──────────────────────────────────────────────────────────────────────

type ActionType = 'approve' | 'reject' | null;

export default function Detail({ pd }: Props) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    const [step, setStep]             = useState(1);
    const [previewDok, setPreviewDok] = useState<{ url: string; nama: string } | null>(null);
    const [action, setAction]         = useState<ActionType>(null);

    const canPrint = !['draft', 'rejected'].includes(pd.status);

    const { data, setData, post, processing, reset } = useForm({ catatan: '' });

    const canApprove = pd.status === 'katim_approved' && step === 4;
    const { cls: statusCls, dot: statusDot } = statusMeta(pd.status);

    const openPreview = (dok: Pd['dokumens'][number]) => {
        const url = `/files/dokumen/${dok.id}`;
        setPreviewDok({ url, nama: dok.nama_file });
    };

    const handleConfirm = () => {
        if (!action) return;
        const url = `/pic-keuangan/permohonan-dana/${pd.id}/${action}`;
        post(url, {
            onSuccess: () => { reset(); setAction(null); },
            onError: (errors: Record<string, string>) => {
                toast.error(Object.values(errors)[0] ?? 'Terjadi kesalahan. Silakan coba lagi.');
            },
        });
    };

    const isLoading = useNavigationLoading();

    return (
        <AppLayout>
            <Head title={`Detail — ${pd.nomor_permohonan}`} />

            {previewDok && (
                <DocPreviewModal url={previewDok.url} nama={previewDok.nama} onClose={() => setPreviewDok(null)} />
            )}

            {isLoading ? <SkeletonDetailPage /> : (<div className="max-w-7xl mx-auto py-8 px-4 space-y-5">

                {/* Back + header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link href="/pic-keuangan/permohonan-dana">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Permohonan Dana
                            </h1>
                            <p className="text-xs font-mono text-blue-700 font-semibold">{pd.nomor_permohonan}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', statusCls)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusDot)} />
                            {pd.status_label}
                        </span>
                        {/* Cetak — hanya jika sudah diajukan */}
                        {canPrint && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={`/pic-keuangan/permohonan-dana/${pd.id}/print`}>
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                            <Download className="h-4 w-4" /> Download Surat
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>Download surat permohonan</TooltipContent>
                            </Tooltip>
                        )}
                        {canPrint && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={`/pic-keuangan/permohonan-dana/${pd.id}/nominatif`}>
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Download className="h-4 w-4" /> Nominatif
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>Download Nominatif</TooltipContent>
                            </Tooltip>
                        )}
                        {/* Bukti Bayar — view only */}
                        {pd.bukti_bayar_path && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={`/files/bukti-bayar/${pd.id}`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                            <CheckCircle2 className="h-4 w-4" /> Bukti Bayar
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>Lihat Bukti Bayar</TooltipContent>
                            </Tooltip>
                        )}
                        {/* LPJ — view only */}
                        {pd.lpj_file_path && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={`/files/lpj/${pd.id}`} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-violet-600 border-violet-200 hover:bg-violet-50">
                                            <FileText className="h-4 w-4" /> LPJ
                                        </Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>Lihat Laporan Pertanggungjawaban</TooltipContent>
                            </Tooltip>
                        )}
                        {/* Approve / Reject — hanya jika status katim_approved */}
                        {canApprove && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" onClick={() => { reset(); setAction('approve'); }}
                                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-8">
                                            <CheckCircle2 className="h-4 w-4" /> Verifikasi
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Verifikasi dan teruskan ke PPK</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="destructive" onClick={() => { reset(); setAction('reject'); }}
                                            className="gap-1.5 h-8">
                                            <XCircle className="h-4 w-4" /> Tolak
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Tolak — PUMK perlu merevisi</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        {/* Info jika sedang menunggu */}
                        {!canApprove && pd.status !== 'rejected' && pd.status !== 'dicairkan' && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                                Menunggu {{
                                    submitted: 'persetujuan KA.TIM',
                                    katim_approved: 'verifikasi PIC Keuangan',
                                    pic_approved: 'persetujuan PPK',
                                    ppk_approved: 'pencairan Bendahara',
                                }[pd.status] ?? 'proses'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Catatan penolakan / persetujuan */}
                {pd.status === 'rejected' && pd.catatan_penolakan && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <span className="font-semibold">Catatan Penolakan: </span>{pd.catatan_penolakan}
                    </div>
                )}
                {pd.catatan_katim && pd.status !== 'rejected' && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        <span className="font-semibold">Catatan KA.TIM: </span>{pd.catatan_katim}
                    </div>
                )}
                {pd.catatan_kabag && pd.status !== 'rejected' && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                        <span className="font-semibold">Catatan Kabag: </span>{pd.catatan_kabag}
                    </div>
                )}
                {pd.catatan_ppk && pd.status !== 'rejected' && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                        <span className="font-semibold">Catatan PPK: </span>{pd.catatan_ppk}
                    </div>
                )}

                {/* Step Bar */}
                <StepBar steps={STEPS} active={step} onChange={setStep} />

                {/* ── Step 1: Informasi Kegiatan ── */}
                {step === 1 && <Step1Informasi pd={pd} />}

                {/* ── Step 2: Waktu & PJ ── */}
                {step === 2 && <Step2Waktu pd={pd} />}

                {/* ── Step 3: Dokumen ── */}
                {step === 3 && <Step3Dokumen dokumens={pd.dokumens} onPreview={openPreview} />}

                {/* ── Step 4: Rincian Biaya ── */}
                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Banknote className="h-4 w-4 text-blue-600" /> Rincian Biaya
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RincianBiayaTable items={pd.items} totalAnggaran={pd.total_anggaran} />
                        </CardContent>
                    </Card>
                )}

                {/* Navigasi bawah */}
                <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                        ← Sebelumnya
                    </Button>
                    <Button variant="outline" onClick={() => setStep(s => Math.min(4, s + 1))} disabled={step === 4}>
                        Selanjutnya →
                    </Button>
                </div>
            </div>)}


            {/* Approve / Reject Dialog */}
            <AlertDialog open={!!action} onOpenChange={o => !o && setAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {action === 'approve' ? 'Verifikasi Permohonan' : 'Tolak Permohonan'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {action === 'approve'
                                ? `Verifikasi ${pd.nomor_permohonan} dan teruskan ke PPK?`
                                : `Tolak ${pd.nomor_permohonan}? PUMK perlu merevisi dan mengajukan ulang.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-6 pb-2 space-y-1.5">
                        <Label className="text-sm">
                            Catatan {action === 'reject' && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                            rows={3}
                            value={data.catatan}
                            onChange={e => setData('catatan', e.target.value)}
                            placeholder={action === 'approve' ? 'Catatan verifikasi (opsional)' : 'Alasan penolakan (wajib diisi)'}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={processing || (action === 'reject' && !data.catatan.trim())}
                            className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {processing ? 'Memproses...' : action === 'approve' ? 'Verifikasi' : 'Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
