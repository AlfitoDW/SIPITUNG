import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Progress', href: '/ketua-tim/perencanaan/rencana-aksi/progress' },
];

type Indikator = {
    id: number;
    kode: string;
    nama: string;
    satuan: string;
    target: string;
    target_tw1: string | null;
    target_tw2: string | null;
    target_tw3: string | null;
    target_tw4: string | null;
};

type RencanaAksi = {
    id: number;
    status: 'draft' | 'final';
    indikators: Indikator[];
};

type TahunAnggaran = {
    id: number;
    tahun: number;
    label: string;
};

type Props = {
    tahun: TahunAnggaran;
    ra: RencanaAksi | null;
};

export default function Progress({ tahun, ra }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Progress — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Progress Rencana Aksi</h1>
                        <p className="text-muted-foreground">Rencana Aksi — {tahun.label}</p>
                    </div>
                    {ra && (
                        ra.status === 'final' ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Final</Badge>
                        ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Draft</Badge>
                        )
                    )}
                </div>

                {!ra ? (
                    <p className="text-muted-foreground">Data belum tersedia.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">
                                        Indikator
                                    </TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">
                                        Satuan
                                    </TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">
                                        Target
                                    </TableHead>
                                    <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">
                                        Triwulan
                                    </TableHead>
                                </TableRow>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                        <TableHead
                                            key={tw}
                                            className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}
                                        >
                                            {tw}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {ra.indikators.map((iku) => (
                                    <TableRow key={iku.kode} className="align-top hover:bg-muted/30">
                                        <TableCell className="text-sm align-top">
                                            <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">
                                                {iku.kode}
                                            </span>
                                            <p className="leading-snug">{iku.nama}</p>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">{iku.satuan}</TableCell>
                                        <TableCell className="text-center text-sm font-semibold">{iku.target}</TableCell>
                                        <TableCell className="text-center text-sm">{iku.target_tw1 ?? '-'}</TableCell>
                                        <TableCell className="text-center text-sm">{iku.target_tw2 ?? '-'}</TableCell>
                                        <TableCell className="text-center text-sm">{iku.target_tw3 ?? '-'}</TableCell>
                                        <TableCell className="text-center text-sm">{iku.target_tw4 ?? '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
