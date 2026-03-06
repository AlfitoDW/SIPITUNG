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
import { PlusCircle, Pencil, Trash2, Send, CheckCircle2, Circle, FileText } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Revisi', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan' },
];

type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string };
type Sasaran   = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK        = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'ppk_approved' | 'rejected'; sasarans: Sasaran[]; rekomendasi_kabag: string | null; rekomendasi_ppk: string | null; rejected_by: 'kabag_umum' | 'ppk' | null };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; pk: PK | null };

const STATUS_CONFIG = {
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

function calcProgress(pk: PK | null): number {
    if (!pk) return 0;
    if (pk.status === 'ppk_approved') return 100;
    if (pk.status === 'kabag_approved') return 90;
    if (pk.status === 'submitted') return 80;
    if (pk.sasarans.length === 0) return 10;
    return pk.sasarans.every(s => s.indikators.length > 0) ? 60 : 35;
}

function StatusBadge({ status }: { status: PK['status'] }) {
    const cfg = STATUS_CONFIG[status];
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

function StepItem({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-sm">
            {done ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
            <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
    );
}

export default function Penyusunan({ tahun, pk }: Props) {
    const isEditable = !pk || pk.status === 'draft' || pk.status === 'rejected';
    const progress   = calcProgress(pk);

    const [sasaranDialog, setSasaranDialog]     = useState<{ open: boolean; editing: Sasaran | null }>({ open: false, editing: null });
    const [indikatorDialog, setIndikatorDialog] = useState<{ open: boolean; sasaranId: number | null; editing: Indikator | null }>({ open: false, sasaranId: null, editing: null });
    const [deleteDialog, setDeleteDialog]       = useState<{ open: boolean; type: 'sasaran' | 'indikator'; id: number | null; label: string }>({ open: false, type: 'sasaran', id: null, label: '' });
    const [submitDialog, setSubmitDialog]       = useState(false);
    const [sasaranForm, setSasaranForm]         = useState({ kode: '', nama: '' });
    const [indikatorForm, setIndikatorForm]     = useState({ kode: '', nama: '', satuan: '', target: '' });

    function openAddSasaran()              { setSasaranForm({ kode: '', nama: '' }); setSasaranDialog({ open: true, editing: null }); }
    function openEditSasaran(s: Sasaran)   { setSasaranForm({ kode: s.kode, nama: s.nama }); setSasaranDialog({ open: true, editing: s }); }
    function openAddIndikator(id: number)  { setIndikatorForm({ kode: '', nama: '', satuan: '', target: '' }); setIndikatorDialog({ open: true, sasaranId: id, editing: null }); }
    function openEditIndikator(i: Indikator) { setIndikatorForm({ kode: i.kode, nama: i.nama, satuan: i.satuan, target: i.target }); setIndikatorDialog({ open: true, sasaranId: null, editing: i }); }

    function submitSasaran() {
        const { editing } = sasaranDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/sasaran/${editing.id}`, sasaranForm, { onSuccess: () => setSasaranDialog({ open: false, editing: null }) });
        } else {
            router.post('/ketua-tim/perencanaan/sasaran', { ...sasaranForm, perjanjian_kinerja_id: pk!.id }, { onSuccess: () => setSasaranDialog({ open: false, editing: null }) });
        }
    }

    function submitIndikator() {
        const { editing, sasaranId } = indikatorDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/indikator/${editing.id}`, indikatorForm, { onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }) });
        } else {
            router.post('/ketua-tim/perencanaan/indikator', { ...indikatorForm, sasaran_id: sasaranId }, { onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }) });
        }
    }

    function confirmDelete() {
        const { type, id } = deleteDialog;
        router.delete(type === 'sasaran' ? `/ketua-tim/perencanaan/sasaran/${id}` : `/ketua-tim/perencanaan/indikator/${id}`, {
            onSuccess: () => setDeleteDialog({ open: false, type: 'sasaran', id: null, label: '' }),
        });
    }

    function submitPK() {
        router.patch('/ketua-tim/perencanaan/perjanjian-kinerja/revisi/submit', {}, { onSuccess: () => setSubmitDialog(false) });
    }

    const totalIndikator = pk ? pk.sasarans.reduce((sum, s) => sum + s.indikators.length, 0) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan Revisi — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Revisi</h1>
                            {pk && <StatusBadge status={pk.status} />}
                        </div>
                        <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label}</p>
                    </div>
                    {pk && isEditable && pk.sasarans.length > 0 && totalIndikator > 0 && (
                        <Button onClick={() => setSubmitDialog(true)}>
                            <Send className="h-4 w-4" />Submit ke Kabag Umum
                        </Button>
                    )}
                </div>

                {/* Progress */}
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kesiapan Dokumen</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        <StepItem done={!!pk} label="Dokumen dibuat" />
                        <StepItem done={!!pk && pk.sasarans.length > 0} label={`Sasaran diisi (${pk?.sasarans.length ?? 0})`} />
                        <StepItem done={totalIndikator > 0} label={`Indikator diisi (${totalIndikator})`} />
                        <StepItem done={!!pk && pk.status !== 'draft' && pk.status !== 'rejected'} label="Disubmit" />
                        <StepItem done={!!pk && pk.status === 'ppk_approved'} label="Disetujui" />
                    </div>
                </div>

                {pk?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 space-y-1">
                        <p className="font-medium">Dokumen ditolak oleh {pk.rejected_by === 'kabag_umum' ? 'Kabag Umum' : 'PPK'}. Silakan perbaiki dan submit ulang.</p>
                        {(pk.rejected_by === 'kabag_umum' ? pk.rekomendasi_kabag : pk.rekomendasi_ppk) && (
                            <p className="text-red-600 dark:text-red-400">
                                <span className="font-medium">Rekomendasi: </span>
                                {pk.rejected_by === 'kabag_umum' ? pk.rekomendasi_kabag : pk.rekomendasi_ppk}
                            </p>
                        )}
                    </div>
                )}
                {pk && !isEditable && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        {pk.status === 'submitted' ? 'Dokumen sedang menunggu review Kabag Umum.' : pk.status === 'kabag_approved' ? 'Dokumen sedang menunggu review PPK.' : 'Dokumen telah disetujui dan terkunci.'}
                    </div>
                )}

                {!pk ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Belum ada dokumen PK Revisi</p>
                            <p className="text-sm text-muted-foreground mt-1">Mulai dengan membuat dokumen baru untuk tahun {tahun.label}</p>
                        </div>
                        <Button onClick={() => router.post('/ketua-tim/perencanaan/perjanjian-kinerja/revisi/init', {})}>
                            <PlusCircle className="h-4 w-4" />Buat Dokumen PK Revisi
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {pk.sasarans.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Belum ada sasaran. Tambahkan sasaran di bawah.</p>
                        ) : (
                            <div className="rounded-xl border shadow-sm overflow-hidden">
                                <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                            <TableHead className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                            <TableHead className={`text-center align-middle font-semibold text-white ${isEditable ? 'border-r border-white/20 w-20' : 'w-20'}`}>Target</TableHead>
                                            {isEditable && <TableHead className="text-center align-middle font-semibold text-white w-20">Aksi</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pk.sasarans.flatMap((sasaran) => {
                                            const color = getColor(sasaran.kode);
                                            const ikuCount = sasaran.indikators.length;
                                            const emptyRow = ikuCount === 0;
                                            const rowSpan = (emptyRow ? 1 : ikuCount) + (isEditable ? 1 : 0);

                                            const sasaranCell = (
                                                <TableCell rowSpan={rowSpan} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                    {isEditable && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditSasaran(sasaran)}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'sasaran', id: sasaran.id, label: sasaran.kode })}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );

                                            const rows: React.ReactNode[] = [];

                                            if (emptyRow) {
                                                rows.push(
                                                    <TableRow key={`${sasaran.id}-empty`} className="hover:bg-muted/30">
                                                        {sasaranCell}
                                                        <TableCell colSpan={isEditable ? 4 : 3} className="text-center text-sm text-muted-foreground py-4 italic">
                                                            Belum ada indikator
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            } else {
                                                sasaran.indikators.forEach((iku, idx) => {
                                                    rows.push(
                                                        <TableRow key={iku.id} className="hover:bg-muted/30 align-top">
                                                            {idx === 0 && sasaranCell}
                                                            <TableCell className="text-sm align-top">
                                                                <span className="inline-block mb-0.5 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                                <p className="leading-snug">{iku.nama}</p>
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm text-muted-foreground">{iku.satuan}</TableCell>
                                                            <TableCell className="text-center text-sm font-semibold">{iku.target}</TableCell>
                                                            {isEditable && (
                                                                <TableCell className="text-center">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditIndikator(iku)}>
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'indikator', id: iku.id, label: iku.kode })}>
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                });
                                            }

                                            if (isEditable) {
                                                rows.push(
                                                    <TableRow key={`${sasaran.id}-add`} className="hover:bg-muted/10 bg-muted/5">
                                                        <TableCell colSpan={4}>
                                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => openAddIndikator(sasaran.id)}>
                                                                <PlusCircle className="h-3.5 w-3.5" />
                                                                Tambah Indikator
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            return rows;
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {isEditable && (
                            <Button variant="outline" className="self-start gap-2" onClick={openAddSasaran}>
                                <PlusCircle className="h-4 w-4" />Tambah Sasaran
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <Dialog open={sasaranDialog.open} onOpenChange={(v) => setSasaranDialog(s => ({ ...s, open: v }))}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{sasaranDialog.editing ? 'Edit Sasaran' : 'Tambah Sasaran'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Kode <span className="text-xs text-muted-foreground">(contoh: S 1)</span></Label>
                            <Input value={sasaranForm.kode} onChange={e => setSasaranForm(f => ({ ...f, kode: e.target.value }))} placeholder="S 1" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Nama Sasaran</Label>
                            <Input value={sasaranForm.nama} onChange={e => setSasaranForm(f => ({ ...f, nama: e.target.value }))} placeholder="Uraian sasaran strategis..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSasaranDialog(s => ({ ...s, open: false }))}>Batal</Button>
                        <Button onClick={submitSasaran} disabled={!sasaranForm.kode || !sasaranForm.nama}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={indikatorDialog.open} onOpenChange={(v) => setIndikatorDialog(s => ({ ...s, open: v }))}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{indikatorDialog.editing ? 'Edit Indikator' : 'Tambah Indikator'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Kode</Label>
                            <Input value={indikatorForm.kode} onChange={e => setIndikatorForm(f => ({ ...f, kode: e.target.value }))} placeholder="IKU 1.1" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Nama Indikator</Label>
                            <Input value={indikatorForm.nama} onChange={e => setIndikatorForm(f => ({ ...f, nama: e.target.value }))} placeholder="Uraian indikator kinerja..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Satuan</Label>
                                <Input value={indikatorForm.satuan} onChange={e => setIndikatorForm(f => ({ ...f, satuan: e.target.value }))} placeholder="%, Nilai..." />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target</Label>
                                <Input value={indikatorForm.target} onChange={e => setIndikatorForm(f => ({ ...f, target: e.target.value }))} placeholder="89,75" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIndikatorDialog(s => ({ ...s, open: false }))}>Batal</Button>
                        <Button onClick={submitIndikator} disabled={!indikatorForm.kode || !indikatorForm.nama || !indikatorForm.satuan || !indikatorForm.target}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialog.open} onOpenChange={(v) => setDeleteDialog(d => ({ ...d, open: v }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {deleteDialog.type === 'sasaran' ? 'Sasaran' : 'Indikator'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteDialog.label}</strong> akan dihapus permanen.
                            {deleteDialog.type === 'sasaran' && ' Semua indikator di dalamnya juga akan terhapus.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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