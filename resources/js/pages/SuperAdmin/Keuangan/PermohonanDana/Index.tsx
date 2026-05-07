import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';

type Item = { id: number; kode_akun: string | null; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    total_anggaran: string;
    status: string;
    status_label: string;
    tim_kerja: { id: number; nama: string; kode: string } | null;
    items: Item[];
};
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; permohonan: PD[]; timKerjaList: { id: number; nama: string }[] };

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const statusColor = (s: string) => {
    if (s === 'dicairkan') return 'bg-green-500';
    if (s === 'rejected') return 'bg-red-500';
    if (s === 'draft') return 'bg-slate-400';
    return 'bg-blue-500';
};

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (s === 'dicairkan') return 'default';
    if (s === 'rejected') return 'destructive';
    if (s === 'draft') return 'secondary';
    return 'outline';
};

const STATUS_ORDER = ['draft', 'submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved', 'dicairkan', 'rejected'];

export default function PermohonanDanaIndex({ tahun, permohonan, timKerjaList }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterTim, setFilterTim] = useState('');

    const filtered = permohonan.filter((pd) => {
        const matchSearch =
            !search ||
            pd.nomor_permohonan.toLowerCase().includes(search.toLowerCase()) ||
            pd.keperluan.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || pd.status === filterStatus;
        const matchTim = !filterTim || String(pd.tim_kerja?.id) === filterTim;
        return matchSearch && matchStatus && matchTim;
    });

    const stats = {
        total: permohonan.length,
        proses: permohonan.filter((p) => !['draft', 'dicairkan', 'rejected'].includes(p.status)).length,
        dicairkan: permohonan.filter((p) => p.status === 'dicairkan').length,
        rejected: permohonan.filter((p) => p.status === 'rejected').length,
        totalCair: permohonan.filter((p) => p.status === 'dicairkan').reduce((s, p) => s + Number(p.total_anggaran), 0),
    };

    return (
        <AppLayout>
            <Head title="Monitoring Permohonan Dana" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Monitoring Permohonan Dana</h1>
                    <p className="text-sm text-muted-foreground">{tahun?.label}</p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-slate-400' },
                        { label: 'Proses', value: stats.proses, color: 'bg-blue-500' },
                        { label: 'Dicairkan', value: `${stats.dicairkan} (${fmt(stats.totalCair)})`, color: 'bg-green-500' },
                        { label: 'Ditolak', value: stats.rejected, color: 'bg-red-500' },
                    ].map((s) => (
                        <div key={s.label} className="overflow-hidden rounded-xl border bg-card">
                            <div className={`h-0.5 w-full ${s.color}`} />
                            <div className="p-3">
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-lg font-bold tabular-nums">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Cari nomor / keperluan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-xs"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Semua Status</option>
                        {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={filterTim}
                        onChange={(e) => setFilterTim(e.target.value)}
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Semua Tim</option>
                        {timKerjaList.map((t) => (
                            <option key={t.id} value={t.id}>{t.nama}</option>
                        ))}
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center py-12 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Tidak ada data permohonan</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filtered.map((pd) => {
                            const isOpen = expanded === pd.id;
                            return (
                                <div key={pd.id} className="overflow-hidden rounded-xl border bg-card">
                                    <div className={`h-0.5 w-full ${statusColor(pd.status)}`} />
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-xs text-muted-foreground">{pd.nomor_permohonan}</span>
                                                    {pd.tim_kerja && <Badge variant="outline" className="text-xs">{pd.tim_kerja.kode}</Badge>}
                                                    <Badge variant={statusVariant(pd.status)} className="text-xs">{pd.status_label}</Badge>
                                                </div>
                                                <p className="font-semibold mt-1 truncate">{pd.keperluan}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {fmtDate(pd.tanggal_mulai)} – {fmtDate(pd.tanggal_selesai)}
                                                </p>
                                                <p className="text-sm font-bold mt-1">{fmt(pd.total_anggaran)}</p>
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                                                        onClick={() => setExpanded(isOpen ? null : pd.id)}
                                                    >
                                                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{isOpen ? 'Sembunyikan rincian' : 'Lihat rincian biaya'}</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {isOpen && pd.items.length > 0 && (
                                            <div className="mt-4 border rounded-lg overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">Kode Akun</th>
                                                            <th className="px-3 py-2 text-left">Uraian</th>
                                                            <th className="px-3 py-2 text-right">Vol</th>
                                                            <th className="px-3 py-2 text-left">Sat</th>
                                                            <th className="px-3 py-2 text-right">Harga Sat.</th>
                                                            <th className="px-3 py-2 text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {pd.items.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="px-3 py-2 font-mono text-muted-foreground">{item.kode_akun ?? '-'}</td>
                                                                <td className="px-3 py-2">{item.uraian}</td>
                                                                <td className="px-3 py-2 text-right">{Number(item.volume)}</td>
                                                                <td className="px-3 py-2">{item.satuan}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums">{fmt(item.harga_satuan)}</td>
                                                                <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(item.total)}</td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-muted/30 font-semibold">
                                                            <td colSpan={5} className="px-3 py-2 text-right text-xs">Total</td>
                                                            <td className="px-3 py-2 text-right tabular-nums">{fmt(pd.total_anggaran)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
