import { Head, Link } from '@inertiajs/react';
import {
    HandCoins, FileText, CheckCircle2, XCircle, Clock, AlertCircle,
    ChevronRight, Inbox, PlusCircle, ArrowRight, TrendingUp,
    Loader2, Shield, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type Tahun = { id: number; tahun: number; label: string } | null;
type TimKerja = { nama: string; kode: string } | null;

type Stats = {
    total: number;
    draft: number;
    rejected: number;
    proses: number;
    dicairkan: number;
    total_dicairkan: number;
};

type PipelineStats = {
    draft: number;
    submitted: number;
    katim_approved: number;
    kabag_approved: number;
    ppk_approved: number;
    pic_approved: number;
    dicairkan: number;
    rejected: number;
};

type TugasItem = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: number;
    status: string;
    updated_at: string;
    hari_menunggu: number;
    rejected_step: string | null;
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

type UserInfo = {
    nama: string;
    nip: string | null;
    role: string;
    nama_unit: string | null;
    kode_unit: string | null;
};

type Props = {
    tahun: Tahun;
    stats: Stats;
    pipeline: PipelineStats;
    tugasHariIni: TugasItem[];
    riwayatCair: RiwayatItem[];
    nilaiDraft: number;
    nilaiProses: number;
    nilaiRejected: number;
    userInfo: UserInfo;
};

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─── Summary Card ─────────────────────────────────────────────────── */
function SummaryCard({
    icon: Icon, iconClass, iconBg, accentBg, label, value, sub, href,
}: {
    icon: React.ElementType; iconClass: string; iconBg: string; accentBg: string;
    label: string; value: string | number; sub?: string; href?: string;
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

/* ─── Pipeline config ──────────────────────────────────────────────── */
const PIPELINE_ROWS = [
    { key: 'draft' as const, label: 'Draft', dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { key: 'submitted' as const, label: 'Menunggu KA.TIM', dot: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', spinner: true as const, spinnerColor: 'text-blue-400' },
    { key: 'katim_approved' as const, label: 'Menunggu Kabag', dot: 'bg-sky-400', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/20', spinner: true as const, spinnerColor: 'text-sky-400' },
    { key: 'kabag_approved' as const, label: 'Menunggu PPK', dot: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20', spinner: true as const, spinnerColor: 'text-indigo-400' },
    { key: 'ppk_approved' as const, label: 'Menunggu PIC', dot: 'bg-violet-400', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', spinner: true as const, spinnerColor: 'text-violet-400' },
    { key: 'pic_approved' as const, label: 'Siap Dicairkan', dot: 'bg-lime-400', text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-50 dark:bg-lime-950/20', spinner: true as const, spinnerColor: 'text-lime-400' },
    { key: 'dicairkan' as const, label: 'Sudah Dicairkan', dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { key: 'rejected' as const, label: 'Ditolak', dot: 'bg-red-400', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20' },
] as const;

/* ─── Tugas Item Card ──────────────────────────────────────────────── */
function TugasCard({ item }: { item: TugasItem }) {
    const isDraft = item.status === 'draft';
    const isRejected = item.status === 'rejected';
    const isUrgent = item.hari_menunggu >= 3;

    return (
        <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors border-b last:border-b-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isRejected ? 'bg-red-50 dark:bg-red-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}>
                {isRejected ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                    <FileText className={`h-5 w-5 ${isUrgent ? 'text-amber-500' : 'text-amber-600 dark:text-amber-400'}`} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{item.keperluan}</p>
                    {item.tim_kerja && (
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold font-mono text-muted-foreground">
                            {item.tim_kerja.kode}
                        </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isRejected ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'}`}>
                        {isRejected ? 'Perlu Revisi' : 'Draft'}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{item.nomor_permohonan || 'Belum ada nomor'}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className={`text-xs font-semibold tabular-nums ${isRejected ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {fmt(item.total_anggaran)}
                    </span>
                </div>
                {isRejected && item.rejected_step && (
                    <p className="text-[11px] text-red-500 mt-0.5">
                        Ditolak oleh {item.rejected_step === 'katim' ? 'KA.TIM' : item.rejected_step === 'kabag' ? 'Kabag' : item.rejected_step === 'ppk' ? 'PPK' : item.rejected_step === 'pic' ? 'PIC' : item.rejected_step === 'bendahara' ? 'Bendahara' : item.rejected_step}
                    </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                    <Clock className={`h-3 w-3 ${isUrgent ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
                    <span className={`text-[11px] ${isUrgent ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'}`}>
                        {isDraft ? 'Dibuat' : 'Ditolak'} {item.hari_menunggu} hari lalu
                    </span>
                </div>
            </div>
            <Link href={`/pumk/permohonan-dana/${item.id}/edit`}>
                <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs h-8">
                    {isRejected ? 'Perbaiki' : 'Lanjutkan'}
                    <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </Link>
        </div>
    );
}

/* ─── Main Component ───────────────────────────────────────────────── */
export default function Dashboard({
    tahun, stats, pipeline, tugasHariIni, riwayatCair,
    nilaiDraft, nilaiProses, nilaiRejected, userInfo,
}: Props) {
    const pdTotal = Object.values(pipeline).reduce((a, b) => a + b, 0);
    const perluPerhatian = stats.draft + stats.rejected;

    return (
        <AppLayout>
            <Head title="Dashboard PUMK" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ═══ HERO ═══════════════════════════════════════════════ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 p-6 text-white shadow-lg">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
                    />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-blue-200" />
                                <span className="text-blue-200 text-xs font-medium uppercase tracking-widest">Petugas Umum &amp; Keuangan</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight">{userInfo.nama}</h1>
                            {userInfo.kode_unit && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-bold text-white">{userInfo.kode_unit}</span>
                                    <span className="text-blue-100 text-sm">{userInfo.nama_unit}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {tahun && (
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-100">
                                    {tahun.label}
                                </span>
                            )}
                            {perluPerhatian > 0 && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-500/30 px-3 py-1.5 animate-pulse">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-200" />
                                    <span className="text-sm font-bold text-white">{perluPerhatian} perlu perhatian</span>
                                </div>
                            )}
                            {stats.total_dicairkan > 0 && (
                                <div className="text-right mt-1">
                                    <p className="text-xs text-blue-200">Total Dicairkan</p>
                                    <p className="text-lg font-bold tabular-nums">{fmt(stats.total_dicairkan)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ SUMMARY CARDS + CTA ══════════════════════════════ */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <SummaryCard
                        icon={FileText}
                        iconClass="text-slate-600 dark:text-slate-300"
                        iconBg="bg-slate-100 dark:bg-slate-800"
                        accentBg="bg-slate-400"
                        label="Total Permohonan"
                        value={stats.total}
                        href="/pumk/permohonan-dana"
                    />
                    <SummaryCard
                        icon={Clock}
                        iconClass="text-blue-600 dark:text-blue-400"
                        iconBg="bg-blue-50 dark:bg-blue-950/30"
                        accentBg="bg-blue-500"
                        label="Sedang Proses"
                        value={stats.proses}
                        sub={nilaiProses > 0 ? fmt(nilaiProses) : undefined}
                        href="/pumk/permohonan-dana"
                    />
                    <SummaryCard
                        icon={XCircle}
                        iconClass="text-red-600 dark:text-red-400"
                        iconBg="bg-red-50 dark:bg-red-950/30"
                        accentBg="bg-red-500"
                        label="Ditolak"
                        value={stats.rejected}
                        sub={nilaiRejected > 0 ? fmt(nilaiRejected) : undefined}
                        href="/pumk/permohonan-dana"
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        iconClass="text-emerald-600 dark:text-emerald-400"
                        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                        accentBg="bg-emerald-500"
                        label="Dicairkan"
                        value={stats.dicairkan}
                        sub={stats.total_dicairkan > 0 ? fmt(stats.total_dicairkan) : undefined}
                    />
                    {/* CTA Card */}
                    <Link href="/pumk/permohonan-dana/buat" className="block h-full">
                        <div className="h-full overflow-hidden rounded-xl border border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 transition-all duration-200 hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-950/30 group">
                            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-sky-400" />
                            <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 group-hover:scale-110 transition-transform">
                                    <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Buat Permohonan</p>
                                    <p className="text-xs text-blue-500/70 dark:text-blue-400/60">Baru</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* ═══ PIPELINE + TUGAS ═════════════════════════════════ */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* ─── Pipeline Card ──────────────────────────────── */}
                    <div className="overflow-hidden rounded-xl border bg-card lg:col-span-1">
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-sky-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Pipeline</p>
                                    <p className="text-xs text-muted-foreground">{pdTotal} total permohonan</p>
                                </div>
                            </div>

                            {pdTotal === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada permohonan</p>
                            ) : (
                                <div className="space-y-1">
                                    {PIPELINE_ROWS.map((row) => {
                                        const value = pipeline[row.key];
                                        const isActive = (row.key === 'draft' || row.key === 'rejected') && value > 0;
                                        return (
                                            <div
                                                key={row.key}
                                                className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${isActive ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900' : 'hover:bg-muted/30'}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    {'spinner' in row && row.spinner ? (
                                                        <Loader2 className={`h-4 w-4 animate-spin ${row.spinnerColor}`} />
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
                                    href="/pumk/permohonan-dana"
                                    className="flex items-center gap-0.5 text-xs text-muted-foreground/50 hover:text-blue-600 transition-colors group/link"
                                >
                                    Lihat semua permohonan
                                    <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ─── Perlu Perhatian ────────────────────────────── */}
                    <div className="overflow-hidden rounded-xl border bg-card lg:col-span-2">
                        <div className="h-1 w-full bg-amber-500" />
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Perlu Perhatian</p>
                                        <p className="text-xs text-muted-foreground">
                                            {perluPerhatian > 0 ? `${stats.draft} draft & ${stats.rejected} perlu revisi` : 'Tidak ada tugas'}
                                        </p>
                                    </div>
                                </div>
                                {perluPerhatian > 0 && (
                                    <Link href="/pumk/permohonan-dana">
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
                                    <p className="text-xs text-muted-foreground mt-1">Tidak ada draft atau revisi yang menunggu</p>
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

                {/* ═══ RIWAYAT DICAIRKAN ════════════════════════════════ */}
                {riwayatCair.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-semibold text-foreground">Riwayat Dicairkan</p>
                            </div>
                            <Link
                                href="/pumk/permohonan-dana"
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
                                        href={`/pumk/permohonan-dana/${item.id}`}
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
                                                <Clock className="h-3 w-3 text-muted-foreground/50" />
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
