import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan', href: '#' },
    { title: 'Approval Permohonan', href: '/ketua-tim/permohonan-dana/approval' },
];

const fmt = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));

type Item = { id: number; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_kegiatan: string;
    total_anggaran: string;
    status: string;
    keterangan: string | null;
    tim_kerja: { nama: string; kode: string };
    created_by: { nama_lengkap: string };
    catatan_bendahara: string | null;
    items: Item[];
};
type Props = { tahun: { id: number; tahun: number; label: string }; permohonan: PD[] };

type ActionDialog = { open: boolean; pd: PD | null; action: 'approve' | 'reject' };

export default function Approval({ tahun, permohonan }: Props) {
    const [dialog, setDialog] = useState<ActionDialog>({ open: false, pd: null, action: 'approve' });
    const [rekomendasi, setRekomendasi] = useState('');

    function openDialog(pd: PD, action: 'approve' | 'reject') {
        setRekomendasi('');
        setDialog({ open: true, pd, action });
    }

    function confirm() {
        if (!dialog.pd) return;
        const { id } = dialog.pd;
        router.post(`/ketua-tim/permohonan-dana/${id}/${dialog.action}`, { rekomendasi }, {
            onSuccess: () => setDialog(d => ({ ...d, open: false })),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Permohonan Dana" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Approval Permohonan Dana</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Review dan setujui permohonan yang sudah diverifikasi bendahara — {tahun.label}
                    </p>
                </div>

                {permohonan.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                        Tidak ada permohonan yang perlu direview saat ini.
                    </div>
                ) : (
                    <Accordion type="multiple" className="flex flex-col gap-2">
                        {permohonan.map((pd) => (
                            <AccordionItem key={pd.id} value={`pd-${pd.id}`} className="rounded-xl border shadow-sm overflow-hidden">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/40">
                                    <div className="flex items-center gap-3 flex-1 mr-2 text-left">
                                        <div>
                                            <p className="font-semibold text-sm">{pd.tim_kerja.nama}</p>
                                            <p className="text-xs text-muted-foreground">{pd.nomor_permohonan} · {pd.keperluan}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ml-auto mr-2">
                                            {fmt(pd.total_anggaran)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <Button
                                            size="sm" variant="outline"
                                            className="h-7 gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                            onClick={(e) => { e.stopPropagation(); openDialog(pd, 'approve'); }}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />Setujui
                                        </Button>
                                        <Button
                                            size="sm" variant="outline"
                                            className="h-7 gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                                            onClick={(e) => { e.stopPropagation(); openDialog(pd, 'reject'); }}
                                        >
                                            <XCircle className="h-3.5 w-3.5" />Tolak
                                        </Button>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-0">
                                    <div className="px-4 py-3 space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Pengaju:</span>
                                                <span className="ml-2 font-medium">{pd.created_by.nama_lengkap}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Tanggal Kegiatan:</span>
                                                <span className="ml-2">{new Date(pd.tanggal_kegiatan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                                            </div>
                                        </div>
                                        {pd.keterangan && <p className="text-sm text-muted-foreground italic">{pd.keterangan}</p>}
                                        {pd.catatan_bendahara && (
                                            <p className="text-xs text-purple-700 bg-purple-50 rounded px-3 py-1.5">
                                                <span className="font-semibold">Catatan Bendahara:</span> {pd.catatan_bendahara}
                                            </p>
                                        )}
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-slate-50">
                                                    <TableHead className="text-xs w-8">No</TableHead>
                                                    <TableHead className="text-xs">Uraian</TableHead>
                                                    <TableHead className="text-xs text-center">Vol</TableHead>
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
                                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                                    <TableCell colSpan={5} className="text-xs font-semibold text-right">Total Anggaran</TableCell>
                                                    <TableCell className="text-sm font-bold text-right">{fmt(pd.total_anggaran)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>

            <Dialog open={dialog.open} onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.action === 'approve'
                                ? `Setujui — ${dialog.pd?.nomor_permohonan}`
                                : `Tolak — ${dialog.pd?.nomor_permohonan}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="rekomendasi">Catatan / Rekomendasi <span className="text-muted-foreground">(opsional)</span></Label>
                        <Textarea
                            id="rekomendasi"
                            placeholder="Tulis catatan atau rekomendasi..."
                            value={rekomendasi}
                            onChange={(e) => setRekomendasi(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(d => ({ ...d, open: false }))}>Batal</Button>
                        <Button
                            variant={dialog.action === 'reject' ? 'destructive' : 'default'}
                            onClick={confirm}
                        >
                            {dialog.action === 'approve' ? 'Setujui' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
