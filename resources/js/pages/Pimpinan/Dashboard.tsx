import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = {
    user: { nama_lengkap: string };
    pimpinanType: 'kabag_umum' | 'ppk';
    tahun: Tahun;
    pending:  { pk_awal: number; pk_revisi: number; ra: number };
    approved: { pk: number; ra: number };
    rejected: { pk: number; ra: number };
};

function StatCard({
    icon: Icon,
    iconClass,
    title,
    total,
    totalClass,
    rows,
    href,
}: {
    icon: React.ElementType;
    iconClass: string;
    title: string;
    total: number;
    totalClass: string;
    rows: { label: string; value: number }[];
    href: string;
}) {
    return (
        <Link href={href} className="block h-full">
            <Card className="h-full cursor-pointer transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className={`h-4 w-4 ${iconClass}`} />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-3xl font-bold ${totalClass}`}>{total}</p>
                    <div className="mt-2 space-y-1">
                        {rows.map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-xs font-medium tabular-nums">{value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function Dashboard({ user, pimpinanType, tahun, pending, approved, rejected }: Props) {
    const roleLabel = pimpinanType === 'kabag_umum' ? 'Kepala Bagian Umum' : 'Pejabat Pembuat Komitmen (PPK)';
    const totalPending  = pending.pk_awal + pending.pk_revisi + pending.ra;
    const totalApproved = approved.pk + approved.ra;
    const totalRejected = rejected.pk + rejected.ra;

    return (
        <AppLayout>
            <Head title="Dashboard Pimpinan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Pimpinan</h1>
                    <p className="text-muted-foreground">Selamat datang, {user.nama_lengkap}</p>
                </div>

                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-1">Jabatan</p>
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-300">{roleLabel}</h3>
                        {tahun && <p className="text-sm text-green-700 dark:text-green-400 mt-0.5">Tahun Anggaran: {tahun.label}</p>}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3 items-stretch">
                    <StatCard
                        icon={Clock}
                        iconClass="text-amber-500"
                        title="Menunggu Review"
                        total={totalPending}
                        totalClass="text-amber-600"
                        href="/pimpinan/perencanaan/perjanjian-kinerja/awal"
                        rows={[
                            { label: 'PK Awal',      value: pending.pk_awal },
                            { label: 'PK Revisi',    value: pending.pk_revisi },
                            { label: 'Rencana Aksi', value: pending.ra },
                        ]}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        iconClass="text-green-500"
                        title="Sudah Disetujui"
                        total={totalApproved}
                        totalClass="text-green-600"
                        href="/pimpinan/perencanaan/perjanjian-kinerja/awal"
                        rows={[
                            { label: 'Perjanjian Kinerja', value: approved.pk },
                            { label: 'Rencana Aksi',       value: approved.ra },
                        ]}
                    />
                    <StatCard
                        icon={XCircle}
                        iconClass="text-red-500"
                        title="Ditolak"
                        total={totalRejected}
                        totalClass="text-red-600"
                        href="/pimpinan/perencanaan/perjanjian-kinerja/awal"
                        rows={[
                            { label: 'Perjanjian Kinerja', value: rejected.pk },
                            { label: 'Rencana Aksi',       value: rejected.ra },
                        ]}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
