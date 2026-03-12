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
import { PlusCircle, Pencil, Trash2, Send, CheckCircle2, Circle, FileText, Lock, Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/rencana-aksi/penyusunan' },
];

type Indikator = {
    id: number; kode: string; nama: string; satuan: string; target: string;
    target_tw1: string | null; target_tw2: string | null; target_tw3: string | null; target_tw4: string | null;
};
type Sasaran = { id: number; kode: string; nama: string; indikators: Indikator[] };
type RA      = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'ppk_approved' | 'rejected'; sasarans: Sasaran[]; rekomendasi_kabag: string | null; rekomendasi_ppk: string | null; rejected_by: 'kabag_umum' | 'ppk' | null };
type Tahun   = { id: number; tahun: number; label: string };
type Props   = { tahun: Tahun; ra: RA | null; sasarans: Sasaran[] };

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

function calcProgress(ra: RA | null): number {
    if (!ra) return 0;
    if (ra.status === 'ppk_approved') return 100;
    if (ra.status === 'kabag_approved') return 90;
    if (ra.status === 'submitted') return 80;
    const totalIndikator = ra.sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    if (totalIndikator === 0) return 10;
    const hasTw = ra.sasarans.some(sar => sar.indikators.some(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4));
    return hasTw ? 60 : 35;
}

function StatusBadge({ status }: { status: RA['status'] }) {
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

type IndikatorForm = { kode: string; nama: string; satuan: string; target: string; target_tw1: string; target_tw2: string; target_tw3: string; target_tw4: string };
const EMPTY_FORM: IndikatorForm = { kode: '', nama: '', satuan: '', target: '', target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '' };

export default function Penyusunan({ tahun, ra, sasarans }: Props) {
    const isEditable = !ra || ra.status === 'draft' || ra.status === 'rejected';
    const progress   = calcProgress(ra);

    const [indikatorDialog, setIndikatorDialog] = useState<{ open: boolean; sasaranId: number | null; editing: Indikator | null }>({ open: false, sasaranId: null, editing: null });
    const [deleteId, setDeleteId]               = useState<number | null>(null);
    const [submitDialog, setSubmitDialog]       = useState(false);
    const [form, setForm]                       = useState<IndikatorForm>(EMPTY_FORM);

    function openAdd(sasaranId: number) {
        setForm(EMPTY_FORM);
        setIndikatorDialog({ open: true, sasaranId, editing: null });
    }
    function openEdit(iku: Indikator) {
        setForm({ kode: iku.kode, nama: iku.nama, satuan: iku.satuan, target: iku.target, target_tw1: iku.target_tw1 ?? '', target_tw2: iku.target_tw2 ?? '', target_tw3: iku.target_tw3 ?? '', target_tw4: iku.target_tw4 ?? '' });
        setIndikatorDialog({ open: true, sasaranId: null, editing: iku });
    }
    function setField(k: keyof IndikatorForm, v: string) { setForm(f => ({ ...f, [k]: v })); }

    function saveIndikator() {
        const payload = { ...form, target_tw1: form.target_tw1 || null, target_tw2: form.target_tw2 || null, target_tw3: form.target_tw3 || null, target_tw4: form.target_tw4 || null };
        const { editing, sasaranId } = indikatorDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/rencana-aksi/indikator/${editing.id}`, payload, { onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }) });
        } else {
            router.post('/ketua-tim/perencanaan/rencana-aksi/indikator', { ...payload, sasaran_id: sasaranId }, { onSuccess: () => setIndikatorDialog({ open: false, sasaranId: null, editing: null }) });
        }
    }
    function confirmDelete() {
        if (deleteId) router.delete(`/ketua-tim/perencanaan/rencana-aksi/indikator/${deleteId}`, { onSuccess: () => setDeleteId(null) });
    }
    function submitRA() {
        router.patch('/ketua-tim/perencanaan/rencana-aksi/submit', {}, { onSuccess: () => setSubmitDialog(false) });
    }

    const displaySasarans: Sasaran[] = ra?.sasarans ?? sasarans;
    const totalIndikator = displaySasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const twFilled = displaySasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                            {ra && <StatusBadge status={ra.status} />}
                        </div>
                        <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                    </div>
                    {ra && isEditable && totalIndikator > 0 && (
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
                        <StepItem done={!!ra} label="Dokumen dibuat" />
                        <StepItem done={totalIndikator > 0} label={`Indikator diisi (${totalIndikator})`} />
                        <StepItem done={twFilled > 0} label={`Target TW diisi (${twFilled}/${totalIndikator})`} />
                        <StepItem done={!!ra && ra.status !== 'draft' && ra.status !== 'rejected'} label="Disubmit" />
                        <StepItem done={!!ra && ra.status === 'ppk_approved'} label="Disetujui" />
                    </div>
                </div>

                {ra?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 space-y-1">
                        <p className="font-medium">Dokumen ditolak oleh {ra.rejected_by === 'kabag_umum' ? 'Kabag Umum' : 'PPK'}. Silakan perbaiki dan submit ulang.</p>
                        {(ra.rejected_by === 'kabag_umum' ? ra.rekomendasi_kabag : ra.rekomendasi_ppk) && (
                            <p className="text-red-600 dark:text-red-400">
                                <span className="font-medium">Rekomendasi: </span>
                                {ra.rejected_by === 'kabag_umum' ? ra.rekomendasi_kabag : ra.rekomendasi_ppk}
                            </p>
                        )}
                    </div>
                )}
                {ra && !isEditable && (
                    <div className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border">
                                {ra.status === 'submitted'
                                    ? <Loader2      className="h-4 w-4 animate-spin text-sky-400" />
                                    : ra.status === 'kabag_approved'
                                    ? <CheckCircle2 className="h-4 w-4 text-amber-400" />
                                    : <Lock         className="h-4 w-4 text-emerald-500" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                    {ra.status === 'submitted'      ? 'Menunggu Review Kabag Umum' :
                                     ra.status === 'kabag_approved' ? 'Disetujui Kabag Umum' :
                                                                      'Dokumen Terkunci'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {ra.status === 'submitted'      ? 'Dokumen telah disubmit dan sedang dalam antrian review.' :
                                     ra.status === 'kabag_approved' ? 'Sedang menunggu persetujuan dari PPK.' :
                                                                      'Telah mendapat persetujuan penuh. Dokumen tidak dapat diubah.'}
                                </p>
                            </div>
                        </div>
                        {(ra.status === 'kabag_approved' || ra.status === 'ppk_approved') && ra.rekomendasi_kabag && (
                            <div className="mt-3 pt-3 border-t border-border/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1.5">Catatan Kabag Umum</p>
                                <p className="text-sm leading-relaxed pl-3 border-l-2 border-l-border italic text-muted-foreground">{ra.rekomendasi_kabag}</p>
                            </div>
                        )}
                        {ra.status === 'ppk_approved' && ra.rekomendasi_ppk && (
                            <div className="mt-3 pt-3 border-t border-border/60">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60 mb-1.5">Catatan PPK</p>
                                <p className="text-sm leading-relaxed pl-3 border-l-2 border-l-border italic text-muted-foreground">{ra.rekomendasi_ppk}</p>
                            </div>
                        )}
                    </div>
                )}

                {!ra ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Belum ada dokumen Rencana Aksi</p>
                            <p className="text-sm text-muted-foreground mt-1">Mulai dengan membuat dokumen baru untuk tahun {tahun.label}</p>
                        </div>
                        <Button onClick={() => router.post('/ketua-tim/perencanaan/rencana-aksi/init', {})}>
                            <PlusCircle className="h-4 w-4" />Buat Dokumen Rencana Aksi
                        </Button>
                    </div>
                ) : displaySasarans.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                        Belum ada sasaran. Buat Perjanjian Kinerja Awal terlebih dahulu agar sasaran dapat digunakan di sini.
                    </div>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                    <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                    {isEditable && <TableHead rowSpan={2} className="text-center font-semibold text-white w-20">Aksi</TableHead>}
                                </TableRow>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                        <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displaySasarans.flatMap((sasaran) => {
                                    const color   = getColor(sasaran.kode);
                                    const count   = sasaran.indikators.length;
                                    // rowspan mencakup baris indikator + 1 baris "Tambah Indikator" (jika editable)
                                    const rowSpan = isEditable ? count + 1 : Math.max(count, 1);

                                    const indikatorRows = count === 0
                                        ? [(
                                            <TableRow key={`${sasaran.id}-empty`} className="hover:bg-muted/20">
                                                <TableCell rowSpan={rowSpan} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                </TableCell>
                                                <TableCell colSpan={isEditable ? 5 : 6} className="text-center text-sm text-muted-foreground py-4 italic">
                                                    Belum ada indikator
                                                </TableCell>
                                                {isEditable && (
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAdd(sasaran.id)}>
                                                            <PlusCircle className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )]
                                        : sasaran.indikators.map((iku, idx) => (
                                            <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                                {idx === 0 && (
                                                    <TableCell rowSpan={rowSpan} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
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
                                                <TableCell className="text-center text-sm">{iku.target_tw1 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                <TableCell className="text-center text-sm">{iku.target_tw2 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                <TableCell className="text-center text-sm">{iku.target_tw3 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                <TableCell className="text-center text-sm">{iku.target_tw4 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                                {isEditable && (
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(iku)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(iku.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ));

                                    const addRow = isEditable
                                        ? [(
                                            <TableRow key={`${sasaran.id}-add`} className="hover:bg-muted/10">
                                                <TableCell colSpan={isEditable ? 8 : 7} className="py-1 pl-3">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => openAdd(sasaran.id)}>
                                                        <PlusCircle className="h-3.5 w-3.5" />Tambah Indikator
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )]
                                        : [];

                                    return [...indikatorRows, ...addRow];
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Dialog: Tambah/Edit Indikator */}
            <Dialog open={indikatorDialog.open} onOpenChange={(v) => setIndikatorDialog(s => ({ ...s, open: v }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{indikatorDialog.editing ? 'Edit Indikator' : 'Tambah Indikator'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label>Kode</Label>
                            <Input value={form.kode} onChange={e => setField('kode', e.target.value)} placeholder="IKU 1.1" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Nama Indikator</Label>
                            <Input value={form.nama} onChange={e => setField('nama', e.target.value)} placeholder="Uraian indikator kinerja..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Satuan</Label>
                                <Input value={form.satuan} onChange={e => setField('satuan', e.target.value)} placeholder="%, Nilai..." />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target Tahunan</Label>
                                <Input value={form.target} onChange={e => setField('target', e.target.value)} placeholder="89,75" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5"><Label>Target TW I</Label><Input value={form.target_tw1} onChange={e => setField('target_tw1', e.target.value)} placeholder="-" /></div>
                            <div className="grid gap-1.5"><Label>Target TW II</Label><Input value={form.target_tw2} onChange={e => setField('target_tw2', e.target.value)} placeholder="-" /></div>
                            <div className="grid gap-1.5"><Label>Target TW III</Label><Input value={form.target_tw3} onChange={e => setField('target_tw3', e.target.value)} placeholder="-" /></div>
                            <div className="grid gap-1.5"><Label>Target TW IV</Label><Input value={form.target_tw4} onChange={e => setField('target_tw4', e.target.value)} placeholder="-" /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIndikatorDialog(s => ({ ...s, open: false }))}>Batal</Button>
                        <Button onClick={saveIndikator} disabled={!form.kode || !form.nama || !form.satuan || !form.target}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Hapus */}
            <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Indikator?</AlertDialogTitle>
                        <AlertDialogDescription>Indikator ini akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog: Submit */}
            <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Rencana Aksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen akan dikirim ke Kabag Umum untuk direview. Anda tidak dapat mengedit sebelum dokumen dikembalikan atau ditolak.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={submitRA}>Ya, Submit</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
