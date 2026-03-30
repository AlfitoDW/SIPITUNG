import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileText, ClipboardList, ChevronRight, Loader2, Building2, HandCoins, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SharedData } from '@/types';

type DocStatus = { id: number; status: string; indikators_count?: number } | null;
type Tahun     = { id: number; tahun: number; label: string } | null;
type Permohonan = {
    draft: number; submitted: number; kabag_approved: number;
    bendahara_checked: number; katimku_approved: number; ppk_approved: number;
    dicairkan: number; rejected: number; nilai_dicairkan: number;
};
type Props = {
    user: { nama_lengkap: string };
    timKerja: { id: number; nama: string; kode: string; nama_singkat?: string } | null;
    tahun: Tahun;
    pkAwal: DocStatus;
    pkRevisi: DocStatus;
    ra: DocStatus;
    permohonan: Permohonan;
    approvalPending: number;
};

const PK_STATUS_CONFIG: Record<string, {
    label: string; dot: string; text: string; pillBg: string; accentBg: string;
    spinner?: boolean; spinnerColor?: string;
}> = {
    draft:          { label: 'Draft',          dot: 'bg-slate-300',  text: 'text-slate-600',  pillBg: 'bg-slate-100',  accentBg: 'bg-slate-300' },
    submitted:      { label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-700',   pillBg: 'bg-blue-50',    accentBg: 'bg-blue-400',  spinner: true, spinnerColor: 'text-blue-400' },
    kabag_approved: { label: 'Menunggu PPK',   dot: 'bg-amber-400',  text: 'text-amber-700',  pillBg: 'bg-amber-50',   accentBg: 'bg-amber-400', spinner: true, spinnerColor: 'text-amber-400' },
    ppk_approved:   { label: 'Terkunci',       dot: 'bg-green-400',  text: 'text-green-700',  pillBg: 'bg-green-50',   accentBg: 'bg-green-400' },
    rejected:       { label: 'Ditolak',        dot: 'bg-red-400',    text: 'text-red-700',    pillBg: 'bg-red-50',     accentBg: 'bg-red-400' },
};

const PD_STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; spinner?: boolean; spinnerColor?: string }> = {
    draft:              { label: 'Draft',                dot: 'bg-slate-300', text: 'text-slate-500' },
    submitted:          { label: 'Menunggu Kabag',       dot: 'bg-blue-400',  text: 'text-blue-600',  spinner: true, spinnerColor: 'text-blue-400' },
    kabag_approved:     { label: 'Menunggu Bendahara',   dot: 'bg-sky-400',   text: 'text-sky-600',   spinner: true, spinnerColor: 'text-sky-400' },
    bendahara_checked:  { label: 'Menunggu Katimku',     dot: 'bg-violet-400',text: 'text-violet-600',spinner: true, spinnerColor: 'text-violet-400' },
    katimku_approved:   { label: 'Menunggu PPK',         dot: 'bg-amber-400', text: 'text-amber-600', spinner: true, spinnerColor: 'text-amber-400' },
    ppk_approved:       { label: 'Siap Cair',            dot: 'bg-lime-400',  text: 'text-lime-600',  spinner: true, spinnerColor: 'text-lime-400' },
    dicairkan:          { label: 'Sudah Cair',           dot: 'bg-green-400', text: 'text-green-600' },
    rejected:           { label: 'Ditolak',              dot: 'bg-red-400',   text: 'text-red-600' },
};

function DocCard({ title, icon: Icon, doc, href, emptyLabel }: {
    title: string; icon: React.ElementType; doc: DocStatus; href: string; emptyLabel: string;
}) {
    const cfg = doc ? (PK_STATUS_CONFIG[doc.status] ?? PK_STATUS_CONFIG['draft']) : null;
    return (
        <Link href={href} className="block group">
            <div className="relative overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-[#003580]/30 hover:shadow-md">
                <div className={`h-0.5 w-full ${cfg ? cfg.accentBg : 'bg-slate-200'}`} />
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#003580]/8">
                            <Icon className="h-4 w-4 text-[#003580]" />
                        </div>
                        <span className="text-sm font-semibold">{title}</span>
                    </div>
                    {doc ? (
                        <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 ${cfg!.pillBg}`}>
                            {cfg!.spinner
                                ? <Loader2 className={`h-3 w-3 animate-spin ${cfg!.spinnerColor}`} />
                                : <span className={`h-1.5 w-1.5 rounded-full ${cfg!.dot}`} />
                            }
                            <span className={`text-xs font-semibold tracking-wide ${cfg!.text}`}>{cfg!.label}</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                            <span className="text-xs text-muted-foreground">{emptyLabel}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed">
                        <span className="text-xs text-muted-foreground">
                            {doc?.indikators_count !== undefined
                                ? `${doc.indikators_count} indikator kinerja`
                                : <span className="invisible">—</span>
                            }
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground/40 group-hover:text-[#003580]/50 transition-colors">
                            Buka <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard({ user, timKerja, tahun, pkAwal, pkRevisi, ra, permohonan, approvalPending }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isKoordinator = auth.user?.is_koordinator ?? false;

    const pdTotal = permohonan.draft + permohonan.submitted + permohonan.kabag_approved +
        permohonan.bendahara_checked + permohonan.katimku_approved + permohonan.ppk_approved +
        permohonan.dicairkan + permohonan.rejected;

    return (
        <AppLayout>
            <Head title="Dashboard Ketua Tim" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Ketua Tim Kerja</h1>
                    <p className="text-muted-foreground">Selamat datang, {user.nama_lengkap}</p>
                </div>

                {timKerja && (
                    <Card className="border-[#003580]/20 overflow-hidden">
                        <div className="h-0.5 w-full bg-[#003580]" />
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#003580]/10">
                                    <Building2 className="h-6 w-6 text-[#003580]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Tim Kerja Anda</p>
                                    <h3 className="text-base font-bold text-foreground leading-tight truncate">{timKerja.nama}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold bg-[#003580]/8 text-[#003580]">
                                            {timKerja.kode}
                                        </span>
                                        {timKerja.nama_singkat && (
                                            <span className="text-xs text-muted-foreground">{timKerja.nama_singkat}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Perencanaan */}
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                        Modul Perencanaan {tahun ? `— ${tahun.label}` : ''}
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                        <DocCard
                            title="PK Awal"
                            icon={FileText}
                            doc={pkAwal}
                            href="/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan"
                            emptyLabel="Belum dibuat"
                        />
                        <DocCard
                            title="PK Revisi"
                            icon={FileText}
                            doc={pkRevisi}
                            href="/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan"
                            emptyLabel="Belum dibuat"
                        />
                        <DocCard
                            title="Rencana Aksi"
                            icon={ClipboardList}
                            doc={ra}
                            href="/ketua-tim/perencanaan/rencana-aksi/penyusunan"
                            emptyLabel="Belum dibuat"
                        />
                    </div>
                </div>

                {/* Keuangan */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                            Modul Keuangan {tahun ? `— ${tahun.label}` : ''}
                        </p>
                        {isKoordinator && approvalPending > 0 && (
                            <Link
                                href="/ketua-tim/permohonan-dana/approval"
                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors"
                            >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {approvalPending} menunggu approval Anda
                            </Link>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="h-0.5 w-full bg-emerald-500" />
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                                    <HandCoins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="text-sm font-semibold">Permohonan Dana</span>
                                {pdTotal > 0 && (
                                    <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">{pdTotal} permohonan</span>
                                )}
                            </div>

                            {pdTotal === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada permohonan dana</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
                                    {Object.entries(PD_STATUS_CONFIG).map(([key, cfg]) => {
                                        const value = permohonan[key as keyof Permohonan] as number;
                                        if (!value) return null;
                                        return (
                                            <div key={key} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {cfg.spinner
                                                        ? <Loader2 className={`h-3 w-3 shrink-0 animate-spin ${cfg.spinnerColor}`} />
                                                        : <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                                                    }
                                                    <span className={`text-xs truncate ${cfg.text}`}>{cfg.label}</span>
                                                </div>
                                                <span className={`text-xs font-bold tabular-nums shrink-0 ${cfg.text}`}>{value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                                <Link
                                    href="/ketua-tim/permohonan-dana"
                                    className="flex items-center gap-0.5 text-xs text-muted-foreground/40 hover:text-emerald-600/60 transition-colors group/link"
                                >
                                    Lihat semua <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                                {permohonan.nilai_dicairkan > 0 && (
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                                        {fmt(permohonan.nilai_dicairkan)} cair
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
