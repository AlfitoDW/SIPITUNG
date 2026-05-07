import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Eye, ClipboardList, Printer, History, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
};

const NOMINATIF_AKUN = ['521115', '521213', '522151', '524111', '524119', '524113'];
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
        case 'katim_approved': return 'Kabag Umum';
        case 'kabag_approved': return 'PPK';
        case 'ppk_approved':   return 'PIC Keuangan';
        case 'pic_approved':   return 'Bendahara';
        default:               return '-';
    }
};

const needsApproval = (status: string) =>
    ['submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved'].includes(status);

const statusColor = (s: string) => {
    if (s === 'dicairkan') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected')  return 'bg-red-100 text-red-700 border-red-200';
    if (s === 'draft')     return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
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
            action: isRejected && rejStep === 'katim' ? 'Ditolak' : 'Disetujui',
            actorName: pd.katim_approved_by_name ?? null,
            ts: pd.katim_approved_at,
            catatan: pd.catatan_katim,
            state: isRejected && rejStep === 'katim' ? 'rejected'
                 : pd.katim_approved_at ? 'done'
                 : pd.status === 'katim_approved' ? 'active' : 'pending',
        },
        {
            key: 'kabag', stepNo: 4,
            role: 'Kabag Umum',
            action: isRejected && rejStep === 'kabag' ? 'Ditolak' : 'Disetujui',
            actorName: pd.kabag_approved_by_name ?? null,
            ts: pd.kabag_approved_at,
            catatan: pd.catatan_kabag,
            state: isRejected && rejStep === 'kabag' ? 'rejected'
                 : pd.kabag_approved_at ? 'done'
                 : pd.status === 'kabag_approved' ? 'active' : 'pending',
        },
        {
            key: 'ppk', stepNo: 5,
            role: 'PPK',
            action: isRejected && rejStep === 'ppk' ? 'Ditolak' : 'Disetujui',
            actorName: pd.ppk_approved_by_name ?? null,
            ts: pd.ppk_approved_at,
            catatan: pd.catatan_ppk,
            state: isRejected && rejStep === 'ppk' ? 'rejected'
                 : pd.ppk_approved_at ? 'done'
                 : pd.status === 'ppk_approved' ? 'active' : 'pending',
        },
        {
            key: 'pic', stepNo: 6,
            role: 'PIC Keuangan',
            action: isRejected && rejStep === 'pic' ? 'Ditolak' : 'Diverifikasi',
            actorName: pd.pic_approved_by_name ?? null,
            ts: pd.pic_approved_at,
            catatan: pd.catatan_pic,
            state: isRejected && rejStep === 'pic' ? 'rejected'
                 : pd.pic_approved_at ? 'done'
                 : pd.status === 'pic_approved' ? 'active' : 'pending',
        },
        {
            key: 'dicairkan', stepNo: 7,
            role: 'Bendahara',
            action: 'Dana Dicairkan',
            actorName: pd.dicairkan_by_name ?? null,
            ts: pd.dicairkan_at,
            catatan: pd.catatan_pencairan,
            state: pd.dicairkan_at ? 'done'
                 : pd.status === 'dicairkan' ? 'active' : 'pending',
        },
    ];
    return steps;
};

// ── Main ─────────────────────────────────────────────────

function VerticalTimeline({ pd, open, onClose }: { pd: PD; open: boolean; onClose: () => void }) {
    const steps  = buildTimeline(pd);
    const doneCount = steps.filter(s => s.state === 'done').length;
    const total     = steps.length;
    const pct       = Math.round((doneCount / total) * 100);

    const stateConfig = {
        done:    { dot: 'bg-emerald-500 border-emerald-400 shadow-emerald-200', icon: CheckCircle2, iconCls: 'text-white', card: 'border-emerald-100 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-700' },
        rejected:{ dot: 'bg-red-500 border-red-400 shadow-red-200',           icon: XCircle,       iconCls: 'text-white', card: 'border-red-100 bg-red-50/40',       badge: 'bg-red-100 text-red-700' },
        active:  { dot: 'bg-blue-500 border-blue-400 shadow-blue-200 animate-pulse', icon: Send, iconCls: 'text-white', card: 'border-blue-100 bg-blue-50/50',   badge: 'bg-blue-100 text-blue-700' },
        pending: { dot: 'bg-gray-100 border-gray-300 shadow-none',            icon: Clock,         iconCls: 'text-gray-400', card: 'border-gray-100 bg-white',     badge: 'bg-gray-100 text-gray-400' },
    } as const;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                {/* ── Header ── */}
                <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-800 to-slate-700">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Riwayat Proses Ajuan</p>
                            <h2 className="text-base font-bold text-white font-mono">{pd.nomor_permohonan}</h2>
                            <p className="text-xs text-slate-300 mt-0.5 truncate max-w-[280px]">
                                {pd.judul_pekerjaan ?? pd.keperluan}
                            </p>
                        </div>
                        <span className={cn(
                            'text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0',
                            pd.status === 'dicairkan' ? 'bg-emerald-400/20 text-emerald-300' :
                            pd.status === 'rejected'  ? 'bg-red-400/20 text-red-300' :
                            pd.status === 'draft'     ? 'bg-slate-500/40 text-slate-300' :
                                                        'bg-blue-400/20 text-blue-300',
                        )}>
                            {pd.status_label}
                        </span>
                    </div>
                    {/* progress bar */}
                    <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{doneCount}/{total} langkah selesai</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-600 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Timeline body ── */}
                <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-0">
                    <div className="relative">
                        {/* vertical connector — hanya di antara item */}
                        <div className="absolute left-[19px] top-5 bottom-5 w-[2px] bg-gradient-to-b from-emerald-200 via-gray-200 to-gray-100" />

                        <ol className="space-y-3">
                            {steps.map((step) => {
                                const cfg  = stateConfig[step.state];
                                const Icon = cfg.icon;
                                const dt   = fmtDateTime(step.ts);

                                return (
                                    <li key={step.key} className="flex gap-3 relative">
                                        {/* dot */}
                                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                                            <div className={cn(
                                                'h-[38px] w-[38px] rounded-full border-2 shadow-md flex items-center justify-center',
                                                cfg.dot,
                                            )}>
                                                <Icon className={cn('h-4 w-4', cfg.iconCls)} />
                                            </div>
                                        </div>

                                        {/* card */}
                                        <div className={cn(
                                            'flex-1 border rounded-xl px-3.5 py-2.5 min-w-0',
                                            cfg.card,
                                        )}>
                                            {/* top row: step badge + role */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                                                    cfg.badge,
                                                )}>
                                                    #{step.stepNo}
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                    {step.role}
                                                </span>
                                            </div>

                                            {/* action label */}
                                            <p className={cn(
                                                'text-sm font-bold leading-snug',
                                                step.state === 'rejected' ? 'text-red-700' :
                                                step.state === 'done'     ? 'text-gray-800' :
                                                step.state === 'active'   ? 'text-blue-700' : 'text-gray-400',
                                            )}>
                                                {step.action}
                                            </p>

                                            {/* actor name */}
                                            {step.actorName && (
                                                <p className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1">
                                                    <span className="inline-block w-3 h-3 rounded-full bg-gray-300 shrink-0" />
                                                    <span className="font-medium">{step.actorName}</span>
                                                </p>
                                            )}

                                            {/* timestamp */}
                                            {dt ? (
                                                <div className="mt-1.5 flex items-center gap-3">
                                                    <span className={cn(
                                                        'text-[10px] font-semibold flex items-center gap-1',
                                                        step.state === 'rejected' ? 'text-red-500' : 'text-emerald-600',
                                                    )}>
                                                        <Clock className="h-3 w-3" />
                                                        {dt.time}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{dt.date}</span>
                                                </div>
                                            ) : step.state === 'active' ? (
                                                <p className="text-[10px] text-blue-500 mt-1 font-medium">⏳ Sedang menunggu proses…</p>
                                            ) : step.state === 'pending' ? (
                                                <p className="text-[10px] text-gray-400 mt-1">Belum diproses</p>
                                            ) : null}

                                            {/* catatan */}
                                            {step.catatan && (
                                                <div className={cn(
                                                    'mt-2 px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed border-l-2',
                                                    step.state === 'rejected'
                                                        ? 'bg-red-50 border-red-300 text-red-700'
                                                        : 'bg-gray-50 border-gray-300 text-gray-600',
                                                )}>
                                                    <span className="font-semibold">Catatan: </span>{step.catatan}
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

    const deleteForm = useForm({});

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteForm.delete(`/pumk/permohonan-dana/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
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

    return (
        <AppLayout>
            <Head title="Daftar Permohonan Dana" />
            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight uppercase">Daftar Permohonan Dana</h1>
                        <p className="text-sm font-medium text-muted-foreground">Ajuan Dana yang Sudah Tersimpan</p>
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
                                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                                            const approver = nextApprover(pd.status);
                                            const perlu = needsApproval(pd.status);
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
                                                        {pd.catatan_penolakan && (
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
                                                        {perlu ? (
                                                            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                                                                Perlu
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                        {approver}
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
