import { Head, Link } from '@inertiajs/react';
import { HandCoins, FileText, CheckCircle2, XCircle, Clock, User, Building2, Hash, BadgeCheck, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';

type Tahun = { id: number; tahun: number; label: string } | null;
type Stats = {
    total: number;
    draft: number;
    rejected: number;
    proses: number;
    dicairkan: number;
    total_dicairkan: number;
};
type UserInfo = {
    nama: string;
    nip: string | null;
    role: string;
    nama_unit: string | null;
    kode_unit: string | null;
};
type Props = { tahun: Tahun; stats: Stats; userInfo: UserInfo };

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function StatCard({
    icon: Icon, iconClass, iconBg, accent, label, value, sub, href,
}: {
    icon: React.ElementType; iconClass: string; iconBg: string; accent: string;
    label: string; value: string | number; sub?: string; href?: string;
}) {
    const inner = (
        <div className="h-full overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-200">
            <div className={`h-0.5 w-full ${accent}`} />
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className={`h-4 w-4 ${iconClass}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-bold tabular-nums">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
        </div>
    );
    return href ? <Link href={href} className="block">{inner}</Link> : <div>{inner}</div>;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold truncate">{value}</p>
            </div>
        </div>
    );
}

export default function Dashboard({ tahun, stats, userInfo }: Props) {
    return (
        <AppLayout>
            <Head title="Dashboard PUMK" />
            <div className="flex flex-col gap-6 p-4 md:p-6">

                {/* Welcome Card */}
                <Card className="overflow-hidden border-blue-200 dark:border-blue-900">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400" />
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                            {/* Avatar initial */}
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white text-xl font-bold shadow-md">
                                {userInfo.nama.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-0.5">
                                    Selamat Datang
                                </p>
                                <h2 className="text-xl font-bold tracking-tight truncate">{userInfo.nama}</h2>
                                <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    <Shield className="h-3 w-3" />
                                    {userInfo.role}
                                </span>
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="mt-5 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InfoRow icon={User} label="Nama" value={userInfo.nama} />
                            <InfoRow icon={BadgeCheck} label="Posisi" value={userInfo.role} />
                            <InfoRow icon={Hash} label="NIP" value={userInfo.nip ?? '-'} />
                            <InfoRow
                                icon={Building2}
                                label="Nama Unit"
                                value={userInfo.nama_unit ?? '-'}
                            />
                            <InfoRow
                                icon={Hash}
                                label="Kode Unit"
                                value={userInfo.kode_unit ?? '-'}
                            />
                            <InfoRow icon={Shield} label="Role" value={userInfo.role} />
                        </div>
                    </CardContent>
                </Card>

                {/* Tahun Anggaran */}
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                    <div className="h-0.5 w-full bg-blue-500" />
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                            <HandCoins className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tahun Anggaran</p>
                            <p className="text-base font-bold">{tahun?.label ?? '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={FileText}
                        iconClass="text-slate-600 dark:text-slate-300"
                        iconBg="bg-slate-100 dark:bg-slate-800"
                        accent="bg-slate-400"
                        label="Total Permohonan"
                        value={stats.total}
                        href="/pumk/permohonan-dana"
                    />
                    <StatCard
                        icon={Clock}
                        iconClass="text-amber-600 dark:text-amber-400"
                        iconBg="bg-amber-50 dark:bg-amber-950/40"
                        accent="bg-amber-400"
                        label="Sedang Proses"
                        value={stats.proses}
                        sub="Menunggu approval"
                        href="/pumk/permohonan-dana"
                    />
                    <StatCard
                        icon={XCircle}
                        iconClass="text-red-600 dark:text-red-400"
                        iconBg="bg-red-50 dark:bg-red-950/40"
                        accent="bg-red-400"
                        label="Ditolak"
                        value={stats.rejected}
                        sub="Perlu direvisi"
                        href="/pumk/permohonan-dana"
                    />
                    <StatCard
                        icon={CheckCircle2}
                        iconClass="text-green-600 dark:text-green-400"
                        iconBg="bg-green-50 dark:bg-green-950/40"
                        accent="bg-green-400"
                        label="Dicairkan"
                        value={stats.dicairkan}
                        sub={stats.total_dicairkan > 0 ? fmt(stats.total_dicairkan) : undefined}
                    />
                </div>

                <div className="flex justify-start">
                    <Link
                        href="/pumk/permohonan-dana/buat"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        <HandCoins className="h-4 w-4" />
                        Buat Permohonan Baru
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
