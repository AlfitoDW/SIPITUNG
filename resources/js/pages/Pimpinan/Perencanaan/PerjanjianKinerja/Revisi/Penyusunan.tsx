import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '#' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Revisi', href: '/pimpinan/perencanaan/perjanjian-kinerja/revisi' },
];

type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string };
type Sasaran   = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK        = { id: number; status: string; sasarans: Sasaran[]; tim_kerja: { nama_singkat: string } };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; pks: PK[]; role: 'kabag_umum' | 'ppk' };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    draft:          { label: 'Draft',          className: 'bg-slate-100 text-slate-700 border-slate-200' },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    kabag_approved: { label: 'Menunggu PPK',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
    ppk_approved:   { label: 'Terkunci',       className: 'bg-green-100 text-green-700 border-green-200' },
    rejected:       { label: 'Ditolak',        className: 'bg-red-100 text-red-700 border-red-200' },
};

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

type ActionDialog = { open: boolean; pkId: number | null; action: 'approve' | 'reject'; label: string };

export default function Penyusunan({ tahun, pks, role }: Props) {
    const [dialog, setDialog] = useState<ActionDialog>({ open: false, pkId: null, action: 'approve', label: '' });
    const [rekomendasi, setRekomendasi] = useState('');

    function openDialog(pk: PK, action: 'approve' | 'reject') {
        setRekomendasi('');
        setDialog({ open: true, pkId: pk.id, action, label: pk.tim_kerja.nama_singkat });
    }

    function confirm() {
        const { pkId, action } = dialog;
        router.post(`/pimpinan/perencanaan/perjanjian-kinerja/${pkId}/${action}`, { rekomendasi }, {
            onSuccess: () => setDialog(d => ({ ...d, open: false })),
        });
    }

    const roleLabel = role === 'kabag_umum' ? 'Kabag Umum' : 'PPK';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PK Revisi — Perencanaan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Review PK Revisi</h1>
                    <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label} · Anda login sebagai <span className="font-medium">{roleLabel}</span></p>
                </div>

                {pks.length === 0 ? (
                    <p className="text-muted-foreground">Tidak ada dokumen yang perlu direview saat ini.</p>
                ) : (
                    <Accordion type="multiple" className="flex flex-col gap-2">
                        {pks.map((pk) => {
                            const statusCfg = STATUS_CONFIG[pk.status] ?? STATUS_CONFIG['draft'];
                            return (
                                <AccordionItem key={pk.id} value={`pk-${pk.id}`} className="rounded-xl border shadow-sm overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/40">
                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                            <span className="text-sm font-semibold">{pk.tim_kerja.nama_singkat}</span>
                                            <Badge variant="outline" className={statusCfg.className}>{statusCfg.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 mr-2">
                                            <Button size="sm" variant="outline" className="h-7 gap-1.5 border-green-300 text-green-700 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); openDialog(pk, 'approve'); }}>
                                                <CheckCircle2 className="h-3.5 w-3.5" />Setujui
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 gap-1.5 border-red-300 text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); openDialog(pk, 'reject'); }}>
                                                <XCircle className="h-3.5 w-3.5" />Tolak
                                            </Button>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0">
                                        {pk.sasarans.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic px-4 py-3">Belum ada data sasaran.</p>
                                        ) : (
                                            <div className="overflow-hidden">
                                                <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                                    <TableHeader>
                                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                                            <TableHead className="text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {pk.sasarans.flatMap((sasaran) => {
                                                            const color = getColor(sasaran.kode);
                                                            return sasaran.indikators.map((iku, idx) => (
                                                                <TableRow key={`${sasaran.id}-${iku.id}`} className="align-top hover:bg-muted/30">
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
                                                                    <TableCell className="text-center text-sm text-muted-foreground">{iku.satuan}</TableCell>
                                                                    <TableCell className="text-center text-sm font-semibold">{iku.target}</TableCell>
                                                                </TableRow>
                                                            ));
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>

            <Dialog open={dialog.open} onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.action === 'approve' ? `Setujui PK Revisi — ${dialog.label}` : `Tolak PK Revisi — ${dialog.label}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="rekomendasi">Rekomendasi <span className="text-muted-foreground">(opsional)</span></Label>
                        <Textarea
                            id="rekomendasi"
                            placeholder="Tulis rekomendasi atau catatan..."
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
