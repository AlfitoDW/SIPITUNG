import { Head, router } from '@inertiajs/react';
import { FileSpreadsheet, FileText, Eye, LockOpen, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengukuran', href: '/super-admin/pengukuran' },
    { title: 'Realisasi Kinerja', href: '/super-admin/pengukuran/realisasi' },
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
type Laporan = {
    id: number;
    status: 'submitted' | 'kabag_approved' | 'rejected';
    rekomendasi_kabag: string | null;
    submitted_at: string | null;
    approved_at: string | null;
    periode_triwulan: string;
    tim_kerja: TimKerja | null;
};
type Tahun = { id: number; tahun: number; label: string };
type Props = { tahun: Tahun; periodes: Periode[]; periode: Periode | null; matrix: MatrixRow[]; laporans: Laporan[] };

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I', TW2: 'Triwulan II', TW3: 'Triwulan III', TW4: 'Triwulan IV',
};

const LAPORAN_STATUS_CONFIG = {
    submitted:      { label: 'Menunggu Kabag', icon: Clock,        className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-400' },
    kabag_approved: { label: 'Disetujui',      icon: CheckCircle2, className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400' },
    rejected:       { label: 'Ditolak',        icon: XCircle,      className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400' },
} as const;

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

// ─── Laporan Status Panel ─────────────────────────────────────────────────────

const LAPORAN_DOT_CONFIG = {
    submitted:      { bg: 'bg-amber-400',   ring: 'ring-amber-300' },
    kabag_approved: { bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
    rejected:       { bg: 'bg-red-500',     ring: 'ring-red-400' },
} as const;

const TW_PILL_CONFIG: Record<string, { pill: string; accent: string; bg: string }> = {
    TW1: { pill: 'bg-[#003580]/10 text-[#003580] dark:bg-blue-900/50 dark:text-blue-300',      accent: 'border-l-4 border-l-[#003580]',  bg: 'bg-slate-50/60 dark:bg-slate-800/30' },
    TW2: { pill: 'bg-teal-600/10 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',        accent: 'border-l-4 border-l-teal-500',    bg: 'bg-slate-50/60 dark:bg-slate-800/30' },
    TW3: { pill: 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',accent: 'border-l-4 border-l-indigo-400',  bg: 'bg-slate-50/60 dark:bg-slate-800/30' },
    TW4: { pill: 'bg-amber-500/10 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',    accent: 'border-l-4 border-l-amber-400',   bg: 'bg-slate-50/60 dark:bg-slate-800/30' },
};

function LaporanStatusPanel({ laporans }: { laporans: Laporan[] }) {
    const [reopenTarget, setReopenTarget] = useState<Laporan | null>(null);

    function doReopen() {
        if (!reopenTarget) return;
        router.patch(`/super-admin/pengukuran/laporan/${reopenTarget.id}/reopen`, {}, {
            onSuccess: () => setReopenTarget(null),
            preserveScroll: true,
        });
    }

    const canReopen = (l: Laporan) => l.status === 'submitted' || l.status === 'kabag_approved';

    const byTw: Record<string, Laporan[]> = {};
    laporans.forEach(l => {
        if (!byTw[l.periode_triwulan]) byTw[l.periode_triwulan] = [];
        byTw[l.periode_triwulan].push(l);
    });

    // Stats
    const statCounts = { kabag_approved: 0, submitted: 0, rejected: 0 };
    laporans.forEach(l => { statCounts[l.status] = (statCounts[l.status] ?? 0) + 1; });

    const STAT_ITEMS = [
        { key: 'kabag_approved' as const, label: 'Disetujui', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' },
        { key: 'submitted'      as const, label: 'Menunggu',  color: 'text-amber-700 dark:text-amber-400',      bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' },
        { key: 'rejected'       as const, label: 'Ditolak',   color: 'text-red-700 dark:text-red-400',          bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' },
    ];

    if (laporans.length === 0) {
        return (
            <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                Belum ada laporan yang disubmit atau disetujui.
            </div>
        );
    }

    return (
        <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2">
                {STAT_ITEMS.map(s => (
                    <div key={s.key} className={`rounded-xl border px-3 py-2.5 flex flex-col items-center gap-0.5 ${s.bg}`}>
                        <span className={`text-2xl font-bold leading-none ${s.color}`}>{statCounts[s.key]}</span>
                        <span className={`text-[11px] font-medium ${s.color} opacity-80`}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Panel */}
            <div className="rounded-xl border shadow-sm overflow-hidden">
                {/* Panel header */}
                <div className="px-5 py-3 bg-[#003580] flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                    <h2 className="text-sm font-semibold text-white">Status Laporan Pengukuran per Tim Kerja</h2>
                    <span className="ml-auto text-xs text-white/60">Super Admin dapat membuka kembali laporan yang terkunci</span>
                </div>

                {Object.entries(byTw).map(([tw, items]) => {
                    const twCfg = TW_PILL_CONFIG[tw] ?? TW_PILL_CONFIG['TW1'];
                    return (
                        <div key={tw} className="border-b last:border-b-0">
                            {/* TW header */}
                            <div className={`flex items-center gap-2 px-5 py-2.5 ${twCfg.bg} ${twCfg.accent}`}>
                                <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${twCfg.pill}`}>
                                    {TW_LABELS[tw] ?? tw}
                                </span>
                                <span className="ml-auto text-[11px] text-muted-foreground">{items.length} laporan</span>
                            </div>

                            {/* Laporan rows */}
                            <div className="divide-y divide-border/50">
                                {items.map(laporan => {
                                    const cfg  = LAPORAN_STATUS_CONFIG[laporan.status];
                                    const Icon = cfg.icon;
                                    const dot  = LAPORAN_DOT_CONFIG[laporan.status];
                                    const reopenable = canReopen(laporan);
                                    return (
                                        <div
                                            key={laporan.id}
                                            className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors
                                                ${laporan.status === 'kabag_approved' ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                                                : laporan.status === 'submitted'      ? 'bg-amber-50/40 dark:bg-amber-950/10'
                                                : laporan.status === 'rejected'       ? 'bg-red-50/40 dark:bg-red-950/10'
                                                : ''}`}
                                        >
                                            {/* Status dot */}
                                            <span className={`shrink-0 h-2.5 w-2.5 rounded-full ring-2 ${dot.bg} ${dot.ring}`} />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold">{laporan.tim_kerja?.nama ?? '—'}</span>
                                                    {laporan.tim_kerja?.kode && (
                                                        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono">
                                                            {laporan.tim_kerja.kode}
                                                        </span>
                                                    )}
                                                </div>
                                                {laporan.rekomendasi_kabag && (
                                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 italic bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded inline-block">
                                                        💬 {laporan.rekomendasi_kabag}
                                                    </p>
                                                )}
                                                {laporan.approved_at && (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">Disetujui: {laporan.approved_at}</p>
                                                )}
                                            </div>

                                            {/* Status badge */}
                                            <Badge variant="outline" className={`shrink-0 flex items-center gap-1.5 text-xs px-2.5 py-1 font-medium ${cfg.className}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                                {cfg.label}
                                            </Badge>

                                            {/* Buka kembali */}
                                            {reopenable && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="shrink-0 h-7 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                    onClick={() => setReopenTarget(laporan)}
                                                >
                                                    <LockOpen className="h-3 w-3" />
                                                    Buka Kembali
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AlertDialog open={reopenTarget !== null} onOpenChange={v => !v && setReopenTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Buka kembali Laporan Pengukuran ini?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Laporan milik <span className="font-semibold">{reopenTarget?.tim_kerja?.nama ?? '—'}</span>{' '}
                                    ({TW_LABELS[reopenTarget?.periode_triwulan ?? ''] ?? reopenTarget?.periode_triwulan}) akan kembali ke status{' '}
                                    <span className="font-semibold">Draft</span> dan dapat diedit ulang oleh tim terkait.
                                </p>
                                {reopenTarget?.status === 'kabag_approved' && (
                                    <div className="rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                                        ⚠️ Laporan ini sudah <strong>disetujui</strong> oleh Kabag Umum. Membuka kembali akan membatalkan persetujuan tersebut.
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-amber-600 text-white hover:bg-amber-700" onClick={doReopen}>
                            Ya, Buka Kembali
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

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
                                            idx === 0
                                                ? 'bg-blue-100 text-blue-800 font-medium'
                                                : 'border border-slate-300 text-slate-500'
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
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Progress/Kegiatan</p>
                        <p className="whitespace-pre-wrap">{row.progress_kegiatan || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kendala/Permasalahan</p>
                        <p className="whitespace-pre-wrap">{row.kendala || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Strategi/Tindak Lanjut</p>
                        <p className="whitespace-pre-wrap">{row.strategi_tindak_lanjut || '—'}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Group by sasaran for rowspan ─────────────────────────────────────────────

function groupBySasaran(rows: MatrixRow[]) {
    return rows.map((row, i) => {
        const prev        = i > 0 ? rows[i - 1].sasaran_kode : null;
        const showSasaran = row.sasaran_kode !== prev;
        const span        = rows.filter(r => r.sasaran_kode === row.sasaran_kode).length;
        return { ...row, showSasaran, rowSpan: showSasaran ? span : undefined };
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Realisasi({ tahun, periodes, periode, matrix, laporans }: Props) {
    const [detail, setDetail] = useState<MatrixRow | null>(null);

    function changePeriode(id: string) {
        router.get('/super-admin/pengukuran/realisasi', { periode_id: id }, { preserveState: false });
    }

    const grouped  = groupBySasaran(matrix);
    const filled   = matrix.filter(r => r.realisasi).length;
    const twLabel  = periode ? (TW_LABELS[periode.triwulan] ?? periode.triwulan) : '';
    const pendingCount = laporans.filter(l => l.status === 'submitted' || l.status === 'kabag_approved').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Realisasi Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Realisasi Kinerja</h1>
                        <p className="text-muted-foreground text-sm">{tahun.label}</p>
                    </div>
                    {periode && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button size="sm" variant="outline" className="gap-1.5 h-8" asChild>
                                <a href={`/super-admin/pengukuran/export/xls?periode_id=${periode.id}`}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export XLSX
                                </a>
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5 h-8" asChild>
                                <a href={`/super-admin/pengukuran/export/tw-pdf?periode_id=${periode.id}`} target="_blank">
                                    <FileText className="h-3.5 w-3.5" /> Export PDF {TW_LABELS[periode.triwulan] ?? periode.triwulan}
                                </a>
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5 h-8" asChild>
                                <a href={`/super-admin/pengukuran/export/pdf`} target="_blank">
                                    <FileText className="h-3.5 w-3.5" /> PDF Semua TW
                                </a>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="realisasi">
                    <TabsList>
                        <TabsTrigger value="realisasi">Realisasi Kinerja</TabsTrigger>
                        <TabsTrigger value="status" className="gap-1.5">
                            Status Laporan
                            {pendingCount > 0 && (
                                <Badge className="h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white">
                                    {pendingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="realisasi" className="mt-4 flex flex-col gap-4">
                        {/* Periode selector */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-muted-foreground">Periode Aktif:</span>
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

                        {!periode ? (
                            <p className="text-muted-foreground">Belum ada periode yang aktif. Aktifkan periode di halaman Kelola Periode.</p>
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
                                        {grouped.map((row) => {
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
                                                                        {t.nama}
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

                                                    <td className="border border-border px-2 py-2 text-center text-xs align-middle bg-slate-50 dark:bg-slate-900/40 w-20">
                                                        {row.iku_target_tw
                                                            ? <span className="font-medium">{row.iku_target_tw}</span>
                                                            : <span className="text-muted-foreground">—</span>
                                                        }
                                                    </td>

                                                    <td className="border border-border px-2 py-2 text-center text-xs align-middle w-20">
                                                        {hasData
                                                            ? <span className="font-semibold text-green-700 dark:text-green-400">{row.realisasi}</span>
                                                            : <span className="text-muted-foreground">—</span>
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
                                                        <Badge variant="outline" className={hasData
                                                            ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200 text-xs'
                                                        }>
                                                            {hasData ? 'Terisi' : 'Kosong'}
                                                        </Badge>
                                                    </td>

                                                    <td className="border border-border px-2 py-2 text-center align-middle">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6"
                                                            onClick={() => setDetail(row)}>
                                                            <Eye className={`h-3.5 w-3.5 ${hasData ? '' : 'black'}`} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="status" className="mt-4 flex flex-col gap-4">
                        <LaporanStatusPanel laporans={laporans} />
                    </TabsContent>
                </Tabs>
            </div>

            {detail && periode && (
                <DetailDialog row={detail} tw={periode.triwulan} onClose={() => setDetail(null)} />
            )}
        </AppLayout>
    );
}
