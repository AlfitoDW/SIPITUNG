import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Pencil, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengukuran Kinerja', href: '/ketua-tim/pengukuran' },
];

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
type Props = {
    tahun: Tahun;
    periodes: Periode[];
    periode: Periode | null;
    ikuList: IKUItem[];
    timKerjaId: number;
};

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I', TW2: 'Triwulan II', TW3: 'Triwulan III', TW4: 'Triwulan IV',
};

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800',      accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800',   accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800',     accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

// ─── Koordinasi Banner ────────────────────────────────────────────────────────
// Tampilkan IKU-IKU yang punya lebih dari 1 PIC (kolaborasi antar tim)

function KoordinasiBanner({ ikuList, timKerjaId }: { ikuList: IKUItem[]; timKerjaId: number }) {
    const sharedIkus = ikuList.filter(i => i.pic_tim_kerjas.length > 1);
    if (sharedIkus.length === 0) return null;

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-3">
            <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        IKU Kolaborasi Tim — Semua PIC dapat mengisi &amp; mengedit data
                    </p>
                    <div className="flex flex-col gap-1">
                        {sharedIkus.map(iku => (
                            <div key={iku.iku_id} className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                                    {iku.iku_kode}
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                    {iku.iku_nama}
                                </span>
                                <span className="text-xs text-blue-500">—</span>
                                <div className="flex gap-1 flex-wrap">
                                    {iku.pic_tim_kerjas.map(t => (
                                        <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium leading-tight ${
                                            t.id === timKerjaId
                                                ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                                                : 'bg-white/70 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300'
                                        }`}>
                                            {t.nama_singkat ?? t.kode}
                                            {t.id === timKerjaId && ' (Tim Anda)'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 italic">
                        Data terakhir yang disimpan akan menjadi realisasi aktif. Gunakan catatan koordinasi untuk mencatat kesepakatan antar tim.
                    </p>
                </div>
            </div>
        </div>
    );
}

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
        form.post('/ketua-tim/pengukuran/store', { onSuccess: onClose });
    }

    const isEdit = !!iku.realisasi_id;
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
                        <Input placeholder={`Contoh: ${iku.iku_target_tw ?? iku.iku_target}`}
                            value={form.data.realisasi}
                            onChange={e => form.setData('realisasi', e.target.value)} />
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
                                placeholder="Misal: Data dikonfirmasi bersama Tim P&K, angka berdasarkan laporan 31 Maret..."
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

// ─── Group by sasaran for rowspan ─────────────────────────────────────────────

function groupBySasaran(rows: IKUItem[]) {
    return rows.map((row, i) => {
        const prev        = i > 0 ? rows[i - 1].sasaran_kode : null;
        const showSasaran = row.sasaran_kode !== prev;
        const span        = rows.filter(r => r.sasaran_kode === row.sasaran_kode).length;
        return { ...row, showSasaran, rowSpan: showSasaran ? span : undefined };
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PengukuranIndex({ tahun, periodes, periode, ikuList, timKerjaId }: Props) {
    const [editing, setEditing] = useState<IKUItem | null>(null);

    function changePeriode(id: string) {
        router.get('/ketua-tim/pengukuran', { periode_id: id }, { preserveState: false });
    }

    const grouped = groupBySasaran(ikuList);
    const filled  = ikuList.filter(i => i.realisasi).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengukuran Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">

                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Pengukuran Kinerja</h1>
                    <p className="text-muted-foreground text-sm">Realisasi IKU tim Anda — {tahun.label}</p>
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
                    {ikuList.length > 0 && (
                        <span className="text-xs text-muted-foreground">{filled}/{ikuList.length} terisi</span>
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

                {/* Koordinasi banner — hanya tampil jika ada IKU kolaborasi */}
                {ikuList.length > 0 && (
                    <KoordinasiBanner ikuList={ikuList} timKerjaId={timKerjaId} />
                )}

                {ikuList.length > 0 && (
                    <div className="rounded-xl border shadow-sm overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr style={{ backgroundColor: '#003580' }}>
                                    <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold w-44">Sasaran</th>
                                    <th className="border border-white/20 px-3 py-2 text-left text-white font-semibold">Indikator Kinerja</th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-28">PIC</th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Satuan</th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Target PK</th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-20">
                                        Target {periode?.triwulan}
                                    </th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-24">Realisasi</th>
                                    <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-28">Terisi Oleh</th>
                                    {periode?.is_active && (
                                        <th className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.map((row) => {
                                    const color   = getColor(row.sasaran_kode);
                                    const hasData = !!row.realisasi;
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

                                            {/* PIC badges */}
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

                                            {/* Terisi oleh */}
                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                {row.input_by_tim_kerja_nama ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
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

                                            {periode?.is_active && (
                                                <td className="border border-border px-2 py-2 text-center align-middle">
                                                    <Button size="sm"
                                                        variant={hasData ? 'outline' : 'default'}
                                                        className="h-6 px-2 text-xs gap-1"
                                                        onClick={() => setEditing(row)}>
                                                        <Pencil className="h-2.5 w-2.5" />
                                                        {hasData ? 'Edit' : 'Isi'}
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editing && periode && (
                <RealisasiDialog iku={editing} periode={periode} onClose={() => setEditing(null)} />
            )}
        </AppLayout>
    );
}
