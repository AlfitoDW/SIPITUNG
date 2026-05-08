import { Head, useForm } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type Item = {
    kode_akun: string;
    uraian: string;
    volume: string;
    satuan: string;
    harga_satuan: string;
    keterangan: string;
};

type PD = {
    id: number;
    keperluan: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    tempat: string | null;
    no_sk: string | null;
    tgl_sk: string | null;
    no_st: string | null;
    tgl_st: string | null;
    keterangan: string | null;
    items: (Item & { id: number; total: string })[];
} | null;

type Tahun = { id: number; tahun: number; label: string } | null;
type Props = { tahun: Tahun; pd: PD };

const emptyItem = (): Item => ({
    kode_akun: '',
    uraian: '',
    volume: '',
    satuan: '',
    harga_satuan: '',
    keterangan: '',
});

const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function Form({ tahun, pd }: Props) {
    const isEdit = !!pd;

    const { data, setData, post, put, processing, errors } = useForm({
        keperluan:      pd?.keperluan ?? '',
        tanggal_mulai:  pd?.tanggal_mulai ?? '',
        tanggal_selesai: pd?.tanggal_selesai ?? '',
        tempat:         pd?.tempat ?? '',
        no_sk:          pd?.no_sk ?? '',
        tgl_sk:         pd?.tgl_sk ?? '',
        no_st:          pd?.no_st ?? '',
        tgl_st:         pd?.tgl_st ?? '',
        keterangan:     pd?.keterangan ?? '',
        items: pd?.items.map((i) => ({
            kode_akun:    i.kode_akun,
            uraian:       i.uraian,
            volume:       i.volume,
            satuan:       i.satuan,
            harga_satuan: i.harga_satuan,
            keterangan:   i.keterangan,
        })) ?? [emptyItem()],
    });

    const total = data.items.reduce((acc, i) => {
        const v = parseFloat(i.volume) || 0;
        const h = parseFloat(i.harga_satuan) || 0;
        return acc + v * h;
    }, 0);

    const addItem = () => setData('items', [...data.items, emptyItem()]);

    const removeItem = (idx: number) =>
        setData('items', data.items.filter((_, i) => i !== idx));

    const updateItem = (idx: number, field: keyof Item, value: string) => {
        const items = [...data.items];
        items[idx] = { ...items[idx], [field]: value };
        setData('items', items);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/pumk/permohonan-dana/${pd!.id}`);
        } else {
            post('/pumk/permohonan-dana');
        }
    };

    return (
        <AppLayout>
            <Head title={isEdit ? 'Edit Permohonan Dana' : 'Buat Permohonan Dana'} />
            <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                    <Link href="/pumk/permohonan-dana">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Permohonan Dana' : 'Buat Permohonan Dana'}</h1>
                        <p className="text-sm text-muted-foreground">{tahun?.label}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Info Kegiatan */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Informasi Kegiatan</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="keperluan">Keperluan / Judul Kegiatan <span className="text-red-500">*</span></Label>
                                <Input
                                    id="keperluan"
                                    value={data.keperluan}
                                    onChange={(e) => setData('keperluan', e.target.value)}
                                    placeholder="Contoh: Rapat Koordinasi Tim Keuangan"
                                />
                                {errors.keperluan && <p className="text-xs text-red-500">{errors.keperluan}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="tanggal_mulai">Tanggal Mulai <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="tanggal_mulai"
                                        type="date"
                                        value={data.tanggal_mulai}
                                        onChange={(e) => setData('tanggal_mulai', e.target.value)}
                                    />
                                    {errors.tanggal_mulai && <p className="text-xs text-red-500">{errors.tanggal_mulai}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="tanggal_selesai">Tanggal Selesai <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="tanggal_selesai"
                                        type="date"
                                        value={data.tanggal_selesai}
                                        onChange={(e) => setData('tanggal_selesai', e.target.value)}
                                    />
                                    {errors.tanggal_selesai && <p className="text-xs text-red-500">{errors.tanggal_selesai}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tempat">Tempat</Label>
                                <Input
                                    id="tempat"
                                    value={data.tempat}
                                    onChange={(e) => setData('tempat', e.target.value)}
                                    placeholder="Lokasi pelaksanaan kegiatan"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    rows={3}
                                    placeholder="Keterangan tambahan (opsional)"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* SK & ST */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold">Surat Keputusan & Surat Tugas <span className="text-muted-foreground font-normal text-sm">(opsional)</span></CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="no_sk">Nomor SK</Label>
                                <Input id="no_sk" value={data.no_sk} onChange={(e) => setData('no_sk', e.target.value)} placeholder="XXX/LL3/KP.04.01/2026" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tgl_sk">Tanggal SK</Label>
                                <Input id="tgl_sk" type="date" value={data.tgl_sk} onChange={(e) => setData('tgl_sk', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="no_st">Nomor ST</Label>
                                <Input id="no_st" value={data.no_st} onChange={(e) => setData('no_st', e.target.value)} placeholder="XXX/LL3/TU.02.05/2026" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tgl_st">Tanggal ST</Label>
                                <Input id="tgl_st" type="date" value={data.tgl_st} onChange={(e) => setData('tgl_st', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Item Anggaran */}
                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold">Rincian Anggaran</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Item
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {(errors as Record<string, string>).items && (
                                <p className="text-xs text-red-500">{(errors as Record<string, string>).items}</p>
                            )}
                            {data.items.map((item, idx) => {
                                const subtotal = (parseFloat(item.volume) || 0) * (parseFloat(item.harga_satuan) || 0);
                                return (
                                    <div key={idx} className="rounded-lg border p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-muted-foreground">Item #{idx + 1}</span>
                                            {data.items.length > 1 && (
                                                <Button
                                                    type="button" variant="ghost" size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => removeItem(idx)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-6 gap-3">
                                            <div className="col-span-1 flex flex-col gap-1.5">
                                                <Label className="text-xs">Kode Akun</Label>
                                                <Input
                                                    value={item.kode_akun}
                                                    onChange={(e) => updateItem(idx, 'kode_akun', e.target.value)}
                                                    placeholder="521111"
                                                    className="font-mono text-xs"
                                                />
                                            </div>
                                            <div className="col-span-5 flex flex-col gap-1.5">
                                                <Label className="text-xs">Uraian <span className="text-red-500">*</span></Label>
                                                <Input
                                                    value={item.uraian}
                                                    onChange={(e) => updateItem(idx, 'uraian', e.target.value)}
                                                    placeholder="Nama kegiatan / barang / jasa"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-xs">Volume <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={item.volume}
                                                    onChange={(e) => updateItem(idx, 'volume', e.target.value)}
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-xs">Satuan <span className="text-red-500">*</span></Label>
                                                <Input
                                                    value={item.satuan}
                                                    onChange={(e) => updateItem(idx, 'satuan', e.target.value)}
                                                    placeholder="OH / ls / unit"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-xs">Harga Satuan <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="number" min="0" step="1000"
                                                    value={item.harga_satuan}
                                                    onChange={(e) => updateItem(idx, 'harga_satuan', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <Label className="text-xs">Keterangan</Label>
                                                <Input
                                                    value={item.keterangan}
                                                    onChange={(e) => updateItem(idx, 'keterangan', e.target.value)}
                                                    placeholder="Opsional"
                                                    className="mt-1.5"
                                                />
                                            </div>
                                            {subtotal > 0 && (
                                                <div className="ml-4 text-right shrink-0">
                                                    <p className="text-xs text-muted-foreground">Subtotal</p>
                                                    <p className="text-sm font-bold tabular-nums">{fmt(subtotal)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {total > 0 && (
                                <div className="flex justify-end pt-2 border-t">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Total Anggaran</p>
                                        <p className="text-lg font-bold tabular-nums">{fmt(total)}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 justify-end">
                        <Link href="/pumk/permohonan-dana">
                            <Button type="button" variant="outline">Batal</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : isEdit ? 'Perbarui Permohonan' : 'Simpan sebagai Draft'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
