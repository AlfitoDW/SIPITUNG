import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Matriks PK', href: '/super-admin/perencanaan/perjanjian-kinerja/matriks' },
];

type TimKerja  = { id: number; nama: string; kode: string };
type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string; pic_tim_kerjas: TimKerja[] };
type Sasaran   = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK        = { id: number; status: string; tim_kerja: TimKerja; sasarans: Sasaran[] };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; pks: PK[]; timKerjas: TimKerja[] };

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

export default function MatriksPK({ tahun, pks, timKerjas }: Props) {
    const [filterPic, setFilterPic] = useState<string>('all');

    type Row = { pk: PK; sasaran: Sasaran; iku: Indikator };
    const allRows: Row[] = pks.flatMap(pk =>
        pk.sasarans.flatMap(sasaran =>
            sasaran.indikators.map(iku => ({ pk, sasaran, iku }))
        )
    );

    const filtered = filterPic === 'all'
        ? allRows
        : filterPic === 'none'
            ? allRows.filter(r => r.iku.pic_tim_kerjas.length === 0)
            : allRows.filter(r => r.iku.pic_tim_kerjas.some(t => t.id.toString() === filterPic));

    type GroupedRow = Row & { sasaranRowSpan?: number; showSasaran: boolean };
    const grouped: GroupedRow[] = filtered.map((row, i) => {
        const prevSasaran = i > 0 ? filtered[i - 1].sasaran.id : null;
        const showSasaran = row.sasaran.id !== prevSasaran;
        const span = filtered.filter(r => r.sasaran.id === row.sasaran.id).length;
        return { ...row, showSasaran, sasaranRowSpan: showSasaran ? span : undefined };
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Matriks PK — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Matriks Perjanjian Kinerja</h1>
                    <p className="text-muted-foreground">Seluruh Sasaran & IKU — {tahun.label}</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Filter PIC:</span>
                    <Select value={filterPic} onValueChange={setFilterPic}>
                        <SelectTrigger className="w-64 h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="none">Belum ada PIC</SelectItem>
                            {timKerjas.map(t => (
                                <SelectItem key={t.id} value={t.id.toString()}>{t.nama}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">{filtered.length} IKU ditampilkan</span>
                </div>

                {grouped.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada data.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="border-r border-white/20 text-center font-semibold text-white w-52">Sasaran</TableHead>
                                    <TableHead className="border-r border-white/20 text-center font-semibold text-white">Indikator Kinerja Utama</TableHead>
                                    <TableHead className="border-r border-white/20 text-center font-semibold text-white w-20">Satuan</TableHead>
                                    <TableHead className="border-r border-white/20 text-center font-semibold text-white w-16">Target</TableHead>
                                    <TableHead className="text-center font-semibold text-white w-44">PIC Tim Kerja</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grouped.map((row) => {
                                    const color = getColor(row.sasaran.kode);
                                    return (
                                        <TableRow key={`${row.sasaran.id}-${row.iku.id}`} className="align-top hover:bg-muted/30">
                                            {row.showSasaran && (
                                                <TableCell rowSpan={row.sasaranRowSpan} className={`align-top text-sm ${color.bg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.badge}`}>{row.sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{row.sasaran.nama}</p>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm align-top">
                                                <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">{row.iku.kode}</span>
                                                <p className="leading-snug">{row.iku.nama}</p>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">{row.iku.satuan}</TableCell>
                                            <TableCell className="text-center text-sm font-semibold">{row.iku.target}</TableCell>
                                            <TableCell className="text-center align-middle">
                                                {row.iku.pic_tim_kerjas.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {row.iku.pic_tim_kerjas.map(t => (
                                                            <Badge key={t.id} variant="secondary" className="text-xs">{t.nama}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
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
