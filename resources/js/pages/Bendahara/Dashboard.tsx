import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, Banknote, CheckCircle2, CircleDollarSign, ChevronRight, CalendarDays } from 'lucide-react';

type Tahun = { id: number; tahun: number; label: string } | null;
type RiwayatItem = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: number;
    dicairkan_at: string;
    tim_kerja: { nama: string; kode: string } | null;
};
type Props = {
    user: { nama_lengkap: string };
    tahun: Tahun;
    verifikasi: number;
    pencairan: number;
    sudahCek: number;
    sudahCair: number;
    nilaiCair: number;
    nilaiPending: number;
    riwayatCair: RiwayatItem[];
};

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

function SummaryCard({
    icon: Icon, iconClass, iconBg, accentBg,
    label, value, sub, href,
}: {
    icon: React.ElementType; iconClass: string; iconBg: string; accentBg: string;
    label: string; value: string | number; sub?: string; href?: string;
}) {
    const inner = (
        <div className="h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md">
            <div className={`h-0.5 w-full ${accentBg}`} />
            <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className={`h-4 w-4 ${iconClass}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
            </div>
        </div>
    );
    return href ? <Link href={href} className="block group h-full">{inner}</Link> : <div className="h-full">{inner}</div>;
}

export default function Dashboard({ user, tahun, verifikasi, pencairan, sudahCek, sudahCair, nilaiCair, nilaiPending, riwayatCair }: Props) {
    return (
        <AppLayout>
            <Head title="Dashboard Bendahara" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Bendahara</h1>
                    <p className="text-muted-foreground">Selamat datang, {user.nama_lengkap}</p>
                </div>

                {/* Jabatan + tahun */}
                <Card className="border-blue-200 dark:border-blue-900 overflow-hidden">
                    <div className="h-0.5 w-full bg-blue-500" />
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                                <Banknote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Jabatan</p>
                                <h3 className="text-base font-bold text-foreground leading-tight">Bendahara</h3>
                                {tahun && (
                                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 mt-1.5">
                                        {tahun.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={ClipboardCheck}
                        iconClass="text-amber-600 dark:text-amber-400"
                        iconBg="bg-amber-50 dark:bg-amber-950/40"
                        accentBg="bg-amber-400"
                        label="Perlu Diverifikasi"
                        value={verifikasi}
                        sub="Menunggu pengecekan"
                        href="/bendahara/permohonan-dana"
                    />
                    <SummaryCard
                        icon={CircleDollarSign}
                        iconClass="text-violet-600 dark:text-violet-400"
                        iconBg="bg-violet-50 dark:bg-violet-950/40"
                        accentBg="bg-violet-400"
                        label="Menunggu Pencairan"
                        value={pencairan}
                        sub={nilaiPending > 0 ? fmt(nilaiPending) : 'Belum ada'}
                        href="/bendahara/permohonan-dana"
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        iconClass="text-green-600 dark:text-green-400"
                        iconBg="bg-green-50 dark:bg-green-950/40"
                        accentBg="bg-green-400"
                        label="Sudah Cair"
                        value={sudahCair}
                        sub={nilaiCair > 0 ? fmt(nilaiCair) : 'Belum ada'}
                    />
                    <SummaryCard
                        icon={ClipboardCheck}
                        iconClass="text-sky-600 dark:text-sky-400"
                        iconBg="bg-sky-50 dark:bg-sky-950/40"
                        accentBg="bg-sky-400"
                        label="Sudah Dicek"
                        value={sudahCek}
                        sub="Menunggu katimku"
                    />
                </div>

                {/* Riwayat pencairan */}
                {riwayatCair.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Riwayat Pencairan Terakhir</p>
                            <Link
                                href="/bendahara/permohonan-dana"
                                className="flex items-center gap-0.5 text-xs text-muted-foreground/50 hover:text-blue-600 transition-colors group"
                            >
                                Lihat semua <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                        <div className="overflow-hidden rounded-xl border bg-card">
                            <div className="h-0.5 w-full bg-green-500" />
                            <div className="divide-y">
                                {riwayatCair.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.keperluan}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-mono text-muted-foreground">{item.nomor_permohonan}</span>
                                                {item.tim_kerja && (
                                                    <span className="text-xs text-muted-foreground">· {item.tim_kerja.kode}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
                                                {fmt(item.total_anggaran)}
                                            </p>
                                            <div className="flex items-center gap-1 justify-end mt-0.5">
                                                <CalendarDays className="h-3 w-3 text-muted-foreground/50" />
                                                <span className="text-xs text-muted-foreground">{fmtDate(item.dicairkan_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
