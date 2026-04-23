import { Head, router } from '@inertiajs/react';
import { Eye, LockOpen, Clock, CheckCircle2, XCircle, FileEdit, AlertTriangle, CalendarClock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeadlineCountdown } from '@/components/deadline-countdown';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/super-admin/perencanaan/rencana-aksi/penyusunan' },
];

type TimKerja  = { id: number; nama: string; kode: string; nama_singkat?: string };
type Kegiatan  = { id: number; triwulan: number; urutan: number; nama_kegiatan: string };
type Indikator = {
    id: number; ra_id: number | null; kode: string; nama: string; satuan: string; target: string | null;
    target_tw1: string | null; target_tw2: string | null; target_tw3: string | null; target_tw4: string | null;
    pic_tim_kerjas: TimKerja[]; tim_kerja: TimKerja | null;
    kegiatans: Kegiatan[];
};
type Sasaran   = { kode: string; nama: string; indikators: Indikator[] };
type Tahun     = { id: number; tahun: number; label: string };
type RaStatus  = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'rejected'; rekomendasi_kabag: string | null; tim_kerja: TimKerja | null };
type Props     = { tahun: Tahun; sasarans: Sasaran[]; ras: RaStatus[]; batasRa: string | null; serverNow: string };

const RA_STATUS_CONFIG = {
    draft:          { label: 'Draft',          icon: FileEdit,     className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    submitted:      { label: 'Menunggu Kabag', icon: Clock,        className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-400' },
    kabag_approved: { label: 'Disetujui',      icon: CheckCircle2, className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400' },
    rejected:       { label: 'Ditolak',        icon: XCircle,      className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400' },
} as const;

// ─── RA Status Panel ──────────────────────────────────────────────────────────

// Status priority untuk memilih RA terbaik per tim
const STATUS_PRIORITY: Record<string, number> = { kabag_approved: 3, submitted: 2, rejected: 1, draft: 0 };

function RaStatusPanel({ ras, sasarans }: { ras: RaStatus[]; sasarans: Sasaran[] }) {
    const [reopenTarget, setReopenTarget] = useState<RaStatus | null>(null);

    // Lookup RA berdasarkan tim_kerja_id → array semua RA milik tim tersebut
    const rasByTimId: Record<number, RaStatus[]> = {};
    for (const ra of ras) {
        if (ra.tim_kerja) {
            const tid = ra.tim_kerja.id;
            if (!rasByTimId[tid]) rasByTimId[tid] = [];
            rasByTimId[tid].push(ra);
        }
    }

    // Ambil RA dengan status terbaik dari kumpulan PIC tim untuk satu IKU.
    // Prioritas: kabag_approved > submitted > rejected > draft.
    // Menggunakan pic_tim_kerjas (bukan ra_id) supaya robust meski RAI entry belum ada.
    function getBestRa(picTeams: TimKerja[]): RaStatus | null {
        let best: RaStatus | null = null;
        for (const team of picTeams) {
            for (const ra of rasByTimId[team.id] ?? []) {
                if (!best || (STATUS_PRIORITY[ra.status] ?? -1) > (STATUS_PRIORITY[best.status] ?? -1)) {
                    best = ra;
                }
            }
        }
        return best;
    }

    function doReopen() {
        if (!reopenTarget) return;
        router.patch(`/super-admin/perencanaan/rencana-aksi/${reopenTarget.id}/reopen`, {}, {
            onSuccess: () => setReopenTarget(null),
            preserveScroll: true,
        });
    }

    const canReopen = (ra: RaStatus) => ra.status === 'submitted' || ra.status === 'kabag_approved';

    if (sasarans.length === 0) return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada IKU yang terdaftar di PK Awal.
        </div>
    );

    return (
        <>
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold">Status Rencana Aksi per IKU</h2>
                    <span className="ml-auto text-xs text-muted-foreground">Super Admin dapat membuka kembali dokumen yang terkunci</span>
                </div>

                <div>
                    {sasarans.map(sasaran => {
                        const color = getColor(sasaran.kode);
                        return (
                            <div key={sasaran.kode} className="border-b last:border-b-0">
                                {/* Sasaran header */}
                                <div className={`flex items-center gap-2 px-4 py-2 ${color.bg} ${color.accent}`}>
                                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold ${color.badge}`}>{sasaran.kode}</span>
                                    <span className="text-xs font-medium text-muted-foreground">{sasaran.nama}</span>
                                </div>

                                {/* IKU rows */}
                                <div className="divide-y divide-border/60">
                                    {sasaran.indikators.map(iku => {
                                        const ra = getBestRa(iku.pic_tim_kerjas);
                                        const status = ra?.status ?? null;
                                        const cfg = status ? RA_STATUS_CONFIG[status] : null;
                                        const Icon = cfg?.icon;
                                        const reopenable = ra ? canReopen(ra) : false;

                                        return (
                                            <div key={iku.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors ${status === 'kabag_approved' ? 'bg-green-50/30 dark:bg-green-950/10' : status === 'submitted' ? 'bg-yellow-50/30 dark:bg-yellow-950/10' : status === 'rejected' ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                                                {/* IKU info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-[11px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{iku.kode}</span>
                                                        <span className="text-sm leading-snug">{iku.nama}</span>
                                                    </div>
                                                    {iku.pic_tim_kerjas.length > 0 && (
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <span className="text-[11px] text-muted-foreground">PIC:</span>
                                                            {iku.pic_tim_kerjas.map((t, i) => (
                                                                <span key={t.id} className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ${i === 0 ? 'bg-[#003580]/10 text-[#003580] dark:bg-blue-900/40 dark:text-blue-300' : 'bg-muted text-muted-foreground'}`}>
                                                                    {t.nama_singkat ?? t.kode}
                                                                </span>
                                                            ))}
                                                            {iku.pic_tim_kerjas.length > 1 && (
                                                                <span className="text-[11px] text-muted-foreground italic">· kolaborasi</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {ra?.rekomendasi_kabag && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                                                            Catatan: {ra.rekomendasi_kabag}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Status badge */}
                                                {cfg && Icon ? (
                                                    <Badge variant="outline" className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 ${cfg.className}`}>
                                                        <Icon className="h-3 w-3" />
                                                        {cfg.label}
                                                    </Badge>
                                                ) : (
                                                    <span className="shrink-0 text-xs text-muted-foreground italic">Belum ada RA</span>
                                                )}

                                                {/* Buka Kembali */}
                                                {reopenable && ra && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="shrink-0 h-7 gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                                        onClick={() => setReopenTarget(ra)}
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
            </div>

            <AlertDialog open={reopenTarget !== null} onOpenChange={v => !v && setReopenTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Buka kembali Rencana Aksi ini?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    RA milik <span className="font-semibold">{reopenTarget?.tim_kerja?.nama ?? '—'}</span> akan kembali ke status <span className="font-semibold">Draft</span> dan dapat diedit ulang oleh tim terkait.
                                </p>
                                {reopenTarget?.status === 'kabag_approved' && (
                                    <div className="rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                                        ⚠️ Dokumen ini sudah <strong>disetujui</strong> oleh Kabag Umum. Membuka kembali akan membatalkan persetujuan tersebut.
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

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-slate-50/70 dark:bg-slate-800/30',  badge: 'bg-[#003580]/10 text-[#003580] dark:bg-blue-900/40 dark:text-blue-300',         accent: 'border-l-4 border-l-[#003580]' },
    'S 2': { bg: 'bg-slate-50/70 dark:bg-slate-800/30',  badge: 'bg-teal-600/10 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',            accent: 'border-l-4 border-l-teal-500' },
    'S 3': { bg: 'bg-slate-50/70 dark:bg-slate-800/30',  badge: 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',     accent: 'border-l-4 border-l-indigo-400' },
    'S 4': { bg: 'bg-slate-50/70 dark:bg-slate-800/30',  badge: 'bg-amber-500/10 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',         accent: 'border-l-4 border-l-amber-400' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

function TwCell({ value }: { value: string | null }) {
    return (
        <TableCell className="text-center text-sm align-middle">
            {value ? <span className="font-medium">{value}</span> : <span className="text-muted-foreground">—</span>}
        </TableCell>
    );
}

const TW_CONFIG = [
    null,
    { label: 'Triwulan I',   roman: 'I',   pill: 'bg-[#003580]/10 text-[#003580] dark:bg-blue-900/50 dark:text-blue-300',       border: 'border-slate-200 dark:border-slate-700', accent: 'border-l-2 border-l-[#003580]' },
    { label: 'Triwulan II',  roman: 'II',  pill: 'bg-teal-600/10 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',         border: 'border-slate-200 dark:border-slate-700', accent: 'border-l-2 border-l-teal-500' },
    { label: 'Triwulan III', roman: 'III', pill: 'bg-indigo-600/10 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300', border: 'border-slate-200 dark:border-slate-700', accent: 'border-l-2 border-l-indigo-400' },
    { label: 'Triwulan IV',  roman: 'IV',  pill: 'bg-amber-500/10 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',     border: 'border-slate-200 dark:border-slate-700', accent: 'border-l-2 border-l-amber-400' },
] as const;

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
                        {iku.tim_kerja && (
                            <Badge variant="secondary" className="text-xs">{iku.tim_kerja.nama}</Badge>
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

/** Konversi ISO string → format datetime-local input (YYYY-MM-DDTHH:MM) */
function toDatetimeLocal(iso: string | null): string {
    if (!iso) return '';
    // new Date() parse ISO8601 dgn offset timezone secara benar → local methods beri waktu WIB
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


// ─── Deadline Panel ───────────────────────────────────────────────────────────

function DeadlinePanel({ batasRa, serverNow }: { batasRa: string | null; serverNow: string }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [value, setValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    function openDialog() {
        setValue(toDatetimeLocal(batasRa));
        setDialogOpen(true);
    }

    function save() {
        setSaving(true);
        router.patch('/super-admin/perencanaan/rencana-aksi/batas', {
            batas_pengisian_ra: value || null,
        }, {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
            onFinish: () => setSaving(false),
        });
    }

    function clearDeadline() {
        setSaving(true);
        router.patch('/super-admin/perencanaan/rencana-aksi/batas', {
            batas_pengisian_ra: null,
        }, {
            preserveScroll: true,
            onSuccess: () => setConfirmClear(false),
            onFinish: () => setSaving(false),
        });
    }

    return (
        <>
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-500" />
                    <h2 className="text-sm font-semibold">Batas Waktu Pengisian Rencana Aksi</h2>
                </div>
                <div className="px-4 py-4 flex flex-col gap-3">
                    <DeadlineCountdown deadline={batasRa} serverNow={serverNow} label="Pengisian RA" />
                    {!batasRa && (
                        <p className="text-sm text-muted-foreground italic">Belum ada batas waktu. Tim Kerja dapat mengisi tanpa batas waktu.</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={openDialog}>
                            <CalendarClock className="h-3.5 w-3.5" />
                            {batasRa ? 'Ubah Batas Waktu' : 'Atur Batas Waktu'}
                        </Button>
                        {batasRa && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                onClick={() => setConfirmClear(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus Batas Waktu
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Set deadline dialog */}
            <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{batasRa ? 'Ubah' : 'Atur'} Batas Waktu Pengisian RA</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-1.5 py-2">
                        <Label>Tanggal & Jam Berakhir</Label>
                        <Input
                            type="datetime-local"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Setelah waktu ini, Tim Kerja tidak dapat menyimpan atau mengubah Rencana Aksi.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Batal</Button>
                        <Button onClick={save} disabled={!value || saving} loading={saving}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm clear dialog */}
            <AlertDialog open={confirmClear} onOpenChange={(v) => !v && setConfirmClear(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus batas waktu?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tim Kerja akan dapat mengisi Rencana Aksi tanpa batas waktu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={clearDeadline} disabled={saving} className="bg-red-600 text-white hover:bg-red-700">
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Penyusunan({ tahun, sasarans, ras, batasRa, serverNow }: Props) {
    const [viewKegiatan, setViewKegiatan] = useState<Indikator | null>(null);

    const totalIku  = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledTw  = sasarans.reduce((s, sar) => s + sar.indikators.filter(
        i => i.target_tw1 && i.target_tw2 && i.target_tw3 && i.target_tw4
    ).length, 0);
    const totalKegiatan = sasarans.reduce((s, sar) => s + sar.indikators.reduce((a, i) => a + i.kegiatans.length, 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total IKU </span>
                        <span className="font-bold">{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Target TW lengkap </span>
                        <span className={`font-bold ${filledTw === totalIku && totalIku > 0 ? 'text-green-600' : 'text-amber-600'}`}>{filledTw}/{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total kegiatan diinput </span>
                        <span className={`font-bold ${totalKegiatan > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>{totalKegiatan}</span>
                    </div>
                </div>

                {/* Tabs: Penyusunan | Status RA */}
                <Tabs defaultValue="penyusunan">
                    <TabsList>
                        <TabsTrigger value="penyusunan">Penyusunan</TabsTrigger>
                        <TabsTrigger value="status" className="gap-1.5">
                            Status RA
                            {ras.filter(ra => ra.status === 'submitted').length > 0 && (
                                <Badge className="h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white">
                                    {ras.filter(ra => ra.status === 'submitted').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="penyusunan" className="mt-4">
                        {sasarans.length === 0 ? (
                            <p className="text-muted-foreground">Belum ada data dari Tim Kerja manapun.</p>
                        ) : (
                            <div className="rounded-xl border shadow-sm overflow-hidden">
                                <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-8">#</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-52">Sasaran</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator Kinerja Utama</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Satuan</TableHead>
                                            <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                            <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                            <TableHead rowSpan={2} className="text-center align-middle font-semibold text-white w-36">PIC Tim Kerja</TableHead>
                                            <TableHead rowSpan={2} className="text-center align-middle font-semibold text-white w-24">Kegiatan</TableHead>
                                        </TableRow>
                                        <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                            {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                                <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
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
                                                    const kegiatanCount = iku.kegiatans.length;
                                                    return (
                                                        <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                                            <TableCell className="text-center text-xs text-muted-foreground align-middle">{rowNum}</TableCell>
                                                            {idx === 0 && (
                                                                <TableCell rowSpan={count} className={`align-top text-sm ${color.bg} ${color.accent}`}>
                                                                    <span className={`inline-block mb-1 rounded px-1.5 py-0.5 text-xs font-bold ${color.badge}`}>{sasaran.kode}</span>
                                                                    <p className="text-xs leading-snug text-foreground">{sasaran.nama}</p>
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="align-top">
                                                                <span className="block text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                                <span className="text-sm leading-snug">{iku.nama}</span>
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                {iku.target
                                                                    ? <span className="text-sm font-semibold">{iku.target}</span>
                                                                    : <span className="text-xs text-amber-500 italic">—</span>}
                                                            </TableCell>
                                                            <TwCell value={iku.target_tw1} />
                                                            <TwCell value={iku.target_tw2} />
                                                            <TwCell value={iku.target_tw3} />
                                                            <TwCell value={iku.target_tw4} />
                                                            <TableCell className="text-center align-middle">
                                                                {iku.pic_tim_kerjas.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                                        {iku.pic_tim_kerjas.map(t => (
                                                                            <Badge key={t.id} variant="secondary" className="text-xs">{t.nama}</Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-muted-foreground italic">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 gap-1.5 text-xs relative"
                                                                    onClick={() => setViewKegiatan(iku)}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    {kegiatanCount > 0 ? (
                                                                        <span className="font-semibold text-blue-600">{kegiatanCount}</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">0</span>
                                                                    )}
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

                    <TabsContent value="status" className="mt-4 flex flex-col gap-4">
                        <DeadlinePanel batasRa={batasRa} serverNow={serverNow} />
                        <RaStatusPanel ras={ras} sasarans={sasarans} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Kegiatan View Sheet */}
            {viewKegiatan && (
                <KegiatanViewSheet
                    iku={viewKegiatan}
                    onClose={() => setViewKegiatan(null)}
                />
            )}
        </AppLayout>
    );
}
