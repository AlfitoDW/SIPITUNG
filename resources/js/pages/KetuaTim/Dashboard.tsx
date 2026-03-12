import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileText, ClipboardList, ChevronRight, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type DocStatus = { id: number; status: string; indikators_count?: number } | null;
type Tahun     = { id: number; tahun: number; label: string } | null;
type Props = {
    user: { nama_lengkap: string };
    timKerja: { id: number; nama: string; kode: string; nama_singkat?: string } | null;
    tahun: Tahun;
    pkAwal: DocStatus;
    pkRevisi: DocStatus;
    ra: DocStatus;
};

const STATUS_CONFIG: Record<string, {
    label: string;
    dot: string;
    text: string;
    pillBg: string;
    accentBg: string;
    spinner?: boolean;
    spinnerColor?: string;
}> = {
    draft:          { label: 'Draft',          dot: 'bg-slate-300',  text: 'text-slate-600',  pillBg: 'bg-slate-100',  accentBg: 'bg-slate-300' },
    submitted:      { label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-700',   pillBg: 'bg-blue-50',    accentBg: 'bg-blue-400',  spinner: true, spinnerColor: 'text-blue-400' },
    kabag_approved: { label: 'Menunggu PPK',   dot: 'bg-amber-400',  text: 'text-amber-700',  pillBg: 'bg-amber-50',   accentBg: 'bg-amber-400', spinner: true, spinnerColor: 'text-amber-400' },
    ppk_approved:   { label: 'Terkunci',       dot: 'bg-green-400',  text: 'text-green-700',  pillBg: 'bg-green-50',   accentBg: 'bg-green-400' },
    rejected:       { label: 'Ditolak',        dot: 'bg-red-400',    text: 'text-red-700',    pillBg: 'bg-red-50',     accentBg: 'bg-red-400' },
};

function DocCard({ title, icon: Icon, doc, href, emptyLabel }: {
    title: string; icon: React.ElementType; doc: DocStatus; href: string; emptyLabel: string;
}) {
    const cfg = doc ? (STATUS_CONFIG[doc.status] ?? STATUS_CONFIG['draft']) : null;
    return (
        <Link href={href} className="block group">
            <div className="relative overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-[#003580]/30 hover:shadow-md">
                {/* Status accent stripe */}
                <div className={`h-0.5 w-full ${cfg ? cfg.accentBg : 'bg-slate-200'}`} />

                <div className="p-5">
                    {/* Icon + title */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#003580]/8">
                            <Icon className="h-4 w-4 text-[#003580]" />
                        </div>
                        <span className="text-sm font-semibold">{title}</span>
                    </div>

                    {/* Status pill */}
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

                    {/* Footer: indikator count + link hint */}
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

export default function Dashboard({ user, timKerja, tahun, pkAwal, pkRevisi, ra }: Props) {
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
            </div>
        </AppLayout>
    );
}
