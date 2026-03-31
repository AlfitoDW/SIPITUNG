import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan', href: '#' },
    { title: 'Pencairan Dana', href: '/super-admin/keuangan/pencairan-dana' },
];

const fmt = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));

type Item = { id: number; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string; keterangan: string | null };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_kegiatan: string;
    total_anggaran: string;
    keterangan: string | null;
    catatan_pencairan: string | null;
    dicairkan_at: string | null;
    tim_kerja: { id: number; nama: string; kode: string } | null;
    items: Item[];
};
type Props = {
    tahun: { id: number; tahun: string; label: string };
    pencairan: PD[];
    timKerjaList: { id: number; nama: string }[];
};

export default function Index({ tahun, pencairan, timKerjaList }: Props) {
    const [expanded, setExpanded]         = useState<number | null>(null);
    const [search, setSearch]             = useState('');
    const [filterTimKerja, setFilterTimKerja] = useState('all');

    const filtered = useMemo(() => {
        return pencairan.filter((pd) => {
            const matchSearch =
                search === '' ||
                pd.nomor_permohonan.toLowerCase().includes(search.toLowerCase()) ||
                pd.keperluan.toLowerCase().includes(search.toLowerCase());
            const matchTimKerja =
                filterTimKerja === 'all' || pd.tim_kerja?.id.toString() === filterTimKerja;
            return matchSearch && matchTimKerja;
        });
    }, [pencairan, search, filterTimKerja]);

    const totalDicairkan = useMemo(
        () => pencairan.reduce((sum, pd) => sum + Number(pd.total_anggaran), 0),
        [pencairan],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Pencairan Dana" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Monitoring Pencairan Dana</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Permohonan dana yang telah dicairkan — {tahun.label}
                        </p>
                    </div>
                    {pencairan.length > 0 && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Dicairkan</p>
                            <p className="text-xl font-bold text-green-600">{fmt(totalDicairkan)}</p>
                            <p className="text-xs text-muted-foreground">{pencairan.length} permohonan</p>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-48 flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nomor atau keperluan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={filterTimKerja} onValueChange={setFilterTimKerja}>
                        <SelectTrigger className="w-48 overflow-hidden">
                            <Building2 className="mr-2 h-4 w-4 shrink-0" />
                            <SelectValue placeholder="Semua Tim Kerja" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tim Kerja</SelectItem>
                            {timKerjaList.map((tk) => (
                                <SelectItem key={tk.id} value={tk.id.toString()}>{tk.nama}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                        {pencairan.length === 0
                            ? 'Belum ada dana yang dicairkan pada tahun anggaran ini.'
                            : 'Tidak ada data yang sesuai dengan filter.'}
                    </div>
                ) : (
                    <div className="rounded-xl border overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="text-white font-semibold w-8"></TableHead>
                                    <TableHead className="text-white font-semibold">Nomor</TableHead>
                                    <TableHead className="text-white font-semibold">Tim Kerja</TableHead>
                                    <TableHead className="text-white font-semibold">Keperluan</TableHead>
                                    <TableHead className="text-white font-semibold">Tgl Dicairkan</TableHead>
                                    <TableHead className="text-white font-semibold text-right">Jumlah</TableHead>
                                    <TableHead className="text-white font-semibold text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((pd) => {
                                    const isExpanded = expanded === pd.id;

                                    return (
                                        <>
                                            <TableRow key={pd.id} className="hover:bg-muted/30">
                                                <TableCell>
                                                    <button
                                                        onClick={() => setExpanded(isExpanded ? null : pd.id)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {isExpanded
                                                            ? <ChevronUp className="h-4 w-4" />
                                                            : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{pd.nomor_permohonan}</TableCell>
                                                <TableCell className="text-sm">
                                                    {pd.tim_kerja ? (
                                                        <span>
                                                            <span className="font-medium">{pd.tim_kerja.nama}</span>
                                                            <span className="ml-1 text-xs text-muted-foreground">({pd.tim_kerja.kode})</span>
                                                        </span>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell className="font-medium">{pd.keperluan}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {pd.dicairkan_at
                                                        ? new Date(pd.dicairkan_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-green-700">
                                                    {fmt(pd.total_anggaran)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                                        Sudah Dicairkan
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>

                                            {isExpanded && (
                                                <TableRow key={`${pd.id}-detail`} className="bg-muted/20">
                                                    <TableCell colSpan={7} className="p-0">
                                                        <div className="px-6 py-4 space-y-3">
                                                            {pd.keterangan && (
                                                                <p className="text-sm text-muted-foreground italic">{pd.keterangan}</p>
                                                            )}
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                                                                        <TableHead className="text-xs w-8">No</TableHead>
                                                                        <TableHead className="text-xs">Uraian</TableHead>
                                                                        <TableHead className="text-xs text-center">Volume</TableHead>
                                                                        <TableHead className="text-xs text-center">Satuan</TableHead>
                                                                        <TableHead className="text-xs text-right">Harga Satuan</TableHead>
                                                                        <TableHead className="text-xs text-right">Total</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {pd.items.map((item, idx) => (
                                                                        <TableRow key={item.id} className="hover:bg-transparent">
                                                                            <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                                            <TableCell className="text-xs">{item.uraian}</TableCell>
                                                                            <TableCell className="text-xs text-center">{item.volume}</TableCell>
                                                                            <TableCell className="text-xs text-center">{item.satuan}</TableCell>
                                                                            <TableCell className="text-xs text-right">{fmt(item.harga_satuan)}</TableCell>
                                                                            <TableCell className="text-xs text-right font-medium">{fmt(item.total)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                            {pd.catatan_pencairan && (
                                                                <p className="text-xs text-green-700 bg-green-50 rounded px-3 py-1.5">
                                                                    <span className="font-semibold">Catatan Pencairan:</span> {pd.catatan_pencairan}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
