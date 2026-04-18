import { Head, Link, usePage } from '@inertiajs/react';
import {
    FileText, ClipboardList, ChevronRight, Loader2, Building2,
    HandCoins, ShieldCheck, ChartNoAxesColumn, ArrowRight
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';

type DocStatus = { id: number; status: string; indikators_count?: number } | null;
type Tahun     = { id: number; tahun: number; label: string } | null;
type Permohonan = {
    draft: number; submitted: number; kabag_approved: number;
    bendahara_checked: number; katimku_approved: number; ppk_approved: number;
    dicairkan: number; rejected: number; nilai_dicairkan: number;
};
type PengukuranStatus = { status: string | null; triwulan: string; approved_at: string | null } | null;
type Props = {
    user: { nama_lengkap: string };
    timKerja: { id: number; nama: string; kode: string; nama_singkat?: string } | null;
    tahun: Tahun;
    pkAwal: DocStatus;
    pkRevisi: DocStatus;
    ra: DocStatus;
    pengukuran: PengukuranStatus;
    permohonan: Permohonan;
    approvalPending: number;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; accent: string; spinner?: boolean }> = {
    draft:          { label: 'Draft',          dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950/20',  accent: 'bg-amber-400' },
    submitted:      { label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950/20',    accent: 'bg-blue-500',  spinner: true },
    kabag_approved: { label: 'Disetujui',      dot: 'bg-emerald-400',text: 'text-emerald-700',bg: 'bg-emerald-50 dark:bg-emerald-950/20',accent:'bg-emerald-500' },
    rejected:       { label: 'Dikembalikan',   dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 dark:bg-red-950/20',      accent: 'bg-red-500' },
};

const PD_STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; spinner?: boolean; spinnerColor?: string }> = {
    draft:              { label: 'Draft',                dot: 'bg-amber-400',  text: 'text-amber-600' },
    submitted:          { label: 'Menunggu Kabag',       dot: 'bg-blue-400',   text: 'text-blue-600',    spinner: true, spinnerColor: 'text-blue-400' },
    kabag_approved:     { label: 'Menunggu Bendahara',   dot: 'bg-sky-400',    text: 'text-sky-600',     spinner: true, spinnerColor: 'text-sky-400' },
    bendahara_checked:  { label: 'Menunggu Katimku',     dot: 'bg-violet-400', text: 'text-violet-600',  spinner: true, spinnerColor: 'text-violet-400' },
    katimku_approved:   { label: 'Menunggu PPK',         dot: 'bg-amber-400',  text: 'text-amber-600',   spinner: true, spinnerColor: 'text-amber-400' },
    ppk_approved:       { label: 'Siap Cair',            dot: 'bg-lime-400',   text: 'text-lime-600',    spinner: true, spinnerColor: 'text-lime-400' },
    dicairkan:          { label: 'Sudah Cair',           dot: 'bg-emerald-400',text: 'text-emerald-600' },
    rejected:           { label: 'Ditolak',              dot: 'bg-red-400',    text: 'text-red-600' },
};

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

type FlowStep = { label: string; href: string; doc: DocStatus | PengukuranStatus; icon: React.ElementType; key: string; emptyLabel: string };

function FlowCard({ step, index, isLast }: { step: FlowStep; index: number; isLast: boolean }) {
    const status = step.doc?.status ?? null;
    const cfg = status ? (STATUS_CONFIG[status] ?? STATUS_CONFIG['draft']) : null;

    return (
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href={step.href} className="flex-1 min-w-0 group">
                <div className={`relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md ${cfg ? '' : 'border-dashed'}`}>
                    {cfg && <div className={`h-0.5 w-full ${cfg.accent}`} />}
                    <div className={`p-4 ${cfg ? cfg.bg : ''}`}>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg ? cfg.bg : 'bg-muted/50'}`}>
                                <step.icon className={`h-4 w-4 ${cfg ? cfg.text : 'text-muted-foreground'}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{step.label}</p>
                                <p className="text-[10px] text-muted-foreground">Langkah {index + 1}</p>
                            </div>
                        </div>
                        {cfg ? (
                            <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                                {cfg.spinner
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                }
                                {cfg.label}
                            </div>
                        ) : step.doc ? (
                            /* Periode aktif ada tapi belum ada laporan */
                            <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs font-semibold text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                                {step.emptyLabel}
                            </div>
                        ) : (
                            <span className="text-[11px] text-muted-foreground italic">{step.emptyLabel}</span>
                        )}
                    </div>
                </div>
            </Link>
            {!isLast && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            )}
        </div>
    );
}

export default function Dashboard({ user, timKerja, tahun, pkAwal, pkRevisi, ra, pengukuran, permohonan, approvalPending }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isKoordinator = auth.user?.is_koordinator ?? false;

    const pdTotal = permohonan.draft + permohonan.submitted + permohonan.kabag_approved +
        permohonan.bendahara_checked + permohonan.katimku_approved + permohonan.ppk_approved +
        permohonan.dicairkan + permohonan.rejected;

    const flowSteps: FlowStep[] = [
        { label: 'PK Awal',      href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan',   doc: pkAwal,     icon: FileText,          key: 'pk-awal',    emptyLabel: 'Menunggu Tim P&K' },
        { label: 'PK Revisi',    href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan', doc: pkRevisi,   icon: FileText,          key: 'pk-revisi',  emptyLabel: 'Menunggu Tim P&K' },
        { label: 'Rencana Aksi', href: '/ketua-tim/perencanaan/rencana-aksi/penyusunan',              doc: ra,         icon: ClipboardList,     key: 'ra',         emptyLabel: 'Belum diisi' },
        {
            label: pengukuran ? `Pengukuran ${pengukuran.triwulan}` : 'Pengukuran',
            href: '/ketua-tim/pengukuran',
            doc: pengukuran,
            icon: ChartNoAxesColumn,
            key: 'pengukuran',
            emptyLabel: 'Belum disubmit',
        },
    ];

    // Hitung step yang selesai untuk progress bar
    const doneCount = flowSteps.filter(s => s.doc?.status === 'kabag_approved').length;
    const progressPct = Math.round((doneCount / flowSteps.length) * 100);

    return (
        <AppLayout>
            <Head title="Dashboard Ketua Tim" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003580] to-[#0052cc] p-6 text-white shadow-lg">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">Selamat datang</p>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight">{user.nama_lengkap}</h1>
                            {timKerja && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Building2 className="h-4 w-4 text-blue-200" />
                                    <span className="text-blue-100 text-sm">{timKerja.nama}</span>
                                    <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-mono font-bold text-white">{timKerja.kode}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {tahun && (
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-100">
                                    {tahun.label}
                                </span>
                            )}
                            <div className="mt-2 text-right">
                                <p className="text-xs text-blue-200">Progress Flow</p>
                                <p className="text-2xl font-bold">{progressPct}%</p>
                                <div className="w-32 h-1.5 bg-white/20 rounded-full mt-1">
                                    <div className="h-1.5 bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flow Perencanaan + Pengukuran */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">Alur Dokumen {tahun ? `— ${tahun.label}` : ''}</p>
                        <Link href="/ketua-tim/monitoring" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#003580] transition-colors">
                            Pantau semua tim <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="flex gap-2 flex-wrap md:flex-nowrap">
                        {flowSteps.map((step, i) => (
                            <FlowCard key={step.key} step={step} index={i} isLast={i === flowSteps.length - 1} />
                        ))}
                    </div>
                </div>

                {/* Keuangan */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">Keuangan {tahun ? `— ${tahun.label}` : ''}</p>
                        {isKoordinator && approvalPending > 0 && (
                            <Link
                                href="/ketua-tim/permohonan-dana/approval"
                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-200 transition-colors"
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {approvalPending} menunggu approval Anda
                            </Link>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="h-0.5 w-full bg-emerald-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                                    <HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-sm font-semibold">Permohonan Dana</span>
                                {pdTotal > 0 && (
                                    <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">{pdTotal} permohonan</span>
                                )}
                            </div>

                            {pdTotal === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada permohonan dana</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                                    {Object.entries(PD_STATUS_CONFIG).map(([key, cfg]) => {
                                        const value = permohonan[key as keyof Permohonan] as number;
                                        if (!value) return null;
                                        return (
                                            <div key={key} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {cfg.spinner
                                                        ? <Loader2 className={`h-3 w-3 shrink-0 animate-spin ${cfg.spinnerColor}`} />
                                                        : <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                                                    }
                                                    <span className={`text-xs truncate ${cfg.text}`}>{cfg.label}</span>
                                                </div>
                                                <span className={`text-xs font-bold tabular-nums shrink-0 ${cfg.text}`}>{value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                                <Link
                                    href="/ketua-tim/permohonan-dana"
                                    className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-emerald-600/60 transition-colors group/link"
                                >
                                    Lihat semua <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                                {permohonan.nilai_dicairkan > 0 && (
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {fmt(permohonan.nilai_dicairkan)} cair
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
