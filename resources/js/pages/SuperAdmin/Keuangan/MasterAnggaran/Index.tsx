import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2, Power, Plus, Upload, ChevronRight, Database } from 'lucide-react';
import { useState, useRef } from 'react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface DjaBase { id: number; kode: string; nama: string; pagu: number; is_aktif: boolean; }
interface Program  extends DjaBase { tahun_anggaran: string; }
interface Sasaran  extends DjaBase { program_id: number; program?: { id: number; kode: string; nama: string }; }
interface Kro      extends DjaBase { sasaran_id: number; sasaran?: { id: number; kode: string; nama: string }; }
interface Ro       extends DjaBase { kro_id: number; kro?: { id: number; kode: string; nama: string }; }
interface Komponen extends DjaBase { ro_id: number; jenis: 'Utama' | 'Pendukung'; ro?: { id: number; kode: string; nama: string }; }
interface Kegiatan extends DjaBase { komponen_id: number; komponen?: { id: number; kode: string; nama: string }; }
interface Rincian  {
    id: number; kegiatan_id: number; kode_akun: string; nama_akun: string; nama_item: string;
    satuan: string; harga_satuan: number; pagu_total: number; urutan: number; is_aktif: boolean;
    kegiatan?: { id: number; kode: string; nama: string };
}
interface Tahun { id: number; tahun: string; label: string; }

interface Props {
    tahun: Tahun;
    programs:  Program[];
    sasarans:  Sasaran[];
    kros:      Kro[];
    ros:       Ro[];
    komponens: Komponen[];
    kegiatans: Kegiatan[];
    rincians:  Rincian[];
}

const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

// ── Import Excel Dialog ───────────────────────────────────────────────────────

function ImportDialog() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const doImport = () => {
        if (!fileRef.current?.files?.[0]) return;
        setUploading(true);
        const form = new FormData();
        form.append('file', fileRef.current.files[0]);
        router.post('/super-admin/keuangan/master-anggaran/import', form, {
            onFinish: () => { setUploading(false); setOpen(false); },
        });
    };

    return (
        <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Upload className="w-4 h-4" /> Import Excel
            </Button>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Import Data DJA dari Excel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Upload file Excel (.xlsx) dengan format kolom:
                            A=Kode Program, B=Nama, C=Pagu; D=Kode Sasaran, E=Nama, F=Pagu;
                            G=Kode KRO, H=Nama, I=Pagu; J=Kode RO, K=Nama, L=Pagu;
                            M=Kode Komp, N=Nama, O=Jenis, P=Pagu; Q=Kode Keg, R=Nama, S=Pagu;
                            T=Kode Akun, U=Nama Akun, V=Nama Item, W=Satuan, X=Harga, Y=Pagu, Z=Urutan
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Input ref={fileRef} type="file" accept=".xlsx,.xls" />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={doImport} disabled={uploading}>
                            {uploading ? 'Mengimport...' : 'Import'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

function DeleteConfirm({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void; }) {
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Semua data turunan akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function AktifBadge({ aktif }: { aktif: boolean }) {
    return (
        <Badge variant={aktif ? 'default' : 'secondary'} className={cn('text-xs', aktif ? 'bg-emerald-500' : '')}>
            {aktif ? 'Aktif' : 'Nonaktif'}
        </Badge>
    );
}

// ── Program Tab ───────────────────────────────────────────────────────────────

function ProgramTab({ programs }: { programs: Program[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({ kode: '', nama: '', pagu: '' });
    const [editing, setEditing] = useState<Program | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const editForm = useForm({ kode: '', nama: '', pagu: '' });

    const store = (e: React.FormEvent) => {
        e.preventDefault();
        post('/super-admin/keuangan/master-anggaran/program', { onSuccess: () => reset() });
    };

    const startEdit = (p: Program) => {
        setEditing(p);
        editForm.setData({ kode: p.kode, nama: p.nama, pagu: String(p.pagu) });
    };

    const update = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/super-admin/keuangan/master-anggaran/program/${editing.id}`, {
            onSuccess: () => setEditing(null),
        });
    };

    return (
        <div className="space-y-4">
            {/* Form Tambah */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah Program</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={store} className="grid grid-cols-4 gap-3 items-end">
                        <div>
                            <Label className="text-xs">Kode <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" value={data.kode} onChange={e => setData('kode', e.target.value)} placeholder="023.01.DK" />
                            {errors.kode && <p className="text-[10px] text-red-500 mt-0.5">{errors.kode}</p>}
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">Nama <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" value={data.nama} onChange={e => setData('nama', e.target.value)} placeholder="Program Pendidikan Tinggi" />
                        </div>
                        <div>
                            <Label className="text-xs">Pagu (Rp) <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu} onChange={e => setData('pagu', e.target.value)} placeholder="0" />
                        </div>
                        <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabel */}
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-4 py-2">Kode</th>
                            <th className="text-left px-4 py-2">Nama</th>
                            <th className="text-right px-4 py-2">Pagu</th>
                            <th className="text-center px-4 py-2">Status</th>
                            <th className="text-center px-4 py-2 w-28">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {programs.map(p => (
                            <tr key={p.id} className={cn('border-b last:border-0', !p.is_aktif && 'opacity-50')}>
                                <td className="px-4 py-2 font-mono text-blue-700 text-xs">{p.kode}</td>
                                <td className="px-4 py-2">{p.nama}</td>
                                <td className="px-4 py-2 text-right text-xs text-gray-600">{fmt(p.pagu)}</td>
                                <td className="px-4 py-2 text-center"><AktifBadge aktif={p.is_aktif} /></td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => startEdit(p)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => router.patch(`/super-admin/keuangan/master-anggaran/program/${p.id}/toggle`)}
                                            className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeleting(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {programs.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">Belum ada data program</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Edit Program</AlertDialogTitle></AlertDialogHeader>
                    <form onSubmit={update} className="space-y-3 py-2">
                        <div><Label className="text-sm">Kode</Label>
                            <Input className="mt-1" value={editForm.data.kode} onChange={e => editForm.setData('kode', e.target.value)} />
                        </div>
                        <div><Label className="text-sm">Nama</Label>
                            <Input className="mt-1" value={editForm.data.nama} onChange={e => editForm.setData('nama', e.target.value)} />
                        </div>
                        <div><Label className="text-sm">Pagu (Rp)</Label>
                            <Input className="mt-1" type="number" value={editForm.data.pagu} onChange={e => editForm.setData('pagu', e.target.value)} />
                        </div>
                    </form>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteConfirm
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) router.delete(`/super-admin/keuangan/master-anggaran/program/${deleting}`, { onFinish: () => setDeleting(null) }); }}
            />
        </div>
    );
}

// ── Generic Level Table (Sasaran / KRO / RO / Komponen / Kegiatan) ────────────

interface LevelItem extends DjaBase {
    parent_id: number;
    parent?: { id: number; kode: string; nama: string };
    jenis?: string;
}

interface LevelConfig {
    label: string;
    parentLabel: string;
    parents: { id: number; kode: string; nama: string }[];
    parentKey: string;
    baseUrl: string;
    withJenis?: boolean;
}

function GenericLevelTab({ items, config }: { items: LevelItem[]; config: LevelConfig }) {
    const initData = { [`${config.parentKey}`]: '', kode: '', nama: '', pagu: '', jenis: 'Utama' };
    const { data, setData, post, processing, reset, errors } = useForm(initData as Record<string, string>);
    const [editing, setEditing] = useState<LevelItem | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const editForm = useForm({ kode: '', nama: '', pagu: '', jenis: 'Utama' });

    const store = (e: React.FormEvent) => {
        e.preventDefault();
        post(config.baseUrl, { onSuccess: () => reset() });
    };

    const startEdit = (item: LevelItem) => {
        setEditing(item);
        editForm.setData({ kode: item.kode, nama: item.nama, pagu: String(item.pagu), jenis: item.jenis ?? 'Utama' });
    };

    const update = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`${config.baseUrl}/${editing.id}`, { onSuccess: () => setEditing(null) });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah {config.label}</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={store} className="grid grid-cols-5 gap-3 items-end">
                        <div>
                            <Label className="text-xs">{config.parentLabel} <span className="text-red-500">*</span></Label>
                            <Select value={data[config.parentKey]} onValueChange={v => setData(config.parentKey, v)}>
                                <SelectTrigger className="mt-1 h-8 text-xs">
                                    <SelectValue placeholder={`Pilih ${config.parentLabel}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {config.parents.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            <span className="font-mono text-blue-700 mr-1 text-xs">{p.kode}</span>{p.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Kode <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" value={data.kode} onChange={e => setData('kode', e.target.value)} />
                        </div>
                        <div className={config.withJenis ? 'col-span-1' : 'col-span-2'}>
                            <Label className="text-xs">Nama <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" value={data.nama} onChange={e => setData('nama', e.target.value)} />
                        </div>
                        {config.withJenis && (
                            <div>
                                <Label className="text-xs">Jenis</Label>
                                <Select value={data.jenis} onValueChange={v => setData('jenis', v)}>
                                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Utama">Utama</SelectItem>
                                        <SelectItem value="Pendukung">Pendukung</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div>
                            <Label className="text-xs">Pagu (Rp) <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu} onChange={e => setData('pagu', e.target.value)} />
                        </div>
                        <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-3 py-2">{config.parentLabel}</th>
                            <th className="text-left px-3 py-2">Kode</th>
                            <th className="text-left px-3 py-2">Nama</th>
                            {config.withJenis && <th className="text-center px-3 py-2">Jenis</th>}
                            <th className="text-right px-3 py-2">Pagu</th>
                            <th className="text-center px-3 py-2">Status</th>
                            <th className="text-center px-3 py-2 w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className={cn('border-b last:border-0 text-xs', !item.is_aktif && 'opacity-50')}>
                                <td className="px-3 py-2 text-gray-500 font-mono">
                                    {item.parent ? `${item.parent.kode}` : item.parent_id}
                                </td>
                                <td className="px-3 py-2 font-mono text-blue-700">{item.kode}</td>
                                <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{item.nama}</td>
                                {config.withJenis && <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{item.jenis}</Badge></td>}
                                <td className="px-3 py-2 text-right text-gray-500">{fmt(item.pagu)}</td>
                                <td className="px-3 py-2 text-center"><AktifBadge aktif={item.is_aktif} /></td>
                                <td className="px-3 py-2">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => startEdit(item)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => router.patch(`${config.baseUrl}/${item.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeleting(item.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={config.withJenis ? 7 : 6} className="text-center py-6 text-gray-400 text-sm">Belum ada data {config.label.toLowerCase()}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Edit {config.label}</AlertDialogTitle></AlertDialogHeader>
                    <form onSubmit={update} className="space-y-3 py-2">
                        <div><Label className="text-sm">Kode</Label>
                            <Input className="mt-1" value={editForm.data.kode} onChange={e => editForm.setData('kode', e.target.value)} /></div>
                        <div><Label className="text-sm">Nama</Label>
                            <Input className="mt-1" value={editForm.data.nama} onChange={e => editForm.setData('nama', e.target.value)} /></div>
                        {config.withJenis && (
                            <div><Label className="text-sm">Jenis</Label>
                                <Select value={editForm.data.jenis} onValueChange={v => editForm.setData('jenis', v)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Utama">Utama</SelectItem>
                                        <SelectItem value="Pendukung">Pendukung</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div><Label className="text-sm">Pagu (Rp)</Label>
                            <Input className="mt-1" type="number" value={editForm.data.pagu} onChange={e => editForm.setData('pagu', e.target.value)} /></div>
                    </form>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteConfirm
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) router.delete(`${config.baseUrl}/${deleting}`, { onFinish: () => setDeleting(null) }); }}
            />
        </div>
    );
}

// ── Rincian Biaya Tab ────────────────────────────────────────────────────────

function RincianTab({ rincians, kegiatans }: { rincians: Rincian[]; kegiatans: Kegiatan[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        kegiatan_id: '', kode_akun: '', nama_akun: '', nama_item: '',
        satuan: 'OK', harga_satuan: '', pagu_total: '', urutan: '',
    });
    const [editing, setEditing] = useState<Rincian | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const editForm = useForm({ kode_akun: '', nama_akun: '', nama_item: '', satuan: '', harga_satuan: '', pagu_total: '', urutan: '' });

    const store = (e: React.FormEvent) => {
        e.preventDefault();
        post('/super-admin/keuangan/master-anggaran/rincian', { onSuccess: () => reset() });
    };

    const startEdit = (r: Rincian) => {
        setEditing(r);
        editForm.setData({
            kode_akun: r.kode_akun, nama_akun: r.nama_akun, nama_item: r.nama_item,
            satuan: r.satuan, harga_satuan: String(r.harga_satuan),
            pagu_total: String(r.pagu_total), urutan: String(r.urutan),
        });
    };

    const update = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/super-admin/keuangan/master-anggaran/rincian/${editing.id}`, { onSuccess: () => setEditing(null) });
    };

    const SATUAN_OPTIONS = ['OK', 'OH', 'OJ', 'OB', 'ORKAL', 'KEG', 'PAKET', 'ls', 'buah'];

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah Rincian Biaya</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={store} className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs">Kegiatan <span className="text-red-500">*</span></Label>
                                <Select value={data.kegiatan_id} onValueChange={v => setData('kegiatan_id', v)}>
                                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Pilih Kegiatan..." /></SelectTrigger>
                                    <SelectContent>
                                        {kegiatans.map(k => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                <span className="font-mono text-xs text-blue-700 mr-1">{k.komponen?.kode ?? ''}-{k.kode}</span>{k.nama.substring(0, 40)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Kode Akun <span className="text-red-500">*</span></Label>
                                <Input className="mt-1 h-8 text-sm font-mono" value={data.kode_akun} onChange={e => setData('kode_akun', e.target.value)} placeholder="521213" />
                            </div>
                            <div>
                                <Label className="text-xs">Nama Akun <span className="text-red-500">*</span></Label>
                                <Input className="mt-1 h-8 text-sm" value={data.nama_akun} onChange={e => setData('nama_akun', e.target.value)} placeholder="Belanja Honor Output Kegiatan" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Nama Item / Uraian <span className="text-red-500">*</span></Label>
                            <Input className="mt-1 h-8 text-sm" value={data.nama_item} onChange={e => setData('nama_item', e.target.value)} placeholder="Honorarium Ketua Panitia" />
                        </div>
                        <div className="grid grid-cols-4 gap-3 items-end">
                            <div>
                                <Label className="text-xs">Satuan <span className="text-red-500">*</span></Label>
                                <Select value={data.satuan} onValueChange={v => setData('satuan', v)}>
                                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>{SATUAN_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs">Harga Satuan <span className="text-red-500">*</span></Label>
                                <Input className="mt-1 h-8 text-sm" type="number" value={data.harga_satuan} onChange={e => setData('harga_satuan', e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Pagu Total <span className="text-red-500">*</span></Label>
                                <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu_total} onChange={e => setData('pagu_total', e.target.value)} />
                            </div>
                            <div>
                                <Label className="text-xs">Urutan</Label>
                                <Input className="mt-1 h-8 text-sm" type="number" value={data.urutan} onChange={e => setData('urutan', e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-3 py-2">Kegiatan</th>
                            <th className="text-left px-3 py-2">Kode Akun</th>
                            <th className="text-left px-3 py-2">Nama Item</th>
                            <th className="text-center px-2 py-2">Sat.</th>
                            <th className="text-right px-3 py-2">Harga Satuan</th>
                            <th className="text-right px-3 py-2">Pagu Total</th>
                            <th className="text-center px-2 py-2">Status</th>
                            <th className="text-center px-2 py-2 w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rincians.map(r => (
                            <tr key={r.id} className={cn('border-b last:border-0', !r.is_aktif && 'opacity-50')}>
                                <td className="px-3 py-2 text-gray-500 text-[10px]">{r.kegiatan?.kode ?? r.kegiatan_id}</td>
                                <td className="px-3 py-2 font-mono text-blue-700 font-semibold">{r.kode_akun}</td>
                                <td className="px-3 py-2 text-gray-700 max-w-xs">{r.nama_item}</td>
                                <td className="px-2 py-2 text-center text-gray-500">{r.satuan}</td>
                                <td className="px-3 py-2 text-right">{fmt(r.harga_satuan)}</td>
                                <td className="px-3 py-2 text-right">{fmt(r.pagu_total)}</td>
                                <td className="px-2 py-2 text-center"><AktifBadge aktif={r.is_aktif} /></td>
                                <td className="px-2 py-2">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => startEdit(r)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => router.patch(`/super-admin/keuangan/master-anggaran/rincian/${r.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeleting(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rincians.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-6 text-gray-400 text-sm">Belum ada data rincian biaya</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Dialog */}
            <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader><AlertDialogTitle>Edit Rincian Biaya</AlertDialogTitle></AlertDialogHeader>
                    <form onSubmit={update} className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-sm">Kode Akun</Label><Input className="mt-1 font-mono" value={editForm.data.kode_akun} onChange={e => editForm.setData('kode_akun', e.target.value)} /></div>
                            <div><Label className="text-sm">Nama Akun</Label><Input className="mt-1" value={editForm.data.nama_akun} onChange={e => editForm.setData('nama_akun', e.target.value)} /></div>
                        </div>
                        <div><Label className="text-sm">Nama Item</Label><Input className="mt-1" value={editForm.data.nama_item} onChange={e => editForm.setData('nama_item', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-sm">Satuan</Label><Input className="mt-1" value={editForm.data.satuan} onChange={e => editForm.setData('satuan', e.target.value)} /></div>
                            <div><Label className="text-sm">Urutan</Label><Input className="mt-1" type="number" value={editForm.data.urutan} onChange={e => editForm.setData('urutan', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-sm">Harga Satuan</Label><Input className="mt-1" type="number" value={editForm.data.harga_satuan} onChange={e => editForm.setData('harga_satuan', e.target.value)} /></div>
                            <div><Label className="text-sm">Pagu Total</Label><Input className="mt-1" type="number" value={editForm.data.pagu_total} onChange={e => editForm.setData('pagu_total', e.target.value)} /></div>
                        </div>
                    </form>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DeleteConfirm
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) router.delete(`/super-admin/keuangan/master-anggaran/rincian/${deleting}`, { onFinish: () => setDeleting(null) }); }}
            />
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MasterAnggaranIndex({ tahun, programs, sasarans, kros, ros, komponens, kegiatans, rincians }: Props) {
    return (
        <AppLayout>
            <Head title="Master Anggaran DJA" />
            <div className="max-w-7xl mx-auto py-8 px-4 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Master Anggaran DJA</h1>
                            <p className="text-sm text-muted-foreground">Tahun Anggaran {tahun.tahun} — Kelola hierarki program dan rincian biaya</p>
                        </div>
                    </div>
                    <ImportDialog />
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-7 gap-3">
                    {[
                        ['Program', programs.length],
                        ['Sasaran', sasarans.length],
                        ['KRO', kros.length],
                        ['RO', ros.length],
                        ['Komponen', komponens.length],
                        ['Kegiatan', kegiatans.length],
                        ['Rincian', rincians.length],
                    ].map(([label, count]) => (
                        <div key={label} className="bg-white border rounded-lg px-3 py-2 text-center">
                            <p className="text-2xl font-bold tabular-nums">{count}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="program">
                    <TabsList className="flex-wrap h-auto gap-1">
                        <TabsTrigger value="program">Program</TabsTrigger>
                        <TabsTrigger value="sasaran">Sasaran</TabsTrigger>
                        <TabsTrigger value="kro">KRO</TabsTrigger>
                        <TabsTrigger value="ro">RO</TabsTrigger>
                        <TabsTrigger value="komponen">Komponen</TabsTrigger>
                        <TabsTrigger value="kegiatan">Kegiatan</TabsTrigger>
                        <TabsTrigger value="rincian">Rincian Biaya</TabsTrigger>
                    </TabsList>

                    <TabsContent value="program" className="mt-4"><ProgramTab programs={programs} /></TabsContent>

                    <TabsContent value="sasaran" className="mt-4">
                        <GenericLevelTab
                            items={sasarans.map(s => ({ ...s, parent_id: s.program_id, parent: s.program }))}
                            config={{ label: 'Sasaran', parentLabel: 'Program', parentKey: 'program_id',
                                parents: programs.map(p => ({ id: p.id, kode: p.kode, nama: p.nama })),
                                baseUrl: '/super-admin/keuangan/master-anggaran/sasaran' }}
                        />
                    </TabsContent>

                    <TabsContent value="kro" className="mt-4">
                        <GenericLevelTab
                            items={kros.map(k => ({ ...k, parent_id: k.sasaran_id, parent: k.sasaran }))}
                            config={{ label: 'KRO', parentLabel: 'Sasaran', parentKey: 'sasaran_id',
                                parents: sasarans.map(s => ({ id: s.id, kode: s.kode, nama: s.nama })),
                                baseUrl: '/super-admin/keuangan/master-anggaran/kro' }}
                        />
                    </TabsContent>

                    <TabsContent value="ro" className="mt-4">
                        <GenericLevelTab
                            items={ros.map(r => ({ ...r, parent_id: r.kro_id, parent: r.kro }))}
                            config={{ label: 'RO', parentLabel: 'KRO', parentKey: 'kro_id',
                                parents: kros.map(k => ({ id: k.id, kode: k.kode, nama: k.nama })),
                                baseUrl: '/super-admin/keuangan/master-anggaran/ro' }}
                        />
                    </TabsContent>

                    <TabsContent value="komponen" className="mt-4">
                        <GenericLevelTab
                            items={komponens.map(k => ({ ...k, parent_id: k.ro_id, parent: k.ro }))}
                            config={{ label: 'Komponen', parentLabel: 'RO', parentKey: 'ro_id',
                                parents: ros.map(r => ({ id: r.id, kode: r.kode, nama: r.nama })),
                                baseUrl: '/super-admin/keuangan/master-anggaran/komponen', withJenis: true }}
                        />
                    </TabsContent>

                    <TabsContent value="kegiatan" className="mt-4">
                        <GenericLevelTab
                            items={kegiatans.map(k => ({ ...k, parent_id: k.komponen_id, parent: k.komponen }))}
                            config={{ label: 'Kegiatan', parentLabel: 'Komponen', parentKey: 'komponen_id',
                                parents: komponens.map(k => ({ id: k.id, kode: k.kode, nama: k.nama })),
                                baseUrl: '/super-admin/keuangan/master-anggaran/kegiatan' }}
                        />
                    </TabsContent>

                    <TabsContent value="rincian" className="mt-4">
                        <RincianTab rincians={rincians} kegiatans={kegiatans} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
