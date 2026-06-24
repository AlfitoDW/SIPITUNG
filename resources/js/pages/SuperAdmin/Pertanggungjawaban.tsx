import { Head, Link } from '@inertiajs/react';
import { FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';

interface PermohonanItem {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    total_anggaran: string | number;
    dicairkan_at: string | null;
    tgl_pertanggungjawaban: string | null;
    tim_kerja_nama: string | null;
    lpj_uploaded_at: string | null;
    lpj_uploaded_by_name: string | null;
    lpj_file_name: string | null;
}

interface Props {
    permohonan: PermohonanItem[];
    tahun: { tahun: number } | null;
}

export default function Pertanggungjawaban({ permohonan }: Props) {
    const fmt = (n: string | number | null | undefined) => {
        const num = Number(n);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isNaN(num) ? 0 : num);
    };

    const fmtDate = (s: string | null) =>
        s ? new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    const belumLpj = permohonan.filter(p => !p.lpj_uploaded_at).length;
    const sudahLpj = permohonan.filter(p => p.lpj_uploaded_at).length;

    return (
        <AppLayout>
            <Head title="Pertanggungjawaban" />

            <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pertanggungjawaban</h1>
                        <p className="text-sm text-muted-foreground mt-1">Laporan pertanggungjawaban permohonan yang telah dicairkan</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Dicairkan</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{permohonan.length}</div></CardContent>
                    </Card>
                    <Card className="border-emerald-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700">LPJ Sudah Upload</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-emerald-700">{sudahLpj}</div></CardContent>
                    </Card>
                    <Card className="border-amber-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700">Belum Upload LPJ</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-amber-700">{belumLpj}</div></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Daftar Permohonan Dicairkan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {permohonan.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Belum ada permohonan yang dicairkan.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Keperluan</TableHead>
                                        <TableHead>Tim Kerja</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Dicairkan</TableHead>
                                        <TableHead>Status LPJ</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permohonan.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono text-xs font-semibold text-blue-700">{p.nomor_permohonan}</TableCell>
                                            <TableCell className="max-w-xs truncate">{p.keperluan}</TableCell>
                                            <TableCell>{p.tim_kerja_nama ?? '-'}</TableCell>
                                            <TableCell className="text-right">{fmt(p.total_anggaran)}</TableCell>
                                            <TableCell className="text-xs text-gray-500">{fmtDate(p.dicairkan_at)}</TableCell>
                                            <TableCell>
                                                {p.lpj_uploaded_at ? (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Sudah Upload
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                                                        <Clock className="h-3 w-3" /> Belum Upload
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {p.lpj_file_name && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <a href={`/files/lpj/${p.id}`} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="sm" variant="ghost" className="h-7 text-violet-600 hover:text-violet-800">
                                                                        <FileText className="h-4 w-4" />
                                                                    </Button>
                                                                </a>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Lihat LPJ</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={`/super-admin/keuangan/permohonan-dana/${p.id}`}>
                                                                <Button size="sm" variant="ghost" className="h-7">
                                                                    <ArrowRight className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Lihat Detail</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
