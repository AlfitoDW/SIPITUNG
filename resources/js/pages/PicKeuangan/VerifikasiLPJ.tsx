import { Head, Link } from '@inertiajs/react';
import { FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface PermohonanItem {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: string | number;
    dicairkan_at: string | null;
    tgl_pertanggungjawaban: string | null;
    tim_kerja_nama: string | null;
    lpj_uploaded_at: string | null;
    lpj_uploaded_by_name: string | null;
    lpj_file_name: string | null;
    bukti_bayar_path: string | null;
}

interface Props {
    permohonan: PermohonanItem[];
    tahun: { tahun: number } | null;
}

const TABS = [
    { key: 'all', label: 'Semua' },
    { key: 'uploaded', label: 'Sudah Upload' },
    { key: 'pending', label: 'Belum Upload' },
];

export default function VerifikasiLPJ({ permohonan }: Props) {
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const handleTab = (key: string) => { setActiveTab(key); setPage(1); };
    const handleSearch = (v: string) => { setSearch(v); setPage(1); };

    const fmt = (n: string | number | null | undefined) => {
        const num = Number(n);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isNaN(num) ? 0 : num);
    };

    const fmtDate = (s: string | null) =>
        s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    const tabFiltered = useMemo(() => {
        if (activeTab === 'all') return permohonan;
        if (activeTab === 'uploaded') return permohonan.filter(p => p.lpj_uploaded_at);
        return permohonan.filter(p => !p.lpj_uploaded_at);
    }, [permohonan, activeTab]);

    const searched = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return tabFiltered;
        return tabFiltered.filter(p =>
            p.nomor_permohonan.toLowerCase().includes(q) ||
            p.keperluan.toLowerCase().includes(q) ||
            (p.tim_kerja_nama ?? '').toLowerCase().includes(q),
        );
    }, [tabFiltered, search]);

    const totalPages = Math.max(1, Math.ceil(searched.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = searched.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = searched.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, searched.length);

    const goPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

    const tabCount = (key: string) => {
        if (key === 'all') return permohonan.length;
        if (key === 'uploaded') return permohonan.filter(p => p.lpj_uploaded_at).length;
        return permohonan.filter(p => !p.lpj_uploaded_at).length;
    };

    const belumLpj = permohonan.filter(p => !p.lpj_uploaded_at).length;
    const sudahLpj = permohonan.filter(p => p.lpj_uploaded_at).length;

    return (
        <AppLayout>
            <Head title="Verifikasi LPJ" />

            <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Verifikasi LPJ</h1>
                        <p className="text-sm text-muted-foreground mt-1">Laporan pertanggungjawaban permohonan yang telah dicairkan</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Dicairkan</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{permohonan.length}</div></CardContent>
                    </Card>
                    <Card className="border-emerald-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700">LPJ Sudah Upload</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-700">{sudahLpj}</div></CardContent>
                    </Card>
                    <Card className="border-amber-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700">Belum Upload LPJ</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-700">{belumLpj}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-0 pt-4 px-4">
                        <div className="flex gap-1 border-b">
                            {TABS.map(tab => {
                                const count = tabCount(tab.key);
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
                                    placeholder="Nomor / keperluan..."
                                    className="h-8 w-56 text-xs"
                                />
                            </div>
                        </div>

                        {permohonan.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Belum ada permohonan yang dicairkan.</p>
                        ) : searched.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Tidak ada hasil pencarian. Coba kata kunci yang berbeda.</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nomor</TableHead>
                                                <TableHead>Keperluan</TableHead>
                                                <TableHead>Tim Kerja</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead>Dicairkan</TableHead>
                                                <TableHead>Status LPJ</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map((p) => (
                                                <TableRow key={p.id}>
                                                    <TableCell className="font-mono text-xs font-semibold text-blue-700">{p.nomor_permohonan}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{p.keperluan}</TableCell>
                                                    <TableCell>{p.tim_kerja_nama ?? '-'}</TableCell>
                                                    <TableCell className="text-right">{fmt(p.total_anggaran)}</TableCell>
                                                    <TableCell className="text-xs text-gray-500">{fmtDate(p.dicairkan_at)}</TableCell>
                                                    <TableCell>
                                                        {p.lpj_uploaded_at ? (
                                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                                                                <CheckCircle2 className="h-3 w-3" /> Sudah Upload
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                                                                <Clock className="h-3 w-3" /> Belum Upload
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {p.lpj_file_name && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <a href={`/files/lpj/${p.id}`} target="_blank" rel="noopener noreferrer">
                                                                            <Button size="sm" variant="ghost" className="h-7 text-violet-600 hover:text-violet-800">
                                                                                <FileText className="h-4 w-4" />
                                                                            </Button>
                                                                        </a>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Lihat LPJ</TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Link href={`/pic-keuangan/permohonan-dana/${p.id}`}>
                                                                        <Button size="sm" variant="ghost" className="h-7">
                                                                            <ArrowRight className="h-4 w-4" />
                                                                        </Button>
                                                                    </Link>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Lihat Detail</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
