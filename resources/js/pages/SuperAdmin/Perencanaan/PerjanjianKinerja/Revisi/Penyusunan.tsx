import { Head, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Settings2, ChevronDown, LockOpen, Clock, CheckCircle2, XCircle, FileEdit, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/super-admin/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Revisi — Penyusunan', href: '/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan' },
];

type TimKerja      = { id: number; nama: string; kode: string; nama_singkat?: string };
type Indikator     = { id: number; kode: string; nama: string; satuan: string; target: string | null; sasaran_id: number; pic_tim_kerjas: TimKerja[] };
type Sasaran       = { kode: string; nama: string; indikators: Indikator[] };
type MasterSasaran = { id: number; kode: string; nama: string };
type Tahun         = { id: number; tahun: number; label: string };
type PkStatus      = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'rejected'; rekomendasi_kabag: string | null; tim_kerja: TimKerja | null };
type Props         = { tahun: Tahun; jenis: string; sasarans: Sasaran[]; masterSasarans: MasterSasaran[]; timKerjas: TimKerja[]; pks: PkStatus[] };

const sasaranColors: Record<string, { bg: string; badge: string; accent: string }> = {
    'S 1': { bg: 'bg-blue-50 dark:bg-blue-950/40',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { bg: 'bg-violet-50 dark:bg-violet-950/40',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { bg: 'bg-amber-50 dark:bg-amber-950/40',     badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

const STATUS_CONFIG = {
    draft:          { label: 'Draft',           icon: FileEdit,      className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' },
    submitted:      { label: 'Menunggu Kabag',  icon: Clock,         className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-400' },
    kabag_approved: { label: 'Disetujui',       icon: CheckCircle2,  className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400' },
    rejected:       { label: 'Ditolak',         icon: XCircle,       className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400' },
} as const;

// ─── PK Status Panel ──────────────────────────────────────────────────────────

function PkStatusPanel({ pks }: { pks: PkStatus[] }) {
    const [reopenTarget, setReopenTarget] = useState<PkStatus | null>(null);

    if (pks.length === 0) return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada Perjanjian Kinerja yang disubmit atau disetujui.
        </div>
    );

    function doReopen() {
        if (!reopenTarget) return;
        router.patch(`/super-admin/perencanaan/perjanjian-kinerja/${reopenTarget.id}/reopen`, {}, {
            onSuccess: () => setReopenTarget(null),
            preserveScroll: true,
        });
    }

    const canReopen = (pk: PkStatus) => pk.status === 'submitted' || pk.status === 'kabag_approved';

    return (
        <>
            <div className="rounded-xl border shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-muted/40 border-b flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold">Status Pengajuan PK per Tim Kerja</h2>
                    <span className="ml-auto text-xs text-muted-foreground">Super Admin dapat membuka kembali dokumen yang terkunci</span>
                </div>
                <div className="divide-y">
                    {pks.map(pk => {
                        const cfg = STATUS_CONFIG[pk.status];
                        const Icon = cfg.icon;
                        const reopenable = canReopen(pk);
                        return (
                            <div key={pk.id} className={`flex items-center gap-3 px-4 py-3 ${pk.status === 'kabag_approved' ? 'bg-green-50/40 dark:bg-green-950/10' : pk.status === 'submitted' ? 'bg-yellow-50/40 dark:bg-yellow-950/10' : ''}`}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold truncate">
                                            {pk.tim_kerja?.nama ?? '—'}
                                        </span>
                                        {pk.tim_kerja?.kode && (
                                            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded px-1.5 py-0.5 font-mono">
                                                {pk.tim_kerja.kode}
                                            </span>
                                        )}
                                    </div>
                                    {pk.rekomendasi_kabag && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            Catatan: {pk.rekomendasi_kabag}
                                        </p>
                                    )}
                                </div>
                                <Badge variant="outline" className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 ${cfg.className}`}>
                                    <Icon className="h-3 w-3" />
                                    {cfg.label}
                                </Badge>
                                {reopenable && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 h-7 gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                        onClick={() => setReopenTarget(pk)}
                                    >
                                        <LockOpen className="h-3 w-3" />
                                        Buka Kembali
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Confirm Reopen Dialog */}
            <AlertDialog open={reopenTarget !== null} onOpenChange={v => !v && setReopenTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Buka kembali PK ini?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Dokumen PK milik <span className="font-semibold">{reopenTarget?.tim_kerja?.nama ?? '—'}</span> akan kembali ke status <span className="font-semibold">Draft</span> dan dapat diedit ulang oleh tim terkait.
                                </p>
                                {reopenTarget?.status === 'kabag_approved' && (
                                    <div className="rounded-md bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                                        ⚠️ Dokumen ini sudah <strong>disetujui</strong> oleh Kabag Umum. Membuka kembali akan membatalkan persetujuan tersebut.
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-600 text-white hover:bg-amber-700"
                            onClick={doReopen}
                        >
                            Ya, Buka Kembali
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ─── Kelola Master Sasaran Dialog ─────────────────────────────────────────────

function MasterSasaranDialog({ open, onClose, masterSasarans }: {
    open: boolean; onClose: () => void; masterSasarans: MasterSasaran[];
}) {
    const [kode, setKode] = useState('');
    const [nama, setNama] = useState('');
    const [delId, setDelId] = useState<number | null>(null);

    function handleAdd(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!kode || !nama) return;
        router.post('/super-admin/perencanaan/master-sasaran', { kode, nama }, {
            onSuccess: () => { setKode(''); setNama(''); },
            preserveScroll: true,
        });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Kelola Master Sasaran</DialogTitle></DialogHeader>
                <div className="flex flex-col gap-4">
                    {/* List existing */}
                    <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
                        {masterSasarans.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada sasaran.</p>
                        ) : masterSasarans.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-3 py-2 gap-2">
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground mr-1.5">{s.kode}</span>
                                    <span className="text-sm">{s.nama}</span>
                                </div>
                                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                    onClick={() => setDelId(s.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Add new */}
                    <form onSubmit={handleAdd} className="flex flex-col gap-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tambah Sasaran Baru</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="grid gap-1">
                                <Label className="text-xs">Kode</Label>
                                <Input className="h-8 text-xs" placeholder="S 5" value={kode}
                                    onChange={e => setKode(e.target.value)} />
                            </div>
                            <div className="col-span-2 grid gap-1">
                                <Label className="text-xs">Nama Sasaran</Label>
                                <Input className="h-8 text-xs" placeholder="Uraian sasaran..." value={nama}
                                    onChange={e => setNama(e.target.value)} />
                            </div>
                        </div>
                        <Button type="submit" size="sm" className="self-end gap-1" disabled={!kode || !nama}>
                            <Plus className="h-3.5 w-3.5" /> Tambah
                        </Button>
                    </form>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>

            {/* Confirm delete */}
            <AlertDialog open={delId !== null} onOpenChange={(v) => !v && setDelId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus master sasaran ini?</AlertDialogTitle>
                        <AlertDialogDescription>IKU yang sudah ada tidak terpengaruh, tapi sasaran ini tidak akan muncul lagi di dropdown.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => router.delete(`/super-admin/perencanaan/master-sasaran/${delId}`, {
                                onSuccess: () => setDelId(null),
                                preserveScroll: true,
                            })}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}

// ─── IKU Dialog ───────────────────────────────────────────────────────────────

type IkuForm = { master_sasaran_id: string; kode: string; nama: string; satuan: string; target: string; target_tw1: string; target_tw2: string; target_tw3: string; target_tw4: string; pic_tim_kerja_ids: number[] };
const EMPTY: IkuForm = { master_sasaran_id: '', kode: '', nama: '', satuan: '', target: '', target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '', pic_tim_kerja_ids: [] };

/** Menghasilkan teks placeholder yang sesuai dengan satuan IKU */
function targetPlaceholder(satuan: string): string {
    const s = satuan.trim().toLowerCase();
    if (s === '%' || s === 'persen') return 'Contoh: 89,75';
    return 'Masukkan nilai target';
}

function IkuDialog({ open, onClose, jenis, timKerjas, masterSasarans, indikator }: {
    open: boolean; onClose: () => void; jenis: string;
    timKerjas: TimKerja[]; masterSasarans: MasterSasaran[]; indikator?: Indikator;
}) {
    const isEdit = !!indikator;
    const [form, setForm] = useState<IkuForm>(() => indikator ? {
        master_sasaran_id: '',
        kode: indikator.kode, nama: indikator.nama, satuan: indikator.satuan,
        target: indikator.target ?? '',
        target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '',
        pic_tim_kerja_ids: indikator.pic_tim_kerjas.map(t => t.id),
    } : EMPTY);

    React.useEffect(() => {
        if (open) {
            setForm(indikator ? {
                master_sasaran_id: '',
                kode: indikator.kode, nama: indikator.nama, satuan: indikator.satuan,
                target: indikator.target ?? '',
                target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '',
                pic_tim_kerja_ids: indikator.pic_tim_kerjas.map(t => t.id),
            } : EMPTY);
        }
    }, [open]);

    function togglePic(id: number) {
        setForm(f => ({
            ...f,
            pic_tim_kerja_ids: f.pic_tim_kerja_ids.includes(id)
                ? f.pic_tim_kerja_ids.filter(x => x !== id)
                : [...f.pic_tim_kerja_ids, id],
        }));
    }

    function submit(e: React.SyntheticEvent) {
        e.preventDefault();
        // Normalisasi: ganti koma dengan titik agar backend bisa parseFloat
        const norm = (v: string) => v.replace(',', '.');
        const payload = {
            kode: form.kode, nama: form.nama, satuan: form.satuan, target: norm(form.target),
            target_tw1: form.target_tw1 ? norm(form.target_tw1) : null,
            target_tw2: form.target_tw2 ? norm(form.target_tw2) : null,
            target_tw3: form.target_tw3 ? norm(form.target_tw3) : null,
            target_tw4: form.target_tw4 ? norm(form.target_tw4) : null,
            pic_tim_kerja_ids: form.pic_tim_kerja_ids,
        };
        if (isEdit) {
            router.put(`/super-admin/perencanaan/indikator/${indikator!.id}`, payload, { onSuccess: onClose });
        } else {
            router.post('/super-admin/perencanaan/indikator', {
                ...payload,
                master_sasaran_id: parseInt(form.master_sasaran_id),
                jenis,
            }, { onSuccess: onClose });
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{isEdit ? 'Edit Indikator' : 'Tambah Indikator Kinerja'}</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
                    {!isEdit && (
                        <div className="grid gap-1.5">
                            <Label>Sasaran <span className="text-destructive">*</span></Label>
                            <Select value={form.master_sasaran_id} onValueChange={v => setForm(f => ({ ...f, master_sasaran_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih Sasaran..." /></SelectTrigger>
                                <SelectContent>
                                    {masterSasarans.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.kode} — {s.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="grid gap-1.5">
                        <Label>Kode IKU <span className="text-destructive">*</span></Label>
                        <Input placeholder="IKU 1.1" value={form.kode} onChange={e => setForm(f => ({ ...f, kode: e.target.value }))} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Nama Indikator <span className="text-destructive">*</span></Label>
                        <Input placeholder="Uraian indikator..." value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label>Satuan <span className="text-destructive">*</span></Label>
                            <Input placeholder="%, Nilai..." value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Target Tahunan</Label>
                            <Input
                                placeholder={targetPlaceholder(form.satuan)}
                                value={form.target}
                                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Target per Triwulan</p>
                        <div className="grid grid-cols-4 gap-2">
                            {(['tw1','tw2','tw3','tw4'] as const).map(tw => (
                                <div key={tw} className="grid gap-1">
                                    <Label className="text-xs">TW {tw.slice(-1)}</Label>
                                    <Input className="h-8 text-xs"
                                        placeholder={targetPlaceholder(form.satuan)}
                                        value={form[`target_${tw}`]}
                                        onChange={e => setForm(f => ({ ...f, [`target_${tw}`]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>PIC Tim Kerja <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(bisa lebih dari satu)</span></Label>
                        <div className="rounded-md border p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {timKerjas.map(t => (
                                <label key={t.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                    <Checkbox checked={form.pic_tim_kerja_ids.includes(t.id)} onCheckedChange={() => togglePic(t.id)} />
                                    <span>{t.nama}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={
                            !form.kode || !form.nama || !form.satuan || !form.target ||
                            (!isEdit && !form.master_sasaran_id) ||
                            form.pic_tim_kerja_ids.length === 0
                        }>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Penyusunan({ tahun, jenis, sasarans, masterSasarans, timKerjas, pks }: Props) {
    const [ikuDlg,      setIkuDlg]      = useState<{ open: boolean; indikator?: Indikator }>({ open: false });
    const [masterDlg,   setMasterDlg]   = useState(false);
    const [deleteDlg,   setDeleteDlg]   = useState<{ open: boolean; id: number | null; label: string }>({ open: false, id: null, label: '' });

    const totalIku  = sasarans.reduce((s, sar) => s + sar.indikators.length, 0);
    const filledPic = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.pic_tim_kerjas.length > 0).length, 0);
    const filledTgt = sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target).length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan Revisi — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Perjanjian Kinerja Revisi</h1>
                        <p className="text-muted-foreground">{tahun.label} — Penyusunan &amp; Monitoring</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="gap-1.5">
                                <Plus className="h-4 w-4" /> Tambah <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIkuDlg({ open: true })}>
                                <Plus className="h-4 w-4 mr-2" /> Tambah IKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setMasterDlg(true)}>
                                <Settings2 className="h-4 w-4 mr-2" /> Kelola Sasaran
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Total IKU </span>
                        <span className="font-bold">{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">PIC ditetapkan </span>
                        <span className={`font-bold ${filledPic === totalIku ? 'text-green-600' : 'text-amber-600'}`}>{filledPic}/{totalIku}</span>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-2 text-sm">
                        <span className="text-muted-foreground">Target diisi </span>
                        <span className={`font-bold ${filledTgt === totalIku ? 'text-green-600' : 'text-amber-600'}`}>{filledTgt}/{totalIku}</span>
                    </div>
                </div>

                {/* Tabs: Penyusunan | Status PK */}
                <Tabs defaultValue="penyusunan">
                    <TabsList>
                        <TabsTrigger value="penyusunan">Penyusunan</TabsTrigger>
                        <TabsTrigger value="status" className="gap-1.5">
                            Status PK
                            {pks.filter(pk => pk.status !== 'draft').length > 0 && (
                                <Badge className="h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-white">
                                    {pks.filter(pk => pk.status !== 'draft').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="penyusunan" className="mt-4">
                        <div className="rounded-xl border shadow-sm overflow-hidden">
                            <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                        <TableHead className="border-r border-white/20 text-white font-semibold text-center w-8">#</TableHead>
                                        <TableHead className="border-r border-white/20 text-white font-semibold w-52">Sasaran</TableHead>
                                        <TableHead className="border-r border-white/20 text-white font-semibold">Indikator Kinerja Utama</TableHead>
                                        <TableHead className="border-r border-white/20 text-white font-semibold text-center w-20">Satuan</TableHead>
                                        <TableHead className="border-r border-white/20 text-white font-semibold text-center w-24">Target</TableHead>
                                        <TableHead className="border-r border-white/20 text-white font-semibold text-center w-44">PIC Tim Kerja</TableHead>
                                        <TableHead className="text-white font-semibold text-center w-20">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sasarans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                                Belum ada data. Jalankan seeder atau tambah IKU manual.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (() => {
                                            let rowNum = 0;
                                            return sasarans.flatMap((sasaran) => {
                                                const color = getColor(sasaran.kode);
                                                const count = sasaran.indikators.length;
                                                if (count === 0) return [];
                                                return sasaran.indikators.map((iku, idx) => {
                                                    rowNum++;
                                                    return (
                                                        <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                                            <TableCell className="text-center text-xs text-muted-foreground align-middle">{rowNum}</TableCell>
                                                            {idx === 0 && (
                                                                <TableCell rowSpan={count} className={`align-top text-sm ${color.bg} ${color.accent}`}>
                                                                    <span className={`inline-block mb-1 rounded px-1.5 py-0.5 text-xs font-bold ${color.badge}`}>{sasaran.kode}</span>
                                                                    <p className="text-xs leading-snug text-foreground">{sasaran.nama}</p>
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="align-top">
                                                                <span className="block text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                                <span className="text-sm leading-snug">{iku.nama}</span>
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm text-muted-foreground align-middle">{iku.satuan}</TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                {iku.target
                                                                    ? <span className="text-sm font-semibold">{iku.target}</span>
                                                                    : <span className="text-xs text-amber-500 italic">Belum diisi</span>}
                                                            </TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                {iku.pic_tim_kerjas.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                                        {iku.pic_tim_kerjas.map(t => (
                                                                            <Badge key={t.id} variant="secondary" className="text-xs">{t.nama}</Badge>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-red-400 italic">Belum ada PIC</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center align-middle">
                                                                <div className="flex justify-center gap-1">
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7"
                                                                        onClick={() => setIkuDlg({ open: true, indikator: iku })}>
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                                                        onClick={() => setDeleteDlg({ open: true, id: iku.id, label: iku.kode })}>
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                });
                                            });
                                        })()
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="status" className="mt-4">
                        <PkStatusPanel pks={pks} />
                    </TabsContent>
                </Tabs>
            </div>

            <MasterSasaranDialog open={masterDlg} onClose={() => setMasterDlg(false)} masterSasarans={masterSasarans} />

            <IkuDialog
                open={ikuDlg.open}
                onClose={() => setIkuDlg({ open: false })}
                jenis={jenis}
                indikator={ikuDlg.indikator}
                timKerjas={timKerjas}
                masterSasarans={masterSasarans}
            />

            <AlertDialog open={deleteDlg.open} onOpenChange={(v) => setDeleteDlg(d => ({ ...d, open: v }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus IKU {deleteDlg.label}?</AlertDialogTitle>
                        <AlertDialogDescription>Data yang dihapus tidak dapat dikembalikan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => router.delete(`/super-admin/perencanaan/indikator/${deleteDlg.id}`, {
                                onSuccess: () => setDeleteDlg(d => ({ ...d, open: false }))
                            })}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
