import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save } from 'lucide-react';

type ItemRow = {
    uraian: string;
    volume: string;
    satuan: string;
    harga_satuan: string;
    keterangan: string;
};

type FormData = {
    keperluan: string;
    tanggal_kegiatan: string;
    keterangan: string;
    items: ItemRow[];
};

type PDItem = { id: number; uraian: string; volume: string; satuan: string; harga_satuan: string; keterangan: string | null };
type PD = { id: number; nomor_permohonan: string; keperluan: string; tanggal_kegiatan: string; keterangan: string | null; items: PDItem[] };
type Props = { tahun: { id: number; tahun: number; label: string }; pd: PD | null };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Keuangan', href: '#' },
    { title: 'Permohonan Dana', href: '/ketua-tim/permohonan-dana' },
    { title: 'Form', href: '#' },
];

const emptyItem = (): ItemRow => ({ uraian: '', volume: '', satuan: '', harga_satuan: '', keterangan: '' });

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Form({ pd }: Props) {
    const isEdit = pd !== null;

    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        keperluan:        pd?.keperluan ?? '',
        tanggal_kegiatan: pd?.tanggal_kegiatan ? pd.tanggal_kegiatan.substring(0, 10) : '',
        keterangan:       pd?.keterangan ?? '',
        items: pd?.items?.map(i => ({
            uraian:       i.uraian,
            volume:       String(i.volume),
            satuan:       i.satuan,
            harga_satuan: String(i.harga_satuan),
            keterangan:   i.keterangan ?? '',
        })) ?? [emptyItem()],
    });

    function updateItem(idx: number, field: keyof ItemRow, value: string) {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        setData('items', items);
    }

    function addItem() {
        setData('items', [...data.items, emptyItem()]);
    }

    function removeItem(idx: number) {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, i) => i !== idx));
    }

    function itemTotal(item: ItemRow): number {
        return (parseFloat(item.volume) || 0) * (parseFloat(item.harga_satuan) || 0);
    }

    const grandTotal = data.items.reduce((sum, item) => sum + itemTotal(item), 0);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/ketua-tim/permohonan-dana/${pd!.id}`);
        } else {
            post('/ketua-tim/permohonan-dana');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Edit ${pd!.nomor_permohonan}` : 'Buat Permohonan Dana'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isEdit ? `Edit — ${pd!.nomor_permohonan}` : 'Buat Permohonan Dana Baru'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Isi detail keperluan dan rincian anggaran</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Header fields */}
                    <div className="rounded-xl border p-5 flex flex-col gap-4 shadow-sm">
                        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informasi Umum</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="keperluan">Keperluan / Judul <span className="text-red-500">*</span></Label>
                                <Input
                                    id="keperluan"
                                    value={data.keperluan}
                                    onChange={e => setData('keperluan', e.target.value)}
                                    placeholder="Contoh: Rapat Koordinasi Tim Kerja..."
                                />
                                {errors.keperluan && <p className="text-xs text-red-500">{errors.keperluan}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tanggal_kegiatan">Tanggal Kegiatan <span className="text-red-500">*</span></Label>
                                <Input
                                    id="tanggal_kegiatan"
                                    type="date"
                                    value={data.tanggal_kegiatan}
                                    onChange={e => setData('tanggal_kegiatan', e.target.value)}
                                />
                                {errors.tanggal_kegiatan && <p className="text-xs text-red-500">{errors.tanggal_kegiatan}</p>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                            <Textarea
                                id="keterangan"
                                value={data.keterangan}
                                onChange={e => setData('keterangan', e.target.value)}
                                placeholder="Informasi tambahan jika diperlukan..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Items table */}
                    <div className="rounded-xl border shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                            <h2 className="font-semibold text-sm">Rincian Anggaran</h2>
                            <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1.5 h-8">
                                <Plus className="h-3.5 w-3.5" />Tambah Item
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-slate-50">
                                    <TableHead className="w-8 text-center text-xs">No</TableHead>
                                    <TableHead className="text-xs">Uraian</TableHead>
                                    <TableHead className="text-xs w-24">Volume</TableHead>
                                    <TableHead className="text-xs w-28">Satuan</TableHead>
                                    <TableHead className="text-xs w-36">Harga Satuan</TableHead>
                                    <TableHead className="text-xs w-36 text-right">Total</TableHead>
                                    <TableHead className="text-xs w-8"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((item, idx) => (
                                    <TableRow key={idx} className="align-top hover:bg-muted/20">
                                        <TableCell className="text-center text-muted-foreground text-xs pt-3">{idx + 1}</TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.uraian}
                                                onChange={e => updateItem(idx, 'uraian', e.target.value)}
                                                placeholder="Nama kegiatan/barang..."
                                                className="h-8 text-sm"
                                            />
                                            {errors[`items.${idx}.uraian` as keyof typeof errors] && (
                                                <p className="text-xs text-red-500 mt-0.5">{errors[`items.${idx}.uraian` as keyof typeof errors]}</p>
                                            )}
                                            <Input
                                                value={item.keterangan}
                                                onChange={e => updateItem(idx, 'keterangan', e.target.value)}
                                                placeholder="Keterangan (opsional)..."
                                                className="h-7 text-xs mt-1 text-muted-foreground"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.volume}
                                                onChange={e => updateItem(idx, 'volume', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.satuan}
                                                onChange={e => updateItem(idx, 'satuan', e.target.value)}
                                                placeholder="unit, OH, ls..."
                                                className="h-8 text-sm"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={item.harga_satuan}
                                                onChange={e => updateItem(idx, 'harga_satuan', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium pt-3">
                                            {fmt(itemTotal(item))}
                                        </TableCell>
                                        <TableCell className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                disabled={data.items.length <= 1}
                                                className="text-red-400 hover:text-red-600 disabled:opacity-30"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex justify-end items-center gap-3 px-5 py-3 border-t bg-muted/20">
                            <span className="text-sm text-muted-foreground">Total Anggaran:</span>
                            <span className="text-lg font-bold">{fmt(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Batal
                        </Button>
                        <Button type="submit" loading={processing} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isEdit ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
