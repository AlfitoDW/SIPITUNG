import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toCommaDisplay } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Pencil, Users, Send, CheckCircle2, Circle, XCircle, AlertCircle, X, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengukuran Kinerja', href: '/ketua-tim/pengukuran' },
];

/** Menghasilkan teks placeholder yang sesuai dengan satuan IKU */
function targetPlaceholder(satuan: string): string {
    const s = satuan.trim().toLowerCase();
    if (s === '%' || s === 'persen') return 'Contoh: 89,75';
    return 'Masukkan nilai target';
}

type PicTimKerja = { id: number; nama: string; kode: string; nama_singkat: string | null };
type Periode     = { id: number; triwulan: string; is_active: boolean };
type IKUItem = {
    iku_id: number;
    sasaran_kode: string; sasaran_nama: string;
    iku_kode: string; iku_nama: string; iku_satuan: string;
    iku_target: string; iku_target_tw: string | null;
    pic_tim_kerjas: PicTimKerja[];
    realisasi_id: number | null;
    realisasi: string | null;
    progress_kegiatan: string | null;
    kendala: string | null;
    strategi_tindak_lanjut: string | null;
    catatan: string | null;
    input_by_tim_kerja_id: number | null;
    input_by_tim_kerja_nama: string | null;
};
type Tahun = { id: number; tahun: number; label: string };
type LaporanGroup = {
    id: number;
    status: string;
    submitted_at: string | null;
    rekomendasi_kabag: string | null;
    approved_at: string | null;
};
type CollabGroup = {
    peer_id: number | null;
    peer_nama: string;
    iku_ids: number[];
    iku_count: number;
    filled_count: number;
    laporan: LaporanGroup | null;
    collaborator: { nama: string; status: 'submitted' | 'kabag_approved' } | null;
    collab_rejected: { nama: string; rekomendasi_kabag: string | null } | null;
};
type Props = {
    tahun: Tahun;
    periodes: Periode[];
    periode: Periode | null;
    ikuList: IKUItem[];
    timKerjaId: number;
    collabGroups: CollabGroup[];
};

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I', TW2: 'Triwulan II', TW3: 'Triwulan III', TW4: 'Triwulan IV',
};

const LAPORAN_STATUS: Record<string, { label: string; className: string }> = {
    submitted:      { label: 'Menunggu Kabag', className: 'bg-yellow-100 text-yellow-800 border-yellow-400' },
    kabag_approved: { label: 'Disetujui',      className: 'bg-green-100 text-green-800 border-green-400' },
    rejected:       { label: 'Dikembalikan',   className: 'bg-red-100 text-red-800 border-red-400' },
};

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800',      accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800',   accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800',     accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

// ─── Realisasi Dialog ────────────────────────────────────────────────────────

function RealisasiDialog({ iku, periode, onClose }: {
    iku: IKUItem; periode: Periode; onClose: () => void;
}) {
    const form = useForm({
        indikator_kinerja_id:    iku.iku_id,
        periode_pengukuran_id:   periode.id,
        realisasi:               iku.realisasi ?? '',
        progress_kegiatan:       iku.progress_kegiatan ?? '',
        kendala:                 iku.kendala ?? '',
        strategi_tindak_lanjut:  iku.strategi_tindak_lanjut ?? '',
        catatan:                 iku.catatan ?? '',
    });

    function submit(e: React.SyntheticEvent) {
        e.preventDefault();
        // Normalisasi: ganti koma dengan titik agar backend bisa parseFloat
        form.transform(data => ({ ...data, realisasi: data.realisasi.replace(',', '.') }))
            .post('/ketua-tim/pengukuran/store', { onSuccess: onClose });
    }

    const isEdit   = !!iku.realisasi_id;
    const isShared = iku.pic_tim_kerjas.length > 1;

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit' : 'Isi'} Realisasi {periode.triwulan} — {iku.iku_kode}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        <p className="font-medium">{iku.iku_nama}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                            Target PK: <strong>{iku.iku_target} {iku.iku_satuan}</strong>
                            {iku.iku_target_tw && (
                                <> · Target {periode.triwulan}: <strong>{iku.iku_target_tw} {iku.iku_satuan}</strong></>
                            )}
                        </p>
                        {isShared && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <Users className="h-3 w-3 text-blue-500 shrink-0" />
                                {iku.pic_tim_kerjas.map(t => (
                                    <span key={t.id} className="inline-block rounded px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700">
                                        {t.nama_singkat ?? t.kode}
                                    </span>
                                ))}
                            </div>
                        )}
                        {iku.input_by_tim_kerja_nama && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Terakhir diisi oleh: <span className="font-medium">{iku.input_by_tim_kerja_nama}</span>
                            </p>
                        )}
                    </div>

                    {form.errors.realisasi && (
                        <p className="text-sm text-destructive">{form.errors.realisasi}</p>
                    )}

                    <div className="grid gap-1.5">
                        <Label>Realisasi ({iku.iku_satuan})</Label>
                        <Input
                            placeholder={
                                (iku.iku_target_tw ?? iku.iku_target)
                                    ? `Contoh: ${toCommaDisplay(iku.iku_target_tw ?? iku.iku_target)}`
                                    : targetPlaceholder(iku.iku_satuan)
                            }
                            value={form.data.realisasi}
                            onChange={e => form.setData('realisasi', e.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Progress / Kegiatan</Label>
                        <Textarea rows={3} placeholder="Kegiatan yang sudah dilakukan..."
                            value={form.data.progress_kegiatan}
                            onChange={e => form.setData('progress_kegiatan', e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Kendala / Permasalahan</Label>
                        <Textarea rows={3} placeholder="Kendala yang dihadapi..."
                            value={form.data.kendala}
                            onChange={e => form.setData('kendala', e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Strategi / Tindak Lanjut</Label>
                        <Textarea rows={3} placeholder="Rencana tindak lanjut..."
                            value={form.data.strategi_tindak_lanjut}
                            onChange={e => form.setData('strategi_tindak_lanjut', e.target.value)} />
                    </div>
                    {isShared && (
                        <div className="grid gap-1.5">
                            <Label>
                                Catatan Koordinasi
                                <span className="ml-1 text-muted-foreground font-normal text-xs">(opsional — terlihat oleh semua PIC)</span>
                            </Label>
                            <Textarea rows={2}
                                placeholder="Misal: Data dikonfirmasi bersama Tim P&K..."
                                value={form.data.catatan}
                                onChange={e => form.setData('catatan', e.target.value)} />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={form.processing}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function CollabGroupCard({
    group, ikuList, periode, timKerjaId, onSubmit, onEdit,
}: {
    group: CollabGroup;
    ikuList: IKUItem[];
    periode: Periode;
    timKerjaId: number;
    onSubmit: (group: CollabGroup) => void;
    onEdit: (iku: IKUItem) => void;
}) {
    const groupIkus   = ikuList.filter(i => group.iku_ids.includes(i.iku_id));
    const grouped     = groupIkus.map((row, i) => {
        const prev        = i > 0 ? groupIkus[i - 1].sasaran_kode : null;
        const showSasaran = row.sasaran_kode !== prev;
        const span        = groupIkus.filter(r => r.sasaran_kode === row.sasaran_kode).length;
        return { ...row, showSasaran, rowSpan: showSasaran ? span : undefined };
    });

    const laporan        = group.laporan;
    const isSubmitted    = laporan?.status === 'submitted';
    const isApproved     = laporan?.status === 'kabag_approved';
    const isRejected     = laporan?.status === 'rejected';
    const collabLocked   = group.collaborator?.status === 'submitted';
    const collabApproved = group.collaborator?.status === 'kabag_approved';
    const isLocked       = collabLocked || collabApproved || isSubmitted || isApproved;

    const isSolo   = group.peer_id === null;
    const peerName = isSolo ? 'IKU Mandiri' : group.peer_nama;

    const canSubmit = periode.is_active
        && group.filled_count > 0
        && !isSubmitted
        && !isApproved
        && !collabLocked
        && !collabApproved;

    // Determine header color based on state
    const headerClass = isApproved || collabApproved
        ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
        : collabLocked || isSubmitted
        ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
        : isRejected
        ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
        : 'border-border bg-card';

    return (
        <div className={`rounded-xl border shadow-sm overflow-hidden ${headerClass}`}>
            {/* Group header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {isSolo ? (
                        <span className="text-sm font-semibold text-foreground">IKU Mandiri</span>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-sm font-semibold text-foreground">
                                Kolaborasi dengan <span className="text-blue-700 dark:text-blue-400">{peerName}</span>
                            </span>
                        </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                        ({group.filled_count}/{group.iku_count} IKU terisi)
                    </span>

                    {/* Status badge for this group */}
                    {isApproved && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400 text-xs">
                            Disetujui
                        </Badge>
                    )}
                    {collabApproved && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400 text-xs">
                            Selesai (via {group.collaborator!.nama})
                        </Badge>
                    )}
                    {isSubmitted && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-400 text-xs">
                            Menunggu Kabag
                        </Badge>
                    )}
                    {collabLocked && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Terkunci — {group.collaborator!.nama} telah submit
                        </Badge>
                    )}
                    {isRejected && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-400 text-xs">
                            Dikembalikan
                        </Badge>
                    )}
                </div>

                {canSubmit && (
                    <Button size="sm" onClick={() => onSubmit(group)} className="gap-1.5 h-8 text-xs">
                        <Send className="h-3 w-3" />
                        {isRejected ? 'Submit Ulang' : 'Submit ke Kabag'}
                    </Button>
                )}
            </div>

            {/* Inline banners for this group */}
            {(isRejected || group.collab_rejected) && !isApproved && !collabApproved && (
                <div className="px-4 py-2.5 space-y-2">
                    {isRejected && (
                        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-800 dark:text-red-400">
                            <span className="font-semibold">Dikembalikan Kabag Umum.</span>{laporan?.rekomendasi_kabag ? ` Rekomendasi: "${laporan.rekomendasi_kabag}"` : ' Silakan perbaiki dan submit ulang.'}
                        </div>
                    )}
                    {group.collab_rejected && (
                        <div className="rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-xs text-orange-800 dark:text-orange-400">
                            <span className="font-semibold">Laporan {group.collab_rejected.nama} dikembalikan.</span>
                            {' '}Tim Anda dapat mengajukan laporan untuk kelompok ini.
                            {group.collab_rejected.rekomendasi_kabag && (
                                <span className="block mt-1 italic">Catatan Kabag: "{group.collab_rejected.rekomendasi_kabag}"</span>
                            )}
                        </div>
                    )}
                </div>
            )}
            {isApproved && (
                <div className="px-4 py-2.5">
                    <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs text-green-800 dark:text-green-400">
                        <span className="font-semibold">Disetujui Kabag Umum{laporan?.approved_at ? ` pada ${laporan.approved_at}` : ''}.</span>
                    </div>
                </div>
            )}
            {collabApproved && (
                <div className="px-4 py-2.5">
                    <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs text-green-800 dark:text-green-400">
                        <span className="font-semibold">Pengukuran selesai</span> — laporan telah diajukan dan disetujui oleh <span className="font-semibold">{group.collaborator!.nama}</span>.
                    </div>
                </div>
            )}
            {isSubmitted && (
                <div className="px-4 py-2.5">
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-400">
                        <span className="font-semibold">Laporan disubmit{laporan?.submitted_at ? ` pada ${laporan.submitted_at}` : ''}.</span> Menunggu persetujuan Kabag Umum.
                    </div>
                </div>
            )}
            {collabLocked && (
                <div className="px-4 py-2.5">
                    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
                        <Lock className="inline h-3 w-3 mr-1" />
                        <span className="font-semibold">{group.collaborator!.nama}</span> telah mengajukan laporan untuk kelompok IKU ini. Pengajuan diblokir.
                    </div>
                </div>
            )}

            {/* IKU Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr style={{ backgroundColor: '#003580' }}>
                            <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold w-44">Sasaran</th>
                            <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold">Indikator Kinerja</th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-28">PIC</th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Satuan</th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Target PK</th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-20">
                                Target {periode.triwulan}
                            </th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-24">Realisasi</th>
                            <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-28">Terisi Oleh</th>
                            {periode.is_active && (
                                <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map((row) => {
                            const color    = getColor(row.sasaran_kode);
                            const hasData  = !!row.realisasi;
                            const isShared = row.pic_tim_kerjas.length > 1;
                            return (
                                <tr key={row.iku_id} className="align-top hover:bg-muted/30">
                                    {row.showSasaran && (
                                        <td rowSpan={row.rowSpan}
                                            className={`border border-border px-3 py-2 align-top ${color.bg} ${color.accent}`}>
                                            <span className={`inline-block mb-1 rounded px-1.5 py-0.5 text-xs font-bold ${color.badge}`}>
                                                {row.sasaran_kode}
                                            </span>
                                            <p className="text-xs leading-snug text-foreground">{row.sasaran_nama}</p>
                                        </td>
                                    )}

                                    <td className="border border-border px-3 py-2 align-top">
                                        <div className="flex items-start gap-1.5">
                                            {isShared && <Users className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />}
                                            <div>
                                                <span className="block text-xs font-semibold text-muted-foreground mb-0.5">{row.iku_kode}</span>
                                                <p className="text-xs leading-snug">{row.iku_nama}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="border border-border px-2 py-2 text-center align-middle">
                                        <div className="flex flex-col gap-0.5 items-center">
                                            {row.pic_tim_kerjas.map((t, idx) => (
                                                <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs leading-tight ${
                                                    t.id === timKerjaId
                                                        ? 'bg-blue-100 text-blue-800 font-medium'
                                                        : idx === 0
                                                            ? 'bg-slate-100 text-slate-600'
                                                            : 'border border-slate-300 text-slate-500 text-[10px]'
                                                }`}>
                                                    {t.nama_singkat ?? t.kode}
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    <td className="border border-border px-2 py-2 text-center text-xs text-muted-foreground align-middle">
                                        {row.iku_satuan}
                                    </td>
                                    <td className="border border-border px-2 py-2 text-center text-xs font-semibold align-middle">
                                        {row.iku_target}
                                    </td>
                                    <td className="border border-border px-2 py-2 text-center text-xs align-middle bg-slate-50 dark:bg-slate-900/40">
                                        {row.iku_target_tw
                                            ? <span className="font-medium">{row.iku_target_tw}</span>
                                            : <span className="text-muted-foreground">—</span>
                                        }
                                    </td>
                                    <td className="border border-border px-2 py-2 text-center text-xs align-middle">
                                        {hasData
                                            ? <span className="font-semibold text-green-700 dark:text-green-400">{row.realisasi}</span>
                                            : <span className="text-muted-foreground">—</span>
                                        }
                                    </td>

                                    <td className="border border-border px-2 py-2 text-center align-middle">
                                        {row.input_by_tim_kerja_nama ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400 text-[10px]">
                                                    {row.input_by_tim_kerja_nama}
                                                </Badge>
                                                {row.catatan && (
                                                    <span className="text-[10px] text-blue-600 italic leading-tight max-w-[100px] line-clamp-2">
                                                        "{row.catatan}"
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-xs">
                                                Kosong
                                            </Badge>
                                        )}
                                    </td>

                                    {periode.is_active && (
                                        <td className="border border-border px-2 py-2 text-center align-middle">
                                            {(!isLocked) ? (
                                                <Button size="sm"
                                                    variant={hasData ? 'outline' : 'default'}
                                                    className="h-6 px-2 text-xs gap-1"
                                                    onClick={() => onEdit(row)}>
                                                    <Pencil className="h-2.5 w-2.5" />
                                                    {hasData ? 'Edit' : 'Isi'}
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Submit Dialog per Kelompok ───────────────────────────────────────────────

function SubmitGroupDialog({ group, periode, onClose, onConfirm }: {
    group: CollabGroup;
    periode: Periode;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const isRejected = group.laporan?.status === 'rejected';
    return (
        <AlertDialog open onOpenChange={(v) => !v && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isRejected ? 'Submit Ulang' : 'Submit'} Laporan — {group.peer_id ? `Kolaborasi dengan ${group.peer_nama}` : 'IKU Mandiri'}?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm">
                            <p>
                                Laporan kelompok ini ({group.iku_count} IKU, {TW_LABELS[periode.triwulan] ?? periode.triwulan}) akan dikirim ke Kabag Umum.
                                Setelah disubmit, data realisasi kelompok ini tidak dapat diubah.
                            </p>
                            {group.peer_id && (
                                <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                                    <Users className="inline h-3 w-3 mr-1" />
                                    Setelah submit, tim <strong>{group.peer_nama}</strong> tidak dapat mengajukan laporan untuk IKU yang sama.
                                </div>
                            )}
                            {group.filled_count < group.iku_count && (
                                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                                    ⚠️ {group.iku_count - group.filled_count} dari {group.iku_count} IKU belum terisi realisasinya.
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Ya, Submit</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PengukuranIndex({ tahun, periodes, periode, ikuList, timKerjaId, collabGroups }: Props) {
    const [editing, setEditing]             = useState<IKUItem | null>(null);
    const [submitGroup, setSubmitGroup]     = useState<CollabGroup | null>(null);

    function changePeriode(id: string) {
        router.get('/ketua-tim/pengukuran', { periode_id: id }, { preserveState: false });
    }

    function doSubmitGroup() {
        if (!periode || !submitGroup) return;
        router.post('/ketua-tim/pengukuran/submit', {
            periode_pengukuran_id: periode.id,
            peer_tim_kerja_id:     submitGroup.peer_id ?? null,
        }, {
            onSuccess: () => setSubmitGroup(null),
        });
    }

    // Overall stats across all groups
    const totalIku       = collabGroups.reduce((s, g) => s + g.iku_count, 0);
    const totalFilled    = collabGroups.reduce((s, g) => s + g.filled_count, 0);
    const anySubmitted   = collabGroups.some(g => g.laporan?.status === 'submitted');
    const allApproved    = collabGroups.length > 0 && collabGroups.every(
        g => g.laporan?.status === 'kabag_approved' || g.collaborator?.status === 'kabag_approved'
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengukuran Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Pengukuran Kinerja</h1>
                        <p className="text-muted-foreground text-sm">Realisasi IKU tim Anda — {tahun.label}</p>
                    </div>
                </div>

                {/* Periode selector */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground">Periode:</span>
                    <Select value={periode?.id?.toString() ?? ''} onValueChange={changePeriode}>
                        <SelectTrigger className="w-48 h-8">
                            <SelectValue placeholder="Pilih periode..." />
                        </SelectTrigger>
                        <SelectContent>
                            {periodes.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {TW_LABELS[p.triwulan] ?? p.triwulan}
                                    {p.is_active && ' (Aktif)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {periode && (
                        <Badge variant="outline" className={periode.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }>
                            {periode.is_active ? 'Aktif — Dapat Diisi' : 'Ditutup'}
                        </Badge>
                    )}
                </div>

                {/* Status messages */}
                {!periode ? (
                    <p className="text-muted-foreground">Belum ada periode. Hubungi SuperAdmin.</p>
                ) : !periode.is_active ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30">
                        Periode ini sedang ditutup. Anda tidak dapat mengisi realisasi.
                    </div>
                ) : ikuList.length === 0 ? (
                    <p className="text-muted-foreground">Tim Anda belum ditugaskan sebagai PIC IKU manapun. Hubungi SuperAdmin.</p>
                ) : null}

                {/* Overall progress card */}
                {periode && ikuList.length > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progres Keseluruhan</span>
                            <span className="text-sm text-muted-foreground">
                                {allApproved ? 100 : anySubmitted ? 80 : totalIku > 0 ? Math.round((totalFilled / totalIku) * 60) : 0}%
                            </span>
                        </div>
                        <Progress
                            value={allApproved ? 100 : anySubmitted ? 80 : totalIku > 0 ? Math.round((totalFilled / totalIku) * 60) : 0}
                            className="h-2"
                        />
                        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                            {[
                                { done: periode.is_active,                            label: 'Periode aktif' },
                                { done: ikuList.length > 0,                           label: `IKU tersedia (${totalIku})` },
                                { done: totalFilled === totalIku && totalIku > 0,     label: `Realisasi diisi (${totalFilled}/${totalIku})` },
                                { done: anySubmitted || allApproved,                  label: 'Ada laporan tersubmit' },
                                { done: allApproved,                                  label: 'Semua disetujui Kabag' },
                            ].map(({ done, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    {done
                                        ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                        : <Circle className="h-5 w-5 text-red-400 shrink-0" />}
                                    <span className={`text-base font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Collaboration groups */}
                {periode && collabGroups.length > 0 && collabGroups.map((group) => (
                    <CollabGroupCard
                        key={group.peer_id ?? 'solo'}
                        group={group}
                        ikuList={ikuList}
                        periode={periode}
                        timKerjaId={timKerjaId}
                        onSubmit={setSubmitGroup}
                        onEdit={setEditing}
                    />
                ))}
            </div>

            {editing && periode && (
                <RealisasiDialog iku={editing} periode={periode} onClose={() => setEditing(null)} />
            )}

            {submitGroup && periode && (
                <SubmitGroupDialog
                    group={submitGroup}
                    periode={periode}
                    onClose={() => setSubmitGroup(null)}
                    onConfirm={doSubmitGroup}
                />
            )}
        </AppLayout>
    );
}
