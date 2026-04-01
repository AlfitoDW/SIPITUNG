import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan', href: '#' },
    { title: 'Permohonan Dana', href: '/ketua-tim/permohonan-dana' },
];

const fmt = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));

const STATUS: Record<string, { label: string; className: string }> = {
    draft:              { label: 'Draft',                         className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
    submitted:          { label: 'Menunggu Kabag Umum',           className: 'bg-blue-50 text-blue-600 border-blue-100' },
    kabag_approved:     { label: 'Menunggu Verifikasi Bendahara', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    bendahara_checked:  { label: 'Menunggu Ketua Tim Perencanaan',className: 'bg-blue-100 text-blue-800 border-blue-200' },
    katimku_approved:   { label: 'Menunggu PPK',                  className: 'bg-blue-100 text-blue-900 border-blue-300' },
    ppk_approved:       { label: 'Siap Dicairkan',                className: 'bg-blue-200 text-[#003580] border-blue-300' },
    dicairkan:          { label: 'Sudah Dicairkan',               className: 'bg-green-50 text-green-700 border-green-200' },
    rejected:           { label: 'Ditolak',                       className: 'bg-red-50 text-red-600 border-red-200' },
};

type Item = { id: number; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_kegiatan: string;
    total_anggaran: string;
    status: string;
    keterangan: string | null;
    rejected_by: string | null;
    rekomendasi_kabag: string | null;
    catatan_bendahara: string | null;
    rekomendasi_katimku: string | null;
    rekomendasi_ppk: string | null;
    items: Item[];
};
type Props = { tahun: { id: number; tahun: number; label: string }; permohonan: PD[] };

export default function Index({ tahun, permohonan }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [submitDialog, setSubmitDialog] = useState<{ open: boolean; pd: PD | null }>({ open: false, pd: null });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; pd: PD | null }>({ open: false, pd: null });

    function confirmSubmit() {
        if (!submitDialog.pd) return;
        router.patch(`/ketua-tim/permohonan-dana/${submitDialog.pd.id}/submit`, {}, {
            onSuccess: () => setSubmitDialog({ open: false, pd: null }),
        });
    }

    function confirmDelete() {
        if (!deleteDialog.pd) return;
        router.delete(`/ketua-tim/permohonan-dana/${deleteDialog.pd.id}`, {
            onSuccess: () => setDeleteDialog({ open: false, pd: null }),
        });
    }

    const editable = (pd: PD) => pd.status === 'draft' || pd.status === 'rejected';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permohonan Dana" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Permohonan Dana</h1>
                        <p className="text-muted-foreground text-sm mt-1">Kelola pengajuan dana unit kerja — {tahun.label}</p>
                    </div>
                    <Button onClick={() => router.get('/ketua-tim/permohonan-dana/buat')} className="gap-2">
                        <Plus className="h-4 w-4" /> Buat Permohonan
                    </Button>
                </div>

                {permohonan.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                        Belum ada permohonan dana. Klik tombol di atas untuk membuat yang baru.
                    </div>
                ) : (
                    <div className="rounded-xl border overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="text-white font-semibold w-8"></TableHead>
                                    <TableHead className="text-white font-semibold">Nomor</TableHead>
                                    <TableHead className="text-white font-semibold">Keperluan</TableHead>
                                    <TableHead className="text-white font-semibold">Tgl Kegiatan</TableHead>
                                    <TableHead className="text-white font-semibold text-right">Total</TableHead>
                                    <TableHead className="text-white font-semibold text-center">Status</TableHead>
                                    <TableHead className="text-white font-semibold text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permohonan.map((pd) => {
                                    const statusCfg = STATUS[pd.status] ?? STATUS['draft'];
                                    const isExpanded = expanded === pd.id;

                                    return (
                                        <>
                                            <TableRow key={pd.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : pd.id)}>
                                                <TableCell>
                                                    <span className="text-muted-foreground">
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{pd.nomor_permohonan}</TableCell>
                                                <TableCell className="font-medium">{pd.keperluan}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(pd.tanggal_kegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">{fmt(pd.total_anggaran)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {editable(pd) && (
                                                            <>
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    className="h-7 gap-1 text-xs"
                                                                    onClick={() => router.get(`/ketua-tim/permohonan-dana/${pd.id}/edit`)}
                                                                >
                                                                    <Pencil className="h-3 w-3" />Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    className="h-7 gap-1 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                                                    onClick={() => setSubmitDialog({ open: true, pd })}
                                                                >
                                                                    <Send className="h-3 w-3" />Ajukan
                                                                </Button>
                                                                <Button
                                                                    size="sm" variant="outline"
                                                                    className="h-7 gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                                    onClick={() => setDeleteDialog({ open: true, pd })}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
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
                                                            {/* Notes from approvers */}
                                                            {pd.rekomendasi_kabag && (
                                                                <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-3 py-1.5">
                                                                    <span className="font-semibold">Catatan Kabag:</span> {pd.rekomendasi_kabag}
                                                                </p>
                                                            )}
                                                            {pd.catatan_bendahara && (
                                                                <p className="text-xs text-purple-700 bg-purple-50 rounded px-3 py-1.5">
                                                                    <span className="font-semibold">Catatan Bendahara:</span> {pd.catatan_bendahara}
                                                                </p>
                                                            )}
                                                            {pd.rekomendasi_katimku && (
                                                                <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-1.5">
                                                                    <span className="font-semibold">Catatan Ketua Tim:</span> {pd.rekomendasi_katimku}
                                                                </p>
                                                            )}
                                                            {pd.rekomendasi_ppk && (
                                                                <p className="text-xs text-teal-700 bg-teal-50 rounded px-3 py-1.5">
                                                                    <span className="font-semibold">Catatan PPK:</span> {pd.rekomendasi_ppk}
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

            {/* Submit Dialog */}
            <Dialog open={submitDialog.open} onOpenChange={(v) => setSubmitDialog(d => ({ ...d, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajukan Permohonan Dana</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin mengajukan permohonan <strong>{submitDialog.pd?.nomor_permohonan}</strong>?
                        Setelah diajukan, dokumen tidak dapat diubah hingga proses selesai.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitDialog({ open: false, pd: null })}>Batal</Button>
                        <Button onClick={confirmSubmit} className="gap-2"><Send className="h-4 w-4" />Ajukan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(v) => setDeleteDialog(d => ({ ...d, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Permohonan Dana</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Apakah Anda yakin ingin menghapus permohonan <strong>{deleteDialog.pd?.nomor_permohonan}</strong>?
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, pd: null })}>Batal</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
