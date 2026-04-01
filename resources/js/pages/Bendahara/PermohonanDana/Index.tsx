import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Banknote, History, Search, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan', href: '#' },
    { title: 'Permohonan Dana', href: '/bendahara/permohonan-dana' },
];

const fmt = (n: number | string) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));

const STATUS: Record<string, { label: string; className: string }> = {
    bendahara_checked: { label: 'Terverifikasi',      className: 'bg-blue-100 text-blue-800 border-blue-200' },
    katimku_approved:  { label: 'Disetujui Ketua Tim',className: 'bg-blue-100 text-blue-900 border-blue-300' },
    dicairkan:         { label: 'Sudah Dicairkan',    className: 'bg-green-50 text-green-700 border-green-200' },
    rejected:          { label: 'Ditolak',            className: 'bg-red-50 text-red-600 border-red-200' },
};

type Item = { id: number; uraian: string; volume: string; satuan: string; harga_satuan: string; total: string; keterangan: string | null };
type PD = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    tanggal_kegiatan: string;
    total_anggaran: string;
    status: string;
    keterangan: string | null;
    rekomendasi_kabag: string | null;
    catatan_pencairan: string | null;
    tim_kerja: { id: number; nama: string; kode: string };
    items?: Item[];
};
type Props = {
    tahun: { id: number; tahun: number; label: string };
    verifikasi: PD[];
    pencairan: PD[];
    riwayat: PD[];
    timKerjaList: { id: number; nama: string }[];
};

type ActionDialog = { open: boolean; pd: PD | null; action: 'cek' | 'cairkan' };

function PDAccordion({ pds, onAction, actionLabel, actionClass, actionIcon, actionKey }: {
    pds: PD[];
    onAction: (pd: PD) => void;
    actionLabel: string;
    actionClass: string;
    actionIcon: React.ReactNode;
    actionKey: string;
}) {
    if (pds.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
                Tidak ada permohonan dana saat ini.
            </div>
        );
    }

    return (
        <Accordion type="multiple" className="flex flex-col gap-2">
            {pds.map((pd) => (
                <AccordionItem key={pd.id} value={`${actionKey}-${pd.id}`} className="rounded-xl border shadow-sm overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/40">
                        <div className="flex items-center gap-3 flex-1 mr-2 text-left">
                            <div>
                                <p className="font-semibold text-sm">{pd.tim_kerja.nama}</p>
                                <p className="text-xs text-muted-foreground">{pd.nomor_permohonan} · {pd.keperluan}</p>
                            </div>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 ml-auto mr-2 font-semibold">
                                {fmt(pd.total_anggaran)}
                            </Badge>
                        </div>
                        <Button
                            size="sm" variant="outline"
                            className={`h-7 gap-1.5 mr-2 ${actionClass}`}
                            onClick={(e) => { e.stopPropagation(); onAction(pd); }}
                        >
                            {actionIcon}{actionLabel}
                        </Button>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                        <div className="px-4 py-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Tanggal Kegiatan:</span>
                                    <span className="ml-2">{new Date(pd.tanggal_kegiatan).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                                </div>
                            </div>
                            {pd.keterangan && <p className="text-sm text-muted-foreground italic">{pd.keterangan}</p>}
                            {pd.rekomendasi_kabag && (
                                <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-3 py-1.5">
                                    <span className="font-semibold">Catatan Kabag:</span> {pd.rekomendasi_kabag}
                                </p>
                            )}
                            {pd.items && pd.items.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-slate-50">
                                            <TableHead className="text-xs w-8">No</TableHead>
                                            <TableHead className="text-xs">Uraian</TableHead>
                                            <TableHead className="text-xs text-center">Vol</TableHead>
                                            <TableHead className="text-xs text-center">Satuan</TableHead>
                                            <TableHead className="text-xs text-right">Harga Satuan</TableHead>
                                            <TableHead className="text-xs text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pd.items.map((item, idx) => (
                                            <TableRow key={item.id} className="hover:bg-transparent">
                                                <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                <TableCell className="text-xs">
                                                    <p>{item.uraian}</p>
                                                    {item.keterangan && <p className="text-muted-foreground">{item.keterangan}</p>}
                                                </TableCell>
                                                <TableCell className="text-xs text-center">{item.volume}</TableCell>
                                                <TableCell className="text-xs text-center">{item.satuan}</TableCell>
                                                <TableCell className="text-xs text-right">{fmt(item.harga_satuan)}</TableCell>
                                                <TableCell className="text-xs text-right font-medium">{fmt(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableCell colSpan={5} className="text-xs font-semibold text-right">Total</TableCell>
                                            <TableCell className="text-sm font-bold text-right">{fmt(pd.total_anggaran)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export default function Index({ tahun, verifikasi, pencairan, riwayat, timKerjaList }: Props) {
    const [dialog, setDialog] = useState<ActionDialog>({ open: false, pd: null, action: 'cek' });
    const [catatan, setCatatan] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [filterTimKerja, setFilterTimKerja] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredRiwayat = useMemo(() => {
        return riwayat.filter((pd) => {
            const matchSearch =
                search === '' ||
                pd.nomor_permohonan.toLowerCase().includes(search.toLowerCase()) ||
                pd.keperluan.toLowerCase().includes(search.toLowerCase());
            const matchTimKerja =
                filterTimKerja === 'all' || pd.tim_kerja.id.toString() === filterTimKerja;
            const matchStatus =
                filterStatus === 'all' || pd.status === filterStatus;
            return matchSearch && matchTimKerja && matchStatus;
        });
    }, [riwayat, search, filterTimKerja, filterStatus]);

    function openDialog(pd: PD, action: 'cek' | 'cairkan') {
        setCatatan('');
        setDialog({ open: true, pd, action });
    }

    function confirm() {
        if (!dialog.pd) return;
        const url = dialog.action === 'cek'
            ? `/bendahara/permohonan-dana/${dialog.pd.id}/cek`
            : `/bendahara/permohonan-dana/${dialog.pd.id}/cairkan`;

        router.post(url, { catatan }, {
            onSuccess: () => setDialog(d => ({ ...d, open: false })),
        });
    }

    const totalVerifikasi = verifikasi.reduce((s, p) => s + Number(p.total_anggaran), 0);
    const totalPencairan  = pencairan.reduce((s, p) => s + Number(p.total_anggaran), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permohonan Dana — Bendahara" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Permohonan Dana</h1>
                    <p className="text-muted-foreground text-sm mt-1">Verifikasi dan pencairan dana — {tahun.label}</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Perlu Diverifikasi', count: verifikasi.length, total: totalVerifikasi, color: 'blue' },
                        { label: 'Perlu Dicairkan',    count: pencairan.length,  total: totalPencairan,  color: 'green' },
                        { label: 'Riwayat',            count: riwayat.length,    total: null,            color: 'slate' },
                    ].map(card => (
                        <div key={card.label} className="rounded-xl border p-4 shadow-sm">
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            <p className="text-2xl font-bold mt-1">{card.count}</p>
                            {card.total !== null && (
                                <p className="text-xs text-muted-foreground mt-0.5">{fmt(card.total)}</p>
                            )}
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="verifikasi">
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="verifikasi" className="gap-2">
                            <ClipboardCheck className="h-4 w-4" />
                            Perlu Diverifikasi {verifikasi.length > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs">{verifikasi.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="pencairan" className="gap-2">
                            <Banknote className="h-4 w-4" />
                            Perlu Dicairkan {pencairan.length > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs">{pencairan.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="riwayat" className="gap-2">
                            <History className="h-4 w-4" />Riwayat
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="verifikasi" className="mt-4">
                        <PDAccordion
                            pds={verifikasi}
                            onAction={(pd) => openDialog(pd, 'cek')}
                            actionLabel="Verifikasi"
                            actionClass="border-purple-300 text-purple-700 hover:bg-purple-50"
                            actionIcon={<ClipboardCheck className="h-3.5 w-3.5" />}
                            actionKey="vrf"
                        />
                    </TabsContent>

                    <TabsContent value="pencairan" className="mt-4">
                        <PDAccordion
                            pds={pencairan}
                            onAction={(pd) => openDialog(pd, 'cairkan')}
                            actionLabel="Cairkan Dana"
                            actionClass="border-green-300 text-green-700 hover:bg-green-50"
                            actionIcon={<Banknote className="h-3.5 w-3.5" />}
                            actionKey="cair"
                        />
                    </TabsContent>

                    <TabsContent value="riwayat" className="mt-4">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className="relative min-w-48 flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nomor atau keperluan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterTimKerja} onValueChange={setFilterTimKerja}>
                                <SelectTrigger className="w-48 overflow-hidden">
                                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                                    <SelectValue placeholder="Semua Tim Kerja" />
                                </SelectTrigger>
                                <SelectContent side="bottom" avoidCollisions={false}>
                                    <SelectItem value="all">Semua Tim Kerja</SelectItem>
                                    {timKerjaList.map((tk) => (
                                        <SelectItem key={tk.id} value={tk.id.toString()}>{tk.nama}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-48 overflow-hidden">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent side="bottom" avoidCollisions={false}>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    {Object.entries(STATUS).map(([key, cfg]) => (
                                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {riwayat.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
                                Belum ada riwayat.
                            </div>
                        ) : filteredRiwayat.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">
                                Tidak ada data yang sesuai dengan filter.
                            </div>
                        ) : (
                            <div className="rounded-xl border overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow style={{ backgroundColor: '#003580' }}>
                                            <TableHead className="text-white font-semibold w-8"></TableHead>
                                            <TableHead className="text-white font-semibold">Nomor</TableHead>
                                            <TableHead className="text-white font-semibold">Unit Kerja</TableHead>
                                            <TableHead className="text-white font-semibold">Keperluan</TableHead>
                                            <TableHead className="text-white font-semibold text-right">Total</TableHead>
                                            <TableHead className="text-white font-semibold text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRiwayat.map((pd) => {
                                            const s = STATUS[pd.status] ?? { label: pd.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
                                            const isExpanded = expanded === pd.id;
                                            return (
                                                <>
                                                    <TableRow key={pd.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : pd.id)}>
                                                        <TableCell>
                                                            <span className="text-muted-foreground">
                                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">{pd.nomor_permohonan}</TableCell>
                                                        <TableCell className="text-sm">{pd.tim_kerja.nama}</TableCell>
                                                        <TableCell className="text-sm">{pd.keperluan}</TableCell>
                                                        <TableCell className="text-right font-semibold">{fmt(pd.total_anggaran)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className={s.className}>{s.label}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                    {isExpanded && (
                                                        <TableRow key={`${pd.id}-detail`} className="bg-muted/20">
                                                            <TableCell colSpan={6} className="p-0">
                                                                <div className="px-6 py-4 space-y-3">
                                                                    {pd.keterangan && (
                                                                        <p className="text-sm text-muted-foreground italic">{pd.keterangan}</p>
                                                                    )}
                                                                    {pd.items && pd.items.length > 0 && (
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow className="bg-slate-100 hover:bg-slate-100">
                                                                                    <TableHead className="text-xs w-8">No</TableHead>
                                                                                    <TableHead className="text-xs">Uraian</TableHead>
                                                                                    <TableHead className="text-xs text-center">Volume</TableHead>
                                                                                    <TableHead className="text-xs text-center">Satuan</TableHead>
                                                                                    <TableHead className="text-xs text-right">Harga Satuan</TableHead>
                                                                                    <TableHead className="text-xs text-right">Total</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {pd.items.map((item, idx) => (
                                                                                    <TableRow key={item.id} className="hover:bg-transparent">
                                                                                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                                                                                        <TableCell className="text-xs">{item.uraian}</TableCell>
                                                                                        <TableCell className="text-xs text-center">{item.volume}</TableCell>
                                                                                        <TableCell className="text-xs text-center">{item.satuan}</TableCell>
                                                                                        <TableCell className="text-xs text-right">{fmt(item.harga_satuan)}</TableCell>
                                                                                        <TableCell className="text-xs text-right font-medium">{fmt(item.total)}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    )}
                                                                    {pd.rekomendasi_kabag && (
                                                                        <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-3 py-1.5">
                                                                            <span className="font-semibold">Catatan Kabag:</span> {pd.rekomendasi_kabag}
                                                                        </p>
                                                                    )}
                                                                    {pd.catatan_pencairan && (
                                                                        <p className="text-xs text-green-700 bg-green-50 rounded px-3 py-1.5">
                                                                            <span className="font-semibold">Catatan Pencairan:</span> {pd.catatan_pencairan}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={dialog.open} onOpenChange={(v) => setDialog(d => ({ ...d, open: v }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialog.action === 'cek'
                                ? `Verifikasi — ${dialog.pd?.nomor_permohonan}`
                                : `Cairkan Dana — ${dialog.pd?.nomor_permohonan}`}
                        </DialogTitle>
                    </DialogHeader>
                    {dialog.action === 'cairkan' && (
                        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                            Total pencairan: <strong>{fmt(dialog.pd?.total_anggaran ?? 0)}</strong>
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="catatan">Catatan <span className="text-muted-foreground">(opsional)</span></Label>
                        <Textarea
                            id="catatan"
                            placeholder={dialog.action === 'cek' ? 'Catatan hasil verifikasi...' : 'Catatan pencairan...'}
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(d => ({ ...d, open: false }))}>Batal</Button>
                        <Button
                            variant={dialog.action === 'cairkan' ? 'default' : 'default'}
                            className={dialog.action === 'cairkan' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={confirm}
                        >
                            {dialog.action === 'cek' ? 'Tandai Terverifikasi' : 'Cairkan Dana'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
