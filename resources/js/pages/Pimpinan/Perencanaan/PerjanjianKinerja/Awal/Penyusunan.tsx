import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '#' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Awal', href: '/pimpinan/perencanaan/perjanjian-kinerja/awal' },
];

type TimKerja  = { id: number; nama: string; kode: string };
type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string; pic_tim_kerjas: TimKerja[] };
type Sasaran   = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK        = { id: number; tim_kerja_id: number; status: string; sasarans: Sasaran[]; tim_kerja: { nama_singkat: string } };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; pks: PK[]; role: 'kabag_umum' | 'ppk' };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft:          { label: 'Draft',          className: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-yellow-100 text-yellow-800 border-yellow-400' },
    kabag_approved: { label: 'Disetujui',      className: 'bg-green-100 text-green-800 border-green-400' },
    rejected:       { label: 'Ditolak',        className: 'bg-red-100 text-red-800 border-red-400' },
};

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

export default function Penyusunan({ tahun, pks, role }: Props) {
    const roleLabel = role === 'kabag_umum' ? 'Kabag Umum' : 'PPK';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PK Awal — Perencanaan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Review PK Awal</h1>
                    <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label} · Anda login sebagai <span className="font-medium">{roleLabel}</span></p>
                </div>

                {pks.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada dokumen yang perlu direview saat ini.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-x-auto">
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-36">Status</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-56">Sasaran</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-36">Tim Kerja / PIC</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                    <TableHead className="text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pks.flatMap((pk) => {
                                    const statusCfg = STATUS_CONFIG[pk.status] ?? STATUS_CONFIG['draft'];
                                    return pk.sasarans.flatMap((sasaran) => {
                                        const color   = getColor(sasaran.kode);
                                        return sasaran.indikators.map((iku, idx) => (
                                            <TableRow key={`${pk.id}-${sasaran.id}-${iku.id}`} className="align-top hover:bg-muted/30">
                                                    {idx === 0 && (
                                                        <TableCell rowSpan={sasaran.indikators.length} className="align-middle text-center px-2 py-3">
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusCfg.className}`}>
                                                                {statusCfg.label}
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                    {idx === 0 && (
                                                        <TableCell rowSpan={sasaran.indikators.length} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                            <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                            <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-sm align-top">
                                                        <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                        <p className="leading-snug">{iku.nama}</p>
                                                    </TableCell>
                                                    <TableCell className="text-center align-middle">
                                                        <div className="flex flex-col gap-0.5 items-center">
                                                            {iku.pic_tim_kerjas.length > 0
                                                                ? iku.pic_tim_kerjas.map((t, i) => (
                                                                    <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs leading-tight ${
                                                                        i === 0
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium'
                                                                            : 'border border-slate-300 text-slate-500 text-[10px]'
                                                                    }`}>
                                                                        {t.nama}
                                                                    </span>
                                                                ))
                                                                : <span className="text-xs text-muted-foreground">—</span>
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                    <TableCell className="text-center text-sm font-semibold align-middle">{iku.target}</TableCell>
                                                </TableRow>
                                        ));
                                    });
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

        </AppLayout>
    );
}
