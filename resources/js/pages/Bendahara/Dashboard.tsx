import { Head, Link } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    ChevronRight,
    CalendarDays,
    Loader2,
    AlertCircle,
    XCircle,
    HandCoins,
    Clock,
    ShieldCheck,
    TrendingUp,
    Wallet,
    ArrowRight,
    Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type Tahun = { id: number; tahun: number; label: string } | null;
type TimKerja = { nama: string; kode: string } | null;

type TugasItem = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: number;
    pic_approved_at: string;
    hari_menunggu: number;
    tim_kerja: TimKerja;
};

type RiwayatItem = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: number;
    dicairkan_at: string;
    tim_kerja: TimKerja;
};

type PipelineStats = {
    kabag_approved: number;
    ppk_approved: number;
    pic_approved: number;
    dicairkan: number;
    rejected: number;
};

type Props = {
    user: { nama_lengkap: string };
    tahun: Tahun;
    siapCair: number;
    sudahCair: number;
    nilaiCair: number;
    nilaiSiap: number;
    pipeline: PipelineStats;
    tugasHariIni: TugasItem[];
    riwayatCair: RiwayatItem[];
};

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Pipeline row config ────────────────────────────────────────────── */
const PIPELINE_ROWS = [
    {
        key: 'kabag_approved' as const,
        label: 'Menunggu PPK',
        dot: 'bg-sky-400',
        text: 'text-sky-600 dark:text-sky-400',
        bg: 'bg-sky-50 dark:bg-sky-950/20',
        icon: Loader2,
        spinner: true,
        spinnerColor: 'text-sky-400',
    },
    {
        key: 'ppk_approved' as const,
        label: 'Menunggu PIC Keuangan',
        dot: 'bg-violet-400',
        text: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-950/20',
        icon: Loader2,
        spinner: true,
        spinnerColor: 'text-violet-400',
    },
    {
        key: 'pic_approved' as const,
        label: 'Siap Dicairkan',
        dot: 'bg-lime-400',
        text: 'text-lime-700 dark:text-lime-400',
        bg: 'bg-lime-50 dark:bg-lime-950/20',
        icon: AlertCircle,
        highlight: true,
    },
    {
        key: 'dicairkan' as const,
        label: 'Sudah Dicairkan',
        dot: 'bg-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        icon: CheckCircle2,
    },
    {
        key: 'rejected' as const,
        label: 'Ditolak',
        dot: 'bg-red-400',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/20',
        icon: XCircle,
    },
] as const;

/* ─── Summary Card ─────────────────────────────────────────────────── */
function SummaryCard({
    icon: Icon,
    iconClass,
    iconBg,
    accentBg,
    label,
    value,
    sub,
    href,
}: {
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    accentBg: string;
    label: string;
    value: string | number;
    sub?: string;
    href?: string;
}) {
    const inner = (
        <div className="h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md">
            <div className={`h-1 w-full ${accentBg}`} />
            <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
            </div>
        </div>
    );
    return href ? <Link href={href} className="block group h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

/* ─── Tugas Item Card ──────────────────────────────────────────────── */
function TugasCard({ item }: { item: TugasItem }) {
    const isUrgent = item.hari_menunggu >= 3;
    return (
        <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors border-b last:border-b-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isUrgent ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-lime-50 dark:bg-lime-950/20'}`}>
                <HandCoins className={`h-5 w-5 ${isUrgent ? 'text-amber-500' : 'text-lime-600 dark:text-lime-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{item.keperluan}</p>
                    {item.tim_kerja && (
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold font-mono text-muted-foreground">
                            {item.tim_kerja.kode}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{item.nomor_permohonan}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className={`text-xs font-semibold tabular-nums ${isUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-lime-600 dark:text-lime-400'}`}>
                        {fmt(item.total_anggaran)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className={`h-3 w-3 ${isUrgent ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
                    <span className={`text-[11px] ${isUrgent ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'}`}>
                        Menunggu {item.hari_menunggu} hari
                    </span>
                </div>
            </div>
            <Link href={`/bendahara/permohonan-dana/${item.id}`}>
                <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8">
                    Proses
                    <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </Link>
        </div>
    );
}

/* ─── Main Component ───────────────────────────────────────────────── */
export default function Dashboard({
    user,
    tahun,
    siapCair,
    sudahCair,
    nilaiCair,
    nilaiSiap,
    pipeline,
    tugasHariIni,
    riwayatCair,
}: Props) {
    const pdTotal = pipeline.kabag_approved + pipeline.ppk_approved + pipeline.pic_approved + pipeline.dicairkan + pipeline.rejected;

    return (
        <AppLayout>
            <Head title="Dashboard Bendahara" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ═══ HERO ═══════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-600 p-6 text-white shadow-lg">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
                    />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="h-4 w-4 text-emerald-200" />
                                <span className="text-emerald-200 text-xs font-medium uppercase tracking-widest">Bendahara</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight">{user.nama_lengkap}</h1>
                            <p className="text-emerald-100 text-sm mt-1">Panel Keuangan &amp; Pencairan Dana</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {tahun && (
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                                    {tahun.label}
                                </span>
                            )}
                            {siapCair > 0 && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-500/30 px-3 py-1.5 animate-pulse">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-200" />
                                    <span className="text-sm font-bold text-white">{siapCair} permohonan siap dicairkan</span>
                                </div>
                            )}
                            {nilaiCair > 0 && (
                                <div className="text-right mt-1">
                                    <p className="text-xs text-emerald-200">Total Dicairkan Tahun Ini</p>
                                    <p className="text-lg font-bold tabular-nums">{fmt(nilaiCair)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ SUMMARY CARDS ════════════════════════════════════ */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={AlertCircle}
                        iconClass="text-lime-600 dark:text-lime-400"
                        iconBg="bg-lime-50 dark:bg-lime-950/30"
                        accentBg="bg-lime-500"
                        label="Siap Dicairkan"
                        value={siapCair}
                        sub={nilaiSiap > 0 ? fmt(nilaiSiap) : 'Belum ada'}
                        href="/bendahara/permohonan-dana"
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        iconClass="text-emerald-600 dark:text-emerald-400"
                        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                        accentBg="bg-emerald-500"
                        label="Sudah Dicairkan"
                        value={sudahCair}
                        sub={nilaiCair > 0 ? fmt(nilaiCair) : 'Belum ada'}
                    />
                    <SummaryCard
                        icon={TrendingUp}
                        iconClass="text-blue-600 dark:text-blue-400"
                        iconBg="bg-blue-50 dark:bg-blue-950/30"
                        accentBg="bg-blue-500"
                        label="Nilai Siap Cair"
                        value={fmt(nilaiSiap)}
                        sub="Menunggu proses Anda"
                    />
                    <SummaryCard
                        icon={Wallet}
                        iconClass="text-violet-600 dark:text-violet-400"
                        iconBg="bg-violet-50 dark:bg-violet-950/30"
                        accentBg="bg-violet-500"
                        label="Nilai Sudah Cair"
                        value={fmt(nilaiCair)}
                        sub="Tahun ini"
                    />
                </div>

                {/* ═══ PIPELINE + TUGAS (2-col layout) ══════════════════ */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* ─── Pipeline Card ──────────────────────────────── */}
                    <div className="overflow-hidden rounded-xl border bg-card lg:col-span-1">
                        <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/20">
                                    <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Pipeline Permohonan</p>
                                    <p className="text-xs text-muted-foreground">{pdTotal} total permohonan</p>
                                </div>
                            </div>

                            {pdTotal === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada permohonan</p>
                            ) : (
                                <div className="space-y-1">
                                    {PIPELINE_ROWS.map((row) => {
                                        const value = pipeline[row.key];
                                        const isActive = row.key === 'pic_approved' && value > 0;
                                        return (
                                            <div
                                                key={row.key}
                                                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${isActive ? 'bg-lime-50 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-900' : 'hover:bg-muted/30'}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {'spinner' in row && row.spinner ? (
                                                        <Loader2 className={`h-4 w-4 animate-spin ${('spinnerColor' in row && row.spinnerColor) ? row.spinnerColor : ''}`} />
                                                    ) : (
                                                        <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
                                                    )}
                                                    <span className={`text-xs font-medium ${row.text}`}>{row.label}</span>
                                                </div>
                                                <span className={`text-xs font-bold tabular-nums ${row.text}`}>{value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-dashed">
                                <Link
                                    href="/bendahara/permohonan-dana"
                                    className="flex items-center gap-0.5 text-xs text-muted-foreground/50 hover:text-teal-600 transition-colors group/link"
                                >
                                    Lihat semua permohonan
                                    <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ─── Tugas Hari Ini ─────────────────────────────── */}
                    <div className="overflow-hidden rounded-xl border bg-card lg:col-span-2">
                        <div className="h-1 w-full bg-lime-500" />
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-50 dark:bg-lime-950/20">
                                        <HandCoins className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Tugas Hari Ini</p>
                                        <p className="text-xs text-muted-foreground">
                                            {siapCair > 0 ? `${siapCair} permohonan menunggu pencairan` : 'Tidak ada tugas'}
                                        </p>
                                    </div>
                                </div>
                                {siapCair > 0 && (
                                    <Link href="/bendahara/permohonan-dana">
                                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                                            Lihat Semua
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {tugasHariIni.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 mb-4">
                                        <Inbox className="h-8 w-8 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">Semua permohonan sudah diproses</p>
                                    <p className="text-xs text-muted-foreground mt-1">Tidak ada yang menunggu pencairan saat ini</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border">
                                    {tugasHariIni.map((item) => (
                                        <TugasCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ RIWAYAT PENCAIRAN ════════════════════════════════ */}
                {riwayatCair.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-semibold text-foreground">Riwayat Pencairan Terakhir</p>
                            </div>
                            <Link
                                href="/bendahara/permohonan-dana"
                                className="flex items-center gap-0.5 text-xs text-muted-foreground/50 hover:text-emerald-600 transition-colors group"
                            >
                                Lihat semua <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-card">
                            <div className="h-1 w-full bg-emerald-500" />
                            <div className="divide-y">
                                {riwayatCair.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/bendahara/permohonan-dana/${item.id}`}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                                {item.keperluan}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-xs font-mono text-muted-foreground">{item.nomor_permohonan}</span>
                                                {item.tim_kerja && (
                                                    <span className="text-xs text-muted-foreground">· {item.tim_kerja.kode}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {fmt(item.total_anggaran)}
                                            </p>
                                            <div className="flex items-center gap-1 justify-end mt-0.5">
                                                <CalendarDays className="h-3 w-3 text-muted-foreground/50" />
                                                <span className="text-xs text-muted-foreground">{fmtDate(item.dicairkan_at)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
