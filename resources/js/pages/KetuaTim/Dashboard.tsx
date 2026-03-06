import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardList, ChevronRight, Loader2 } from 'lucide-react';

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

const STATUS_CONFIG: Record<string, { label: string; className: string; spinner?: boolean }> = {
    draft:          { label: 'Draft',          className: 'bg-slate-100 text-slate-700 border-slate-200' },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-blue-100 text-blue-700 border-blue-200',   spinner: true },
    kabag_approved: { label: 'Menunggu PPK',   className: 'bg-amber-100 text-amber-700 border-amber-200', spinner: true },
    ppk_approved:   { label: 'Terkunci',       className: 'bg-green-100 text-green-700 border-green-200' },
    rejected:       { label: 'Ditolak',        className: 'bg-red-100 text-red-700 border-red-200' },
};

function DocCard({ title, icon: Icon, doc, href, emptyLabel }: {
    title: string; icon: React.ElementType; doc: DocStatus; href: string; emptyLabel: string;
}) {
    const cfg = doc ? (STATUS_CONFIG[doc.status] ?? STATUS_CONFIG['draft']) : null;
    return (
        <Link href={href}>
            <Card className="cursor-pointer transition-colors hover:bg-muted/40">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className="h-4 w-4" />{title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        {doc ? (
                            <>
                                <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${cfg!.className}`}>
                                    {cfg!.spinner && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {cfg!.label}
                                </Badge>
                                {doc.indikators_count !== undefined && (
                                    <p className="text-xs text-muted-foreground mt-1">{doc.indikators_count} indikator</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
                        )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
            </Card>
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
                    <Card className="border-[#003580]/20 bg-[#003580]/5">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Tim Kerja Anda</p>
                            <h3 className="text-xl font-bold text-[#003580]">{timKerja.nama}</h3>
                            <p className="text-sm text-[#003580]/70 mt-0.5">Kode: {timKerja.kode}</p>
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
