import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle2, XCircle, FileText, Calendar,
    User, MapPin, ClipboardList, Banknote, Eye,
    Printer, History, CircleDot, Clock,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
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
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
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
    }[];
    dokumens: {
        id: number; nama_jenis: string; nama_file: string; path_file: string;
    }[];
}

interface Props { pd: Pd; role: 'kabag_umum' | 'ppk'; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));

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

// ── Step Bar ──────────────────────────────────────────────────────────────────

function StepBar({ active, onChange }: { active: number; onChange: (s: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-6">
            {STEPS.map((label, i) => {
                const step = i + 1;
                const isActive = active === step;
                const isDone = active > step;
                return (
                    <div key={step} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => onChange(step)}
                            className={cn(
                                'flex flex-col items-center gap-1 min-w-[80px] group cursor-pointer',
                            )}
                        >
                            <div className={cn(
                                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                                isDone  && 'bg-emerald-500 border-emerald-500 text-white',
                                isActive && 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md',
                                !isDone && !isActive && 'bg-white border-gray-300 text-gray-400 hover:border-blue-300 hover:scale-105',
                            )}>
                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : step}
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium text-center leading-tight transition-colors',
                                isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-gray-400',
                            )}>{label}</span>
                        </button>
                        {i < STEPS.length - 1 && (
                            <div className={cn(
                                'h-0.5 w-12 mx-1 mb-4 transition-colors',
                                active > i + 1 ? 'bg-emerald-400' : 'bg-gray-200',
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
    return (
        <div className="grid grid-cols-5 gap-2 py-2.5 border-b border-gray-100 last:border-0">
            <span className="col-span-2 text-sm text-gray-500 font-medium">{label}</span>
            <span className={cn('col-span-3 text-sm text-gray-800', mono && 'font-mono')}>{value || '-'}</span>
        </div>
    );
}

// ── DocPreviewModal ───────────────────────────────────────────────────────────

function getFileType(path: string): 'pdf' | 'image' | 'other' {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
}

function DocPreviewModal({ url, nama, onClose }: { url: string; nama: string; onClose: () => void }) {
    const type = getFileType(url);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{ width: '90vw', maxWidth: 960, height: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 truncate">{nama}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2">
                            Buka di tab baru
                        </a>
                        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 transition-colors">
                            <XCircle className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    {type === 'pdf' && <iframe src={url} className="w-full h-full border-0" title={nama} />}
                    {type === 'image' && (
                        <div className="flex items-center justify-center h-full bg-gray-100 overflow-auto p-4">
                            <img src={url} alt={nama} className="max-w-full max-h-full object-contain rounded shadow" />
                        </div>
                    )}
                    {type === 'other' && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                            <FileText className="w-16 h-16 text-gray-300" />
                            <p className="text-sm">Pratinjau tidak tersedia.</p>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                                Download / Buka file
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── VerticalTimeline ─────────────────────────────────────────────────────────

const fmtDateTime = (s: string | null) => {
    if (!s) return null;
    const d = new Date(s);
    return {
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
};

type TLState = 'done' | 'rejected' | 'active' | 'pending';
type TLStep = { key: string; stepNo: number; role: string; action: string; actorName: string | null; ts: string | null; catatan: string | null; state: TLState; };

function buildTimeline(pd: Pd): TLStep[] {
    const isRej = pd.status === 'rejected';
    const rejStep = pd.rejected_at_step ?? '';
    return [
        { key: 'dibuat',    stepNo: 1, role: 'PUMK',         action: 'Permohonan Dibuat',    actorName: pd.created_by_name, ts: pd.created_at,       catatan: null,              state: 'done' },
        { key: 'submitted', stepNo: 2, role: 'PUMK',         action: 'Diajukan ke KA.TIM',   actorName: pd.created_by_name, ts: pd.submitted_at,     catatan: null,              state: pd.submitted_at ? 'done' : 'pending' },
        { key: 'katim',     stepNo: 3, role: 'KA.TIM',       action: isRej && rejStep === 'katim' ? 'Ditolak' : 'Disetujui', actorName: pd.katim_approved_by_name, ts: pd.katim_approved_at, catatan: pd.catatan_katim,  state: isRej && rejStep === 'katim' ? 'rejected' : pd.katim_approved_at ? 'done' : pd.status === 'submitted' ? 'active' : 'pending' },
        { key: 'kabag',     stepNo: 4, role: 'Kabag Umum',   action: isRej && rejStep === 'kabag' ? 'Ditolak' : 'Disetujui', actorName: pd.kabag_approved_by_name, ts: pd.kabag_approved_at, catatan: pd.catatan_kabag, state: isRej && rejStep === 'kabag' ? 'rejected' : pd.kabag_approved_at ? 'done' : pd.status === 'katim_approved' ? 'active' : 'pending' },
        { key: 'ppk',       stepNo: 5, role: 'PPK',          action: isRej && rejStep === 'ppk'   ? 'Ditolak' : 'Disetujui', actorName: pd.ppk_approved_by_name,   ts: pd.ppk_approved_at,   catatan: pd.catatan_ppk,   state: isRej && rejStep === 'ppk'   ? 'rejected' : pd.ppk_approved_at   ? 'done' : pd.status === 'kabag_approved' ? 'active' : 'pending' },
        { key: 'pic',       stepNo: 6, role: 'PIC Keuangan', action: isRej && rejStep === 'pic'   ? 'Ditolak' : 'Diverifikasi', actorName: pd.pic_approved_by_name, ts: pd.pic_approved_at,   catatan: pd.catatan_pic,   state: isRej && rejStep === 'pic'   ? 'rejected' : pd.pic_approved_at   ? 'done' : pd.status === 'ppk_approved'  ? 'active' : 'pending' },
        { key: 'cair',      stepNo: 7, role: 'Bendahara',    action: 'Dana Dicairkan',           actorName: pd.dicairkan_by_name,      ts: pd.dicairkan_at,     catatan: pd.catatan_pencairan, state: pd.dicairkan_at ? 'done' : pd.status === 'pic_approved' ? 'active' : 'pending' },
    ];
}

function VerticalTimeline({ pd, open, onClose }: { pd: Pd; open: boolean; onClose: () => void }) {
    const steps = buildTimeline(pd);
    const doneCount = steps.filter(s => s.state === 'done').length;
    const pct = Math.round((doneCount / steps.length) * 100);

    const stateStyles = {
        done:     { border: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-600' },
        rejected: { border: 'border-l-red-500',     icon: XCircle,      iconColor: 'text-red-600' },
        active:   { border: 'border-l-blue-500',    icon: CircleDot,    iconColor: 'text-blue-600' },
        pending:  { border: 'border-l-gray-200',    icon: Clock,        iconColor: 'text-gray-400' },
    } as const;

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-2xl p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-base font-semibold">{pd.nomor_permohonan}</DialogTitle>
                            <DialogDescription className="text-sm">{pd.judul_pekerjaan ?? pd.keperluan}</DialogDescription>
                        </div>
                        <Badge variant={pd.status === 'rejected' ? 'destructive' : pd.status === 'dicairkan' ? 'default' : 'secondary'}>
                            {pd.status_label}
                        </Badge>
                    </div>
                    <div className="pt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Progress</span>
                            <span>{doneCount} dari {steps.length} langkah</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    <div className="relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
                        
                        <ol className="space-y-4">
                            {steps.map((step, idx) => {
                                const style = stateStyles[step.state];
                                const Icon = style.icon;
                                const dt = fmtDateTime(step.ts);
                                const isLeft = idx % 2 === 0;
                                
                                return (
                                    <li key={step.key} className="relative flex items-center">
                                        <div className={cn('flex-1 pr-6', isLeft ? 'text-right' : 'opacity-0 pointer-events-none')}>
                                            {isLeft && (
                                                <div className={cn('inline-block border rounded-lg p-3 bg-card text-left border-l-4', style.border)}>
                                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase">{step.role}</span>
                                                        <Icon className={cn('h-4 w-4', style.iconColor)} />
                                                    </div>
                                                    <p className="text-sm font-medium">{step.action}</p>
                                                    {step.actorName && <p className="text-xs text-muted-foreground mt-0.5">{step.actorName}</p>}
                                                    {dt && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {dt.date} · {dt.time}
                                                        </p>
                                                    )}
                                                    {step.catatan && (
                                                        <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                                                            {step.catatan}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative z-10 flex-shrink-0 w-2.5 h-2.5 rounded-full bg-background border-2 border-current"
                                            style={{ color: step.state === 'done' ? '#10b981' : step.state === 'rejected' ? '#ef4444' : step.state === 'active' ? '#3b82f6' : '#e5e7eb' }}
                                        />

                                        <div className={cn('flex-1 pl-6', !isLeft ? 'text-left' : 'opacity-0 pointer-events-none')}>
                                            {!isLeft && (
                                                <div className={cn('inline-block border rounded-lg p-3 bg-card text-left border-l-4', style.border)}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon className={cn('h-4 w-4', style.iconColor)} />
                                                        <span className="text-xs font-medium text-muted-foreground uppercase">{step.role}</span>
                                                    </div>
                                                    <p className="text-sm font-medium">{step.action}</p>
                                                    {step.actorName && <p className="text-xs text-muted-foreground mt-0.5">{step.actorName}</p>}
                                                    {dt && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {dt.date} · {dt.time}
                                                        </p>
                                                    )}
                                                    {step.catatan && (
                                                        <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                                                            {step.catatan}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ActionType = 'approve' | 'reject' | null;

export default function Detail({ pd, role }: Props) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    const [step, setStep]             = useState(1);
    const [previewDok, setPreviewDok] = useState<{ url: string; nama: string } | null>(null);
    const [action, setAction]         = useState<ActionType>(null);
    const [showHistory, setShowHistory] = useState(false);

    const canPrint = !['draft', 'rejected'].includes(pd.status);

    const { data, setData, post, processing, reset } = useForm({ catatan: '' });

    const isKabag = role === 'kabag_umum';
    const canApprove = isKabag
        ? pd.status === 'katim_approved'
        : pd.status === 'kabag_approved';
    const nextLabel = isKabag ? 'PPK' : 'PIC Keuangan';
    const { cls: statusCls, dot: statusDot } = statusMeta(pd.status);

    const openPreview = (dok: Pd['dokumens'][number]) => {
        const url = `/files/dokumen/${dok.id}`;
        const type = getFileType(dok.path_file);
        if (type === 'other') window.open(url, '_blank', 'noopener,noreferrer');
        else setPreviewDok({ url, nama: dok.nama_file });
    };

    const handleConfirm = () => {
        if (!action) return;
        const url = `/pimpinan/keuangan/permohonan-dana/${pd.id}/${action}`;
        post(url, { onSuccess: () => { reset(); setAction(null); } });
    };

    return (
        <AppLayout>
            <Head title={`Detail — ${pd.nomor_permohonan}`} />

            {previewDok && (
                <DocPreviewModal url={previewDok.url} nama={previewDok.nama} onClose={() => setPreviewDok(null)} />
            )}

            <div className="max-w-4xl mx-auto py-8 px-4 space-y-5">

                {/* Back + header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link href="/pimpinan/keuangan/permohonan-dana">
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
                        {/* Riwayat — selalu tampil */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setShowHistory(true)} className="gap-1.5 h-8 text-violet-600 border-violet-200 hover:bg-violet-50">
                                    <History className="h-4 w-4" /> Riwayat
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Riwayat proses ajuan</TooltipContent>
                        </Tooltip>
                        {/* Pimpinan tidak bisa cetak — tombol sengaja dihilangkan */}
                        {/* Approve / Reject — hanya jika status sesuai peran */}
                        {canApprove && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="sm" onClick={() => { reset(); setAction('approve'); }}
                                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 h-8">
                                            <CheckCircle2 className="h-4 w-4" /> Setujui
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Setujui dan teruskan ke {nextLabel}</TooltipContent>
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
                        {/* Info jika sedang menunggu approval orang lain */}
                        {!canApprove && pd.status !== 'rejected' && pd.status !== 'dicairkan' && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                                Menunggu persetujuan {isKabag ? 'Kabag Umum' : 'PPK'}
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
                <StepBar active={step} onChange={setStep} />

                {/* ── Step 1: Informasi Kegiatan ── */}
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

                {/* ── Step 2: Waktu & PJ ── */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Calendar className="h-4 w-4 text-blue-600" /> Waktu & Penanggung Jawab
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            <InfoRow label="Tanggal Mulai"    value={fmtDate(pd.tanggal_mulai)} />
                            <InfoRow label="Tanggal Selesai"  value={fmtDate(pd.tanggal_selesai)} />
                            <InfoRow label="Jam Pelaksanaan"  value={pd.jam_pelaksanaan} />
                            <InfoRow label="Tempat"
                                value={pd.tempat && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />{pd.tempat}
                                    </span>
                                )}
                            />
                            <InfoRow label="Tgl. Pertanggungjawaban" value={fmtDate(pd.tgl_pertanggungjawaban)} />
                            <InfoRow label="Kapokja Kegiatan"
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

                {/* ── Step 3: Dokumen ── */}
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

                {/* ── Step 4: Rincian Biaya ── */}
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
                                                <th className="px-3 py-2.5 text-right w-16">Vol</th>
                                                <th className="px-3 py-2.5 text-left w-14">Sat</th>
                                                <th className="px-3 py-2.5 text-right w-32">Harga Satuan</th>
                                                <th className="px-3 py-2.5 text-right w-32 text-blue-700">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {pd.items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/60">
                                                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.kode_akun ?? '-'}</td>
                                                    <td className="px-3 py-2.5">{item.uraian}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums">{Number(item.volume)}</td>
                                                    <td className="px-3 py-2.5 text-muted-foreground">{item.satuan}</td>
                                                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(item.harga_satuan)}</td>
                                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-blue-700">{fmt(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-50 border-t font-bold">
                                                <td colSpan={5} className="px-3 py-2.5 text-right text-xs text-gray-600">Total Permintaan</td>
                                                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{fmt(pd.total_anggaran)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
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
            </div>

            {/* Riwayat Timeline */}
            {showHistory && <VerticalTimeline pd={pd} open={showHistory} onClose={() => setShowHistory(false)} />}

            {/* Approve / Reject Dialog */}
            <AlertDialog open={!!action} onOpenChange={o => !o && setAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {action === 'approve' ? 'Setujui Permohonan' : 'Tolak Permohonan'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {action === 'approve'
                                ? `Setujui ${pd.nomor_permohonan} dan teruskan ke ${nextLabel}?`
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
                            placeholder={action === 'approve' ? 'Catatan persetujuan (opsional)' : 'Alasan penolakan (wajib diisi)'}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={processing || (action === 'reject' && !data.catatan.trim())}
                            className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {processing ? 'Memproses...' : action === 'approve' ? 'Setujui' : 'Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
