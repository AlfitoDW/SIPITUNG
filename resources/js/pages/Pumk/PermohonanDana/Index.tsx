import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Eye, ClipboardList, Printer, History, CheckCircle2, XCircle, Clock, CircleDot, FileCheck, Zap } from 'lucide-react';
import { useState, useMemo } from 'react';
import { SkeletonPageHeader, SkeletonTable } from '@/components/skeletons';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    judul_pekerjaan: string | null;
    created_at: string;
    submitted_at: string | null;
    tanggal_mulai: string | null;
    total_anggaran: string;
    status: string;
    status_label: string;
    catatan_penolakan: string | null;
    kapokja: { id: number; nama_lengkap: string } | null;
    items: Array<{ id: number; kode_akun: string | null; tipe_nominatif: string }>;
    // approval actors & timestamps
    katim_approved_by: number | null;
    katim_approved_at: string | null;
    kabag_approved_by: number | null;
    kabag_approved_at: string | null;
    ppk_approved_by: number | null;
    ppk_approved_at: string | null;
    pic_approved_by: number | null;
    pic_approved_at: string | null;
    dicairkan_by: number | null;
    dicairkan_at: string | null;
    rejected_at: string | null;
    rejected_at_step: string | null;
    catatan_katim: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
    // actor names
    created_by_name: string | null;
    katim_approved_by_name: string | null;
    kabag_approved_by_name: string | null;
    ppk_approved_by_name: string | null;
    pic_approved_by_name: string | null;
    dicairkan_by_name: string | null;
    // bukti bayar
    bukti_bayar_path: string | null;
    bukti_bayar_uploaded_at: string | null;
    // next approver
    next_approver_role: string | null;
    next_approver_name: string | null;
};

const NOMINATIF_AKUN = ['521115', '521213', '522151', '524111', '524119', '524113', '524114'];
const hasNominatifItems = (pd: PD) =>
    pd.items.some(i => i.kode_akun && NOMINATIF_AKUN.includes(i.kode_akun));
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; permohonan: PD[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const nextApprover = (status: string): string => {
    switch (status) {
        case 'submitted':      return 'KA.TIM';
        case 'katim_approved': return 'PIC Keuangan';
        case 'pic_approved':   return 'PPK';
        case 'ppk_approved':   return 'Bendahara';
        default:               return '-';
    }
};

const needsApproval = (status: string) =>
    ['submitted', 'katim_approved', 'pic_approved', 'ppk_approved'].includes(status);

const statusColor = (s: string) => {
    if (s === 'dicairkan') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected')  return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'draft')     return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
};

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = { key: string; label: string; statuses: string[] | null };
const TABS: Tab[] = [
    { key: 'all',      label: 'Semua Ajuan', statuses: null },
    { key: 'draft',    label: 'Draft',        statuses: ['draft'] },
    { key: 'diajukan', label: 'Diajukan',     statuses: ['submitted', 'katim_approved', 'pic_approved', 'ppk_approved'] },
    { key: 'revisi',   label: 'Revisi',       statuses: ['rejected'] },
    { key: 'selesai',  label: 'Selesai',      statuses: ['dicairkan'] },
];

// ── Vertical Timeline ─────────────────────────────────────────────────────────

const fmtDateTime = (s: string | null): { date: string; time: string } | null => {
    if (!s) return null;
    const d = new Date(s);
    return {
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
};

type TimelineStep = {
    key: string;
    stepNo: number;
    role: string;       // jabatan singkat, e.g. "KA.TIM"
    action: string;     // aksi label, e.g. "Disetujui"
    actorName: string | null;
    ts: string | null;
    catatan: string | null;
    state: 'done' | 'rejected' | 'active' | 'pending';
};

const buildTimeline = (pd: PD): TimelineStep[] => {
    const isRejected = pd.status === 'rejected';
    const rejStep    = pd.rejected_at_step ?? '';

    const steps: TimelineStep[] = [
        {
            key: 'dibuat', stepNo: 1,
            role: 'PUMK',
            action: 'Permohonan Dibuat',
            actorName: pd.created_by_name ?? null,
            ts: pd.created_at,
            catatan: null,
            state: 'done',
        },
        {
            key: 'submitted', stepNo: 2,
            role: 'PUMK',
            action: 'Diajukan ke KA.TIM',
            actorName: pd.created_by_name ?? null,
            ts: pd.submitted_at,
            catatan: null,
            state: pd.submitted_at ? 'done' : pd.status === 'submitted' ? 'active' : 'pending',
        },
        {
            key: 'katim', stepNo: 3,
            role: 'KA.TIM',
            action: isRejected && rejStep === 'katim' ? 'Revisi' : 'Disetujui',
            actorName: pd.katim_approved_by_name ?? null,
            ts: pd.katim_approved_at,
            catatan: pd.catatan_katim,
            state: isRejected && rejStep === 'katim' ? 'rejected'
                 : pd.katim_approved_at ? 'done'
                 : pd.status === 'submitted' ? 'active' : 'pending',
        },
        {
            key: 'pic', stepNo: 4,
            role: 'PIC Keuangan',
            action: isRejected && rejStep === 'pic' ? 'Revisi' : 'Diverifikasi',
            actorName: pd.pic_approved_by_name ?? null,
            ts: pd.pic_approved_at,
            catatan: pd.catatan_pic,
            state: isRejected && rejStep === 'pic' ? 'rejected'
                 : pd.pic_approved_at ? 'done'
                 : pd.status === 'katim_approved' ? 'active' : 'pending',
        },
        {
            key: 'ppk', stepNo: 5,
            role: 'PPK',
            action: isRejected && rejStep === 'ppk' ? 'Revisi' : 'Disetujui',
            actorName: pd.ppk_approved_by_name ?? null,
            ts: pd.ppk_approved_at,
            catatan: pd.catatan_ppk,
            state: isRejected && rejStep === 'ppk' ? 'rejected'
                 : pd.ppk_approved_at ? 'done'
                 : pd.status === 'pic_approved' ? 'active' : 'pending',
        },
        {
            key: 'dicairkan', stepNo: 6,
            role: 'Bendahara',
            action: 'Dana Dicairkan',
            actorName: pd.dicairkan_by_name ?? null,
            ts: pd.dicairkan_at,
            catatan: pd.catatan_pencairan,
            state: pd.dicairkan_at ? 'done'
                 : pd.status === 'ppk_approved' ? 'active' : 'pending',
        },
    ];
    return steps;
};

// ── Main ─────────────────────────────────────────────────

function VerticalTimeline({ pd, open, onClose }: { pd: PD; open: boolean; onClose: () => void }) {
    const steps  = buildTimeline(pd);
    const doneCount = steps.filter(s => s.state === 'done').length;
    const pct       = Math.round((doneCount / steps.length) * 100);

    const stateStyles = {
        done:     { border: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-600' },
        rejected: { border: 'border-l-red-500',     icon: XCircle,      iconColor: 'text-red-600' },
        active:   { border: 'border-l-blue-500',    icon: CircleDot,    iconColor: 'text-blue-600' },
        pending:  { border: 'border-l-gray-200',    icon: Clock,        iconColor: 'text-gray-400' },
    } as const;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PermohonanDanaIndex({ tahun, permohonan }: Props) {
    const [activeTab,    setActiveTab]    = useState('all');
    const [search,       setSearch]       = useState('');
    const [pageSize,     setPageSize]     = useState(10);
    const [page,         setPage]         = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<PD | null>(null);
    const [historyTarget, setHistoryTarget] = useState<PD | null>(null);
    const [fastTrackTarget, setFastTrackTarget] = useState<PD | null>(null);

    const deleteForm = useForm({});
    const fastTrackForm = useForm({});

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteForm.delete(`/pumk/permohonan-dana/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const handleFastTrack = () => {
        if (!fastTrackTarget) return;
        fastTrackForm.post(`/pumk/permohonan-dana/${fastTrackTarget.id}/fast-track`, {
            onSuccess: () => setFastTrackTarget(null),
        });
    };

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
            (pd.judul_pekerjaan ?? pd.keperluan).toLowerCase().includes(q),
        );
    }, [tabFiltered, search]);

    // Pagination
    const totalPages  = Math.max(1, Math.ceil(searched.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated   = searched.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from        = searched.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to          = Math.min(currentPage * pageSize, searched.length);

    const goPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    // Reset page on filter change
    const handleTab = (key: string) => { setActiveTab(key); setPage(1); };
    const handleSearch = (v: string) => { setSearch(v); setPage(1); };

    const tabCount = (tab: Tab) =>
        tab.statuses ? permohonan.filter(pd => tab.statuses!.includes(pd.status)).length : permohonan.length;
    const isLoading = useNavigationLoading();

    return (
        <AppLayout>
            <Head title="Daftar Permohonan Dana" />
            {isLoading ? (
                <div className="p-4"><SkeletonPageHeader /><SkeletonTable rows={5} /></div>
            ) : (
            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Daftar Permohonan Dana</h1>
                        <p className="text-sm text-muted-foreground">Ajuan Dana yang Sudah Tersimpan</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                            Pengajuan permohonan dana dilakukan oleh kapokja bagian · {tahun?.label}
                        </p>
                    </div>
                    <Link href="/pumk/permohonan-dana/buat">
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Buat Permohonan
                        </Button>
                    </Link>
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
                        {/* Toolbar: Show entries + Search */}
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
                                    placeholder="Nomor / judul kegiatan..."
                                    className="h-8 w-56 text-xs"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-3 py-3 text-center w-10">#</th>
                                        <th className="px-3 py-3 text-left">Nomor Permohonan</th>
                                        <th className="px-3 py-3 text-left">Judul Kegiatan</th>
                                        <th className="px-3 py-3 text-center w-36">Tanggal Pengajuan</th>
                                        <th className="px-3 py-3 text-center w-40">Status Permohonan</th>
                                        <th className="px-3 py-3 text-center w-24">Perlu Approval</th>
                                        <th className="px-3 py-3 text-center w-28">Oleh</th>
                                        <th className="px-3 py-3 text-center w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                                                Tidak ada data
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((pd, i) => {
                                            const canEdit  = pd.status === 'draft' || pd.status === 'rejected';
                                            const canPrint = !['draft', 'rejected'].includes(pd.status);
                                            return (
                                                <tr key={pd.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-3 py-3 text-center text-muted-foreground tabular-nums text-xs">
                                                        {from + i}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className="font-mono text-xs text-blue-700 font-semibold">{pd.nomor_permohonan}</span>
                                                    </td>
                                                    <td className="px-3 py-3 max-w-xs">
                                                        <p className="font-medium truncate">{pd.judul_pekerjaan ?? pd.keperluan}</p>
                                                        {pd.status === 'rejected' && pd.catatan_penolakan && (
                                                            <p className="text-xs text-red-500 mt-0.5 truncate">↳ {pd.catatan_penolakan}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(pd.submitted_at)}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <span className={cn(
                                                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                                            statusColor(pd.status),
                                                        )}>
                                                            {pd.status_label}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {pd.next_approver_role ? (
                                                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                                                                {pd.next_approver_role}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                        {pd.next_approver_name ?? '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {canEdit ? (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={`/pumk/permohonan-dana/${pd.id}/wizard`}>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Edit permohonan</TooltipContent>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={`/pumk/permohonan-dana/${pd.id}/wizard`}>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                                <Eye className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Lihat detail</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {canEdit && hasNominatifItems(pd) && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={`/pumk/permohonan-dana/${pd.id}/nominatif`}>
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                                                                                <ClipboardList className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Input daftar nominatif</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {canPrint && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={`/pumk/permohonan-dana/${pd.id}/print`} target="_blank">
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                                                <Printer className="h-3.5 w-3.5" />
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
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                                                <FileCheck className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </a>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Lihat Bukti Bayar</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {/* Riwayat Ajuan — selalu tampil */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost" size="icon"
                                                                        className="h-7 w-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                                                        onClick={() => setHistoryTarget(pd)}
                                                                    >
                                                                        <History className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Riwayat proses ajuan</TooltipContent>
                                                            </Tooltip>
                                                            {pd.status === 'submitted' && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost" size="icon"
                                                                            className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                            onClick={() => setFastTrackTarget(pd)}
                                                                        >
                                                                            <Zap className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Fast-track ke PIC Keuangan</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {canEdit && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost" size="icon"
                                                                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                            onClick={() => setDeleteTarget(pd)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Hapus permohonan</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer: info + pagination */}
                        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground pt-1">
                            <span>
                                Showing {from} to {to} of {searched.length} entries
                            </span>
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

                                {/* Page numbers (max 5 shown) */}
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
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Permohonan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hapus permohonan <strong>{deleteTarget?.nomor_permohonan}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Fast Track Dialog */}
            <AlertDialog open={!!fastTrackTarget} onOpenChange={(o) => !o && setFastTrackTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fast-Track Approval</AlertDialogTitle>
                        <AlertDialogDescription>
                            Setujui permohonan <strong>{fastTrackTarget?.nomor_permohonan}</strong> langsung sampai PIC Keuangan?
                            <br /><br />
                            Ini akan melewati approval KA.TIM, Kabag Umum, PPK, dan PIC secara otomatis.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFastTrack} className="bg-amber-600 hover:bg-amber-700">
                            <Zap className="h-4 w-4 mr-1" />
                            Fast-Track
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Riwayat Ajuan — Vertical Timeline */}
            {historyTarget && (
                <VerticalTimeline
                    pd={historyTarget}
                    open={!!historyTarget}
                    onClose={() => setHistoryTarget(null)}
                />
            )}
        </AppLayout>
    );
}
