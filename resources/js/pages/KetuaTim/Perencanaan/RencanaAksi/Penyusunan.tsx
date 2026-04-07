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
import { Pencil, Send, CheckCircle2, Circle, FileText, Lock, Loader2, PlusCircle, Users } from 'lucide-react';

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
type RA      = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'ppk_approved' | 'rejected'; rekomendasi_kabag: string | null; rekomendasi_ppk: string | null; rejected_by: 'kabag_umum' | 'ppk' | null };
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

function calcProgress(ra: RA | null, sasarans: Sasaran[]): number {
    if (!ra) return 0;
    if (ra.status === 'ppk_approved') return 100;
    if (ra.status === 'kabag_approved') return 90;
    if (ra.status === 'submitted') return 80;
    const total = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    if (total === 0) return 10;
    const twFilled = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length, 0);
    return twFilled === total ? 60 : 35;
}

type TwForm = { target: string; target_tw1: string; target_tw2: string; target_tw3: string; target_tw4: string };
const EMPTY_TW: TwForm = { target: '', target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '' };

export default function Penyusunan({ tahun, ra, sasarans }: Props) {
    const isEditable  = !ra || ra.status === 'draft' || ra.status === 'rejected';
    const isCoPicMode = !ra && sasarans.length > 0;
    const progress    = calcProgress(ra, sasarans);

    const [editDialog, setEditDialog] = useState<{ open: boolean; iku: Indikator | null }>({ open: false, iku: null });
    const [form, setForm]             = useState<TwForm>(EMPTY_TW);
    const [submitDialog, setSubmitDialog] = useState(false);

    function openEdit(iku: Indikator) {
        setForm({
            target:      iku.target ?? '',
            target_tw1:  iku.target_tw1 ?? '',
            target_tw2:  iku.target_tw2 ?? '',
            target_tw3:  iku.target_tw3 ?? '',
            target_tw4:  iku.target_tw4 ?? '',
        });
        setEditDialog({ open: true, iku });
    }

    function saveEdit() {
        if (!editDialog.iku) return;
        const payload = {
            target:      form.target,
            target_tw1:  form.target_tw1 || null,
            target_tw2:  form.target_tw2 || null,
            target_tw3:  form.target_tw3 || null,
            target_tw4:  form.target_tw4 || null,
        };
        router.patch(`/ketua-tim/perencanaan/rencana-aksi/indikator/${editDialog.iku.id}/target`, payload, {
            onSuccess: () => setEditDialog({ open: false, iku: null }),
        });
    }

    function submitRA() {
        router.patch('/ketua-tim/perencanaan/rencana-aksi/submit', {}, { onSuccess: () => setSubmitDialog(false) });
    }

    const totalIndikator = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const twFilled       = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                            {ra && <Badge variant="outline" className={STATUS_CONFIG[ra.status].className}>{STATUS_CONFIG[ra.status].label}</Badge>}
                            {isCoPicMode && <Badge variant="outline" className="bg-sky-100 text-sky-700 border-sky-200">Co-PIC</Badge>}
                        </div>
                        <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                    </div>
                    {ra && isEditable && twFilled === totalIndikator && totalIndikator > 0 && (
                        <Button onClick={() => setSubmitDialog(true)}>
                            <Send className="h-4 w-4" />Submit ke Kabag Umum
                        </Button>
                    )}
                </div>

                {/* Co-PIC info banner */}
                {isCoPicMode && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900 flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>Tim Anda adalah <span className="font-semibold">co-PIC</span> untuk IKU berikut. Anda dapat mengisi target triwulan, namun submit dilakukan oleh tim pemilik dokumen RA.</p>
                    </div>
                )}

                {/* Progress */}
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Kesiapan Dokumen</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        <div className="flex items-center gap-1.5 text-sm">
                            {!!ra ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={!!ra ? 'text-foreground' : 'text-muted-foreground'}>Dokumen dibuat</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            {totalIndikator > 0 ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={totalIndikator > 0 ? 'text-foreground' : 'text-muted-foreground'}>IKU tersedia ({totalIndikator})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            {twFilled === totalIndikator && totalIndikator > 0 ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={twFilled === totalIndikator && totalIndikator > 0 ? 'text-foreground' : 'text-muted-foreground'}>Target TW diisi ({twFilled}/{totalIndikator})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            {!!ra && ra.status !== 'draft' && ra.status !== 'rejected' ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={!!ra && ra.status !== 'draft' && ra.status !== 'rejected' ? 'text-foreground' : 'text-muted-foreground'}>Disubmit</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            {!!ra && ra.status === 'ppk_approved' ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={!!ra && ra.status === 'ppk_approved' ? 'text-foreground' : 'text-muted-foreground'}>Disetujui</span>
                        </div>
                    </div>
                </div>

                {ra?.status === 'rejected' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 space-y-1">
                        <p className="font-medium">Dokumen ditolak oleh {ra.rejected_by === 'kabag_umum' ? 'Kabag Umum' : 'PPK'}. Silakan perbaiki dan submit ulang.</p>
                        {(ra.rejected_by === 'kabag_umum' ? ra.rekomendasi_kabag : ra.rekomendasi_ppk) && (
                            <p><span className="font-medium">Rekomendasi: </span>{ra.rejected_by === 'kabag_umum' ? ra.rekomendasi_kabag : ra.rekomendasi_ppk}</p>
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

                {!ra && sasarans.length === 0 ? (
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
                ) : sasarans.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                        Belum ada sasaran. Buat Perjanjian Kinerja Awal terlebih dahulu agar sasaran dapat digunakan di sini.
                    </div>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        {isEditable && (
                            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
                                Isi kolom <span className="font-semibold text-foreground">Target per Triwulan</span> untuk setiap IKU, kemudian submit ke Kabag Umum.
                            </div>
                        )}
                        <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                    <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                    <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                    {isEditable && <TableHead rowSpan={2} className="text-center font-semibold text-white w-16">Aksi</TableHead>}
                                </TableRow>
                                <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                    {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                        <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sasarans.flatMap((sasaran) => {
                                    const color   = getColor(sasaran.kode);
                                    const count   = sasaran.indikators.length;
                                    const rowSpan = Math.max(count, 1);

                                    if (count === 0) {
                                        return [(
                                            <tr key={`${sasaran.id}-empty`} className="hover:bg-muted/20">
                                                <td rowSpan={rowSpan} className={`align-top text-sm p-3 border-b border-r ${color.sasaranBg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                </td>
                                                <td colSpan={isEditable ? 6 : 5} className="text-center text-sm text-muted-foreground py-4 italic border-b">Belum ada indikator</td>
                                            </tr>
                                        )];
                                    }

                                    return sasaran.indikators.map((iku, idx) => (
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
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(iku)}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ));
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Dialog: Edit Target TW */}
            <Dialog open={editDialog.open} onOpenChange={(v) => setEditDialog(d => ({ ...d, open: v }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Isi Target Triwulan</DialogTitle>
                    </DialogHeader>
                    {editDialog.iku && (
                        <div className="grid gap-4 py-2">
                            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                                <p className="text-xs text-muted-foreground mb-0.5">{editDialog.iku.kode}</p>
                                <p className="font-medium leading-snug">{editDialog.iku.nama}</p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target Tahunan ({editDialog.iku.satuan})</Label>
                                <Input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="Contoh: 89,75" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5"><Label>Target TW I</Label><Input value={form.target_tw1} onChange={e => setForm(f => ({ ...f, target_tw1: e.target.value }))} placeholder="-" /></div>
                                <div className="grid gap-1.5"><Label>Target TW II</Label><Input value={form.target_tw2} onChange={e => setForm(f => ({ ...f, target_tw2: e.target.value }))} placeholder="-" /></div>
                                <div className="grid gap-1.5"><Label>Target TW III</Label><Input value={form.target_tw3} onChange={e => setForm(f => ({ ...f, target_tw3: e.target.value }))} placeholder="-" /></div>
                                <div className="grid gap-1.5"><Label>Target TW IV</Label><Input value={form.target_tw4} onChange={e => setForm(f => ({ ...f, target_tw4: e.target.value }))} placeholder="-" /></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialog({ open: false, iku: null })}>Batal</Button>
                        <Button onClick={saveEdit} disabled={!form.target.trim()}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
