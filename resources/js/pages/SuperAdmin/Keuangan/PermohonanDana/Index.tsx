import { Head, Link } from '@inertiajs/react';
import {
    Eye, ClipboardList, Printer, History, FileText
} from 'lucide-react';
import { useState, useMemo } from 'react';
import ApprovalTimeline from '@/components/ApprovalTimeline';
import { SkeletonPageHeader, SkeletonTable } from '@/components/skeletons';
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
    tim_kerja: { id: number; nama: string; kode: string } | null;
    items: Array<{ id: number; kode_akun: string | null; tipe_nominatif: string }>;
    // approval timestamps
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
    catatan_katim: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    catatan_pencairan: string | null;
    created_by_name: string | null;
    next_approver_role: string | null;
    next_approver_name: string | null;
};

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; permohonan: PD[]; timKerjaList: { id: number; nama: string }[] };

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
    if (s === 'rejected')  return 'bg-amber-100 text-amber-700 border-amber-200';
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



// ── Main ─────────────────────────────────────────────────────────────────────

export default function PermohonanDanaIndex({ tahun, permohonan, timKerjaList }: Props) {
    const [activeTab,    setActiveTab]    = useState('all');
    const [search,       setSearch]       = useState('');
    const [filterTim,    setFilterTim]    = useState('');
    const [pageSize,     setPageSize]     = useState(10);
    const [page,         setPage]         = useState(1);
    const [historyTarget, setHistoryTarget] = useState<PD | null>(null);

    // Filter by tab
    const tabFiltered = useMemo(() => {
        const tab = TABS.find(t => t.key === activeTab)!;
        let list = tab.statuses ? permohonan.filter(pd => tab.statuses!.includes(pd.status)) : permohonan;
        if (filterTim) list = list.filter(pd => String(pd.tim_kerja?.id) === filterTim);
        return list;
    }, [permohonan, activeTab, filterTim]);

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
    const handleFilterTim = (v: string) => { setFilterTim(v === 'all' ? '' : v); setPage(1); };

    const tabCount = (tab: Tab) => {
        let list = tab.statuses ? permohonan.filter(pd => tab.statuses!.includes(pd.status)) : permohonan;
        if (filterTim) list = list.filter(pd => String(pd.tim_kerja?.id) === filterTim);
        return list.length;
    };

    const isLoading = useNavigationLoading();

    return (
        <AppLayout>
            <Head title="Monitoring Permohonan Dana" />
            {isLoading ? (
                <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">
                    <SkeletonPageHeader />
                    <SkeletonTable rows={5} cols={6} />
                </div>
            ) : (
            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Monitoring Permohonan Dana</h1>
                        <p className="text-sm text-muted-foreground">Semua ajuan dana dari tim kerja</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{tahun?.label}</p>
                    </div>
                </div>

                <Card>
                    {/* Tab Bar */}
                    <CardHeader className="pb-0 pt-4 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex gap-1 border-b">
                                {TABS.map(tab => {
                                    const count = tabCount(tab);
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => handleTab(tab.key)}
                                            className={cn(
                                                'flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
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
                            {/* Tim Filter */}
                            <Select value={filterTim || 'all'} onValueChange={handleFilterTim}>
                                <SelectTrigger className="h-8 w-56 text-xs">
                                    <SelectValue placeholder="Filter Tim Kerja" className="truncate" />
                                </SelectTrigger>
                                <SelectContent className="max-w-80">
                                    <SelectItem value="all">Semua Tim</SelectItem>
                                    {timKerjaList.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)} className="truncate max-w-72">
                                            {t.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                        <th className="px-3 py-3 text-left">Tim Kerja</th>
                                        <th className="px-3 py-3 text-left">Judul Kegiatan</th>
                                        <th className="px-3 py-3 text-center w-36">Tanggal</th>
                                        <th className="px-3 py-3 text-center w-40">Status</th>
                                        <th className="px-3 py-3 text-center w-24">Approval</th>
                                        <th className="px-3 py-3 text-center w-28">Oleh</th>
                                        <th className="px-3 py-3 text-center w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paginated.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-3 py-12 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                    <p className="text-sm text-muted-foreground">Tidak ada data permohonan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginated.map((pd, i) => {
                                            return (
                                                <tr key={pd.id} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-3 py-3 text-center text-muted-foreground tabular-nums text-xs">
                                                        {from + i}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className="font-mono text-xs text-blue-700 font-semibold">{pd.nomor_permohonan}</span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {pd.tim_kerja ? (
                                                            <Badge variant="outline" className="text-[10px]">{pd.tim_kerja.kode}</Badge>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 max-w-xs">
                                                        <p className="font-medium truncate">{pd.judul_pekerjaan ?? pd.keperluan}</p>
                                                        {pd.catatan_penolakan && (
                                                            <p className="text-xs text-red-500 mt-0.5 truncate">↳ {pd.catatan_penolakan}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(pd.submitted_at ?? pd.created_at)}
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
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/super-admin/keuangan/permohonan-dana/${pd.id}`}>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Lihat detail</TooltipContent>
                                                            </Tooltip>
                                                            {!['draft', 'rejected'].includes(pd.status) && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={`/super-admin/keuangan/permohonan-dana/${pd.id}/print`} target="_blank">
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                                                <Printer className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Cetak permohonan</TooltipContent>
                                                                </Tooltip>
                                                            )}
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
                                                                <TooltipContent>Riwayat proses</TooltipContent>
                                                            </Tooltip>
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

            <ApprovalTimeline pd={historyTarget} open={!!historyTarget} onClose={() => setHistoryTarget(null)} />
        </AppLayout>
    );
}
