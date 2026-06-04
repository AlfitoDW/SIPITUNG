import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2, Power, Plus, Upload, UserCog, Search, Download, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { DataTableControls } from '@/components/data-table-controls';
import { DataTablePagination } from '@/components/data-table-pagination';
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
import { usePaginatedTable } from '@/hooks/use-paginated-table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface Pegawai {
    id: number;
    nama: string;
    nip: string | null;
    nik: string | null;
    npwp: string | null;
    gol_ruang: string | null;
    status_kepegawaian: 'PNS' | 'Non-PNS';
    nama_rekening: string | null;
    no_rekening: string | null;
    nama_bank: string | null;
    email: string | null;
    pph21_persen: string;
    is_aktif: boolean;
}

interface Props {
    pegawai: Pegawai[];
}

const BANK_OPTIONS = ['BNI', 'BRI', 'Mandiri', 'BTN', 'BSI', 'BCA', 'Lainnya'];

const INIT = {
    nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
    status_kepegawaian: 'PNS' as 'PNS' | 'Non-PNS',
    nama_rekening: '', no_rekening: '', nama_bank: '', email: '',
};

// ── Form Fields ───────────────────────────────────────────────────────────────

function PegawaiForm({
    data, setData, errors, processing, onSubmit, onCancel, submitLabel,
}: {
    data: typeof INIT;
    setData: (key: keyof typeof INIT, value: string) => void;
    errors: Partial<Record<keyof typeof INIT, string>>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel?: () => void;
    submitLabel?: string;
}) {
    const GOL_OPTIONS = ['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'];

    // Bank select + custom state
    const isCustomBank = !BANK_OPTIONS.includes(data.nama_bank) && data.nama_bank !== '';
    const [bankSelect, setBankSelect] = useState(isCustomBank ? 'Lainnya' : data.nama_bank || '');
    const [bankCustom, setBankCustom] = useState(isCustomBank ? data.nama_bank : '');
    const [bankError, setBankError] = useState('');

    // Sync when external data changes (edit mode)
    useEffect(() => {
        const isCustom = data.nama_bank !== '' && !BANK_OPTIONS.includes(data.nama_bank);
        setBankSelect(isCustom ? 'Lainnya' : (data.nama_bank || ''));
        setBankCustom(isCustom ? data.nama_bank : '');
        setBankError('');
    }, [data.nama_bank]);

    const handleBankSelect = (v: string) => {
        setBankSelect(v);
        setBankError('');
        if (v !== 'Lainnya') {
            setData('nama_bank', v);
            setBankCustom('');
        } else {
            setData('nama_bank', bankCustom);
        }
    };

    const handleBankCustom = (v: string) => {
        setBankCustom(v);
        setBankError('');
        if (bankSelect === 'Lainnya') {
            setData('nama_bank', v);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (bankSelect === 'Lainnya' && !bankCustom.trim()) {
            setBankError('Nama bank wajib diisi');
            return;
        }
        onSubmit(e);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm">Nama Lengkap <span className="text-red-500">*</span></Label>
                    <Input className="mt-1" value={data.nama} onChange={e => setData('nama', e.target.value)} placeholder="Nama pegawai" />
                    {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
                </div>
                <div>
                    <Label className="text-sm">NIP</Label>
                    <Input className="mt-1" value={data.nip} onChange={e => setData('nip', e.target.value)} placeholder="Kosongkan jika tidak ada" />
                    {errors.nip && <p className="text-xs text-red-500 mt-1">{errors.nip}</p>}
                </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label className="text-sm">NIK (KTP)</Label>
                    <Input className="mt-1" value={data.nik} onChange={e => setData('nik', e.target.value)} placeholder="Kosongkan jika tidak ada" />
                </div>
                <div>
                    <Label className="text-sm">NPWP</Label>
                    <Input className="mt-1" value={data.npwp} onChange={e => setData('npwp', e.target.value)} placeholder="Kosongkan jika tidak ada" />
                </div>
                <div>
                    <Label className="text-sm">Email</Label>
                    <Input type="email" className="mt-1" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="email@contoh.com" />
                </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm">Status Kepegawaian <span className="text-red-500">*</span></Label>
                    <Select value={data.status_kepegawaian} onValueChange={v => setData('status_kepegawaian', v as any)}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PNS">PNS</SelectItem>
                            <SelectItem value="Non-PNS">Non-PNS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-sm">Golongan/Ruang</Label>
                    <Select value={data.gol_ruang} onValueChange={v => setData('gol_ruang', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih golongan..." /></SelectTrigger>
                        <SelectContent>
                            {GOL_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-gray-400 mt-0.5">PPh21 dihitung otomatis berdasarkan golongan & status</p>
                </div>
            </div>

            {/* Row 4 — Rekening */}
            <div className="rounded-lg bg-gray-50 border p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Informasi Rekening Bank</p>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <Label className="text-xs">Nama Bank</Label>
                        <Select value={bankSelect} onValueChange={handleBankSelect}>
                            <SelectTrigger className={cn("mt-1 h-8 text-sm", bankError && "border-red-400")}>
                                <SelectValue placeholder="Pilih bank..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BANK_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {bankError && <p className="text-[10px] text-red-500 mt-0.5">{bankError}</p>}
                        {bankSelect === 'Lainnya' && (
                            <Input
                                className="mt-1.5 h-8 text-sm"
                                placeholder="Masukkan nama bank..."
                                value={bankCustom}
                                onChange={e => handleBankCustom(e.target.value)}
                            />
                        )}
                    </div>
                    <div>
                        <Label className="text-xs">No. Rekening</Label>
                        <Input className="mt-1 h-8 text-sm font-mono" value={data.no_rekening} onChange={e => setData('no_rekening', e.target.value)} />
                    </div>
                    <div>
                        <Label className="text-xs">Nama Rekening</Label>
                        <Input className="mt-1 h-8 text-sm" value={data.nama_rekening} onChange={e => setData('nama_rekening', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
                {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>}
                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" /> {submitLabel ?? 'Simpan'}
                </Button>
            </div>
        </form>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RefNamaIndex({ pegawai }: Props) {
    const [editing, setEditing] = useState<Pegawai | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    const addForm = useForm(INIT);
    const editForm = useForm(INIT);

    const [jenisFilter, setJenisFilter] = useState<'all' | 'PNS' | 'Non-PNS'>('all');

    const filteredPegawai = useMemo(() => {
        if (jenisFilter === 'all') return pegawai;
        return pegawai.filter(p => p.status_kepegawaian === jenisFilter);
    }, [pegawai, jenisFilter]);

    const table = usePaginatedTable(filteredPegawai, ['nama', 'nip', 'nik', 'npwp', 'email', 'nama_bank'], { pageSize: 10 });

    const store = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/super-admin/ref-nama', { onSuccess: () => { addForm.reset(); setShowForm(false); } });
    };

    const startEdit = (p: Pegawai) => {
        setEditing(p);
        editForm.setData({
            nama: p.nama, nip: p.nip ?? '', nik: p.nik ?? '', npwp: p.npwp ?? '',
            gol_ruang: p.gol_ruang ?? '', status_kepegawaian: p.status_kepegawaian,
            nama_rekening: p.nama_rekening ?? '', no_rekening: p.no_rekening ?? '',
            nama_bank: p.nama_bank ?? '', email: p.email ?? '',
        });
    };

    const update = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/super-admin/ref-nama/${editing.id}`, { onSuccess: () => setEditing(null) });
    };

    const [importError, setImportError] = useState<string>('');

    const doImport = () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        // Validasi ekstensi
        const allowed = ['.xlsx', '.xls'];
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
            setImportError('File harus berekstensi .xlsx atau .xls');
            return;
        }
        // Validasi size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setImportError('Ukuran file maksimal 5 MB');
            return;
        }

        setImportError('');
        setImporting(true);
        const form = new FormData();
        form.append('file', file);
        router.post('/super-admin/ref-nama/import', form, {
            onFinish: () => { setImporting(false); if (fileRef.current) fileRef.current.value = ''; },
            onError: (errors) => {
                setImportError(errors.file || 'Gagal mengimport file. Pastikan format sesuai template.');
            },
        });
    };

    const statusColor = (s: string) => s === 'PNS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';

    return (
        <AppLayout>
            <Head title="Referensi Nama Pegawai" />
            <div className="max-w-7xl mx-auto py-8 px-4 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-50 border border-violet-100">
                            <UserCog className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Referensi Nama Pegawai</h1>
                            <p className="text-sm text-gray-500">Master data pegawai untuk daftar nominatif pembayaran</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                                <Input ref={fileRef} type="file" accept=".xlsx,.xls" className="h-8 text-xs w-44" onChange={() => setImportError('')} />
                                <Button variant="outline" size="sm" className="gap-1" onClick={doImport} disabled={importing}>
                                    <Upload className="w-3.5 h-3.5" /> {importing ? 'Proses...' : 'Import Excel'}
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700" onClick={() => window.location.href = '/super-admin/ref-nama/template'}>
                                    <Download className="w-3.5 h-3.5" /> Template
                                </Button>
                            </div>
                            {importError && (
                                <div className="flex items-center gap-1 text-[11px] text-red-500">
                                    <AlertCircle className="w-3 h-3" /> {importError}
                                </div>
                            )}
                        </div>
                        <Button size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700" onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4" /> Tambah Pegawai
                        </Button>
                    </div>
                </div>

                {/* Stat */}
                <div className="grid grid-cols-4 gap-3 max-w-sm">
                    {[
                        ['Total', pegawai.length],
                        ['Aktif', pegawai.filter(p => p.is_aktif).length],
                        ['PNS', pegawai.filter(p => p.status_kepegawaian === 'PNS').length],
                        ['Non-PNS', pegawai.filter(p => p.status_kepegawaian === 'Non-PNS').length],
                    ].map(([l, v]) => (
                        <div key={l} className="bg-white border rounded-lg px-3 py-2 text-center">
                            <p className="text-lg font-bold text-gray-800">{v}</p>
                            <p className="text-xs text-gray-500">{l}</p>
                        </div>
                    ))}
                </div>

                {/* Add Form */}
                {showForm && (
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Tambah Pegawai Baru</CardTitle></CardHeader>
                        <CardContent>
                            <PegawaiForm
                                data={addForm.data}
                                setData={addForm.setData as any}
                                errors={addForm.errors}
                                processing={addForm.processing}
                                onSubmit={store}
                                onCancel={() => setShowForm(false)}
                                submitLabel="Tambah Pegawai"
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Filter Jenis Kepegawaian */}
                <div className="flex items-center gap-3">
                    <Select value={jenisFilter} onValueChange={v => setJenisFilter(v as any)}>
                        <SelectTrigger className="h-8 text-xs w-[140px]">
                            <SelectValue placeholder="Jenis Kepegawaian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Jenis</SelectItem>
                            <SelectItem value="PNS">PNS</SelectItem>
                            <SelectItem value="Non-PNS">Non-PNS</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Controls + Pagination */}
                <DataTableControls {...table} />

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-3 py-2 text-gray-500">Nama</th>
                                <th className="text-left px-3 py-2 text-gray-500">NIP / NIK</th>
                                <th className="text-left px-3 py-2 text-gray-500">NPWP</th>
                                <th className="text-center px-2 py-2 text-gray-500">Gol.</th>
                                <th className="text-center px-2 py-2 text-gray-500">Status</th>
                                <th className="text-center px-2 py-2 text-gray-500">PPh21</th>
                                <th className="text-left px-3 py-2 text-gray-500">Rekening</th>
                                <th className="text-left px-3 py-2 text-gray-500">Bank</th>
                                <th className="text-center px-2 py-2 text-gray-500">Aktif</th>
                                <th className="text-center px-2 py-2 text-gray-500 w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.paginated.map(p => (
                                <tr key={p.id} className={cn('border-b last:border-0', !p.is_aktif && 'opacity-50')}>
                                    <td className="px-3 py-2 font-medium text-gray-800">{p.nama}</td>
                                    <td className="px-3 py-2 font-mono text-gray-600">
                                        <div>{p.nip ?? '-'}</div>
                                        {p.nik && <div className="text-[10px] text-gray-400">{p.nik}</div>}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500">{p.npwp ?? '-'}</td>
                                    <td className="px-2 py-2 text-center">{p.gol_ruang ?? '-'}</td>
                                    <td className="px-2 py-2 text-center">
                                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', statusColor(p.status_kepegawaian))}>
                                            {p.status_kepegawaian}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-center text-gray-600">{p.pph21_persen}%</td>
                                    <td className="px-3 py-2 font-mono text-gray-600">
                                        <div>{p.no_rekening ?? '-'}</div>
                                        {p.nama_rekening && <div className="text-[10px] text-gray-400">{p.nama_rekening}</div>}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{p.nama_bank ?? '-'}</td>
                                    <td className="px-2 py-2 text-center">
                                        <Badge variant={p.is_aktif ? 'default' : 'secondary'}
                                            className={cn('text-[10px]', p.is_aktif && 'bg-emerald-500')}>
                                            {p.is_aktif ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={() => startEdit(p)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => router.patch(`/super-admin/ref-nama/${p.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => setDeleting(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {table.paginated.length === 0 && (
                                <tr><td colSpan={10} className="text-center py-8 text-gray-400">
                                    {table.search ? 'Tidak ada hasil pencarian' : 'Belum ada data pegawai. Tambah atau import dari Excel.'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <DataTablePagination page={table.page} totalPages={table.totalPages} goPage={table.goPage} />
            </div>

            {/* Edit Dialog */}
            <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader><AlertDialogTitle>Edit Data Pegawai</AlertDialogTitle></AlertDialogHeader>
                    <PegawaiForm
                        data={editForm.data}
                        setData={editForm.setData as any}
                        errors={editForm.errors}
                        processing={editForm.processing}
                        onSubmit={update}
                        onCancel={() => setEditing(null)}
                        submitLabel="Simpan Perubahan"
                    />
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirm */}
            <AlertDialog open={deleting !== null} onOpenChange={() => setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data Pegawai?</AlertDialogTitle>
                        <AlertDialogDescription>Data pegawai ini akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                            onClick={() => { if (deleting) router.delete(`/super-admin/ref-nama/${deleting}`, { onFinish: () => setDeleting(null) }); }}>
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
