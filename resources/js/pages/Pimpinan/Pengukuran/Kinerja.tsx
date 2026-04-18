import { Head, router, useForm } from '@inertiajs/react';
import { Eye, FileText, Save, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengukuran', href: '#' },
    { title: 'Pengukuran Kinerja', href: '/pimpinan/pengukuran/kinerja' },
];

type Periode  = { id: number; triwulan: string; is_active: boolean };
type TimKerja = { id: number; nama: string; kode: string; nama_singkat?: string };
type MatrixRow = {
    sasaran_kode: string; sasaran_nama: string;
    iku_id: number; iku_kode: string; iku_nama: string;
    iku_satuan: string; iku_target: string; iku_target_tw: string | null;
    pic_tim_kerjas: TimKerja[];
    input_by_tim_kerja: TimKerja | null;
    realisasi: string | null;
    progress_kegiatan: string | null;
    kendala: string | null;
    strategi_tindak_lanjut: string | null;
    catatan: string | null;
};
type Tahun = { id: number; tahun: number; label: string };
type Props = {
    tahun: Tahun;
    periodes: Periode[];
    periode: Periode | null;
    matrix: MatrixRow[];
    role: string | null;
    rekomendasi_pimpinan: string | null;
    // laporans & role still passed from controller but not used here — approval moved to hub
};

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I', TW2: 'Triwulan II', TW3: 'Triwulan III', TW4: 'Triwulan IV',
};

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

// ─── Detail Dialog ─────────────────────────────────────────────────────────────

function DetailDialog({ row, tw, onClose }: { row: MatrixRow; tw: string; onClose: () => void }) {
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{row.iku_kode} — Detail {TW_LABELS[tw] ?? tw}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 text-sm">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Indikator</p>
                        <p className="font-medium">{row.iku_nama}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Target PK</p>
                            <p className="font-semibold">{row.iku_target} <span className="font-normal text-muted-foreground">{row.iku_satuan}</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Target {tw}</p>
                            <p className="font-semibold">{row.iku_target_tw ?? '—'} {row.iku_target_tw && <span className="font-normal text-muted-foreground">{row.iku_satuan}</span>}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Realisasi</p>
                            <p className={row.realisasi ? 'font-semibold text-green-700 dark:text-green-400' : 'text-muted-foreground italic'}>
                                {row.realisasi ? `${row.realisasi} ${row.iku_satuan}` : 'Belum diisi'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PIC Tim Kerja</p>
                            <div className="flex flex-wrap gap-1">
                                {row.pic_tim_kerjas.length > 0
                                    ? row.pic_tim_kerjas.map((t, idx) => (
                                        <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs ${
                                            idx === 0 ? 'bg-blue-100 text-blue-800 font-medium' : 'border border-slate-300 text-slate-500'
                                        }`}>
                                            {t.nama}
                                        </span>
                                    ))
                                    : <span className="text-muted-foreground">—</span>
                                }
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Diisi Oleh</p>
                            {row.input_by_tim_kerja
                                ? <span className="inline-block rounded px-1.5 py-0.5 text-xs bg-green-100 text-green-800 font-medium">
                                    {row.input_by_tim_kerja.nama}
                                  </span>
                                : <span className="text-muted-foreground italic text-xs">Belum ada</span>
                            }
                        </div>
                    </div>

                    {row.catatan && (
                        <div className="rounded border-l-2 border-l-blue-300 bg-blue-50 px-3 py-2 dark:bg-blue-950/30">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Catatan Koordinasi</p>
                            <p className="text-sm italic text-blue-700 dark:text-blue-300">{row.catatan}</p>
                        </div>
                    )}

                    <hr />
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Progress / Kegiatan</p>
                        <p className="whitespace-pre-wrap text-sm">{row.progress_kegiatan || <span className="italic text-muted-foreground">—</span>}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kendala / Permasalahan</p>
                        <p className="whitespace-pre-wrap text-sm">{row.kendala || <span className="italic text-muted-foreground">—</span>}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Strategi / Tindak Lanjut</p>
                        <p className="whitespace-pre-wrap text-sm">{row.strategi_tindak_lanjut || <span className="italic text-muted-foreground">—</span>}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Group by sasaran for rowspan ──────────────────────────────────────────────

function groupBySasaran(rows: MatrixRow[]) {
    return rows.map((row, i) => {
        const prev        = i > 0 ? rows[i - 1].sasaran_kode : null;
        const showSasaran = row.sasaran_kode !== prev;
        const span        = rows.filter(r => r.sasaran_kode === row.sasaran_kode).length;
        return { ...row, showSasaran, rowSpan: showSasaran ? span : undefined };
    });
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Kinerja({ tahun, periodes, periode, matrix, role, rekomendasi_pimpinan }: Props) {
    const [detail, setDetail] = useState<MatrixRow | null>(null);
    const isLoading = useNavigationLoading();

    const rekForm = useForm({
        periode_id:           periode?.id?.toString() ?? '',
        rekomendasi_pimpinan: rekomendasi_pimpinan ?? '',
    });

    const isKabagUmum = role === 'kabag_umum';

    function changePeriode(id: string) {
        router.get('/pimpinan/pengukuran/kinerja', { periode_id: id }, { preserveState: false });
    }

    const grouped = groupBySasaran(matrix);
    const filled  = matrix.filter(r => r.realisasi).length;
    const twLabel = periode ? (TW_LABELS[periode.triwulan] ?? periode.triwulan) : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengukuran Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Pengukuran Kinerja</h1>
                        <p className="text-muted-foreground text-sm">{tahun.label}</p>
                    </div>
                    {periode && (
                        <Button size="sm" variant="outline" className="gap-1.5 h-8" asChild>
                            <a href={`/pimpinan/pengukuran/export/pdf?periode_id=${periode.id}`} target="_blank">
                                <FileText className="h-3.5 w-3.5" /> Export PDF {twLabel}
                            </a>
                        </Button>
                    )}
                </div>

                {/* Periode selector */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground">Periode:</span>
                    {periodes.length === 0 ? (
                        <span className="text-sm text-amber-600">Belum ada periode yang aktif.</span>
                    ) : (
                        <Select value={periode?.id?.toString() ?? ''} onValueChange={changePeriode}>
                            <SelectTrigger className="w-48 h-8">
                                <SelectValue placeholder="Pilih periode..." />
                            </SelectTrigger>
                            <SelectContent>
                                {periodes.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {TW_LABELS[p.triwulan] ?? p.triwulan}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {periode && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400">
                            Aktif
                        </Badge>
                    )}
                    {matrix.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {filled} / {matrix.length} IKU sudah diisi
                        </span>
                    )}
                </div>

                {/* ─── Matrix Table ─────────────────────────────────────────────── */}
                {!periode ? (
                    <p className="text-muted-foreground">Belum ada periode yang aktif saat ini.</p>
                ) : matrix.length === 0 ? (
                    <p className="text-muted-foreground">Belum ada data IKU.</p>
                ) : (
                    <div className="rounded-xl border shadow-sm overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr style={{ backgroundColor: '#003580' }}>
                                    <th rowSpan={2} className="border border-white/20 px-3 py-2 text-left text-white font-semibold w-44">Sasaran</th>
                                    <th rowSpan={2} className="border border-white/20 px-3 py-2 text-left text-white font-semibold">Indikator Kinerja</th>
                                    <th rowSpan={2} className="border border-white/20 px-3 py-2 text-center text-white font-semibold w-36">PIC Tim Kerja</th>
                                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Satuan</th>
                                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Target PK</th>
                                    <th colSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold">{twLabel}</th>
                                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-28">Diisi Oleh</th>
                                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-16">Status</th>
                                    <th rowSpan={2} className="border border-white/20 px-2 py-2 text-center text-white font-semibold w-12">Detail</th>
                                </tr>
                                <tr style={{ backgroundColor: '#004099' }}>
                                    <th className="border border-white/20 px-2 py-1.5 text-center text-white/80 font-normal text-xs w-20">Target</th>
                                    <th className="border border-white/20 px-2 py-1.5 text-center text-white/80 font-normal text-xs w-20">Realisasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        {[160, 220, 80, 60, 60, 70, 80].map((w, j) => (
                                            <td key={j} className="border border-border px-3 py-2">
                                                <Skeleton className="h-4 rounded" style={{ width: w }} />
                                            </td>
                                        ))}
                                    </tr>
                                )) : grouped.map((row) => {
                                    const color   = getColor(row.sasaran_kode);
                                    const hasData = !!row.realisasi;
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
                                                <span className="block text-xs font-semibold text-muted-foreground mb-0.5">{row.iku_kode}</span>
                                                <p className="text-xs leading-snug">{row.iku_nama}</p>
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                <div className="flex flex-col gap-0.5 items-center">
                                                    {row.pic_tim_kerjas.length > 0
                                                        ? row.pic_tim_kerjas.map((t, idx) => (
                                                            <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs leading-tight ${
                                                                idx === 0
                                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium'
                                                                    : 'border border-slate-300 text-slate-500 text-[10px]'
                                                            }`}>
                                                                {t.nama_singkat ?? t.nama}
                                                            </span>
                                                        ))
                                                        : <span className="text-xs text-muted-foreground">—</span>
                                                    }
                                                </div>
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center text-xs text-muted-foreground align-middle">
                                                {row.iku_satuan}
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center text-xs font-semibold align-middle">
                                                {row.iku_target}
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center text-xs align-middle text-muted-foreground">
                                                {row.iku_target_tw ?? '—'}
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                {hasData
                                                    ? <span className="text-xs font-semibold text-green-700 dark:text-green-400">{row.realisasi}</span>
                                                    : <span className="text-xs text-muted-foreground italic">—</span>
                                                }
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                {row.input_by_tim_kerja
                                                    ? <span className="inline-block rounded px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        {row.input_by_tim_kerja.nama}
                                                      </span>
                                                    : <span className="text-xs text-muted-foreground">—</span>
                                                }
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                {hasData
                                                    ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">Terisi</Badge>
                                                    : <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-300 text-xs">Kosong</Badge>
                                                }
                                            </td>

                                            <td className="border border-border px-2 py-2 text-center align-middle">
                                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                                    onClick={() => setDetail(row)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {detail && (
                <DetailDialog
                    row={detail}
                    tw={periode?.triwulan ?? ''}
                    onClose={() => setDetail(null)}
                />
            )}

            {/* ─── Rekomendasi Pimpinan Form (Kabag Umum only) ─────────────────── */}
            {isKabagUmum && periode && (
                <div className="px-4 md:px-6 pb-6">
                    <div className="rounded-xl border bg-card shadow-sm">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30 rounded-t-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                <MessageSquareText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Rekomendasi Pimpinan</p>
                                <p className="text-xs text-muted-foreground">
                                    Isi rekomendasi untuk {TW_LABELS[periode.triwulan] ?? periode.triwulan}. Akan otomatis tampil saat export PDF.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                rekForm.post('/pimpinan/pengukuran/rekomendasi');
                            }}
                            className="p-5 flex flex-col gap-4"
                        >
                            <div className="grid gap-1.5">
                                <Label htmlFor="rekomendasi-pimpinan" className="text-sm">
                                    Rekomendasi {TW_LABELS[periode.triwulan] ?? periode.triwulan}
                                </Label>
                                <Textarea
                                    id="rekomendasi-pimpinan"
                                    rows={5}
                                    placeholder={`Tuliskan rekomendasi pimpinan untuk ${TW_LABELS[periode.triwulan] ?? periode.triwulan} di sini...`}
                                    value={rekForm.data.rekomendasi_pimpinan}
                                    onChange={e => rekForm.setData('rekomendasi_pimpinan', e.target.value)}
                                    className="resize-none text-sm"
                                />
                                {rekForm.errors.rekomendasi_pimpinan && (
                                    <p className="text-xs text-destructive">{rekForm.errors.rekomendasi_pimpinan}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                {rekForm.recentlySuccessful && (
                                    <p className="text-xs text-green-600 font-medium">✓ Rekomendasi berhasil disimpan.</p>
                                )}
                                {!(rekForm.recentlySuccessful) && <span />}
                                <Button
                                    type="submit"
                                    size="sm"
                                    loading={rekForm.processing}
                                    className="gap-1.5"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    Simpan Rekomendasi
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
