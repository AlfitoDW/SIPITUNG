import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Eye, History, Printer, CircleDot, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type Item = {
    id: number;
    kode_akun: string | null;
    uraian: string;
    volume: string;
    satuan: string;
    harga_satuan: string;
    total: string;
};

type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    judul_pekerjaan: string | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    tempat: string | null;
    total_anggaran: string;
    status: string;
    status_label: string;
    catatan_katim: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
    catatan_penolakan: string | null;
    created_at: string;
    submitted_at: string | null;
    created_by_name: string | null;
    kapokja_id: number | null;
    kapokja_name: string | null;
    tim_kerja_kode: string | null;
    tim_kerja_nama: string | null;
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
    items: Item[];
};

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; menunggu: PD[]; permohonan: PD[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const statusColor = (s: string) => {
    if (s === 'dicairkan')      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected')       return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'draft')          return 'bg-gray-100 text-gray-600 border-gray-200';
    if (s === 'submitted')      return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'katim_approved') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-sky-100 text-sky-700 border-sky-200';
};

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = { key: string; label: string; statuses: string[] | null };
const TABS: Tab[] = [
    { key: 'all',      label: 'Semua Ajuan', statuses: null },
    { key: 'draft',    label: 'Draft',        statuses: ['draft'] },
    { key: 'diajukan', label: 'Diajukan',     statuses: ['submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved'] },
    { key: 'revisi',   label: 'Revisi',       statuses: ['rejected'] },
    { key: 'selesai',  label: 'Selesai',      statuses: ['dicairkan'] },
];

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

function buildTimeline(pd: PD): TLStep[] {
    const isRej = pd.status === 'rejected';
    const rejStep = pd.rejected_at_step ?? '';
    return [
        { key: 'dibuat',    stepNo: 1, role: 'PUMK',         action: 'Permohonan Dibuat',      actorName: pd.created_by_name,        ts: pd.created_at,       catatan: null,                 state: 'done' },
        { key: 'submitted', stepNo: 2, role: 'PUMK',         action: 'Diajukan ke KA.TIM',     actorName: pd.created_by_name,        ts: pd.submitted_at,     catatan: null,                 state: pd.submitted_at ? 'done' : 'pending' },
        { key: 'katim',     stepNo: 3, role: 'KA.TIM',       action: isRej && rejStep === 'katim' ? 'Ditolak' : 'Disetujui', actorName: pd.katim_approved_by_name, ts: pd.katim_approved_at, catatan: pd.catatan_katim,  state: isRej && rejStep === 'katim' ? 'rejected' : pd.katim_approved_at ? 'done' : pd.status === 'submitted' ? 'active' : 'pending' },
        { key: 'kabag',     stepNo: 4, role: 'Kabag Umum',   action: isRej && rejStep === 'kabag' ? 'Ditolak' : 'Disetujui', actorName: pd.kabag_approved_by_name, ts: pd.kabag_approved_at, catatan: pd.catatan_kabag, state: isRej && rejStep === 'kabag' ? 'rejected' : pd.kabag_approved_at ? 'done' : pd.status === 'katim_approved' ? 'active' : 'pending' },
        { key: 'ppk',       stepNo: 5, role: 'PPK',          action: isRej && rejStep === 'ppk'   ? 'Ditolak' : 'Disetujui', actorName: pd.ppk_approved_by_name,   ts: pd.ppk_approved_at,   catatan: pd.catatan_ppk,   state: isRej && rejStep === 'ppk'   ? 'rejected' : pd.ppk_approved_at   ? 'done' : pd.status === 'kabag_approved' ? 'active' : 'pending' },
        { key: 'pic',       stepNo: 6, role: 'PIC Keuangan', action: isRej && rejStep === 'pic'   ? 'Ditolak' : 'Diverifikasi', actorName: pd.pic_approved_by_name, ts: pd.pic_approved_at,   catatan: pd.catatan_pic,   state: isRej && rejStep === 'pic'   ? 'rejected' : pd.pic_approved_at   ? 'done' : pd.status === 'ppk_approved'  ? 'active' : 'pending' },
        { key: 'cair',      stepNo: 7, role: 'Bendahara',    action: 'Dana Dicairkan',             actorName: pd.dicairkan_by_name,      ts: pd.dicairkan_at,     catatan: pd.catatan_pencairan, state: pd.dicairkan_at ? 'done' : pd.status === 'pic_approved' ? 'active' : 'pending' },
    ];
}

function VerticalTimeline({ pd, open, onClose }: { pd: PD; open: boolean; onClose: () => void }) {
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

export default function Approval({ tahun, menunggu, permohonan }: Props) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    const [activeTab,    setActiveTab]    = useState('all');
    const [search,       setSearch]       = useState('');
    const [pageSize,     setPageSize]     = useState(10);
    const [page,         setPage]         = useState(1);
    const [historyTarget, setHistoryTarget] = useState<PD | null>(null);
    const [actionTarget,  setActionTarget]  = useState<{ pd: PD; action: 'approve' | 'reject' } | null>(null);

    const { data, setData, post, processing, reset } = useForm({ catatan: '' });

    const handleConfirm = () => {
        if (!actionTarget) return;
        const url = `/ketua-tim/keuangan/permohonan-dana/${actionTarget.pd.id}/${actionTarget.action}`;
        post(url, { onSuccess: () => { reset(); setActionTarget(null); } });
    };

    const tabCount    = (tab: Tab) => tab.statuses ? permohonan.filter(pd => tab.statuses!.includes(pd.status)).length : permohonan.length;
    const handleTab   = (key: string) => { setActiveTab(key); setPage(1); };
    const handleSearch = (v: string)  => { setSearch(v); setPage(1); };

    // Filter by tab
    const tabFiltered = useMemo(() => {
        const tab = TABS.find(t => t.key === activeTab)!;
        return tab.statuses ? permohonan.filter(pd => tab.statuses!.includes(pd.status)) : permohonan;
    }, [permohonan, activeTab]);

    // Filter by search
    const searched = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tabFiltered;
        return tabFiltered.filter(pd =>
            pd.nomor_permohonan.toLowerCase().includes(q) ||
            (pd.judul_pekerjaan ?? pd.keperluan).toLowerCase().includes(q) ||
            (pd.created_by_name ?? '').toLowerCase().includes(q) ||
            (pd.kapokja_name ?? '').toLowerCase().includes(q) ||
            (pd.tim_kerja_kode ?? '').toLowerCase().includes(q),
        );
    }, [tabFiltered, search]);

    // Pagination
    const totalPages  = Math.max(1, Math.ceil(searched.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated   = searched.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from        = searched.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to          = Math.min(currentPage * pageSize, searched.length);

    const goPage      = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    return (
        <AppLayout>
            <Head title="Approval Permohonan Dana — KA.TIM" />
            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight uppercase">Approval Permohonan Dana</h1>
                        <p className="text-sm font-medium text-muted-foreground">Persetujuan Pengajuan Dana Tim</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                            KA.TIM — Step 1 Approval · {tahun?.label}
                        </p>
                    </div>
                    {/* Badge ringkasan menunggu */}
                    {menunggu.length > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-sm font-medium text-amber-700">
                                {menunggu.length} menunggu persetujuan
                            </span>
                        </div>
                    )}
                </div>

                <Card>
                    {/* Tab Bar */}
                    <CardHeader className="pb-0 pt-4 px-4">
                        <div className="flex gap-1 border-b">
                            {TABS.map(tab => {
                                const count = tabCount(tab);
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTab(tab.key)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                                            activeTab === tab.key
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-muted-foreground hover:text-gray-700',
                                        )}
                                    >
                                        {tab.label}
                                        <span className={cn(
                                            'text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center',
                                            activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4 px-4 space-y-3">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Show</span>
                                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
                                    <SelectTrigger className="h-8 w-16 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map(n => (
                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span>entries</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Search:</span>
                                <Input
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Nomor / judul / nama PUMK / kapokja / tim..."
                                    className="h-8 w-72 text-xs"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        <th className="px-3 py-3 text-center w-10">#</th>
                                        <th className="px-3 py-3 text-left">Nomor Permohonan</th>
                                        <th className="px-3 py-3 text-left">Judul Kegiatan</th>
                                        <th className="px-3 py-3 text-left w-28">Tim</th>
                                        <th className="px-3 py-3 text-left w-28">Kapokja</th>
                                        <th className="px-3 py-3 text-center w-36">Tanggal Pengajuan</th>
                                        <th className="px-3 py-3 text-right w-36">Total Anggaran</th>
                                        <th className="px-3 py-3 text-center w-32">Status</th>
                                        <th className="px-3 py-3 text-center w-36">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-3 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <FileText className="h-8 w-8 opacity-30" />
                                                    <span className="text-sm">Tidak ada data</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((pd, i) => {
                                            const isKapokja = pd.kapokja_id === currentUserId;
                                            const canApprove = isKapokja && pd.status === 'submitted';
                                            const canView = ['draft', 'rejected', 'submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved', 'dicairkan'].includes(pd.status);
                                            return (
                                                <>
                                                    <tr
                                                        key={pd.id}
                                                        className={cn(
                                                            'hover:bg-gray-50/60 transition-colors',
                                                            canApprove && 'bg-amber-50/40',
                                                        )}
                                                    >
                                                        <td className="px-3 py-3 text-center text-muted-foreground tabular-nums text-xs">
                                                            {from + i}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <span className="font-mono text-xs text-blue-700 font-semibold">
                                                                {pd.nomor_permohonan}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 max-w-xs">
                                                            <p className="font-medium truncate">{pd.judul_pekerjaan ?? pd.keperluan}</p>
                                                            {pd.catatan_penolakan && (
                                                                <p className="text-xs text-red-500 mt-0.5 truncate">↳ {pd.catatan_penolakan}</p>
                                                            )}
                                                            {pd.catatan_katim && pd.status !== 'submitted' && (
                                                                <p className="text-xs text-blue-500 mt-0.5 truncate">✓ {pd.catatan_katim}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-xs">
                                                            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                                                {pd.tim_kerja_kode ?? '-'}
                                                            </span>
                                                            {pd.tim_kerja_nama && (
                                                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[100px]">{pd.tim_kerja_nama}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-xs text-muted-foreground">
                                                            {pd.kapokja_name ?? '-'}
                                                            {isKapokja && (
                                                                <span className="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 rounded">Saya</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                            {fmtDate(pd.submitted_at)}
                                                        </td>
                                                        <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap">
                                                            {fmt(pd.total_anggaran)}
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={cn(
                                                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                                                statusColor(pd.status),
                                                            )}>
                                                                {pd.status_label}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {/* Riwayat */}
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon"
                                                                            className="h-7 w-7 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                                                                            onClick={() => setHistoryTarget(pd)}>
                                                                            <History className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Riwayat Ajuan</TooltipContent>
                                                                </Tooltip>
                                                                {/* Cetak — hanya non-draft/rejected */}
                                                                {!['draft','rejected'].includes(pd.status) && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Link href={`/ketua-tim/keuangan/permohonan-dana/${pd.id}/print`} target="_blank">
                                                                                <Button variant="ghost" size="icon"
                                                                                    className="h-7 w-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50">
                                                                                    <Printer className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Cetak</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                                {/* Setujui / Tolak — langsung dari list */}
                                                                {canApprove && (
                                                                    <>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="icon"
                                                                                    className="h-7 w-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                                                    onClick={() => { reset(); setActionTarget({ pd, action: 'approve' }); }}>
                                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Setujui</TooltipContent>
                                                                        </Tooltip>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="icon"
                                                                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                    onClick={() => { reset(); setActionTarget({ pd, action: 'reject' }); }}>
                                                                                    <XCircle className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Tolak</TooltipContent>
                                                                        </Tooltip>
                                                                    </>
                                                                )}
                                                                {/* Lihat Detail — selalu tampil */}
                                                                {canView && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Link href={`/ketua-tim/keuangan/permohonan-dana/${pd.id}`}>
                                                                                <Button variant="ghost" size="icon"
                                                                                    className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Lihat Detail</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer: info + pagination */}
                        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground pt-1">
                            <span>Showing {from} to {to} of {searched.length} entries</span>
                            <div className="flex items-center gap-1">
                                {[
                                    { label: 'First',    page: 1 },
                                    { label: 'Previous', page: currentPage - 1 },
                                ].map(btn => (
                                    <button
                                        key={btn.label}
                                        onClick={() => goPage(btn.page)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                    >
                                        {btn.label}
                                    </button>
                                ))}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) =>
                                        p === '...' ? (
                                            <span key={`e${idx}`} className="px-2 text-xs">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => goPage(p as number)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded border text-xs font-medium transition-colors',
                                                    currentPage === p
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'hover:bg-gray-100',
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ),
                                    )}

                                {[
                                    { label: 'Next', page: currentPage + 1 },
                                    { label: 'Last', page: totalPages },
                                ].map(btn => (
                                    <button
                                        key={btn.label}
                                        onClick={() => goPage(btn.page)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {historyTarget && (
                <VerticalTimeline pd={historyTarget} open={!!historyTarget} onClose={() => setHistoryTarget(null)} />
            )}

            {/* Approve / Reject Dialog */}
            <AlertDialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionTarget?.action === 'approve' ? 'Setujui Permohonan' : 'Tolak Permohonan'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionTarget?.action === 'approve'
                                ? `Setujui ${actionTarget?.pd.nomor_permohonan} dan teruskan ke Kabag Umum?`
                                : `Tolak ${actionTarget?.pd.nomor_permohonan}? PUMK perlu merevisi dan mengajukan ulang.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-6 pb-2 space-y-1.5">
                        <Label className="text-sm">
                            Catatan {actionTarget?.action === 'reject' && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                            rows={3}
                            value={data.catatan}
                            onChange={e => setData('catatan', e.target.value)}
                            placeholder={actionTarget?.action === 'approve' ? 'Catatan persetujuan (opsional)' : 'Alasan penolakan (wajib diisi)'}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={processing || (actionTarget?.action === 'reject' && !data.catatan.trim())}
                            className={actionTarget?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {processing ? 'Memproses...' : actionTarget?.action === 'approve' ? 'Setujui' : 'Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
