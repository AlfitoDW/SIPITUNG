import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Pencil, Send, CheckCircle2, Circle, FileText, Lock, Loader2, PlusCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Revisi', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan' },
];

type PicTimKerja = { id: number; nama: string; kode: string; nama_singkat: string };
type Indikator   = { id: number; kode: string; nama: string; satuan: string; target: string; pic_tim_kerjas: PicTimKerja[] };
type Sasaran     = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK          = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'ppk_approved' | 'rejected'; rekomendasi_kabag: string | null; rekomendasi_ppk: string | null; rejected_by: 'kabag_umum' | 'ppk' | null };
type Tahun       = { id: number; tahun: number; label: string };
type Props       = { tahun: Tahun; pk: PK | null; sasarans: Sasaran[]; ownIkuCount: number; ownFilledCount: number; collaboratorSubmittedBy: string | null };

const STATUS_CONFIG = {
    draft:          { label: 'Draft',          className: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-yellow-100 text-yellow-800 border-yellow-400' },
    kabag_approved: { label: 'Menunggu PPK',   className: 'bg-orange-100 text-orange-800 border-orange-400' },
    ppk_approved:   { label: 'Terkunci',       className: 'bg-green-100 text-green-800 border-green-400' },
    rejected:       { label: 'Ditolak',        className: 'bg-red-100 text-red-800 border-red-400' },
};

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

function calcProgress(pk: PK | null, ownIkuCount: number, ownFilledCount: number, collaboratorSubmittedBy: string | null, totalIndikator: number, filledTarget: number): number {
    if (collaboratorSubmittedBy) return 80;
    if (!pk) return totalIndikator > 0 ? Math.round((filledTarget / totalIndikator) * 50 + 10) : 10;
    if (pk.status === 'ppk_approved') return 100;
    if (pk.status === 'kabag_approved') return 90;
    if (pk.status === 'submitted') return 80;
    if (ownIkuCount === 0) return totalIndikator > 0 ? Math.round((filledTarget / totalIndikator) * 50 + 10) : 10;
    return ownFilledCount === ownIkuCount ? 60 : 35;
}

export default function Penyusunan({ tahun, pk, sasarans, ownIkuCount, ownFilledCount, collaboratorSubmittedBy }: Props) {
    const isEditable = !pk || pk.status === 'draft' || pk.status === 'rejected';
    const totalIndikator = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledTarget   = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target).length, 0);
    const progress       = calcProgress(pk, ownIkuCount, ownFilledCount, collaboratorSubmittedBy, totalIndikator, filledTarget);

    const [targetDialog, setTargetDialog] = useState<{ open: boolean; iku: Indikator | null }>({ open: false, iku: null });
    const [targetVal, setTargetVal]       = useState('');
    const [submitDialog, setSubmitDialog] = useState(false);

    function openTargetEdit(iku: Indikator) {
        setTargetVal(iku.target ?? '');
        setTargetDialog({ open: true, iku });
    }

    function saveTarget() {
        if (!targetDialog.iku) return;
        router.patch(`/ketua-tim/perencanaan/indikator/${targetDialog.iku.id}/target`, { target: targetVal }, {
            onSuccess: () => setTargetDialog({ open: false, iku: null }),
        });
    }

    function submitPK() {
        router.patch('/ketua-tim/perencanaan/perjanjian-kinerja/revisi/submit', {}, {
            onSuccess: () => setSubmitDialog(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan Revisi — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Revisi</h1>
                            {pk && <Badge variant="outline" className={STATUS_CONFIG[pk.status].className}>{STATUS_CONFIG[pk.status].label}</Badge>}
                        </div>
                        <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label}</p>
                    </div>
                    {pk && isEditable && totalIndikator > 0 &&
                     (ownIkuCount === 0 ? filledTarget === totalIndikator : ownFilledCount === ownIkuCount) && (
                        <Button onClick={() => setSubmitDialog(true)}>
                            <Send className="h-4 w-4" /> Submit ke Kabag Umum
                        </Button>
                    )}
                </div>

                {/* Progress */}
                {totalIndikator > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Kesiapan Dokumen</span>
                            <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                            {[
                                { done: !!pk,                                                                         label: 'Dokumen dibuat' },
                                { done: totalIndikator > 0,                                                           label: `IKU tersedia (${totalIndikator})` },
                                { done: filledTarget === totalIndikator && totalIndikator > 0,                        label: `Target diisi (${filledTarget}/${totalIndikator})` },
                                { done: (!!pk && pk.status !== 'draft' && pk.status !== 'rejected') || !!collaboratorSubmittedBy, label: 'Disubmit' },
                                { done: !!pk && pk.status === 'ppk_approved',                                         label: 'Disetujui' },
                            ].map(({ done, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    {done ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> : <Circle className="h-5 w-5 text-red-400 shrink-0" />}
                                    <span className={`text-base font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Collaborator already submitted banner */}
                {collaboratorSubmittedBy && (
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                                <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">Sudah Disubmit oleh Kolaborator</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    <span className="font-medium">{collaboratorSubmittedBy}</span> telah mengajukan PK yang mencakup IKU bersama. Submit oleh tim Anda tidak diperlukan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rejected banner */}
                {pk?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 space-y-1">
                        <p className="font-medium">Dokumen ditolak oleh {pk.rejected_by === 'kabag_umum' ? 'Kabag Umum' : 'PPK'}. Silakan perbaiki dan submit ulang.</p>
                        {(pk.rejected_by === 'kabag_umum' ? pk.rekomendasi_kabag : pk.rekomendasi_ppk) && (
                            <p><span className="font-medium">Rekomendasi: </span>{pk.rejected_by === 'kabag_umum' ? pk.rekomendasi_kabag : pk.rekomendasi_ppk}</p>
                        )}
                    </div>
                )}

                {/* Submitted/Approved banner */}
                {pk && !isEditable && (
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                                {pk.status === 'submitted'      ? <Loader2      className="h-4 w-4 animate-spin text-sky-400" />
                                : pk.status === 'kabag_approved' ? <CheckCircle2 className="h-4 w-4 text-amber-400" />
                                :                                  <Lock         className="h-4 w-4 text-emerald-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                    {pk.status === 'submitted'      ? 'Menunggu Review Kabag Umum'
                                    : pk.status === 'kabag_approved' ? 'Disetujui Kabag Umum'
                                    :                                  'Dokumen Terkunci'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {pk.status === 'submitted'      ? 'Dokumen telah disubmit dan sedang dalam antrian review.'
                                    : pk.status === 'kabag_approved' ? 'Sedang menunggu persetujuan dari PPK.'
                                    :                                  'Telah mendapat persetujuan penuh. Dokumen tidak dapat diubah.'}
                                </p>
                            </div>
                        </div>
                        {(pk.status === 'kabag_approved' || pk.status === 'ppk_approved') && pk.rekomendasi_kabag && (
                            <div className="mt-3 pt-3 border-t border-border/60">
                                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1.5">📋 Catatan Kabag Umum</p>
                                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-950/30 dark:border-amber-800">
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{pk.rekomendasi_kabag}</p>
                                </div>
                            </div>
                        )}
                        {pk.status === 'ppk_approved' && pk.rekomendasi_ppk && (
                            <div className="mt-3 pt-3 border-t border-border/60">
                                <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-1.5">📋 Catatan PPK</p>
                                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 dark:bg-blue-950/30 dark:border-blue-800">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{pk.rekomendasi_ppk}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No PK yet (primary PIC with no doc and no IKUs) */}
                {!pk && sasarans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Belum ada dokumen PK Revisi</p>
                            <p className="text-sm text-muted-foreground mt-1">Mulai dengan membuat dokumen baru untuk tahun {tahun.label}</p>
                        </div>
                        <Button onClick={() => router.post('/ketua-tim/perencanaan/perjanjian-kinerja/revisi/init', {})}>
                            <PlusCircle className="h-4 w-4" /> Buat Dokumen PK Revisi
                        </Button>
                    </div>
                ) : !pk && sasarans.length > 0 ? (
                    <>
                        <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                            <p className="text-sm text-muted-foreground">
                                Anda adalah co-PIC untuk IKU berikut. Buat dokumen PK untuk dapat mengajukan ke Kabag Umum.
                            </p>
                            <Button size="sm" onClick={() => router.post('/ketua-tim/perencanaan/perjanjian-kinerja/revisi/init', {})}>
                                <PlusCircle className="h-4 w-4" /> Buat Dokumen PK Revisi
                            </Button>
                        </div>
                        <div className="rounded-xl border shadow-sm overflow-hidden">
                            <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                        <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                        <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
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
                                                    <TableCell rowSpan={Math.max(count, 1)} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                        <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                        <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-sm align-top">
                                                    <span className="inline-block mb-0.5 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                    <p className="leading-snug">{iku.nama}</p>
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                <TableCell className="text-center align-middle">
                                                    <span className="text-sm font-semibold">{iku.target || '-'}</span>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : sasarans.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada data IKU. Hubungi SuperAdmin.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        {isEditable && (
                            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
                                Isi kolom <span className="font-semibold text-foreground">Target</span> untuk setiap IKU
                                {pk && ', kemudian submit ke Kabag Umum'}.
                            </div>
                        )}
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                    <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
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
                                    placeholder="Contoh: 89,75"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && saveTarget()}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTargetDialog({ open: false, iku: null })}>Batal</Button>
                        <Button onClick={saveTarget} disabled={!targetVal.trim()}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Submit */}
            <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit PK Revisi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen akan dikirim ke Kabag Umum untuk direview. Anda tidak dapat mengedit sebelum dokumen dikembalikan atau ditolak.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={submitPK}>Ya, Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
