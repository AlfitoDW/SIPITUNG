import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Shield, ChevronRight } from 'lucide-react';

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = {
    user: { nama_lengkap: string };
    pimpinanType: 'kabag_umum' | 'ppk';
    tahun: Tahun;
    pending:  { pk_awal: number; pk_revisi: number; ra: number; permohonan_dana: number };
    approved: { pk: number; ra: number; permohonan_dana: number };
    rejected: { pk: number; ra: number; permohonan_dana: number };
};

function StatCard({
    icon: Icon,
    iconClass,
    iconBg,
    accentBg,
    title,
    total,
    totalClass,
    rows,
    href,
}: {
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    accentBg: string;
    title: string;
    total: number;
    totalClass: string;
    rows: { label: string; value: number }[];
    href: string;
}) {
    return (
        <Link href={href} className="block group h-full">
            <div className="h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md hover:border-current/20">
                <div className={`h-0.5 w-full ${accentBg}`} />
                <div className="flex flex-col h-full p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                                <Icon className={`h-4 w-4 ${iconClass}`} />
                            </div>
                            <span className="text-sm font-semibold">{title}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
                    </div>

                    <p className={`text-4xl font-bold tabular-nums leading-none ${totalClass}`}>{total}</p>
                    <p className="text-xs text-muted-foreground mt-1">dokumen</p>

                    <div className="mt-4 pt-4 border-t border-dashed space-y-2.5">
                        {rows.map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className={`text-xs font-bold tabular-nums ${totalClass}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function Dashboard({ user, pimpinanType, tahun, pending, approved, rejected }: Props) {
    const roleLabel = pimpinanType === 'kabag_umum' ? 'Kepala Bagian Umum' : 'Pejabat Pembuat Komitmen (PPK)';
    const totalPending  = pending.pk_awal + pending.pk_revisi + pending.ra + pending.permohonan_dana;
    const totalApproved = approved.pk + approved.ra + approved.permohonan_dana;
    const totalRejected = rejected.pk + rejected.ra + rejected.permohonan_dana;

    const pdLink = pimpinanType === 'kabag_umum'
        ? '/pimpinan/keuangan/permohonan-dana'
        : '/pimpinan/keuangan/permohonan-dana';

    return (
        <AppLayout>
            <Head title="Dashboard Pimpinan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Pimpinan</h1>
                    <p className="text-muted-foreground">Selamat datang, {user.nama_lengkap}</p>
                </div>

                {/* Jabatan card */}
                <Card className="border-green-200 dark:border-green-900 overflow-hidden">
                    <div className="h-0.5 w-full bg-green-500" />
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/40">
                                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Jabatan</p>
                                <h3 className="text-base font-bold text-foreground leading-tight">{roleLabel}</h3>
                                {tahun && (
                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 mt-1.5">
                                        {tahun.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stat cards */}
                <div className="grid gap-4 md:grid-cols-3 items-stretch">
                    <StatCard
                        icon={Loader2}
                        iconClass="animate-spin text-amber-500"
                        iconBg="bg-amber-50 dark:bg-amber-950/40"
                        accentBg="bg-amber-400"
                        title="Menunggu Review"
                        total={totalPending}
                        totalClass="text-amber-600 dark:text-amber-400"
                        href="/pimpinan/perencanaan/perjanjian-kinerja/awal"
                        rows={[
                            { label: 'PK Awal',          value: pending.pk_awal },
                            { label: 'PK Revisi',         value: pending.pk_revisi },
                            { label: 'Rencana Aksi',      value: pending.ra },
                            { label: 'Permohonan Dana',   value: pending.permohonan_dana },
                        ]}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        iconClass="text-green-500"
                        iconBg="bg-green-50 dark:bg-green-950/40"
                        accentBg="bg-green-400"
                        title="Sudah Disetujui"
                        total={totalApproved}
                        totalClass="text-green-600 dark:text-green-400"
                        href="/pimpinan/perencanaan/perjanjian-kinerja/awal"
                        rows={[
                            { label: 'Perjanjian Kinerja', value: approved.pk },
                            { label: 'Rencana Aksi',        value: approved.ra },
                            { label: 'Permohonan Dana',     value: approved.permohonan_dana },
                        ]}
                    />
                    <StatCard
                        icon={XCircle}
                        iconClass="text-red-500"
                        iconBg="bg-red-50 dark:bg-red-950/40"
                        accentBg="bg-red-400"
                        title="Ditolak"
                        total={totalRejected}
                        totalClass="text-red-600 dark:text-red-400"
                        href={pdLink}
                        rows={[
                            { label: 'Perjanjian Kinerja', value: rejected.pk },
                            { label: 'Rencana Aksi',        value: rejected.ra },
                            { label: 'Permohonan Dana',     value: rejected.permohonan_dana },
                        ]}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
