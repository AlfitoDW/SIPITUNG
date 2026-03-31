import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { FileText, Users, ClipboardList, Loader2, ChevronRight, HandCoins } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
];

type PerencanaanStats = { draft: number; submitted: number; kabag_approved: number; ppk_approved: number; rejected: number };
type PdStats = {
    draft: number; submitted: number; kabag_approved: number; bendahara_checked: number;
    katimku_approved: number; ppk_approved: number; dicairkan: number; rejected: number;
};
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = {
    tahun: Tahun;
    timKerjaTotal: number;
    pkAwal: PerencanaanStats;
    pkRevisi: PerencanaanStats;
    ra: PerencanaanStats;
    permohonanDana: PdStats;
    nilaiCair: number;
};

const PERENCANAAN_ROWS = [
    { key: 'draft',          label: 'Draft',          dot: 'bg-slate-300',  text: 'text-slate-500',  spinner: false },
    { key: 'submitted',      label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved', label: 'Menunggu PPK',   dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: true,  spinnerColor: 'text-amber-400' },
    { key: 'ppk_approved',   label: 'Terkunci',       dot: 'bg-green-400',  text: 'text-green-600',  spinner: false },
    { key: 'rejected',       label: 'Ditolak',        dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
] as const;

const PD_ROWS = [
    { key: 'draft',              label: 'Draft',               dot: 'bg-slate-300',  text: 'text-slate-500',  spinner: false },
    { key: 'submitted',          label: 'Menunggu Kabag',      dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved',     label: 'Menunggu Bendahara',  dot: 'bg-sky-400',    text: 'text-sky-600',    spinner: true,  spinnerColor: 'text-sky-400' },
    { key: 'bendahara_checked',  label: 'Menunggu Katimku',    dot: 'bg-violet-400', text: 'text-violet-600', spinner: true,  spinnerColor: 'text-violet-400' },
    { key: 'katimku_approved',   label: 'Menunggu PPK',        dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: true,  spinnerColor: 'text-amber-400' },
    { key: 'ppk_approved',       label: 'Siap Cair',           dot: 'bg-lime-400',   text: 'text-lime-600',   spinner: true,  spinnerColor: 'text-lime-400' },
    { key: 'dicairkan',          label: 'Sudah Cair',          dot: 'bg-green-400',  text: 'text-green-600',  spinner: false },
    { key: 'rejected',           label: 'Ditolak',             dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
] as const;

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

type StatusRow = { key: string; label: string; dot: string; text: string; spinner: boolean; spinnerColor?: string };

function DocCard<T extends Record<string, number>>({
    title, icon: Icon, stats, statusRows, href, accentBg, footer,
}: {
    title: string;
    icon: React.ElementType;
    stats: T;
    statusRows: readonly StatusRow[];
    href: string;
    accentBg?: string;
    footer?: React.ReactNode;
}) {
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className={`h-0.5 w-full ${accentBg ?? 'bg-[#003580]'}`} />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#003580]/8">
                        <Icon className="h-4 w-4 text-[#003580]" />
                    </div>
                    <span className="text-sm font-semibold">{title}</span>
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
                                            ? <Loader2 className={`h-3 w-3 animate-spin ${row.spinnerColor}`} />
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
                    {footer ?? (
                        total > 0 && (
                            <span className="text-xs font-bold tabular-nums text-muted-foreground">{total} tim kerja</span>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ tahun, timKerjaTotal, pkAwal, pkRevisi, ra, permohonanDana, nilaiCair }: Props) {
    const pdTotal = Object.values(permohonanDana).reduce((a, b) => a + b, 0);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Super Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Super Admin</h1>
                    <p className="text-muted-foreground">
                        {tahun ? `Tahun Anggaran: ${tahun.label}` : 'Belum ada tahun anggaran aktif'}
                    </p>
                </div>

                {/* Summary card */}
                <Card className="border-[#003580]/20 overflow-hidden">
                    <div className="h-0.5 w-full bg-[#003580]" />
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10">
                                <Users className="h-6 w-6 text-[#003580]" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Total Tim Kerja</p>
                                <p className="text-3xl font-bold text-foreground tabular-nums leading-none">{timKerjaTotal}</p>
                                {tahun && (
                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold bg-[#003580]/8 text-[#003580] mt-1.5">
                                        {tahun.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Perencanaan cards */}
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Modul Perencanaan</p>
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

                {/* Keuangan card */}
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Modul Keuangan</p>
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
                                    ? <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">{fmt(nilaiCair)} cair</span>
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
