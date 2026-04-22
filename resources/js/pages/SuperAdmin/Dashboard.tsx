import { Head, Link } from '@inertiajs/react';
import { FileText, ClipboardList, Loader2, ChevronRight, HandCoins, ChartNoAxesColumn } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
];

type PerencanaanStats = { draft: number; submitted: number; kabag_approved: number; rejected: number };
type PengukuranStats  = { draft: number; submitted: number; kabag_approved: number; rejected: number };
type PdStats = {
    draft: number; submitted: number; kabag_approved: number; bendahara_checked: number;
    katimku_approved: number; dicairkan: number; rejected: number;
};
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = {
    tahun: Tahun;
    timKerjaTotal: number;
    pkAwal: PerencanaanStats;
    pkRevisi: PerencanaanStats;
    ra: PerencanaanStats;
    pengukuran: PengukuranStats;
    permohonanDana: PdStats;
    nilaiCair: number;
};

const PERENCANAAN_ROWS = [
    { key: 'draft',          label: 'Draft',          dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: false },
    { key: 'submitted',      label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved', label: 'Disetujui',      dot: 'bg-emerald-400',text: 'text-emerald-600',spinner: false },
    { key: 'rejected',       label: 'Dikembalikan',   dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
] as const;

const PENGUKURAN_ROWS = [
    { key: 'submitted',      label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved', label: 'Disetujui',      dot: 'bg-emerald-400',text: 'text-emerald-600',spinner: false },
    { key: 'rejected',       label: 'Dikembalikan',   dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
    { key: 'draft',          label: 'Draft',          dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: false },
] as const;

const PD_ROWS = [
    { key: 'draft',              label: 'Draft',               dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: false },
    { key: 'submitted',          label: 'Menunggu Kabag',      dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved',     label: 'Menunggu Bendahara',  dot: 'bg-sky-400',    text: 'text-sky-600',    spinner: true,  spinnerColor: 'text-sky-400' },
    { key: 'bendahara_checked',  label: 'Menunggu Katimku',    dot: 'bg-violet-400', text: 'text-violet-600', spinner: true,  spinnerColor: 'text-violet-400' },
    { key: 'katimku_approved',   label: 'Siap Cair',           dot: 'bg-lime-400',   text: 'text-lime-600',   spinner: true,  spinnerColor: 'text-lime-400' },
    { key: 'dicairkan',          label: 'Sudah Cair',          dot: 'bg-emerald-400',text: 'text-emerald-600',spinner: false },
    { key: 'rejected',           label: 'Ditolak',             dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
] as const;

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

type StatusRow = { key: string; label: string; dot: string; text: string; spinner: boolean; spinnerColor?: string };

function DocCard<T extends Record<string, number>>({
    title, icon: Icon, stats, statusRows, href, accentBg, footer, iconBg,
}: {
    title: string;
    icon: React.ElementType;
    stats: T;
    statusRows: readonly StatusRow[];
    href: string;
    accentBg?: string;
    iconBg?: string;
    footer?: React.ReactNode;
}) {
    const total = statusRows.reduce((a, row) => a + (stats[row.key] ?? 0), 0);
    return (
        <div className="overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-200 group">
            <div className={`h-0.5 w-full ${accentBg ?? 'bg-[#003580]'}`} />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg ?? 'bg-[#003580]/8'}`}>
                        <Icon className={`h-4 w-4 ${iconBg ? 'text-current' : 'text-[#003580]'}`} />
                    </div>
                    <span className="text-sm font-semibold">{title}</span>
                    {total > 0 && (
                        <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">{total}</span>
                    )}
                </div>

                {total === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                    <div className="space-y-2.5">
                        {statusRows.map((row) => {
                            const value = stats[row.key] ?? 0;
                            if (value === 0) return null;
                            return (
                                <div key={row.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {row.spinner
                                            ? <Loader2 className={`h-3 w-3 animate-spin ${'spinnerColor' in row ? row.spinnerColor : row.dot.replace('bg-', 'text-')}`} />
                                            : <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                                        }
                                        <span className={`text-xs ${row.text}`}>{row.label}</span>
                                    </div>
                                    <span className={`text-xs font-bold tabular-nums ${row.text}`}>{value}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                    <Link href={href} className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-[#003580]/60 transition-colors group/link">
                        Lihat detail
                        <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                    {footer}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ tahun, timKerjaTotal, pkAwal, pkRevisi, ra, pengukuran, permohonanDana, nilaiCair }: Props) {
    const pdTotal = Object.values(permohonanDana).reduce((a, b) => a + b, 0);
    const pengTotal = pengukuran.draft + pengukuran.submitted + pengukuran.kabag_approved + pengukuran.rejected;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Super Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003580] to-[#0a4fa6] p-6 text-white shadow-lg">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">Panel Administrasi</p>
                            <h1 className="text-xl md:text-2xl font-bold">Dashboard Super Admin</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold tabular-nums">{timKerjaTotal}</p>
                                <p className="text-xs text-blue-200 mt-0.5">Tim Kerja</p>
                            </div>
                            {tahun && (
                                <div className="border-l border-white/20 pl-4">
                                    <p className="text-xs text-blue-200">Tahun Anggaran</p>
                                    <p className="text-lg font-bold">{tahun.label}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Perencanaan */}
                <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Modul Perencanaan</p>
                    <div className="grid gap-4 md:grid-cols-3">
                        <DocCard
                            title="PK Awal"
                            icon={FileText}
                            stats={pkAwal}
                            statusRows={PERENCANAAN_ROWS}
                            href="/super-admin/perencanaan/perjanjian-kinerja/awal/penyusunan"
                        />
                        <DocCard
                            title="PK Revisi"
                            icon={FileText}
                            stats={pkRevisi}
                            statusRows={PERENCANAAN_ROWS}
                            href="/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan"
                        />
                        <DocCard
                            title="Rencana Aksi"
                            icon={ClipboardList}
                            stats={ra}
                            statusRows={PERENCANAAN_ROWS}
                            href="/super-admin/perencanaan/rencana-aksi/penyusunan"
                        />
                    </div>
                </div>

                {/* Pengukuran */}
                <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Modul Pengukuran</p>
                    <div className="grid gap-4 md:grid-cols-3">
                        <DocCard
                            title="Pengukuran Kinerja"
                            icon={ChartNoAxesColumn}
                            stats={pengukuran}
                            statusRows={PENGUKURAN_ROWS}
                            href="/super-admin/pengukuran/realisasi"
                            accentBg="bg-indigo-500"
                            footer={
                                pengTotal > 0
                                    ? <span className="text-xs font-bold tabular-nums text-muted-foreground">{pengTotal} laporan</span>
                                    : null
                            }
                        />
                    </div>
                </div>

                {/* Keuangan */}
                <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Modul Keuangan</p>
                    <div className="grid gap-4 md:grid-cols-3">
                        <DocCard
                            title="Permohonan Dana"
                            icon={HandCoins}
                            stats={permohonanDana}
                            statusRows={PD_ROWS}
                            href="/super-admin/keuangan/permohonan-dana"
                            accentBg="bg-emerald-500"
                            footer={
                                nilaiCair > 0
                                    ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(nilaiCair)} cair</span>
                                    : pdTotal > 0
                                        ? <span className="text-xs font-bold tabular-nums text-muted-foreground">{pdTotal} permohonan</span>
                                        : null
                            }
                        />
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
