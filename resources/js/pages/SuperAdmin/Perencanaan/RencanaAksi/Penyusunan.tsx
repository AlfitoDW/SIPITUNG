import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/super-admin/perencanaan/rencana-aksi/penyusunan' },
];

type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string; target_tw1: string | null; target_tw2: string | null; target_tw3: string | null; target_tw4: string | null };
type RA        = { id: number; status: 'draft' | 'submitted' | 'approved' | 'rejected'; indikators: Indikator[]; tim_kerja: { nama_singkat: string } };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; ras: RA[] };

const STATUS_CONFIG = {
    draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-700 border-slate-200' },
    submitted: { label: 'Menunggu',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
    approved:  { label: 'Disetujui', className: 'bg-green-100 text-green-700 border-green-200' },
    rejected:  { label: 'Ditolak',   className: 'bg-red-100 text-red-700 border-red-200' },
};

type ActionDialog = { open: boolean; raId: number | null; action: 'approve' | 'reject' | 'reopen'; label: string };

export default function Penyusunan({ tahun, ras }: Props) {
    const [dialog, setDialog] = useState<ActionDialog>({ open: false, raId: null, action: 'approve', label: '' });

    function openDialog(ra: RA, action: 'approve' | 'reject' | 'reopen') {
        setDialog({ open: true, raId: ra.id, action, label: ra.tim_kerja.nama_singkat });
    }

    function confirm() {
        const { raId, action } = dialog;
        router.patch(`/super-admin/perencanaan/rencana-aksi/${raId}/${action}`, {}, {
            onSuccess: () => setDialog(d => ({ ...d, open: false })),
        });
    }

    const submittedCount = ras.filter(r => r.status === 'submitted').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                </div>

                {submittedCount > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        {submittedCount} dokumen menunggu persetujuan.
                    </div>
                )}

                {ras.length === 0 ? (
                    <p className="text-muted-foreground">Belum ada data dari Tim Kerja manapun.</p>
                ) : (
                    ras.map((ra) => {
                        const statusCfg = STATUS_CONFIG[ra.status];
                        return (
                            <div key={ra.id} className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{ra.tim_kerja.nama_singkat}</span>
                                        <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {ra.status === 'submitted' && (
                                            <>
                                                <Button size="sm" variant="outline" className="h-7 gap-1.5 border-green-300 text-green-700 hover:bg-green-50" onClick={() => openDialog(ra, 'approve')}>
                                                    <CheckCircle2 className="h-3.5 w-3.5" />Setujui
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 gap-1.5 border-red-300 text-red-700 hover:bg-red-50" onClick={() => openDialog(ra, 'reject')}>
                                                    <XCircle className="h-3.5 w-3.5" />Tolak
                                                </Button>
                                            </>
                                        )}
                                        {ra.status === 'approved' && (
                                            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-muted-foreground" onClick={() => openDialog(ra, 'reopen')}>
                                                <RotateCcw className="h-3.5 w-3.5" />Buka Kembali
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {ra.indikators.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic pl-1">Belum ada indikator.</p>
                                ) : (
                                    <div className="rounded-xl border shadow-sm overflow-hidden">
                                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                                    <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                                </TableRow>
                                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                                    {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                                        <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {ra.indikators.map((iku) => (
                                                    <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                                        <TableCell className="text-sm align-top">
                                                            <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                            <p className="leading-snug">{iku.nama}</p>
                                                        </TableCell>
                                                        <TableCell className="text-center text-sm text-muted-foreground">{iku.satuan}</TableCell>
                                                        <TableCell className="text-center text-sm font-semibold">{iku.target}</TableCell>
                                                        <TableCell className="text-center text-sm">{iku.target_tw1 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                        <TableCell className="text-center text-sm">{iku.target_tw2 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                        <TableCell className="text-center text-sm">{iku.target_tw3 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                        <TableCell className="text-center text-sm">{iku.target_tw4 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <AlertDialog open={dialog.open} onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {dialog.action === 'approve' && 'Setujui dokumen?'}
                            {dialog.action === 'reject'  && 'Tolak dokumen?'}
                            {dialog.action === 'reopen'  && 'Buka kembali dokumen?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialog.action === 'approve' && `Rencana Aksi dari ${dialog.label} akan disetujui dan terkunci.`}
                            {dialog.action === 'reject'  && `Rencana Aksi dari ${dialog.label} akan ditolak dan dikembalikan ke KetuaTim.`}
                            {dialog.action === 'reopen'  && `Rencana Aksi dari ${dialog.label} akan dibuka kembali ke status draft.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className={dialog.action === 'reject' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
                            onClick={confirm}
                        >
                            {dialog.action === 'approve' && 'Setujui'}
                            {dialog.action === 'reject'  && 'Tolak'}
                            {dialog.action === 'reopen'  && 'Buka Kembali'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
