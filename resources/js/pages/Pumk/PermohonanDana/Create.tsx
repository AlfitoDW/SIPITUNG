import { Head, router, useForm } from '@inertiajs/react';
import { ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface DjaItem { id: number; kode: string; nama: string; pagu: number; }
interface Sasaran  extends DjaItem { program_id: number; }
interface Kro      extends DjaItem { sasaran_id: number; }
interface Ro       extends DjaItem { kro_id: number; }
interface Komponen extends DjaItem { ro_id: number; }
interface Kegiatan extends DjaItem { komponen_id: number; }

interface Props {
    tahun: { tahun: string; label: string };
    programs:  DjaItem[];
    sasarans:  Sasaran[];
    kros:      Kro[];
    ros:       Ro[];
    komponens: Komponen[];
    kegiatans: Kegiatan[];
}

const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

export default function Create({ tahun, programs, sasarans, kros, ros, komponens, kegiatans }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        dja_program_id:  '',
        dja_sasaran_id:  '',
        dja_kro_id:      '',
        dja_ro_id:       '',
        dja_komponen_id: '',
        dja_kegiatan_id: '',
        judul_pekerjaan: '',
    });

    // Client-side cascade filter
    const filteredSasarans  = useMemo(() => sasarans.filter(s => String(s.program_id)  === data.dja_program_id),  [data.dja_program_id]);
    const filteredKros      = useMemo(() => kros.filter(k => String(k.sasaran_id)       === data.dja_sasaran_id),  [data.dja_sasaran_id]);
    const filteredRos       = useMemo(() => ros.filter(r => String(r.kro_id)            === data.dja_kro_id),      [data.dja_kro_id]);
    const filteredKomponens = useMemo(() => komponens.filter(k => String(k.ro_id)       === data.dja_ro_id),       [data.dja_ro_id]);
    const filteredKegiatans = useMemo(() => kegiatans.filter(k => String(k.komponen_id) === data.dja_komponen_id), [data.dja_komponen_id]);
    const selectedKegiatan  = filteredKegiatans.find(k => String(k.id) === data.dja_kegiatan_id) ?? null;

    const reset = (fields: (keyof typeof data)[]) => {
        const patch: Partial<typeof data> = {};
        fields.forEach(f => { (patch as any)[f] = ''; });
        setData(d => ({ ...d, ...patch }));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pumk/permohonan-dana');
    };

    return (
        <AppLayout>
            <Head title="Buat Permohonan Dana" />
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Buat Permohonan Dana</h1>
                        <p className="text-sm text-muted-foreground">Tahun Anggaran {tahun.tahun} — Draft akan disimpan otomatis</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">

                    {/* Section A — Identitas (read-only info) */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Identitas Permohonan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400">No. Permohonan</p>
                                <p className="text-sm font-medium text-gray-600 mt-0.5">Auto-generate saat disimpan</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Tahun Anggaran</p>
                                <p className="text-sm font-medium text-gray-800 mt-0.5">{tahun.tahun}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section B — Hierarki DJA */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Hierarki Anggaran DJA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            {/* Program */}
                            <div>
                                <Label className="text-sm font-medium">Program <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_program_id}
                                    onValueChange={v => {
                                        setData(d => ({ ...d, dja_program_id: v, dja_sasaran_id: '', dja_kro_id: '', dja_ro_id: '', dja_komponen_id: '', dja_kegiatan_id: '' }));
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih Program..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                <span className="font-mono text-blue-700 mr-2">{p.kode}</span> {p.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_program_id && <p className="text-xs text-red-500 mt-1">{errors.dja_program_id}</p>}
                            </div>

                            {/* Sasaran */}
                            <div>
                                <Label className="text-sm font-medium">Sasaran <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_sasaran_id}
                                    disabled={!data.dja_program_id || filteredSasarans.length === 0}
                                    onValueChange={v => setData(d => ({ ...d, dja_sasaran_id: v, dja_kro_id: '', dja_ro_id: '', dja_komponen_id: '', dja_kegiatan_id: '' }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={!data.dja_program_id ? 'Pilih Program dulu...' : 'Pilih Sasaran...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSasarans.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                <span className="font-mono text-blue-700 mr-2">{s.kode}</span> {s.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_sasaran_id && <p className="text-xs text-red-500 mt-1">{errors.dja_sasaran_id}</p>}
                            </div>

                            {/* KRO */}
                            <div>
                                <Label className="text-sm font-medium">Klasifikasi Rincian Output [KRO] <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_kro_id}
                                    disabled={!data.dja_sasaran_id || filteredKros.length === 0}
                                    onValueChange={v => setData(d => ({ ...d, dja_kro_id: v, dja_ro_id: '', dja_komponen_id: '', dja_kegiatan_id: '' }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={!data.dja_sasaran_id ? 'Pilih Sasaran dulu...' : 'Pilih KRO...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredKros.map(k => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                <span className="font-mono text-blue-700 mr-2">{k.kode}</span> {k.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_kro_id && <p className="text-xs text-red-500 mt-1">{errors.dja_kro_id}</p>}
                            </div>

                            {/* RO */}
                            <div>
                                <Label className="text-sm font-medium">Rincian Output [RO] <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_ro_id}
                                    disabled={!data.dja_kro_id || filteredRos.length === 0}
                                    onValueChange={v => setData(d => ({ ...d, dja_ro_id: v, dja_komponen_id: '', dja_kegiatan_id: '' }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={!data.dja_kro_id ? 'Pilih KRO dulu...' : 'Pilih RO...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredRos.map(r => (
                                            <SelectItem key={r.id} value={String(r.id)}>
                                                <span className="font-mono text-blue-700 mr-2">{r.kode}</span> {r.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_ro_id && <p className="text-xs text-red-500 mt-1">{errors.dja_ro_id}</p>}
                            </div>

                            {/* Komponen */}
                            <div>
                                <Label className="text-sm font-medium">Komponen <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_komponen_id}
                                    disabled={!data.dja_ro_id || filteredKomponens.length === 0}
                                    onValueChange={v => setData(d => ({ ...d, dja_komponen_id: v, dja_kegiatan_id: '' }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={!data.dja_ro_id ? 'Pilih RO dulu...' : 'Pilih Komponen...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredKomponens.map(k => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                <span className="font-mono text-blue-700 mr-2">{k.kode}</span> {k.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_komponen_id && <p className="text-xs text-red-500 mt-1">{errors.dja_komponen_id}</p>}
                            </div>

                            {/* Kegiatan */}
                            <div>
                                <Label className="text-sm font-medium">Kegiatan <span className="text-red-500">*</span></Label>
                                <Select
                                    value={data.dja_kegiatan_id}
                                    disabled={!data.dja_komponen_id || filteredKegiatans.length === 0}
                                    onValueChange={v => setData(d => ({ ...d, dja_kegiatan_id: v }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder={!data.dja_komponen_id ? 'Pilih Komponen dulu...' : 'Pilih Kegiatan...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredKegiatans.map(k => (
                                            <SelectItem key={k.id} value={String(k.id)}>
                                                <span className="font-mono font-bold text-blue-700 mr-2">{k.kode}</span> {k.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.dja_kegiatan_id && <p className="text-xs text-red-500 mt-1">{errors.dja_kegiatan_id}</p>}
                            </div>

                            {/* Pagu info */}
                            {selectedKegiatan && (
                                <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                                    <span className="text-sm text-blue-700">
                                        Pagu Kegiatan <strong>{selectedKegiatan.kode}</strong>
                                    </span>
                                    <span className="text-sm font-bold text-blue-800">{fmt(selectedKegiatan.pagu)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section C — Judul Pekerjaan */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                                Judul Pekerjaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label className="text-sm font-medium">
                                Judul Pekerjaan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                className="mt-1"
                                value={data.judul_pekerjaan}
                                onChange={e => setData('judul_pekerjaan', e.target.value)}
                                placeholder="Contoh: Workshop Peningkatan Mutu PT Wilayah III"
                            />
                            {errors.judul_pekerjaan && <p className="text-xs text-red-500 mt-1">{errors.judul_pekerjaan}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button type="button" variant="outline"
                            onClick={() => router.visit('/pumk/permohonan-dana')}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                            {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Simpan sebagai Draft
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
