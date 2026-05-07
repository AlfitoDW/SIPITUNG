import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, ClipboardCheck, FileText } from 'lucide-react';
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
    tim_kerja: { nama: string; kode: string } | null;
    created_by_user?: { nama_lengkap: string } | null;
    items: Item[];
};
type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; menunggu: PD[]; riwayat: PD[] };

const fmt = (n: string | number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n));
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

type ActionForm = { id: number; nomor: string; action: 'approve' | 'reject' } | null;

function PermohonanCard({ pd, onApprove, onReject }: { pd: PD; onApprove: () => void; onReject: () => void }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-0.5 w-full bg-amber-400" />
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{pd.nomor_permohonan}</span>
                            {pd.tim_kerja && (
                                <Badge variant="outline" className="text-xs">{pd.tim_kerja.kode}</Badge>
                            )}
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
                        <p className="text-sm font-bold mt-1">{fmt(pd.total_anggaran)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50" onClick={onApprove}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verifikasi
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50" onClick={onReject}>
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak
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

export default function PermohonanDanaIndex({ tahun, menunggu, riwayat }: Props) {
    const [actionTarget, setActionTarget] = useState<ActionForm>(null);
    const { data, setData, post, processing, reset } = useForm({ catatan: '' });

    const handleConfirm = () => {
        if (!actionTarget) return;
        const url = `/pic-keuangan/permohonan-dana/${actionTarget.id}/${actionTarget.action === 'approve' ? 'approve' : 'reject'}`;
        post(url, { onSuccess: () => { reset(); setActionTarget(null); } });
    };

    return (
        <AppLayout>
            <Head title="Verifikasi Permohonan Dana" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Verifikasi Permohonan Dana</h1>
                    <p className="text-sm text-muted-foreground">{tahun?.label} · PIC Keuangan — Step 4</p>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ClipboardCheck className="h-4 w-4 text-amber-500" />
                        <h2 className="text-sm font-semibold">Menunggu Verifikasi ({menunggu.length})</h2>
                    </div>
                    {menunggu.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-12 text-center">
                                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">Tidak ada permohonan yang perlu diverifikasi</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {menunggu.map((pd) => (
                                <PermohonanCard
                                    key={pd.id}
                                    pd={pd}
                                    onApprove={() => { reset(); setActionTarget({ id: pd.id, nomor: pd.nomor_permohonan, action: 'approve' }); }}
                                    onReject={() => { reset(); setActionTarget({ id: pd.id, nomor: pd.nomor_permohonan, action: 'reject' }); }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {riwayat.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold mb-3">Riwayat Verifikasi Saya ({riwayat.length})</h2>
                        <div className="flex flex-col gap-2">
                            {riwayat.map((pd) => (
                                <div key={pd.id} className="overflow-hidden rounded-xl border bg-card">
                                    <div className={`h-0.5 w-full ${pd.status === 'rejected' ? 'bg-red-400' : 'bg-green-400'}`} />
                                    <div className="p-4 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">{pd.nomor_permohonan}</span>
                                                {pd.tim_kerja && <Badge variant="outline" className="text-xs">{pd.tim_kerja.kode}</Badge>}
                                                <Badge variant={pd.status === 'rejected' ? 'destructive' : 'default'} className="text-xs">{pd.status_label}</Badge>
                                            </div>
                                            <p className="text-sm font-medium mt-0.5 truncate">{pd.keperluan}</p>
                                        </div>
                                        <p className="text-sm font-bold tabular-nums shrink-0">{fmt(pd.total_anggaran)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AlertDialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionTarget?.action === 'approve' ? 'Verifikasi Permohonan' : 'Tolak Permohonan'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionTarget?.action === 'approve'
                                ? `Verifikasi permohonan ${actionTarget?.nomor} dan teruskan ke Bendahara untuk pencairan?`
                                : `Tolak permohonan ${actionTarget?.nomor}? PUMK perlu merevisi.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-6 pb-2">
                        <Label className="text-sm">
                            Catatan {actionTarget?.action === 'reject' && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                            className="mt-1.5"
                            rows={3}
                            value={data.catatan}
                            onChange={(e) => setData('catatan', e.target.value)}
                            placeholder={actionTarget?.action === 'approve' ? 'Catatan verifikasi (opsional)' : 'Alasan penolakan (wajib)'}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={processing}
                            className={actionTarget?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            {processing ? 'Memproses...' : actionTarget?.action === 'approve' ? 'Verifikasi' : 'Tolak'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
