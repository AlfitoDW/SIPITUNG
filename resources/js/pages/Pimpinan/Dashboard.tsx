import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Loader2, CheckCircle2, XCircle, Shield, ChevronRight,
    ClipboardList, ChartNoAxesColumn, FileText, HandCoins, AlertCircle, Clock
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/pimpinan/dashboard' },
];

type Tahun = { id: number; tahun: number; label: string } | null;
type PeriodePengukuran = { id: number; triwulan: string; laporan_submitted: number; laporan_approved: number };
type Props = {
    user: { nama_lengkap: string };
    pimpinanType: 'kabag_umum' | 'ppk';
    tahun: Tahun;
    pending:  { pk_awal: number; pk_revisi: number; ra: number; permohonan_dana: number; pengukuran: number };
    approved: { pk: number; ra: number; permohonan_dana: number; pengukuran: number };
    rejected: { pk: number; ra: number; permohonan_dana: number };
    periodePengukuran: PeriodePengukuran[];
};

const LINKS = {
    pk_awal:      '/pimpinan/perencanaan/perjanjian-kinerja/awal',
    pk_revisi:    '/pimpinan/perencanaan/perjanjian-kinerja/revisi',
    ra:           '/pimpinan/perencanaan/rencana-aksi',
    pengukuran:   '/pimpinan/pengukuran/kinerja',
    permohonan:   '/pimpinan/keuangan/permohonan-dana',
    persetujuan:  '/pimpinan/persetujuan',
};

function PendingRow({ icon: Icon, label, count, href }: {
    icon: React.ElementType; label: string; count: number; href: string;
}) {
    if (!count) return null;
    return (
        <Link href={href} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors group">
            <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/40">
                    <Icon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tabular-nums text-amber-700 dark:text-amber-400">{count}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-amber-600/60 group-hover:translate-x-0.5 transition-all" />
            </div>
        </Link>
    );
}

function StatusBadge({ count, variant }: { count: number; variant: 'success' | 'danger' }) {
    const cls = variant === 'success'
        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${cls}`}>
            {count}
        </span>
    );
}

export default function Dashboard({ user, pimpinanType, tahun, pending, approved, rejected, periodePengukuran }: Props) {
    const isKabag = pimpinanType === 'kabag_umum';
    const roleLabel = isKabag ? 'Kepala Bagian Umum' : 'Pejabat Pembuat Komitmen (PPK)';

    const totalPending = pending.pk_awal + pending.pk_revisi + pending.ra + pending.permohonan_dana + pending.pengukuran;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Pimpinan" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 p-6 text-white shadow-lg">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-emerald-200" />
                                <span className="text-emerald-200 text-xs font-medium uppercase tracking-widest">{roleLabel}</span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold leading-tight">{user.nama_lengkap}</h1>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {tahun && (
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                                    {tahun.label}
                                </span>
                            )}
                            {totalPending > 0 && (
                                <div className="flex items-center gap-2 rounded-full bg-amber-500/30 px-3 py-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-200" />
                                    <span className="text-sm font-bold text-white">{totalPending} dokumen menunggu review</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* Menunggu Review — utama */}
                    <div className="overflow-hidden rounded-xl border bg-card lg:col-span-1">
                        <div className="h-0.5 w-full bg-amber-400" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40">
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Menunggu Review</p>
                                    <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 leading-tight">{totalPending}</p>
                                </div>
                            </div>
                            <div className="space-y-0.5">
                                <PendingRow icon={FileText}          label="PK Awal"          count={pending.pk_awal}         href={LINKS.pk_awal} />
                                <PendingRow icon={FileText}          label="PK Revisi"         count={pending.pk_revisi}       href={LINKS.pk_revisi} />
                                <PendingRow icon={ClipboardList}     label="Rencana Aksi"      count={pending.ra}              href={LINKS.ra} />
                                {isKabag && <PendingRow icon={ChartNoAxesColumn} label="Pengukuran Kinerja" count={pending.pengukuran} href={LINKS.pengukuran} />}
                                <PendingRow icon={HandCoins}         label="Permohonan Dana"   count={pending.permohonan_dana} href={LINKS.permohonan} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed">
                                <Link href={LINKS.persetujuan} className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-amber-600/60 transition-colors group/link">
                                    Buka Hub Persetujuan <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Sudah Disetujui */}
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="h-0.5 w-full bg-emerald-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Sudah Disetujui</p>
                                    <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">
                                        {approved.pk + approved.ra + approved.permohonan_dana + approved.pengukuran}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'Perjanjian Kinerja', value: approved.pk,         href: LINKS.pk_awal },
                                    { label: 'Rencana Aksi',       value: approved.ra,         href: LINKS.ra },
                                    ...(isKabag ? [{ label: 'Pengukuran Kinerja', value: approved.pengukuran, href: LINKS.pengukuran }] : []),
                                    { label: 'Permohonan Dana',    value: approved.permohonan_dana, href: LINKS.permohonan },
                                ].map(({ label, value, href }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                                        <StatusBadge count={value} variant="success" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed">
                                <Link href={LINKS.persetujuan} className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-emerald-600/60 transition-colors group/link">
                                    Lihat di Hub Persetujuan <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Dikembalikan */}
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="h-0.5 w-full bg-red-400" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Dikembalikan</p>
                                    <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400 leading-tight">
                                        {rejected.pk + rejected.ra + rejected.permohonan_dana}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: 'Perjanjian Kinerja', value: rejected.pk,         href: LINKS.pk_awal },
                                    { label: 'Rencana Aksi',       value: rejected.ra,         href: LINKS.ra },
                                    { label: 'Permohonan Dana',    value: rejected.permohonan_dana, href: LINKS.permohonan },
                                ].map(({ label, value, href }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <Link href={href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
                                        <StatusBadge count={value} variant="danger" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed">
                                <Link href={LINKS.persetujuan} className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-red-600/60 transition-colors group/link">
                                    Lihat di Hub Persetujuan <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Pengukuran per Triwulan — hanya Kabag */}
                {isKabag && periodePengukuran.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-foreground">Status Pengukuran Kinerja</p>
                            <Link href="/pimpinan/pengukuran/kinerja" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#003580] transition-colors">
                                Buka <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                            {periodePengukuran.map(p => {
                                const total = p.laporan_submitted + p.laporan_approved;
                                return (
                                    <Link key={p.id} href={`/pimpinan/pengukuran/kinerja?periode_id=${p.id}`}
                                        className="overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all group">
                                        <div className="h-0.5 w-full bg-indigo-500" />
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{p.triwulan}</span>
                                                <ChartNoAxesColumn className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            {total === 0 ? (
                                                <p className="text-xs text-muted-foreground italic">Belum ada laporan</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {p.laporan_submitted > 0 && (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="h-3 w-3 text-amber-500" />
                                                                <span className="text-[11px] text-muted-foreground">Menunggu</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-amber-600">{p.laporan_submitted}</span>
                                                        </div>
                                                    )}
                                                    {p.laporan_approved > 0 && (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                <span className="text-[11px] text-muted-foreground">Disetujui</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600">{p.laporan_approved}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
