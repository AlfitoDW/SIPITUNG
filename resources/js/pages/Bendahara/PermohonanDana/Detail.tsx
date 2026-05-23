import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    ArrowLeft, CheckCircle2, XCircle, FileText, Calendar,
    User, MapPin, ClipboardList, Banknote, Eye,
    Printer, Upload, Download, Trash2, Unlock,
} from 'lucide-react';
import { useState } from 'react';
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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import DocPreviewModal from '@/components/DocPreviewModal';
import InfoRow from '@/components/InfoRow';
import StepBar from '@/components/StepBar';

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
    dibuka_kunci_by: number | null;
    dibuka_kunci_at: string | null;
    dibuka_kunci_by_name: string | null;
    alasan_pembukaan_kunci: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
    bukti_bayar_path: string | null;
    bukti_bayar_uploaded_at: string | null;
    bukti_bayar_uploaded_by_name: string | null;
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
    }[];
    dokumens: {
        id: number; nama_jenis: string; nama_file: string; path_file: string;
    }[];
}

interface Props { pd: Pd; }

const fmt = (n: string | number | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isNaN(num) ? 0 : num);
};

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

const STEPS = ['Informasi Kegiatan', 'Waktu & PJ', 'Dokumen', 'Rincian Biaya'] as const;

const statusMeta = (s: string) => {
    if (s === 'submitted')      return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'katim_approved') return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'kabag_approved') return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'ppk_approved')   return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'pic_approved')   return { cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' };
    if (s === 'rejected')       return { cls: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' };
    if (s === 'dicairkan')      return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    return { cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
};



type ActionType = 'setujui' | 'reject' | 'upload_bukti_bayar' | null;

export default function Detail({ pd }: Props) {
    const [step, setStep] = useState(1);
    const [previewDok, setPreviewDok] = useState<{ url: string; nama: string } | null>(null);
    const [action, setAction] = useState<ActionType>(null);
    const [showDeleteBukti, setShowDeleteBukti] = useState(false);
    const [showBukaKunci, setShowBukaKunci] = useState(false);

    const canPrint = !['draft', 'rejected'].includes(pd.status);
    const canAct = pd.status === 'pic_approved';
    const canUploadBuktiBayar = pd.status === 'dicairkan' && !pd.bukti_bayar_path;

    const user = (usePage().props as unknown as { auth: { user: { role: string } } }).auth.user;
    const canBukaKunci = user.role === 'bendahara'
        && !['draft', 'rejected'].includes(pd.status)
        && !(pd.status === 'dicairkan' && pd.bukti_bayar_path);

    const { data, setData, post, processing, reset } = useForm({ 
        catatan: '',
        bukti_bayar: null as File | null,
    });

    const { cls: statusCls, dot: statusDot } = statusMeta(pd.status);

    const openPreview = (dok: Pd['dokumens'][number]) => {
        const url = `/files/dokumen/${dok.id}`;
        const ext = dok.path_file.split('.').pop()?.toLowerCase() ?? '';
        const isPreviewable = ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        if (!isPreviewable) window.open(url, '_blank', 'noopener,noreferrer');
        else setPreviewDok({ url, nama: dok.nama_file });
    };

    const bukaKunciForm = useForm({ alasan: '' });

    const handleConfirm = () => {
        if (!action) return;
        const onError = (errors: Record<string, string>) => {
            toast.error(Object.values(errors)[0] ?? 'Terjadi kesalahan. Silakan coba lagi.');
        };
        if (action === 'setujui') {
            post(`/bendahara/permohonan-dana/${pd.id}/setujui`, {
                catatan: data.catatan,
                onError,
            } as any);
            reset();
            setAction(null);
        } else if (action === 'upload_bukti_bayar') {
            if (data.bukti_bayar && data.bukti_bayar.size > 5 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 5 MB.');
                return;
            }
            const formData = new FormData();
            if (data.bukti_bayar) {
                formData.append('bukti_bayar', data.bukti_bayar);
            }
            post(`/bendahara/permohonan-dana/${pd.id}/upload-bukti-bayar`, {
                ...formData as any,
                onError,
            });
            reset();
            setAction(null);
        } else {
            post(`/bendahara/permohonan-dana/${pd.id}/reject`, {
                catatan: data.catatan,
                onError,
            } as any);
            reset();
            setAction(null);
        }
    };

    return (
        <AppLayout>
            <Head title={`Detail — ${pd.nomor_permohonan}`} />

            {previewDok && (
                <DocPreviewModal url={previewDok.url} nama={previewDok.nama} onClose={() => setPreviewDok(null)} />
            )}

            <div className="max-w-4xl mx-auto py-8 px-4 space-y-5">

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link href="/bendahara/permohonan-dana">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Detail Pencairan Dana</h1>
                            <p className="text-xs font-mono text-blue-700 font-semibold">{pd.nomor_permohonan}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', statusCls)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusDot)} />
                            {pd.status_label}
                        </span>
                        {canPrint && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`/bendahara/permohonan-dana/${pd.id}/print`} target="_blank">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                            <Printer className="h-4 w-4" /> Cetak
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>Cetak permohonan dana</TooltipContent>
                            </Tooltip>
                        )}
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
                        {pd.status === 'dicairkan' && pd.bukti_bayar_path && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 h-8 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setShowDeleteBukti(true)}
                                    >
                                        <Trash2 className="h-4 w-4" /> Hapus Bukti Bayar
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Hapus bukti bayar</TooltipContent>
                            </Tooltip>
                        )}
                        {canPrint && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`/bendahara/permohonan-dana/${pd.id}/nominatif`} target="_blank">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                                            <Download className="h-4 w-4" /> Nominatif
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>Download Nominatif</TooltipContent>
                            </Tooltip>
                        )}
                        {canAct && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" onClick={() => { reset(); setAction('setujui'); }}
                                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-8">
                                            <CheckCircle2 className="h-4 w-4" /> Setujui
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Setujui pencairan dana</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" variant="destructive" onClick={() => { reset(); setAction('reject'); }}
                                            className="gap-1.5 h-8">
                                            <XCircle className="h-4 w-4" /> Tolak
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Tolak — kembalikan ke PUMK</TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        {canUploadBuktiBayar && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => { reset(); setAction('upload_bukti_bayar'); }}
                                        className="gap-1.5 h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                        <Upload className="h-4 w-4" /> Upload Bukti Bayar
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Upload bukti bayar untuk permohonan yang telah disetujui</TooltipContent>
                            </Tooltip>
                        )}
                        {!canAct && pd.status !== 'rejected' && pd.status !== 'dicairkan' && !canUploadBuktiBayar && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                                Menunggu verifikasi
                            </span>
                        )}
                        {canBukaKunci && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => { bukaKunciForm.reset(); setShowBukaKunci(true); }}
                                        className="gap-1.5 h-8 text-orange-600 border-orange-200 hover:bg-orange-50">
                                        <Unlock className="h-4 w-4" /> Buka Kunci
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Buka kunci permohonan — kembalikan ke Revisi</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>

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
                {pd.catatan_pic && pd.status !== 'rejected' && (
                    <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 text-sm text-fuchsia-700">
                        <span className="font-semibold">Catatan PIC: </span>{pd.catatan_pic}
                    </div>
                )}

                <StepBar active={step} onChange={setStep} steps={STEPS} />

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ClipboardList className="h-4 w-4 text-blue-600" /> Informasi Kegiatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="No. Permohonan" value={pd.nomor_permohonan} mono />
                            <InfoRow label="Diajukan Oleh"  value={pd.created_by_name} />
                            <InfoRow label="Judul Pekerjaan" value={pd.judul_pekerjaan ?? pd.keperluan} />
                            <InfoRow label="Program"        value={pd.dja_program?.nama} />
                            <InfoRow label="Sasaran"        value={pd.dja_sasaran?.nama} />
                            <InfoRow label="KRO"            value={pd.dja_kro ? `${pd.dja_kro.kode} — ${pd.dja_kro.nama}` : null} />
                            <InfoRow label="RO"             value={pd.dja_ro?.nama} />
                            <InfoRow label="Komponen"       value={pd.dja_komponen?.nama} />
                            <InfoRow label="Kegiatan"       value={pd.dja_kegiatan ? `${pd.dja_kegiatan.kode} — ${pd.dja_kegiatan.nama}` : null} />
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Calendar className="h-4 w-4 text-blue-600" /> Waktu & Penanggung Jawab
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="Tanggal Pelaksanaan Awal"    value={fmtDate(pd.tanggal_mulai)} />
                            <InfoRow label="Tanggal Pelaksanaan Akhir"  value={fmtDate(pd.tanggal_selesai)} />
                            <InfoRow label="Waktu Pelaksanaan"  value={pd.jam_pelaksanaan} />
                            <InfoRow label="Tempat"
                                value={pd.tempat && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />{pd.tempat}
                                    </span>
                                )}
                            />
                            <InfoRow label="Waktu Penyelesaian Pertanggungjawaban (sesuai RPD)" value={fmtDate(pd.tgl_pertanggungjawaban)} />
                            <InfoRow label="Ketua Tim Kerja"
                                value={pd.kapokja && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />{pd.kapokja.nama_lengkap}
                                    </span>
                                )}
                            />
                            <InfoRow label="PIC Keuangan"
                                value={pd.pic_keuangan && (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />{pd.pic_keuangan.nama_lengkap}
                                    </span>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <FileText className="h-4 w-4 text-blue-600" /> Dokumen Pendukung
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pd.dokumens.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Belum ada dokumen diupload</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="text-left py-2 w-8">No</th>
                                            <th className="text-left py-2">Jenis Dokumen</th>
                                            <th className="text-left py-2">Nama File</th>
                                            <th className="text-center py-2 w-16">Lihat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pd.dokumens.map((dok, i) => (
                                            <tr key={dok.id} className="border-b last:border-0 hover:bg-gray-50/60">
                                                <td className="py-2 text-gray-400">{i + 1}</td>
                                                <td className="py-2 font-medium">{dok.nama_jenis}</td>
                                                <td className="py-2 text-gray-600 truncate max-w-xs">{dok.nama_file}</td>
                                                <td className="py-2 text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => openPreview(dok)}
                                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Lihat {dok.nama_jenis}</TooltipContent>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                )}

                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Banknote className="h-4 w-4 text-blue-600" /> Rincian Biaya
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pd.items.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Belum ada rincian biaya</p>
                            ) : (
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                <th className="px-3 py-2.5 text-left">Kode Akun</th>
                                                <th className="px-3 py-2.5 text-left">Uraian</th>
                                                <th className="px-3 py-2.5 text-right w-28">Pagu</th>
                                                <th className="px-3 py-2.5 text-right w-16">Vol</th>
                                                <th className="px-3 py-2.5 text-left w-14">Sat</th>
                                                <th className="px-3 py-2.5 text-right w-32">Harga Satuan</th>
                                                <th className="px-3 py-2.5 text-right w-28 text-orange-600">Terpakai</th>
                                                <th className="px-3 py-2.5 text-right w-32 text-blue-700">Jml Permintaan</th>
                                                <th className="px-3 py-2.5 text-right w-28 text-emerald-600">Sisa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {pd.items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/60">
                                                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.kode_akun ?? '-'}</td>
                                                    <td className="px-3 py-2.5">{item.uraian}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(item.pagu_total ?? 0)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums">{Number(item.volume)}</td>
                                                    <td className="px-3 py-2.5 text-muted-foreground">{item.satuan}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(item.harga_satuan)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-orange-600">{fmt(item.terpakai ?? 0)}</td>
                                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-blue-700">{fmt(item.total)}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">{fmt(Math.max(0, Number(item.sisa_anggaran ?? 0)))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-50 border-t font-bold">
                                                <td colSpan={7} className="px-3 py-2.5 text-right text-xs text-gray-600">Total Permintaan</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{fmt(pd.total_anggaran)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                        ← Sebelumnya
                    </Button>
                    <Button variant="outline" onClick={() => setStep(s => Math.min(4, s + 1))} disabled={step === 4}>
                        Selanjutnya →
                    </Button>
                </div>
            </div>



            <AlertDialog open={!!action} onOpenChange={o => !o && setAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {action === 'setujui' ? 'Setujui Pencairan Dana'
                                : action === 'upload_bukti_bayar' ? 'Upload Bukti Bayar'
                                : 'Tolak Permohonan'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {action === 'setujui'
                                ? `Setujui pencairan dana untuk ${pd.nomor_permohonan}?`
                                : action === 'upload_bukti_bayar'
                                ? `Upload bukti bayar untuk ${pd.nomor_permohonan}.`
                                : `Tolak ${pd.nomor_permohonan}? PUMK perlu merevisi dan mengajukan ulang.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {action === 'setujui' && (
                        <div className="px-6 pb-2 space-y-3">
                            <div>
                                <Label className="text-sm">Catatan Pencairan (opsional)</Label>
                                <Textarea
                                    rows={3}
                                    value={data.catatan}
                                    onChange={e => setData('catatan', e.target.value)}
                                    placeholder="Catatan pencairan (opsional)"
                                    className="mt-1.5"
                                />
                            </div>
                        </div>
                    )}

                    {action === 'upload_bukti_bayar' && (
                        <div className="px-6 pb-2 space-y-3">
                            <div>
                                <Label className="text-sm">
                                    Bukti Bayar <span className="text-red-500">*</span>
                                </Label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setData('bukti_bayar', e.target.files?.[0] || null)}
                                    className="mt-1.5 w-full text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG - Max 5MB</p>
                            </div>
                        </div>
                    )}

                    {action === 'reject' && (
                        <div className="px-6 pb-2 space-y-1.5">
                            <Label className="text-sm">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                rows={3}
                                value={data.catatan}
                                onChange={e => setData('catatan', e.target.value)}
                                placeholder="Alasan penolakan (wajib diisi)"
                                className="mt-1.5"
                            />
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={processing || (action === 'reject' && !data.catatan.trim()) || (action === 'upload_bukti_bayar' && !data.bukti_bayar)}
                            className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                        >
                            {processing ? 'Memproses...' : action === 'setujui' ? 'Setujui' : action === 'upload_bukti_bayar' ? 'Upload' : 'Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Hapus Bukti Bayar */}
            <AlertDialog open={showDeleteBukti} onOpenChange={setShowDeleteBukti}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Bukti Bayar</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hapus bukti bayar dan kembalikan status ke Menunggu Pencairan?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteBukti(false)}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                post(`/bendahara/permohonan-dana/${pd.id}/hapus-bukti-bayar`, {
                                    onError: (errors: Record<string, string>) => {
                                        toast.error(Object.values(errors)[0] ?? 'Terjadi kesalahan. Silakan coba lagi.');
                                    },
                                });
                                setShowDeleteBukti(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Buka Kunci */}
            <AlertDialog open={showBukaKunci} onOpenChange={setShowBukaKunci}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Buka Kunci Permohonan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan membuka kunci permohonan {pd.nomor_permohonan} dan mengembalikan status ke <strong>Revisi</strong>.
                            PUMK dapat mengedit dan mengajukan ulang.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-6 pb-2 space-y-1.5">
                        <Label className="text-sm">
                            Alasan Pembukaan Kunci <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            rows={3}
                            value={bukaKunciForm.data.alasan}
                            onChange={e => bukaKunciForm.setData('alasan', e.target.value)}
                            placeholder="Opsional: Jelaskan alasan pembukaan kunci (maks 1000 karakter)"
                            className="mt-1.5"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowBukaKunci(false)}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                bukaKunciForm.post(`/bendahara/permohonan-dana/${pd.id}/buka-kunci`, {
                                    onSuccess: () => {
                                        setShowBukaKunci(false);
                                        bukaKunciForm.reset();
                                    },
                                    onError: (errors: Record<string, string>) => {
                                        toast.error(Object.values(errors)[0] ?? 'Terjadi kesalahan. Silakan coba lagi.');
                                    },
                                });
                            }}
                            disabled={bukaKunciForm.processing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {bukaKunciForm.processing ? 'Memproses...' : 'Buka Kunci'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
