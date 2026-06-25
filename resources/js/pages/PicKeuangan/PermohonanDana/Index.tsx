import { Head, Link } from '@inertiajs/react';
import { Download, Eye, History, Printer } from 'lucide-react';
import { useState, useMemo } from 'react';
import ApprovalTimeline from '@/components/ApprovalTimeline';
import { SkeletonPageHeader, SkeletonTable } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
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
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    tempat: string | null;
    total_anggaran: string;
    status: string;
    status_label: string;
    submitted_at: string | null;
    catatan_penolakan: string | null;
    catatan_katim: string | null;
    catatan_kabag: string | null;
    catatan_ppk: string | null;
    catatan_pic: string | null;
    tim_kerja: { nama: string; kode: string } | null;
    created_by_user?: { nama_lengkap: string } | null;
    // approval
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
    next_approver_role: string | null;
    next_approver_name: string | null;
};

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; menunggu: PD[]; riwayat: PD[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));

const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const statusColor = (s: string) => {
    if (s === 'dicairkan')      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected')       return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s === 'submitted')      return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'katim_approved') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'kabag_approved') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'ppk_approved')   return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'pic_approved')   return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = { key: string; label: string; statuses: string[] | null };
const TABS: Tab[] = [
    { key: 'all',      label: 'Semua Ajuan', statuses: null },
    { key: 'waiting',  label: 'Menunggu',    statuses: ['katim_approved'] },
    { key: 'diajukan', label: 'Diajukan',    statuses: ['submitted', 'katim_approved', 'pic_approved', 'ppk_approved'] },
    { key: 'revisi',   label: 'Revisi',      statuses: ['rejected'] },
    { key: 'selesai',  label: 'Selesai',     statuses: ['dicairkan'] },
];



// ── Main ──────────────────────────────────────────────────────────────────────

export default function PermohonanDanaIndex({ tahun, menunggu, riwayat }: Props) {
    const allData = useMemo(() => riwayat, [riwayat]);

    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [historyTarget, setHistoryTarget] = useState<PD | null>(null);

    const handleTab = (key: string) => { setActiveTab(key); setPage(1); };
    const handleSearch = (v: string) => { setSearch(v); setPage(1); };

    const tabFiltered = useMemo(() => {
        const tab = TABS.find(t => t.key === activeTab)!;
        if (!tab.statuses) return allData;
        return allData.filter(pd => tab.statuses!.includes(pd.status));
    }, [allData, activeTab]);

    const searched = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tabFiltered;
        return tabFiltered.filter(pd =>
            pd.nomor_permohonan.toLowerCase().includes(q) ||
            (pd.judul_pekerjaan ?? pd.keperluan).toLowerCase().includes(q) ||
            (pd.tim_kerja?.kode ?? '').toLowerCase().includes(q) ||
            (pd.created_by_user?.nama_lengkap ?? '').toLowerCase().includes(q),
        );
    }, [tabFiltered, search]);

    const totalPages = Math.max(1, Math.ceil(searched.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = searched.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = searched.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, searched.length);

    const goPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    const tabCount = (tab: Tab) =>
        tab.statuses ? allData.filter(pd => tab.statuses!.includes(pd.status)).length : allData.length;
    const isLoading = useNavigationLoading();

    return (
        <AppLayout>
            <Head title="Verifikasi Permohonan Dana" />
            {isLoading ? (
                <div className="p-4"><SkeletonPageHeader /><SkeletonTable rows={5} /></div>
            ) : (
            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Verifikasi Permohonan Dana</h1>
                        <p className="text-sm text-muted-foreground">Verifikasi Pengajuan Dana</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                            PIC Keuangan — Step 4 · {tahun?.label}
                        </p>
                    </div>
                    {menunggu.length > 0 && (
                        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-sm font-medium text-amber-700">{menunggu.length} menunggu verifikasi</span>
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
                                    <SelectTrigger className="h-8 w-16 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
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
                                            const canAct = pd.status === 'katim_approved';
                                            const canPrint = !['draft', 'rejected'].includes(pd.status);
                                            return (
                                                <tr key={pd.id} className={cn('hover:bg-gray-50/60 transition-colors', canAct && 'bg-amber-50/40')}>
                                                    <td className="px-3 py-3 text-center text-muted-foreground tabular-nums text-xs">{from + i}</td>
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
                                                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusColor(pd.status))}>
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
                                                                    <Button variant="ghost" size="icon"
                                                                        className="h-7 w-7 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
                                                                        onClick={() => setHistoryTarget(pd)}>
                                                                        <History className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Riwayat Ajuan</TooltipContent>
                                                            </Tooltip>
                                                            {canPrint && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <a href={`/pic-keuangan/permohonan-dana/${pd.id}/print`}>
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50">
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                        </a>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Download Surat</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            {canPrint && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <a href={`/pic-keuangan/permohonan-dana/${pd.id}/nominatif`} target="_blank" rel="noopener noreferrer">
                                                                            <Button variant="ghost" size="icon"
                                                                                className="h-7 w-7 text-teal-500 hover:text-teal-700 hover:bg-teal-50">
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                        </a>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Download Nominatif</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/pic-keuangan/permohonan-dana/${pd.id}`}>
                                                                        <Button variant="ghost" size="icon"
                                                                            className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Lihat Detail</TooltipContent>
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
                            <span>Showing {from} to {to} of {searched.length} entries</span>
                            <div className="flex items-center gap-1">
                                {[
                                    { label: 'First', page: 1 },
                                    { label: 'Previous', page: currentPage - 1 },
                                ].map(btn => (
                                    <button key={btn.label} onClick={() => goPage(btn.page)} disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors">
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
                                            <button key={p} onClick={() => goPage(p as number)}
                                                className={cn('px-3 py-1.5 rounded border text-xs font-medium transition-colors',
                                                    currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100')}>
                                                {p}
                                            </button>
                                        ),
                                    )}
                                {[
                                    { label: 'Next', page: currentPage + 1 },
                                    { label: 'Last', page: totalPages },
                                ].map(btn => (
                                    <button key={btn.label} onClick={() => goPage(btn.page)} disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors">
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
