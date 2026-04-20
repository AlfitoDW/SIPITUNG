import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, FileEdit, AlertTriangle, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '#' },
    { title: 'Rencana Aksi', href: '/pimpinan/perencanaan/rencana-aksi' },
];

type TimKerja  = { id: number; nama: string; kode: string; nama_singkat?: string };
type Kegiatan  = { id: number; triwulan: number; urutan: number; nama_kegiatan: string };
type Indikator = {
    id: number | null;
    kode: string;
    nama: string;
    satuan: string;
    target: string;
    target_tw1: string | null;
    target_tw2: string | null;
    target_tw3: string | null;
    target_tw4: string | null;
    pic_tim_kerjas: TimKerja[];
    ra_id: number | null;
    ra_status: string | null;
    ra_tim_kerja: TimKerja | null;
    kegiatans: Kegiatan[];
};
type SasaranGroup = { kode: string; nama: string; indikators: Indikator[] };
type RAStatus = { id: number; status: string; rekomendasi_kabag: string | null; tim_kerja: TimKerja | null };
type Tahun = { id: number; tahun: number; label: string };
type Props = { tahun: Tahun; sasarans: SasaranGroup[]; ras: RAStatus[]; role: 'kabag_umum' | 'ppk' };

const RA_STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    draft:          { label: 'Draft',          className: 'bg-slate-100 text-slate-700 border-slate-300',   icon: FileEdit },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-yellow-50 text-yellow-700 border-yellow-300', icon: Clock },
    kabag_approved: { label: 'Disetujui',      className: 'bg-green-50 text-green-700 border-green-300',    icon: CheckCircle2 },
    rejected:       { label: 'Ditolak',        className: 'bg-red-50 text-red-700 border-red-300',          icon: XCircle },
};

const TW_CONFIG = [
    null,
    { label: 'Triwulan I',   roman: 'I',   pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',                    border: 'border-blue-200 dark:border-blue-800',       accent: 'border-l-2 border-l-blue-400' },
    { label: 'Triwulan II',  roman: 'II',  pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',        border: 'border-emerald-200 dark:border-emerald-800', accent: 'border-l-2 border-l-emerald-400' },
    { label: 'Triwulan III', roman: 'III', pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',            border: 'border-violet-200 dark:border-violet-800',   accent: 'border-l-2 border-l-violet-400' },
    { label: 'Triwulan IV',  roman: 'IV',  pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',               border: 'border-amber-200 dark:border-amber-800',     accent: 'border-l-2 border-l-amber-400' },
] as const;

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

// ─── Kegiatan View Sheet ──────────────────────────────────────────────────────

function KegiatanViewSheet({ iku, onClose }: { iku: Indikator; onClose: () => void }) {
    const kegiatanByTw = (tw: number) =>
        iku.kegiatans.filter(k => k.triwulan === tw).sort((a, b) => a.urutan - b.urutan);

    const totalKegiatan = iku.kegiatans.length;

    return (
        <Sheet open onOpenChange={(v) => !v && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
                <SheetHeader className="px-5 pt-5 pb-3 border-b">
                    <SheetTitle className="text-base leading-tight">Rencana Kegiatan / Aktivitas</SheetTitle>
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm mt-1">
                        <p className="text-xs text-muted-foreground">{iku.kode}</p>
                        <p className="font-medium leading-snug">{iku.nama}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {iku.ra_tim_kerja && (
                            <Badge variant="secondary" className="text-xs">{iku.ra_tim_kerja.nama}</Badge>
                        )}
                        {iku.pic_tim_kerjas.length > 1 && (
                            <span className="text-xs text-muted-foreground">
                                Kolaborasi:{' '}
                                {iku.pic_tim_kerjas.map((t, i) => (
                                    <span key={t.id}>
                                        {i > 0 && ' · '}
                                        <span className="font-medium text-foreground">{t.nama_singkat ?? t.nama}</span>
                                    </span>
                                ))}
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">{totalKegiatan} kegiatan tercatat</span>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {totalKegiatan === 0 ? (
                        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                            Belum ada rencana kegiatan yang diinput oleh Tim Kerja.
                        </div>
                    ) : (
                        ([1, 2, 3, 4] as const).map((tw) => {
                            const cfg  = TW_CONFIG[tw]!;
                            const list = kegiatanByTw(tw);
                            const twTarget = iku[`target_tw${tw}` as keyof Indikator] as string | null;
                            if (list.length === 0) return null;
                            return (
                                <div key={tw} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.pill}`}>
                                                TW {cfg.roman} — {cfg.label}
                                            </span>
                                            {twTarget && (
                                                <span className="text-xs text-muted-foreground">
                                                    Target: <span className="font-semibold">{twTarget}</span> {iku.satuan}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{list.length} kegiatan</span>
                                    </div>
                                    <div className={`rounded-lg border divide-y ${cfg.border}`}>
                                        {list.map((k, idx) => (
                                            <div key={k.id} className={`flex items-start gap-2 px-3 py-2 ${cfg.accent}`}>
                                                <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0 text-right">
                                                    {idx + 1}.
                                                </span>
                                                <p className="text-sm leading-snug">{k.nama_kegiatan}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── RA Actions Panel ─────────────────────────────────────────────────────────

type ActionTarget = { ra: RAStatus; action: 'approve' | 'reject' };

function RaActionsPanel({ ras, role }: { ras: RAStatus[]; role: 'kabag_umum' | 'ppk' }) {
    const [target, setTarget] = useState<ActionTarget | null>(null);
    const [rekomendasi, setRekomendasi] = useState('');

    const submittedRas = ras.filter(ra => ra.status === 'submitted');

    function doAction() {
        if (!target) return;
        const url = `/pimpinan/perencanaan/rencana-aksi/${target.ra.id}/${target.action}`;
        router.post(url, { rekomendasi }, {
            onSuccess: () => { setTarget(null); setRekomendasi(''); },
            preserveScroll: true,
        });
    }

    return (
        <>
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold">Status Rencana Aksi per Tim Kerja</h2>
                    {submittedRas.length > 0 && role === 'kabag_umum' && (
                        <span className="ml-auto text-xs text-amber-600 font-medium">{submittedRas.length} menunggu persetujuan Anda</span>
                    )}
                </div>
                {ras.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Belum ada Rencana Aksi yang disubmit.
                    </div>
                ) : (
                    <div className="divide-y">
                        {ras.map(ra => {
                            const cfg  = RA_STATUS_CONFIG[ra.status] ?? RA_STATUS_CONFIG['draft'];
                            const Icon = cfg.icon;
                            const canAct = ra.status === 'submitted' && role === 'kabag_umum';
                            return (
                                <div key={ra.id} className={`flex items-center gap-3 px-4 py-3 ${ra.status === 'kabag_approved' ? 'bg-green-50/40 dark:bg-green-950/10' : ra.status === 'submitted' ? 'bg-yellow-50/40 dark:bg-yellow-950/10' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold truncate">{ra.tim_kerja?.nama ?? '—'}</span>
                                            {ra.tim_kerja?.kode && (
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5 font-mono">{ra.tim_kerja.kode}</span>
                                            )}
                                        </div>
                                        {ra.rekomendasi_kabag && (
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">Catatan: {ra.rekomendasi_kabag}</p>
                                        )}
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 ${cfg.className}`}>
                                        <Icon className="h-3 w-3" />
                                        {cfg.label}
                                    </Badge>
                                    {canAct && (
                                        <div className="flex gap-1.5 shrink-0">
                                            <Button size="sm" variant="outline"
                                                className="h-7 gap-1 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                                onClick={() => { setTarget({ ra, action: 'approve' }); setRekomendasi(''); }}>
                                                <CheckCircle2 className="h-3 w-3" /> Setujui
                                            </Button>
                                            <Button size="sm" variant="outline"
                                                className="h-7 gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                onClick={() => { setTarget({ ra, action: 'reject' }); setRekomendasi(''); }}>
                                                <XCircle className="h-3 w-3" /> Tolak
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertDialog open={target !== null} onOpenChange={v => !v && setTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {target?.action === 'approve' ? 'Setujui' : 'Tolak'} Rencana Aksi ini?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    RA milik <span className="font-semibold">{target?.ra.tim_kerja?.nama ?? '—'}</span> akan{' '}
                                    {target?.action === 'approve'
                                        ? <span>diubah ke status <span className="font-semibold text-green-700">Disetujui</span>.</span>
                                        : <span>dikembalikan ke tim kerja dengan status <span className="font-semibold text-red-700">Ditolak</span>.</span>
                                    }
                                </p>
                                {target?.action === 'reject' && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Catatan / Rekomendasi</label>
                                        <Textarea
                                            placeholder="Tulis alasan penolakan atau rekomendasi perbaikan..."
                                            value={rekomendasi}
                                            onChange={e => setRekomendasi(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTarget(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className={target?.action === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}
                            onClick={doAction}
                        >
                            {target?.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Penyusunan({ tahun, sasarans, ras, role }: Props) {
    const [viewKegiatan, setViewKegiatan] = useState<Indikator | null>(null);

    const roleLabel   = role === 'kabag_umum' ? 'Kabag Umum' : 'PPK';
    const pendingCount = ras.filter(ra => ra.status === 'submitted').length;

    const totalIku        = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledIku       = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target_tw1 && i.target_tw2 && i.target_tw3 && i.target_tw4).length, 0);
    const totalKegiatan   = sasarans.reduce((s, sar) => s + sar.indikators.reduce((a, i) => a + i.kegiatans.length, 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rencana Aksi — Perencanaan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Review Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label} · Anda login sebagai <span className="font-medium">{roleLabel}</span></p>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total IKU </span>
                        <span className="font-bold">{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Target TW lengkap </span>
                        <span className={`font-bold ${filledIku === totalIku && totalIku > 0 ? 'text-green-600' : 'text-amber-600'}`}>{filledIku}/{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total kegiatan </span>
                        <span className={`font-bold ${totalKegiatan > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>{totalKegiatan}</span>
                    </div>
                    {pendingCount > 0 && (
                        <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                            <span className="text-muted-foreground">Menunggu persetujuan </span>
                            <span className="font-bold text-amber-600">{pendingCount} RA</span>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="review">
                    <TabsList>
                        <TabsTrigger value="review">Review IKU</TabsTrigger>
                        <TabsTrigger value="actions" className="gap-1.5">
                            Persetujuan RA
                            {pendingCount > 0 && (
                                <Badge className="h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white">{pendingCount}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="review" className="mt-4">
                        {sasarans.length === 0 ? (
                            <p className="text-muted-foreground">Belum ada data IKU untuk tahun ini.</p>
                        ) : (
                            <div className="rounded-xl border shadow-sm overflow-x-auto">
                                <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-8">#</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-52">Sasaran</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-32">Tim Kerja</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-32">Status RA</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Satuan</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                            <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                            <TableHead rowSpan={2} className="text-center align-middle font-semibold text-white w-24">Kegiatan</TableHead>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                            {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                                <TableHead key={tw} className={`text-center font-semibold text-white w-16${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            let rowNum = 0;
                                            return sasarans.flatMap((sasaran) => {
                                                const color = getColor(sasaran.kode);
                                                const count = sasaran.indikators.length;
                                                if (count === 0) return [];
                                                return sasaran.indikators.map((iku, idx) => {
                                                    rowNum++;
                                                    const statusCfg = iku.ra_status ? (RA_STATUS_CONFIG[iku.ra_status] ?? RA_STATUS_CONFIG['draft']) : null;
                                                    const StatusIcon = statusCfg?.icon;
                                                    const kegiatanCount = iku.kegiatans.length;
                                                    return (
                                                        <TableRow key={`${sasaran.kode}-${iku.kode}`} className="align-top hover:bg-muted/30">
                                                            <TableCell className="text-center text-xs text-muted-foreground align-middle">{rowNum}</TableCell>
                                                            {idx === 0 && (
                                                                <TableCell rowSpan={count} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="text-sm align-top">
                                                                <span className="block text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                                <span className="leading-snug">{iku.nama}</span>
                                                            </TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                <div className="flex flex-col gap-0.5 items-center">
                                                                    {iku.pic_tim_kerjas.length > 0
                                                                        ? iku.pic_tim_kerjas.map((t, i) => (
                                                                            <span key={t.id} className={`inline-block rounded px-1.5 py-0.5 text-xs leading-tight ${i === 0
                                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium'
                                                                                : 'border border-slate-300 text-slate-500 text-[10px]'
                                                                            }`}>
                                                                                {t.nama_singkat ?? t.nama}
                                                                            </span>
                                                                        ))
                                                                        : <span className="text-xs text-muted-foreground">—</span>
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center align-middle px-2">
                                                                {statusCfg && StatusIcon ? (
                                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${statusCfg.className}`}>
                                                                        <StatusIcon className="h-3 w-3" />
                                                                        {statusCfg.label}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                {iku.target
                                                                    ? <span className="text-sm font-semibold">{iku.target}</span>
                                                                    : <span className="text-xs text-amber-500 italic">—</span>}
                                                            </TableCell>
                                                            {(['target_tw1', 'target_tw2', 'target_tw3', 'target_tw4'] as const).map(tw => (
                                                                <TableCell key={tw} className="text-center text-sm align-middle">
                                                                    {iku[tw] ? <span className="font-medium">{iku[tw]}</span> : <span className="text-muted-foreground">—</span>}
                                                                </TableCell>
                                                            ))}
                                                            <TableCell className="text-center align-middle">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 gap-1.5 text-xs"
                                                                    onClick={() => setViewKegiatan(iku)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    {kegiatanCount > 0
                                                                        ? <span className="font-semibold text-blue-600">{kegiatanCount}</span>
                                                                        : <span className="text-muted-foreground">0</span>
                                                                    }
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                });
                                            });
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="actions" className="mt-4">
                        <RaActionsPanel ras={ras} role={role} />
                    </TabsContent>
                </Tabs>
            </div>

            {viewKegiatan && (
                <KegiatanViewSheet iku={viewKegiatan} onClose={() => setViewKegiatan(null)} />
            )}
        </AppLayout>
    );
}
