import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/super-admin/perencanaan/rencana-aksi/penyusunan' },
];

type TimKerja  = { id: number; nama: string; kode: string };
type Indikator = {
    id: number; kode: string; nama: string; satuan: string; target: string | null;
    target_tw1: string | null; target_tw2: string | null; target_tw3: string | null; target_tw4: string | null;
    pic_tim_kerjas: TimKerja[]; tim_kerja: TimKerja;
};
type Sasaran   = { kode: string; nama: string; indikators: Indikator[] };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; sasarans: Sasaran[] };

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

function TwCell({ value }: { value: string | null }) {
    return (
        <TableCell className="text-center text-sm align-middle">
            {value ? <span className="font-medium">{value}</span> : <span className="text-muted-foreground">—</span>}
        </TableCell>
    );
}

export default function Penyusunan({ tahun, sasarans }: Props) {
    const totalIku  = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledTw  = sasarans.reduce((s, sar) => s + sar.indikators.filter(
        i => i.target_tw1 && i.target_tw2 && i.target_tw3 && i.target_tw4
    ).length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total IKU </span>
                        <span className="font-bold">{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Target TW lengkap </span>
                        <span className={`font-bold ${filledTw === totalIku && totalIku > 0 ? 'text-green-600' : 'text-amber-600'}`}>{filledTw}/{totalIku}</span>
                    </div>
                </div>

                {/* Main Table */}
                {sasarans.length === 0 ? (
                    <p className="text-muted-foreground">Belum ada data dari Tim Kerja manapun.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-8">#</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-52">Sasaran</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Satuan</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                    <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                    <TableHead rowSpan={2} className="text-center align-middle font-semibold text-white w-44">PIC Tim Kerja</TableHead>
                                </TableRow>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                        <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    let rowNum = 0;
                                    return sasarans.flatMap((sasaran) => {
                                        const color = getColor(sasaran.kode);
                                        const count = sasaran.indikators.length;
                                        if (count === 0) return [];
                                        return sasaran.indikators.map((iku, idx) => {
                                            rowNum++;
                                            return (
                                                <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                                    <TableCell className="text-center text-xs text-muted-foreground align-middle">{rowNum}</TableCell>
                                                    {idx === 0 && (
                                                        <TableCell rowSpan={count} className={`align-top text-sm ${color.bg} ${color.accent}`}>
                                                            <span className={`inline-block mb-1 rounded px-1.5 py-0.5 text-xs font-bold ${color.badge}`}>{sasaran.kode}</span>
                                                            <p className="text-xs leading-snug text-foreground">{sasaran.nama}</p>
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="align-top">
                                                        <span className="block text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                        <span className="text-sm leading-snug">{iku.nama}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                    <TableCell className="text-center align-middle">
                                                        {iku.target
                                                            ? <span className="text-sm font-semibold">{iku.target}</span>
                                                            : <span className="text-xs text-amber-500 italic">—</span>}
                                                    </TableCell>
                                                    <TwCell value={iku.target_tw1} />
                                                    <TwCell value={iku.target_tw2} />
                                                    <TwCell value={iku.target_tw3} />
                                                    <TwCell value={iku.target_tw4} />
                                                    <TableCell className="text-center align-middle">
                                                        {iku.pic_tim_kerjas.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 justify-center">
                                                                {iku.pic_tim_kerjas.map(t => (
                                                                    <Badge key={t.id} variant="secondary" className="text-xs">{t.nama}</Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        });
                                    });
                                })()}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
