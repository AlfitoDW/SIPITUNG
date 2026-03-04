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
    { title: 'Awal', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan' },
];

type Indikator = { id: number; kode: string; nama: string; satuan: string; target: string };
type Sasaran   = { id: number; kode: string; nama: string; indikators: Indikator[] };
type PK        = { id: number; status: 'draft' | 'submitted' | 'approved' | 'rejected'; sasarans: Sasaran[] };
type Tahun     = { id: number; tahun: number; label: string };
type Props     = { tahun: Tahun; pk: PK | null };

const STATUS_CONFIG = {
    draft:     { label: 'Draft',         className: 'bg-slate-100 text-slate-700 border-slate-200' },
    submitted: { label: 'Menunggu',       className: 'bg-blue-100 text-blue-700 border-blue-200' },
    approved:  { label: 'Disetujui',      className: 'bg-green-100 text-green-700 border-green-200' },
    rejected:  { label: 'Ditolak',        className: 'bg-red-100 text-red-700 border-red-200' },
};

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',    kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',       accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40', kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',  accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',   kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',     accent: 'border-l-4 border-l-amber-500' },
};

function getColor(kode: string) {
    return sasaranColors[kode] ?? sasaranColors['S 1'];
}

function calcProgress(pk: PK | null): number {
    if (!pk) return 0;
    if (pk.status === 'approved') return 100;
    if (pk.status === 'submitted') return 80;
    const totalSasaran = pk.sasarans.length;
    if (totalSasaran === 0) return 10;
    const allHaveIndikator = pk.sasarans.every(s => s.indikators.length > 0);
    return allHaveIndikator ? 60 : 35;
}

function StatusBadge({ status }: { status: PK['status'] }) {
    const cfg = STATUS_CONFIG[status];
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

function StepItem({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-sm">
            {done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            }
            <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
    );
}

export default function Penyusunan({ tahun, pk }: Props) {
    const isEditable = !pk || pk.status === 'draft' || pk.status === 'rejected';
    const progress   = calcProgress(pk);

    // ── Dialog state ────────────────────────────────────────────────────────────
    const [sasaranDialog, setSasaranDialog]     = useState<{ open: boolean; editing: Sasaran | null }>({ open: false, editing: null });
    const [indikatorDialog, setIndikatorDialog] = useState<{ open: boolean; sasaranId: number | null; editing: Indikator | null }>({ open: false, sasaranId: null, editing: null });
    const [deleteDialog, setDeleteDialog]       = useState<{ open: boolean; type: 'sasaran' | 'indikator'; id: number | null; label: string }>({ open: false, type: 'sasaran', id: null, label: '' });
    const [submitDialog, setSubmitDialog]       = useState(false);

    // ── Form state ───────────────────────────────────────────────────────────────
    const [sasaranForm, setSasaranForm] = useState({ kode: '', nama: '' });
    const [indikatorForm, setIndikatorForm] = useState({ kode: '', nama: '', satuan: '', target: '' });

    // ── Handlers ─────────────────────────────────────────────────────────────────
    function openAddSasaran() {
        setSasaranForm({ kode: '', nama: '' });
        setSasaranDialog({ open: true, editing: null });
    }
    function openEditSasaran(s: Sasaran) {
        setSasaranForm({ kode: s.kode, nama: s.nama });
        setSasaranDialog({ open: true, editing: s });
    }
    function openAddIndikator(sasaranId: number) {
        setIndikatorForm({ kode: '', nama: '', satuan: '', target: '' });
        setIndikatorDialog({ open: true, sasaranId, editing: null });
    }
    function openEditIndikator(iku: Indikator) {
        setIndikatorForm({ kode: iku.kode, nama: iku.nama, satuan: iku.satuan, target: iku.target });
        setIndikatorDialog({ open: true, sasaranId: null, editing: iku });
    }

    function submitSasaran() {
        const { editing } = sasaranDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/sasaran/${editing.id}`, sasaranForm, {
                onSuccess: () => setSasaranDialog({ open: false, editing: null }),
            });
        } else {
            router.post('/ketua-tim/perencanaan/sasaran', { ...sasaranForm, perjanjian_kinerja_id: pk!.id }, {
                onSuccess: () => setSasaranDialog({ open: false, editing: null }),
            });
        }
    }

    function submitIndikator() {
        const { editing, sasaranId } = indikatorDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/indikator/${editing.id}`, indikatorForm, {
                onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }),
            });
        } else {
            router.post('/ketua-tim/perencanaan/indikator', { ...indikatorForm, sasaran_id: sasaranId }, {
                onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }),
            });
        }
    }

    function confirmDelete() {
        const { type, id } = deleteDialog;
        const url = type === 'sasaran'
            ? `/ketua-tim/perencanaan/sasaran/${id}`
            : `/ketua-tim/perencanaan/indikator/${id}`;
        router.delete(url, { onSuccess: () => setDeleteDialog({ open: false, type: 'sasaran', id: null, label: '' }) });
    }

    function submitPK() {
        router.patch('/ketua-tim/perencanaan/perjanjian-kinerja/awal/submit', {}, {
            onSuccess: () => setSubmitDialog(false),
        });
    }

    const totalIndikator = pk ? pk.sasarans.reduce((sum, s) => sum + s.indikators.length, 0) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan Awal — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── Header ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Awal</h1>
                            {pk && <StatusBadge status={pk.status} />}
                        </div>
                        <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {pk && isEditable && pk.sasarans.length > 0 && totalIndikator > 0 && (
                            <Button onClick={() => setSubmitDialog(true)}>
                                <Send className="h-4 w-4" />
                                Submit ke SuperAdmin
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Progress ── */}
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
                        <StepItem done={!!pk && (pk.status === 'submitted' || pk.status === 'approved')} label="Disubmit" />
                        <StepItem done={!!pk && pk.status === 'approved'} label="Disetujui" />
                    </div>
                </div>

                {/* ── Rejected banner ── */}
                {pk?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                        Dokumen ini ditolak. Silakan perbaiki dan submit ulang.
                    </div>
                )}

                {/* ── Submitted/Approved banner ── */}
                {pk && !isEditable && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        {pk.status === 'submitted' ? 'Dokumen sedang menunggu persetujuan SuperAdmin.' : 'Dokumen telah disetujui dan terkunci.'}
                    </div>
                )}

                {/* ── No PK yet ── */}
                {!pk ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Belum ada dokumen PK Awal</p>
                            <p className="text-sm text-muted-foreground mt-1">Mulai dengan membuat dokumen baru untuk tahun {tahun.label}</p>
                        </div>
                        <Button onClick={() => router.post('/ketua-tim/perencanaan/perjanjian-kinerja/awal/init', {})}>
                            <PlusCircle className="h-4 w-4" />
                            Buat Dokumen PK Awal
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* ── Sasaran list ── */}
                        {pk.sasarans.map((sasaran) => {
                            const color = getColor(sasaran.kode);
                            return (
                                <div key={sasaran.id} className={`rounded-xl border shadow-sm overflow-hidden ${color.accent}`}>
                                    {/* Sasaran header */}
                                    <div className={`flex items-center justify-between px-4 py-2.5 ${color.sasaranBg}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                            <span className="text-sm font-medium">{sasaran.nama}</span>
                                        </div>
                                        {isEditable && (
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSasaran(sasaran)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, type: 'sasaran', id: sasaran.id, label: sasaran.kode })}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Indikator table */}
                                    <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent bg-muted/50">
                                                <TableHead className="text-xs font-semibold">Indikator</TableHead>
                                                <TableHead className="text-xs font-semibold text-center w-24">Satuan</TableHead>
                                                <TableHead className="text-xs font-semibold text-center w-20">Target</TableHead>
                                                {isEditable && <TableHead className="text-xs font-semibold text-center w-20">Aksi</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sasaran.indikators.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={isEditable ? 4 : 3} className="text-center text-sm text-muted-foreground py-4">
                                                        Belum ada indikator
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sasaran.indikators.map((iku) => (
                                                    <TableRow key={iku.id} className="hover:bg-muted/30">
                                                        <TableCell className="text-sm">
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
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>

                                    {isEditable && (
                                        <div className="px-4 py-2 bg-muted/20 border-t">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => openAddIndikator(sasaran.id)}>
                                                <PlusCircle className="h-3.5 w-3.5" />
                                                Tambah Indikator
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isEditable && (
                            <Button variant="outline" className="self-start gap-2" onClick={openAddSasaran}>
                                <PlusCircle className="h-4 w-4" />
                                Tambah Sasaran
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Dialog: Tambah/Edit Sasaran ── */}
            <Dialog open={sasaranDialog.open} onOpenChange={(v) => setSasaranDialog(s => ({ ...s, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{sasaranDialog.editing ? 'Edit Sasaran' : 'Tambah Sasaran'}</DialogTitle>
                    </DialogHeader>
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

            {/* ── Dialog: Tambah/Edit Indikator ── */}
            <Dialog open={indikatorDialog.open} onOpenChange={(v) => setIndikatorDialog(s => ({ ...s, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{indikatorDialog.editing ? 'Edit Indikator' : 'Tambah Indikator'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Kode <span className="text-xs text-muted-foreground">(contoh: IKU 1.1)</span></Label>
                            <Input value={indikatorForm.kode} onChange={e => setIndikatorForm(f => ({ ...f, kode: e.target.value }))} placeholder="IKU 1.1" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Nama Indikator</Label>
                            <Input value={indikatorForm.nama} onChange={e => setIndikatorForm(f => ({ ...f, nama: e.target.value }))} placeholder="Uraian indikator kinerja..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Satuan</Label>
                                <Input value={indikatorForm.satuan} onChange={e => setIndikatorForm(f => ({ ...f, satuan: e.target.value }))} placeholder="%, Nilai, Predikat..." />
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

            {/* ── AlertDialog: Hapus ── */}
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

            {/* ── AlertDialog: Submit ── */}
            <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit PK Awal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen akan dikirim ke SuperAdmin untuk disetujui. Anda tidak dapat mengedit sebelum dokumen dikembalikan atau ditolak.
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
