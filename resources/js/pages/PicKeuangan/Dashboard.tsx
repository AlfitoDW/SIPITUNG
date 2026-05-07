import { Head, Link } from '@inertiajs/react';
import { ClipboardCheck, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type Tahun = { id: number; tahun: number; label: string } | null;
type Stats = { menunggu_verifikasi: number; menunggu_pencairan: number; selesai: number };
type Props = { tahun: Tahun; stats: Stats };

function StatCard({
    icon: Icon, iconClass, iconBg, accent, label, value, href,
}: {
    icon: React.ElementType; iconClass: string; iconBg: string; accent: string;
    label: string; value: number; href?: string;
}) {
    const inner = (
        <div className="overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-200">
            <div className={`h-0.5 w-full ${accent}`} />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className={`h-4 w-4 ${iconClass}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{value}</p>
            </div>
        </div>
    );
    return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}

export default function Dashboard({ tahun, stats }: Props) {
    return (
        <AppLayout>
            <Head title="Dashboard PIC Keuangan" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard PIC Keuangan</h1>
                    <p className="text-muted-foreground text-sm">Verifikasi Permohonan Dana</p>
                </div>

                <Card className="overflow-hidden border-violet-200 dark:border-violet-900">
                    <div className="h-0.5 w-full bg-violet-500" />
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                            <ClipboardCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tahun Anggaran</p>
                            <p className="text-base font-bold">{tahun?.label ?? '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        icon={Clock}
                        iconClass="text-amber-600 dark:text-amber-400"
                        iconBg="bg-amber-50 dark:bg-amber-950/40"
                        accent="bg-amber-400"
                        label="Perlu Diverifikasi"
                        value={stats.menunggu_verifikasi}
                        href="/pic-keuangan/permohonan-dana"
                    />
                    <StatCard
                        icon={ClipboardCheck}
                        iconClass="text-blue-600 dark:text-blue-400"
                        iconBg="bg-blue-50 dark:bg-blue-950/40"
                        accent="bg-blue-400"
                        label="Menunggu Pencairan"
                        value={stats.menunggu_pencairan}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        iconClass="text-green-600 dark:text-green-400"
                        iconBg="bg-green-50 dark:bg-green-950/40"
                        accent="bg-green-400"
                        label="Selesai Dicairkan"
                        value={stats.selesai}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
