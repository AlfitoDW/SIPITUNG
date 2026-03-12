import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { FileText, Users, ClipboardList, Loader2, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
];

type StatusStats = { draft: number; submitted: number; kabag_approved: number; ppk_approved: number; rejected: number };
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; timKerjaTotal: number; pkAwal: StatusStats; pkRevisi: StatusStats; ra: StatusStats };

const STATUS_ROWS = [
    { key: 'draft',          label: 'Draft',          dot: 'bg-slate-300',  text: 'text-slate-500',  spinner: false },
    { key: 'submitted',      label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-600',   spinner: true,  spinnerColor: 'text-blue-400' },
    { key: 'kabag_approved', label: 'Menunggu PPK',   dot: 'bg-amber-400',  text: 'text-amber-600',  spinner: true,  spinnerColor: 'text-amber-400' },
    { key: 'ppk_approved',   label: 'Terkunci',       dot: 'bg-green-400',  text: 'text-green-600',  spinner: false },
    { key: 'rejected',       label: 'Ditolak',        dot: 'bg-red-400',    text: 'text-red-600',    spinner: false },
] as const;

function DocCard({ title, icon: Icon, stats, href }: { title: string; icon: React.ElementType; stats: StatusStats; href: string }) {
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-0.5 w-full bg-[#003580]" />
            <div className="p-5">
                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#003580]/8">
                        <Icon className="h-4 w-4 text-[#003580]" />
                    </div>
                    <span className="text-sm font-semibold">{title}</span>
                </div>

                {/* Status rows */}
                {total === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data</p>
                ) : (
                    <div className="space-y-2.5">
                        {STATUS_ROWS.map((row) => {
                            const value = stats[row.key];
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

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                    <Link href={href} className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-[#003580]/60 transition-colors group/link">
                        Lihat detail
                        <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                    {total > 0 && (
                        <span className="text-xs font-bold tabular-nums text-muted-foreground">{total} tim kerja</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ tahun, timKerjaTotal, pkAwal, pkRevisi, ra }: Props) {
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

                {/* Per-modul cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <DocCard
                        title="PK Awal"
                        icon={FileText}
                        stats={pkAwal}
                        href="/super-admin/perencanaan/perjanjian-kinerja/awal/penyusunan"
                    />
                    <DocCard
                        title="PK Revisi"
                        icon={FileText}
                        stats={pkRevisi}
                        href="/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan"
                    />
                    <DocCard
                        title="Rencana Aksi"
                        icon={ClipboardList}
                        stats={ra}
                        href="/super-admin/perencanaan/rencana-aksi/penyusunan"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
