import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';
import { FileText, Users, ClipboardList } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/super-admin/dashboard' },
];

type StatusStats = { draft: number; submitted: number; kabag_approved: number; ppk_approved: number; rejected: number };
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; timKerjaTotal: number; pkAwal: StatusStats; pkRevisi: StatusStats; ra: StatusStats };

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
    if (value === 0) return null;
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <Badge variant="outline" className={color}>{value}</Badge>
        </div>
    );
}

function DocCard({ title, icon: Icon, stats, href }: { title: string; icon: React.ElementType; stats: StatusStats; href: string }) {
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {total === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Belum ada data</p>
                ) : (
                    <>
                        <StatRow label="Draft"           value={stats.draft}          color="bg-slate-100 text-slate-700 border-slate-200" />
                        <StatRow label="Menunggu Kabag"  value={stats.submitted}       color="bg-blue-100 text-blue-700 border-blue-200" />
                        <StatRow label="Menunggu PPK"    value={stats.kabag_approved}  color="bg-amber-100 text-amber-700 border-amber-200" />
                        <StatRow label="Terkunci"        value={stats.ppk_approved}    color="bg-green-100 text-green-700 border-green-200" />
                        <StatRow label="Ditolak"         value={stats.rejected}        color="bg-red-100 text-red-700 border-red-200" />
                    </>
                )}
                <Link href={href} className="block pt-1 text-xs text-primary hover:underline">Lihat detail →</Link>
            </CardContent>
        </Card>
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
                <Card className="border-[#003580]/20 bg-[#003580]/5">
                    <CardContent className="flex items-center gap-4 pt-6">
                        <Users className="h-8 w-8 text-[#003580]" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Tim Kerja</p>
                            <p className="text-3xl font-bold text-[#003580]">{timKerjaTotal}</p>
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
