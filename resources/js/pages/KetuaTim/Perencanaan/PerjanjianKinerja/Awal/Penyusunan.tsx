import { Head, router } from '@inertiajs/react';
import { Pencil, Send, FileText, Lock, Loader2, PlusCircle, X, AlertCircle } from 'lucide-react';
import React from 'react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Awal', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan' },
];

type PicTimKerja = { id: number; nama: string; kode: string; nama_singkat: string };
type Indikator   = { id: number; kode: string; nama: string; satuan: string; target: string; pic_tim_kerjas: PicTimKerja[] };
type Sasaran     = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK          = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'rejected'; rekomendasi_kabag: string | null };
type Tahun       = { id: number; tahun: number; label: string };
type Props       = { tahun: Tahun; pk: PK | null; sasarans: Sasaran[]; isOwner: boolean; canInit: boolean };

const STATUS_CONFIG = {
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

/** Menghasilkan teks placeholder yang sesuai dengan satuan IKU */
function targetPlaceholder(satuan: string): string {
    const s = satuan.trim().toLowerCase();
    if (s === '%' || s === 'persen') return 'Contoh: 89,75';
    return 'Masukkan nilai target';
}

export default function Penyusunan({ tahun, pk, sasarans, isOwner, canInit }: Props) {
    const isEditable     = isOwner && (!pk || pk.status === 'draft' || pk.status === 'rejected');
    const totalIndikator = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledTarget   = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target).length, 0);

    const [targetDialog, setTargetDialog] = useState<{ open: boolean; iku: Indikator | null }>({ open: false, iku: null });
    const [targetVal, setTargetVal]       = useState('');
    const [submitDialog, setSubmitDialog] = useState(false);
    const [saving, setSaving]             = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [rejectedVisible, setRejectedVisible] = useState(true);
    const [rejectedDismissed, setRejectedDismissed] = useState(false);
    const [statusVisible, setStatusVisible] = useState(true);
    const [statusDismissed, setStatusDismissed] = useState(false);

    function dismissRejected() {
        setRejectedVisible(false);
        setTimeout(() => setRejectedDismissed(true), 300);
    }
    function dismissStatus() {
        setStatusVisible(false);
        setTimeout(() => setStatusDismissed(true), 300);
    }

    function openTargetEdit(iku: Indikator) {
        setTargetVal(iku.target ?? '');
        setTargetDialog({ open: true, iku });
    }

    function saveTarget() {
        if (!targetDialog.iku) return;
        // Normalisasi: ganti koma dengan titik agar backend bisa parseFloat
        const normalized = targetVal.replace(',', '.');
        setSaving(true);
        router.patch(`/ketua-tim/perencanaan/indikator/${targetDialog.iku.id}/target`, { target: normalized }, {
            onSuccess: () => setTargetDialog({ open: false, iku: null }),
            onFinish: () => setSaving(false),
        });
    }

    function submitPK() {
        setSubmitting(true);
        router.patch('/ketua-tim/perencanaan/perjanjian-kinerja/awal/submit', {}, {
            onSuccess: () => setSubmitDialog(false),
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan Awal — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Awal</h1>
                            {pk && <Badge variant="outline" className={STATUS_CONFIG[pk.status].className}>{STATUS_CONFIG[pk.status].label}</Badge>}
                        </div>
                        <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label}</p>
                    </div>
                    {pk && isEditable && totalIndikator > 0 && filledTarget === totalIndikator && (
                        <Button onClick={() => setSubmitDialog(true)}>
                            <Send className="h-4 w-4" /> Submit ke Kabag Umum
                        </Button>
                    )}
                </div>

                {/* Rejected banner */}
                {pk?.status === 'rejected' && !rejectedDismissed && (
                    <div className={`rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 overflow-hidden transition-all duration-300 ${rejectedVisible ? 'opacity-100 max-h-50' : 'opacity-0 max-h-0 py-0'}`}>
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-1">
                                <p className="font-medium">Dokumen ditolak oleh Kabag Umum. Silakan perbaiki dan submit ulang.</p>
                                {pk.rekomendasi_kabag && (
                                    <p><span className="font-medium">Rekomendasi: </span>{pk.rekomendasi_kabag}</p>
                                )}
                            </div>
                            <button onClick={dismissRejected} className="shrink-0 rounded p-0.5 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Submitted/Approved banner — hanya untuk owner */}
                {pk && isOwner && !isEditable && !statusDismissed && (
                    <div className={`rounded-xl border bg-muted/30 overflow-hidden transition-all duration-300 ${statusVisible ? 'opacity-100 max-h-[400px]' : 'opacity-0 max-h-0'}`}>
                        <div className="p-4">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                                    {pk.status === 'submitted'
                                        ? <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                                        : <Lock    className="h-4 w-4 text-emerald-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                        {pk.status === 'submitted' ? 'Menunggu Review Kabag Umum' : 'Dokumen Terkunci'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {pk.status === 'submitted'
                                            ? 'Dokumen telah disubmit dan sedang dalam antrian review.'
                                            : 'Telah disetujui Kabag Umum. Dokumen tidak dapat diubah.'}
                                    </p>
                                </div>
                                <button onClick={dismissStatus} className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {pk.status === 'kabag_approved' && pk.rekomendasi_kabag && (
                                <div className="mt-3 pt-3 border-t border-border/60">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5">📋 Catatan Kabag Umum</p>
                                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-950/30 dark:border-amber-800">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{pk.rekomendasi_kabag}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* No PK yet */}
                {!pk ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Belum ada dokumen PK Awal</p>
                            <p className="text-sm text-muted-foreground mt-1">Dokumen belum dibuat oleh Tim Perencanaan dan Keuangan.</p>
                        </div>
                        {canInit && (
                            <Button onClick={() => router.post('/ketua-tim/perencanaan/perjanjian-kinerja/awal/init', {})}>
                                <PlusCircle className="h-4 w-4" /> Buat Dokumen PK Awal
                            </Button>
                        )}
                    </div>
                ) : sasarans.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada data IKU. Hubungi SuperAdmin.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        {isEditable && (
                            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
                                Isi kolom <span className="font-semibold text-foreground">Target</span> untuk setiap IKU, kemudian submit ke Kabag Umum.
                            </div>
                        )}
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-56">Sasaran</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-32">PIC Tim Kerja</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                    <TableHead className="text-center align-middle font-semibold text-white w-28">Target</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sasarans.flatMap((sasaran) => {
                                    const color = getColor(sasaran.kode);
                                    const count = sasaran.indikators.length;

                                    return sasaran.indikators.map((iku, idx) => (
                                        <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                            {idx === 0 && (
                                                <TableCell rowSpan={Math.max(count, 1)}
                                                    className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm align-top">
                                                <span className="inline-block mb-0.5 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
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
                                                                {t.nama_singkat}
                                                            </span>
                                                        ))
                                                        : <span className="text-xs text-muted-foreground">—</span>
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                            <TableCell className="text-center align-middle">
                                                {isEditable ? (
                                                    <button
                                                        onClick={() => openTargetEdit(iku)}
                                                        className="group flex items-center justify-center gap-1.5 mx-auto rounded px-2 py-1 hover:bg-primary/10 transition-colors"
                                                    >
                                                        <span className={`text-sm font-semibold ${iku.target ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                                                            {iku.target || 'Isi target'}
                                                        </span>
                                                        <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                                    </button>
                                                ) : (
                                                    <span className="text-sm font-semibold">{iku.target}</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ));
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Dialog: Edit Target */}
            <Dialog open={targetDialog.open} onOpenChange={(v) => setTargetDialog(d => ({ ...d, open: v }))}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit Target</DialogTitle>
                    </DialogHeader>
                    {targetDialog.iku && (
                        <div className="space-y-4 py-1">
                            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                                <p className="text-xs text-muted-foreground mb-0.5">{targetDialog.iku.kode}</p>
                                <p className="font-medium leading-snug">{targetDialog.iku.nama}</p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target ({targetDialog.iku.satuan})</Label>
                                <Input
                                    value={targetVal}
                                    onChange={e => setTargetVal(e.target.value)}
                                    placeholder={targetPlaceholder(targetDialog.iku.satuan)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && saveTarget()}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTargetDialog({ open: false, iku: null })} disabled={saving}>Batal</Button>
                        <Button onClick={saveTarget} loading={saving} disabled={!targetVal.trim()}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Submit */}
            <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit PK Awal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen akan dikirim ke Kabag Umum untuk direview. Anda tidak dapat mengedit sebelum dokumen dikembalikan atau ditolak.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={submitPK} disabled={submitting}>
                            {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            Ya, Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
