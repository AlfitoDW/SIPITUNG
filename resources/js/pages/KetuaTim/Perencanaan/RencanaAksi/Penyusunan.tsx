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
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/rencana-aksi/penyusunan' },
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

type RA    = { id: number; status: 'draft' | 'submitted' | 'approved' | 'rejected'; indikators: Indikator[] };
type Tahun = { id: number; tahun: number; label: string };
type Props = { tahun: Tahun; ra: RA | null };

const STATUS_CONFIG = {
    draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-700 border-slate-200' },
    submitted: { label: 'Menunggu',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
    approved:  { label: 'Disetujui', className: 'bg-green-100 text-green-700 border-green-200' },
    rejected:  { label: 'Ditolak',   className: 'bg-red-100 text-red-700 border-red-200' },
};

type IndikatorFormState = {
    kode: string; nama: string; satuan: string; target: string;
    target_tw1: string; target_tw2: string; target_tw3: string; target_tw4: string;
};

const EMPTY_FORM: IndikatorFormState = { kode: '', nama: '', satuan: '', target: '', target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '' };

function calcProgress(ra: RA | null): number {
    if (!ra) return 0;
    if (ra.status === 'approved') return 100;
    if (ra.status === 'submitted') return 80;
    if (ra.indikators.length === 0) return 10;
    const withTw = ra.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length;
    return Math.round(10 + (withTw / ra.indikators.length) * 50);
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

export default function Penyusunan({ tahun, ra }: Props) {
    const isEditable = !ra || ra.status === 'draft' || ra.status === 'rejected';
    const progress   = calcProgress(ra);

    const [indikatorDialog, setIndikatorDialog] = useState<{ open: boolean; editing: Indikator | null }>({ open: false, editing: null });
    const [deleteId, setDeleteId]               = useState<number | null>(null);
    const [submitDialog, setSubmitDialog]       = useState(false);
    const [form, setForm]                       = useState<IndikatorFormState>(EMPTY_FORM);

    function openAdd()                    { setForm(EMPTY_FORM); setIndikatorDialog({ open: true, editing: null }); }
    function openEdit(i: Indikator)       { setForm({ kode: i.kode, nama: i.nama, satuan: i.satuan, target: i.target, target_tw1: i.target_tw1 ?? '', target_tw2: i.target_tw2 ?? '', target_tw3: i.target_tw3 ?? '', target_tw4: i.target_tw4 ?? '' }); setIndikatorDialog({ open: true, editing: i }); }
    function setField(k: keyof IndikatorFormState, v: string) { setForm(f => ({ ...f, [k]: v })); }

    function saveIndikator() {
        const payload = { ...form, target_tw1: form.target_tw1 || null, target_tw2: form.target_tw2 || null, target_tw3: form.target_tw3 || null, target_tw4: form.target_tw4 || null };
        const { editing } = indikatorDialog;
        if (editing) {
            router.put(`/ketua-tim/perencanaan/rencana-aksi/indikator/${editing.id}`, payload, { onSuccess: () => setIndikatorDialog({ open: false, editing: null }) });
        } else {
            router.post('/ketua-tim/perencanaan/rencana-aksi/indikator', { ...payload, rencana_aksi_id: ra!.id }, { onSuccess: () => setIndikatorDialog({ open: false, editing: null }) });
        }
    }

    function confirmDelete() {
        if (deleteId) router.delete(`/ketua-tim/perencanaan/rencana-aksi/indikator/${deleteId}`, { onSuccess: () => setDeleteId(null) });
    }

    function submitRA() {
        router.patch('/ketua-tim/perencanaan/rencana-aksi/submit', {}, { onSuccess: () => setSubmitDialog(false) });
    }

    const twFilled = ra ? ra.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length : 0;

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
                    {ra && isEditable && ra.indikators.length > 0 && (
                        <Button onClick={() => setSubmitDialog(true)}>
                            <Send className="h-4 w-4" />Submit ke SuperAdmin
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
                        <StepItem done={!!ra && ra.indikators.length > 0} label={`Indikator diisi (${ra?.indikators.length ?? 0})`} />
                        <StepItem done={twFilled > 0} label={`Target TW diisi (${twFilled}/${ra?.indikators.length ?? 0})`} />
                        <StepItem done={!!ra && (ra.status === 'submitted' || ra.status === 'approved')} label="Disubmit" />
                        <StepItem done={!!ra && ra.status === 'approved'} label="Disetujui" />
                    </div>
                </div>

                {ra?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                        Dokumen ini ditolak. Silakan perbaiki dan submit ulang.
                    </div>
                )}
                {ra && !isEditable && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                        {ra.status === 'submitted' ? 'Dokumen sedang menunggu persetujuan SuperAdmin.' : 'Dokumen telah disetujui dan terkunci.'}
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
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border shadow-sm overflow-hidden">
                            <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
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
                                    {ra.indikators.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={isEditable ? 8 : 7} className="text-center text-sm text-muted-foreground py-8">
                                                Belum ada indikator. Tambahkan indikator kinerja di bawah.
                                            </TableCell>
                                        </TableRow>
                                    ) : ra.indikators.map((iku) => (
                                        <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                            <TableCell className="text-sm align-top">
                                                <span className="inline-block mb-0.5 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {isEditable && (
                            <Button variant="outline" className="self-start gap-2" onClick={openAdd}>
                                <PlusCircle className="h-4 w-4" />Tambah Indikator
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog: Tambah/Edit Indikator RA */}
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
                            <div className="grid gap-1.5">
                                <Label>Target TW I</Label>
                                <Input value={form.target_tw1} onChange={e => setField('target_tw1', e.target.value)} placeholder="-" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target TW II</Label>
                                <Input value={form.target_tw2} onChange={e => setField('target_tw2', e.target.value)} placeholder="-" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target TW III</Label>
                                <Input value={form.target_tw3} onChange={e => setField('target_tw3', e.target.value)} placeholder="-" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target TW IV</Label>
                                <Input value={form.target_tw4} onChange={e => setField('target_tw4', e.target.value)} placeholder="-" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIndikatorDialog(s => ({ ...s, open: false }))}>Batal</Button>
                        <Button onClick={saveIndikator} disabled={!form.kode || !form.nama || !form.satuan || !form.target}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog: Hapus Indikator */}
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

            {/* AlertDialog: Submit RA */}
            <AlertDialog open={submitDialog} onOpenChange={setSubmitDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Rencana Aksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen akan dikirim ke SuperAdmin untuk disetujui. Anda tidak dapat mengedit sebelum dokumen dikembalikan atau ditolak.
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
