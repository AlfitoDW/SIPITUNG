import { Head, useForm } from '@inertiajs/react';
import { Banknote, ChevronDown, ChevronUp, CheckCircle2, FileText, CalendarDays, Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Item = { id: number; kode_akun: string | null; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    submitted_at: string | null;
    tempat: string | null;
    total_anggaran: string;
    status: string;
    status_label: string;
    dicairkan_at: string | null;
    tim_kerja: { nama: string; kode: string } | null;
    catatan_pic: string | null;
    items: Item[];
};
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; siapCair: PD[]; riwayat: PD[] };

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

function PDCard({ pd, onCairkan }: { pd: PD; onCairkan: () => void }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-0.5 w-full bg-violet-500" />
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{pd.nomor_permohonan}</span>
                            {pd.tim_kerja && <Badge variant="outline" className="text-xs">{pd.tim_kerja.kode}</Badge>}
                            <Badge variant="outline" className="text-xs text-violet-600 border-violet-300">Siap Cair</Badge>
                        </div>
                        <p className="font-semibold mt-1">{pd.keperluan}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtDate(pd.tanggal_mulai)} – {fmtDate(pd.tanggal_selesai)}
                            {pd.tempat && ` · ${pd.tempat}`}
                        </p>
                        {pd.submitted_at && (
                            <p className="text-[10px] text-blue-600 mt-0.5">
                                Tanggal Pengajuan: {fmtDate(pd.submitted_at)}
                            </p>
                        )}
                        <p className="text-lg font-bold mt-1 text-violet-600 dark:text-violet-400">{fmt(pd.total_anggaran)}</p>
                        {pd.catatan_pic && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/40 px-2 py-1 rounded">
                                Catatan PIC: {pd.catatan_pic}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a href={`/bendahara/permohonan-dana/${pd.id}/nominatif`}
                            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" /> Nominatif
                        </a>
                        <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={onCairkan}>
                            <Banknote className="h-3.5 w-3.5" />
                            Cairkan Dana
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
                                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{expanded ? 'Sembunyikan rincian' : 'Lihat rincian biaya'}</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {expanded && pd.items.length > 0 && (
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
}

export default function PermohonanDanaIndex({ tahun, siapCair, riwayat }: Props) {
    const [cairTarget, setCairTarget] = useState<PD | null>(null);
    const { data, setData, post, processing, reset } = useForm({ catatan: '' });

    const handleCairkan = () => {
        if (!cairTarget) return;
        post(`/bendahara/permohonan-dana/${cairTarget.id}/cairkan`, {
            onSuccess: () => { reset(); setCairTarget(null); },
        });
    };

    return (
        <AppLayout>
            <Head title="Pencairan Dana" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pencairan Dana</h1>
                    <p className="text-sm text-muted-foreground">{tahun?.label} · Bendahara — Step 5</p>
                </div>

                <div>
                    <h2 className="text-sm font-semibold mb-3">Siap Dicairkan ({siapCair.length})</h2>
                    {siapCair.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">Tidak ada dana yang siap dicairkan</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {siapCair.map((pd) => (
                                <PDCard
                                    key={pd.id}
                                    pd={pd}
                                    onCairkan={() => { reset(); setCairTarget(pd); }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {riwayat.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold mb-3">Riwayat Pencairan ({riwayat.length})</h2>
                        <div className="overflow-hidden rounded-xl border bg-card">
                            <div className="h-0.5 w-full bg-green-500" />
                            <div className="divide-y">
                                {riwayat.map((pd) => (
                                    <div key={pd.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40 shrink-0">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{pd.keperluan}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-mono text-muted-foreground">{pd.nomor_permohonan}</span>
                                                {pd.tim_kerja && <span className="text-xs text-muted-foreground">· {pd.tim_kerja.kode}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">{fmt(pd.total_anggaran)}</p>
                                            {pd.submitted_at && (
                                                <p className="text-[10px] text-blue-600">
                                                    Diajukan: {fmtDate(pd.submitted_at)}
                                                </p>
                                            )}
                                            {pd.dicairkan_at && (
                                                <div className="flex items-center gap-1 justify-end">
                                                    <CalendarDays className="h-3 w-3 text-muted-foreground/50" />
                                                    <span className="text-xs text-muted-foreground">{fmtDate(pd.dicairkan_at)}</span>
                                                </div>
                                            )}
                                            <a href={`/bendahara/permohonan-dana/${pd.id}/nominatif`}
                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                                target="_blank" rel="noopener noreferrer">
                                                <Download className="h-3 w-3" /> Nominatif
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={!!cairTarget} onOpenChange={(o) => !o && setCairTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cairkan Dana</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cairkan dana sebesar <strong>{cairTarget ? fmt(cairTarget.total_anggaran) : ''}</strong> untuk permohonan{' '}
                            <strong>{cairTarget?.nomor_permohonan}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-6 pb-2">
                        <Label className="text-sm">Catatan Pencairan</Label>
                        <Textarea
                            className="mt-1.5"
                            rows={3}
                            value={data.catatan}
                            onChange={(e) => setData('catatan', e.target.value)}
                            placeholder="Catatan pencairan (opsional)"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCairkan} disabled={processing} className="bg-violet-600 hover:bg-violet-700">
                            {processing ? 'Memproses...' : 'Cairkan Dana'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
