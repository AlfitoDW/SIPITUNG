import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type RefNama = {
    id: number;
    nama: string;
    nip: string | null;
    nik: string | null;
    npwp: string | null;
    gol_ruang: string | null;
    status_kepegawaian: string;
    nama_rekening: string | null;
    no_rekening: string | null;
    nama_bank: string | null;
    email: string | null;
    pph21_persen: string;
};

type NominatifRow = {
    item_id: number;
    ref_nama_id: number | null;
    nama: string;
    nip: string;
    nik: string;
    npwp: string;
    gol_ruang: string;
    nama_rekening: string;
    no_rekening: string;
    nama_bank: string;
    email: string;
    pph21_persen: string;
    jabatan: string;
    volume: string;
    harga_satuan: string;
    transport: string;
    uang_harian_vol: string;
    uang_harian_satuan: string;
    fullboard_vol: string;
    fullboard_satuan: string;
    fullday_vol: string;
    fullday_satuan: string;
    representasi: string;
    taksi_pp: string;
    tiket_pesawat: string;
    hotel: string;
};

type Item = {
    id: number;
    kode_akun: string;
    uraian: string;
    volume: string;
    satuan: string;
    harga_satuan: string;
    total: string;
    tipe_nominatif: string;
    nominatif: Array<{
        id: number;
        ref_nama_id: number | null;
        nama: string;
        nip: string | null; nik: string | null; npwp: string | null;
        gol_ruang: string | null; nama_rekening: string | null;
        no_rekening: string | null; nama_bank: string | null;
        email: string | null; pph21_persen: string;
        jabatan: string | null;
        volume: string; harga_satuan: string;
        transport: string; uang_harian_vol: string; uang_harian_satuan: string;
        fullboard_vol: string; fullboard_satuan: string;
        fullday_vol: string; fullday_satuan: string;
        representasi: string; taksi_pp: string; tiket_pesawat: string; hotel: string;
    }>;
};

type Permohonan = {
    id: number;
    nomor_permohonan: string;
    keperluan: string;
    status: string;
    status_label: string;
};

type Props = {
    permohonan: Permohonan;
    items_honor: Item[];
    items_perjadin: Item[];
    ref_nama: RefNama[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number) => new Intl.NumberFormat('id-ID').format(Number(n));

const JABATAN_OPTIONS = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Anggota', 'Penanggung Jawab', 'Narasumber', 'Moderator'];

const GOL_PNS = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];

function makeEmptyHonorRow(item: Item): NominatifRow {
    return {
        item_id: item.id, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', harga_satuan: item.harga_satuan,
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function makeEmptyPerjadinRow(item: Item): NominatifRow {
    return {
        item_id: item.id, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', harga_satuan: '0',
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function rowFromExisting(nom: Item['nominatif'][0], itemId: number): NominatifRow {
    return {
        item_id: itemId, ref_nama_id: nom.ref_nama_id,
        nama: nom.nama, nip: nom.nip ?? '', nik: nom.nik ?? '',
        npwp: nom.npwp ?? '', gol_ruang: nom.gol_ruang ?? '',
        nama_rekening: nom.nama_rekening ?? '', no_rekening: nom.no_rekening ?? '',
        nama_bank: nom.nama_bank ?? '', email: nom.email ?? '',
        pph21_persen: nom.pph21_persen,
        jabatan: nom.jabatan ?? '', volume: nom.volume, harga_satuan: nom.harga_satuan,
        transport: nom.transport, uang_harian_vol: nom.uang_harian_vol,
        uang_harian_satuan: nom.uang_harian_satuan,
        fullboard_vol: nom.fullboard_vol, fullboard_satuan: nom.fullboard_satuan,
        fullday_vol: nom.fullday_vol, fullday_satuan: nom.fullday_satuan,
        representasi: nom.representasi, taksi_pp: nom.taksi_pp,
        tiket_pesawat: nom.tiket_pesawat, hotel: nom.hotel,
    };
}

// ── Dialog Tambah Pegawai Baru ────────────────────────────────────────────────

type NewPegawaiForm = {
    nama: string; nip: string; nik: string; npwp: string;
    status_kepegawaian: string; gol_ruang: string;
    nama_rekening: string; no_rekening: string; nama_bank: string; email: string;
};

function TambahPegawaiDialog({
    open,
    onClose,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: (pegawai: RefNama) => void;
}) {
    const [form, setForm] = useState<NewPegawaiForm>({
        nama: '', nip: '', nik: '', npwp: '',
        status_kepegawaian: 'PNS', gol_ruang: 'III/a',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Bank select + custom
    const BANK_OPTIONS = ['BNI', 'BRI', 'Mandiri', 'BTN', 'BSI', 'BCA', 'Lainnya'];
    const [bankSelect, setBankSelect] = useState('');
    const [bankCustom, setBankCustom] = useState('');

    const set = (k: keyof NewPegawaiForm, v: string) => {
        setForm(f => {
            const next = { ...f, [k]: v };
            // reset gol_ruang kalau ganti status
            if (k === 'status_kepegawaian') {
                next.gol_ruang = v === 'PNS' ? 'III/a' : 'Non PNS';
            }
            return next;
        });
        setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    };

    const handleBankSelect = (v: string) => {
        setBankSelect(v);
        if (v !== 'Lainnya') {
            set('nama_bank', v);
            setBankCustom('');
        } else {
            set('nama_bank', bankCustom);
        }
    };

    const handleBankCustom = (v: string) => {
        setBankCustom(v);
        if (bankSelect === 'Lainnya') {
            set('nama_bank', v);
        }
    };

    const handleSubmit = async () => {
        setErrors({});
        if (bankSelect === 'Lainnya' && !bankCustom.trim()) {
            setErrors({ nama_bank: 'Nama bank wajib diisi' });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/pumk/ref-pegawai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({
                    ...form,
                    gol_ruang: form.status_kepegawaian === 'Non-PNS' ? 'Non PNS' : form.gol_ruang,
                }),
            });

            if (res.ok) {
                const data: RefNama = await res.json();
                onSuccess(data);
                onClose();
                setForm({ nama: '', nip: '', nik: '', npwp: '', status_kepegawaian: 'PNS', gol_ruang: 'III/a', nama_rekening: '', no_rekening: '', nama_bank: '', email: '' });
                setBankSelect('');
                setBankCustom('');
            } else {
                const err = await res.json();
                if (err.errors) setErrors(err.errors);
            }
        } catch {
            setErrors({ nama: 'Terjadi kesalahan. Coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    const field = (label: string, key: keyof NewPegawaiForm, placeholder = '') => (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className={cn('h-8 text-sm', errors[key] && 'border-red-400')}
            />
            {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Tambah Pegawai Baru</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">{field('Nama Lengkap *', 'nama', 'Nama lengkap dengan gelar')}</div>

                    <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Status Kepegawaian</Label>
                        <Select value={form.status_kepegawaian} onValueChange={v => set('status_kepegawaian', v)}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PNS">PNS</SelectItem>
                                <SelectItem value="Non-PNS">Non-PNS</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {form.status_kepegawaian === 'PNS' ? (
                        <div className="space-y-1">
                            <Label className="text-xs">Golongan/Ruang</Label>
                            <Select value={form.gol_ruang} onValueChange={v => set('gol_ruang', v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {GOL_PNS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label className="text-xs">Golongan/Ruang</Label>
                            <Input value="Non PNS" disabled className="h-8 text-sm bg-muted" />
                        </div>
                    )}

                    {field('NIP', 'nip', 'Kosongkan jika Non-PNS')}
                    {field('NIK (KTP)', 'nik', '16 digit')}
                    {field('NPWP', 'npwp', 'Kosongkan jika tidak ada')}
                    {field('Email', 'email', 'email@domain.com')}

                    <div className="col-span-2 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Informasi Rekening Bank</p>
                    </div>
                    {field('Nama di Rekening', 'nama_rekening', 'Sesuai nama di rekening bank')}
                    {field('Nomor Rekening', 'no_rekening', '')}
                    {/* Nama Bank — Select + Custom */}
                    <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Nama Bank</Label>
                        <Select value={bankSelect} onValueChange={handleBankSelect}>
                            <SelectTrigger className={cn('h-8 text-sm', errors.nama_bank && 'border-red-400')}>
                                <SelectValue placeholder="Pilih bank..." />
                            </SelectTrigger>
                            <SelectContent>
                                {BANK_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {bankSelect === 'Lainnya' && (
                            <Input
                                className="h-8 text-sm mt-1.5"
                                placeholder="Masukkan nama bank..."
                                value={bankCustom}
                                onChange={e => handleBankCustom(e.target.value)}
                            />
                        )}
                        {errors.nama_bank && <p className="text-xs text-red-500">{errors.nama_bank}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
                    <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                        {saving ? 'Menyimpan...' : <><UserPlus className="h-4 w-4" /> Simpan Pegawai</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Combobox Peserta (fixed-position dropdown) ────────────────────────────────

function PegawaiCombobox({
    value,
    onChange,
    options,
    onOpenAddDialog,
}: {
    value: string;
    onChange: (nama: string, pegawai: RefNama | null) => void;
    options: RefNama[];
    onOpenAddDialog: (prefill: string) => void;
}) {
    const [query, setQuery]   = useState(value);
    const [open, setOpen]     = useState(false);
    const [style, setStyle]   = useState<React.CSSProperties>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

    // Hitung posisi fixed berdasarkan bounding rect input
    const reposition = useCallback(() => {
        if (!inputRef.current) return;
        const r = inputRef.current.getBoundingClientRect();
        setStyle({
            position: 'fixed',
            top: r.bottom + 4,
            left: r.left,
            width: Math.max(280, r.width),
            zIndex: 9999,
        });
    }, []);

    const handleOpen = () => { reposition(); setOpen(true); };

    useEffect(() => {
        if (!open) return;
        const onScroll = () => reposition();
        const onResize = () => reposition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, reposition]);

    // Tutup saat klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query.trim().length === 0
        ? options.slice(0, 30)
        : options.filter(p => p.nama.toLowerCase().includes(query.toLowerCase())).slice(0, 30);

    const exactMatch = options.find(p => p.nama.toLowerCase() === query.toLowerCase().trim());

    return (
        <div ref={containerRef} className="relative">
            <Input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); handleOpen(); if (!e.target.value) onChange('', null); }}
                onFocus={handleOpen}
                placeholder="Cari nama..."
                className="h-8 text-xs w-full"
            />
            {open && (
                <div style={style} className="rounded-md border bg-white shadow-xl text-xs max-h-60 overflow-y-auto">
                    {/* Opsi: tambah baru */}
                    <button
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600 border-b font-medium flex items-center gap-1.5 sticky top-0 bg-white"
                        onMouseDown={e => { e.preventDefault(); setOpen(false); onOpenAddDialog(query); }}
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Tambah pegawai baru{query.trim() ? ` "${query.trim()}"` : ''}
                    </button>
                    {filtered.length === 0 && (
                        <div className="px-3 py-3 text-muted-foreground text-center">Tidak ditemukan</div>
                    )}
                    {filtered.map(p => (
                        <button
                            key={p.id}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b last:border-0"
                            onMouseDown={e => {
                                e.preventDefault();
                                setQuery(p.nama);
                                onChange(p.nama, p);
                                setOpen(false);
                            }}
                        >
                            <span className="font-medium">{p.nama}</span>
                            {p.nip && <span className="text-muted-foreground ml-2 text-[10px]">{p.nip}</span>}
                            {p.gol_ruang && (
                                <span className="ml-2 text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                                    {p.gol_ruang}
                                </span>
                            )}
                            {p.pph21_persen !== '0.00' && (
                                <span className="ml-1 text-[10px] text-amber-600">PPh21: {p.pph21_persen}%</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Icon Action dengan Tooltip ────────────────────────────────────────────────

function ActionBtn({
    title,
    onClick,
    className,
    children,
}: {
    title: string;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        className,
                    )}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
        </Tooltip>
    );
}

// ── Honor Item Group ──────────────────────────────────────────────────────────

function HonorItemGroup({
    item,
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
}: {
    item: Item;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string) => void;
}) {
    const showJabatan = item.kode_akun !== '521115';

    const fillFromPegawai = (idx: number, nama: string, peg: RefNama | null) => {
        onChange(idx, 'nama', nama);
        onChange(idx, 'ref_nama_id', peg ? String(peg.id) : '');
        onChange(idx, 'nip', peg?.nip ?? '');
        onChange(idx, 'nik', peg?.nik ?? '');
        onChange(idx, 'npwp', peg?.npwp ?? '');
        onChange(idx, 'gol_ruang', peg?.gol_ruang ?? '');
        onChange(idx, 'nama_rekening', peg?.nama_rekening ?? '');
        onChange(idx, 'no_rekening', peg?.no_rekening ?? '');
        onChange(idx, 'nama_bank', peg?.nama_bank ?? '');
        onChange(idx, 'email', peg?.email ?? '');
        onChange(idx, 'pph21_persen', peg?.pph21_persen ?? '0');
    };

    const colSpanAll = showJabatan ? 9 : 8;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono text-xs bg-orange-50 border-orange-200 text-orange-700">
                    {item.kode_akun}
                </Badge>
                <span className="text-sm font-medium">{item.uraian}</span>
                <span className="text-xs text-muted-foreground">· Rp {fmt(item.harga_satuan)} / keg</span>
            </div>
            <div className="rounded-md border overflow-visible">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-orange-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-2 py-2.5 w-8 text-center">#</th>
                            <th className="px-2 py-2.5 text-left min-w-[200px]">Nama Peserta</th>
                            {showJabatan && <th className="px-2 py-2.5 text-left min-w-[140px]">Jabatan</th>}
                            <th className="px-2 py-2.5 text-right w-20">Vol</th>
                            <th className="px-2 py-2.5 text-right w-32">Harga Sat.</th>
                            <th className="px-2 py-2.5 text-right w-32">Jml Bruto</th>
                            <th className="px-2 py-2.5 text-right w-24">PPh21 (%)</th>
                            <th className="px-2 py-2.5 text-right w-32">Jml Diterima</th>
                            <th className="px-2 py-2.5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row, idx) => {
                            const vol      = parseFloat(row.volume) || 0;
                            const harga    = parseFloat(row.harga_satuan) || 0;
                            const bruto    = vol * harga;
                            const pph21    = parseFloat(row.pph21_persen) || 0;
                            const pajak    = bruto * pph21 / 100;
                            const diterima = bruto - pajak;
                            return (
                                <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-2 py-2 text-center text-muted-foreground">{idx + 1}</td>
                                    <td className="px-2 py-2">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={onOpenAddDialog}
                                        />
                                    </td>
                                    {showJabatan && (
                                        <td className="px-2 py-2">
                                            <Select value={row.jabatan} onValueChange={v => onChange(idx, 'jabatan', v)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Pilih jabatan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {JABATAN_OPTIONS.map(j => (
                                                        <SelectItem key={j} value={j}>{j}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    )}
                                    <td className="px-2 py-2">
                                        <Input value={row.volume} type="number" min="0" step="0.5"
                                            onChange={e => onChange(idx, 'volume', e.target.value)}
                                            className="h-8 text-xs text-right w-20" />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input value={row.harga_satuan} type="number" min="0"
                                            onChange={e => onChange(idx, 'harga_satuan', e.target.value)}
                                            className="h-8 text-xs text-right w-32" />
                                    </td>
                                    <td className="px-2 py-2 text-right tabular-nums font-medium text-gray-700">
                                        {fmt(bruto)}
                                    </td>
                                    <td className="px-2 py-2">
                                        <Input value={row.pph21_persen} type="number" min="0" max="100" step="0.5"
                                            onChange={e => onChange(idx, 'pph21_persen', e.target.value)}
                                            className="h-8 text-xs text-right w-24" />
                                    </td>
                                    <td className="px-2 py-2 text-right tabular-nums font-semibold text-emerald-700">
                                        {fmt(diterima)}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                        <ActionBtn
                                            title="Hapus baris"
                                            onClick={() => onRemove(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </ActionBtn>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={colSpanAll} className="px-3 py-6 text-center text-muted-foreground text-xs">
                                    Belum ada peserta — klik "+ Tambah Peserta" di bawah.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50/50">
                            <td colSpan={colSpanAll} className="px-2 py-1">
                                <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                                </Button>
                            </td>
                        </tr>
                        {rows.length > 0 && (
                            <tr className="border-t bg-orange-50/30 text-xs font-semibold">
                                <td colSpan={showJabatan ? 5 : 4} className="px-2 py-2 text-right text-muted-foreground">Total</td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                    {fmt(rows.reduce((s, r) => s + (parseFloat(r.volume)||0)*(parseFloat(r.harga_satuan)||0), 0))}
                                </td>
                                <td />
                                <td className="px-2 py-2 text-right tabular-nums text-emerald-700">
                                    {fmt(rows.reduce((s, r) => {
                                        const bruto = (parseFloat(r.volume)||0)*(parseFloat(r.harga_satuan)||0);
                                        return s + bruto - bruto*(parseFloat(r.pph21_persen)||0)/100;
                                    }, 0))}
                                </td>
                                <td />
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ── Perjadin Item Group ───────────────────────────────────────────────────────

function PerjadinItemGroup({
    item,
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
}: {
    item: Item;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string) => void;
}) {
    const fillFromPegawai = (idx: number, nama: string, peg: RefNama | null) => {
        onChange(idx, 'nama', nama);
        onChange(idx, 'ref_nama_id', peg ? String(peg.id) : '');
        onChange(idx, 'nip', peg?.nip ?? '');
        onChange(idx, 'nik', peg?.nik ?? '');
        onChange(idx, 'npwp', peg?.npwp ?? '');
        onChange(idx, 'gol_ruang', peg?.gol_ruang ?? '');
        onChange(idx, 'nama_rekening', peg?.nama_rekening ?? '');
        onChange(idx, 'no_rekening', peg?.no_rekening ?? '');
        onChange(idx, 'nama_bank', peg?.nama_bank ?? '');
        onChange(idx, 'email', peg?.email ?? '');
    };

    const n = (row: NominatifRow, idx: number, f: keyof NominatifRow) => (
        <Input value={row[f] as string} type="number" min="0"
            onChange={e => onChange(idx, f, e.target.value)}
            className="h-7 text-xs text-right w-20" />
    );

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono text-xs bg-blue-50 border-blue-200 text-blue-700">
                    {item.kode_akun}
                </Badge>
                <span className="text-sm font-medium">{item.uraian}</span>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs" style={{ minWidth: 1400 }}>
                    <thead>
                        <tr className="bg-blue-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-2 py-2.5 w-8 text-center">#</th>
                            <th className="px-2 py-2.5 text-left min-w-[180px]">Nama Peserta</th>
                            <th className="px-2 py-2.5 text-right">Transport</th>
                            <th className="px-2 py-2.5 text-center" colSpan={3}>Uang Harian Biasa</th>
                            <th className="px-2 py-2.5 text-center" colSpan={3}>Fullboard</th>
                            <th className="px-2 py-2.5 text-center" colSpan={3}>Fullday</th>
                            <th className="px-2 py-2.5 text-right">Representasi</th>
                            <th className="px-2 py-2.5 text-right">Taksi PP</th>
                            <th className="px-2 py-2.5 text-right">Tiket Pesawat</th>
                            <th className="px-2 py-2.5 text-right">Hotel</th>
                            <th className="px-2 py-2.5 text-right font-bold">Total</th>
                            <th className="px-2 py-2.5 w-10"></th>
                        </tr>
                        <tr className="bg-blue-50/60 border-b text-xs font-medium text-gray-500">
                            <th /><th />
                            <th className="px-2 py-1 text-right">Rp</th>
                            <th className="px-1 py-1 text-center">Hari</th>
                            <th className="px-1 py-1 text-center">Satuan</th>
                            <th className="px-1 py-1 text-center">Jml</th>
                            <th className="px-1 py-1 text-center">Hari</th>
                            <th className="px-1 py-1 text-center">Satuan</th>
                            <th className="px-1 py-1 text-center">Jml</th>
                            <th className="px-1 py-1 text-center">Hari</th>
                            <th className="px-1 py-1 text-center">Satuan</th>
                            <th className="px-1 py-1 text-center">Jml</th>
                            <th /><th /><th /><th />
                            <th className="px-2 py-1 text-right">Rp</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row, idx) => {
                            const uhJml = (parseFloat(row.uang_harian_vol)||0)*(parseFloat(row.uang_harian_satuan)||0);
                            const fbJml = (parseFloat(row.fullboard_vol)||0)*(parseFloat(row.fullboard_satuan)||0);
                            const fdJml = (parseFloat(row.fullday_vol)||0)*(parseFloat(row.fullday_satuan)||0);
                            const total = (parseFloat(row.transport)||0) + uhJml + fbJml + fdJml
                                        + (parseFloat(row.representasi)||0) + (parseFloat(row.taksi_pp)||0)
                                        + (parseFloat(row.tiket_pesawat)||0) + (parseFloat(row.hotel)||0);
                            return (
                                <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-2 py-2 text-center text-muted-foreground">{idx + 1}</td>
                                    <td className="px-2 py-2">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={onOpenAddDialog}
                                        />
                                    </td>
                                    <td className="px-2 py-2">{n(row, idx, 'transport')}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'uang_harian_vol')}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'uang_harian_satuan')}</td>
                                    <td className="px-1 py-2 text-right tabular-nums text-gray-700 font-medium">{fmt(uhJml)}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'fullboard_vol')}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'fullboard_satuan')}</td>
                                    <td className="px-1 py-2 text-right tabular-nums text-gray-700 font-medium">{fmt(fbJml)}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'fullday_vol')}</td>
                                    <td className="px-1 py-2">{n(row, idx, 'fullday_satuan')}</td>
                                    <td className="px-1 py-2 text-right tabular-nums text-gray-700 font-medium">{fmt(fdJml)}</td>
                                    <td className="px-2 py-2">{n(row, idx, 'representasi')}</td>
                                    <td className="px-2 py-2">{n(row, idx, 'taksi_pp')}</td>
                                    <td className="px-2 py-2">{n(row, idx, 'tiket_pesawat')}</td>
                                    <td className="px-2 py-2">{n(row, idx, 'hotel')}</td>
                                    <td className="px-2 py-2 text-right tabular-nums font-bold text-blue-700">{fmt(total)}</td>
                                    <td className="px-2 py-2 text-center">
                                        <ActionBtn
                                            title="Hapus baris"
                                            onClick={() => onRemove(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </ActionBtn>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={19} className="px-3 py-6 text-center text-muted-foreground text-xs">
                                    Belum ada peserta — klik "+ Tambah Peserta" di bawah.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50/50">
                            <td colSpan={19} className="px-2 py-1">
                                <Button variant="ghost" size="sm" onClick={onAdd}
                                    className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                                </Button>
                            </td>
                        </tr>
                        {rows.length > 0 && (
                            <tr className="border-t bg-blue-50/30 text-xs font-semibold">
                                <td colSpan={16} className="px-2 py-2 text-right text-muted-foreground">Total Keseluruhan</td>
                                <td className="px-2 py-2 text-right tabular-nums text-blue-700">
                                    {fmt(rows.reduce((s, row) => {
                                        const uhJml = (parseFloat(row.uang_harian_vol)||0)*(parseFloat(row.uang_harian_satuan)||0);
                                        const fbJml = (parseFloat(row.fullboard_vol)||0)*(parseFloat(row.fullboard_satuan)||0);
                                        const fdJml = (parseFloat(row.fullday_vol)||0)*(parseFloat(row.fullday_satuan)||0);
                                        return s + (parseFloat(row.transport)||0) + uhJml + fbJml + fdJml
                                            + (parseFloat(row.representasi)||0) + (parseFloat(row.taksi_pp)||0)
                                            + (parseFloat(row.tiket_pesawat)||0) + (parseFloat(row.hotel)||0);
                                    }, 0))}
                                </td>
                                <td />
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Nominatif({ permohonan, items_honor, items_perjadin, ref_nama: initialRefNama }: Props) {
    const [activeTab, setActiveTab]   = useState<'honor' | 'perjadin'>('honor');
    const [saving, setSaving]         = useState(false);
    const [refNama, setRefNama]       = useState<RefNama[]>(initialRefNama);

    // Dialog tambah pegawai baru
    const [addDialogOpen, setAddDialogOpen]     = useState(false);
    const [addDialogPrefill, setAddDialogPrefill] = useState('');
    // Callback setelah pegawai baru dibuat — untuk auto-select ke baris tertentu
    const pendingSelectRef = useRef<((peg: RefNama) => void) | null>(null);

    const openAddDialog = (prefill: string, onSelect?: (peg: RefNama) => void) => {
        setAddDialogPrefill(prefill);
        pendingSelectRef.current = onSelect ?? null;
        setAddDialogOpen(true);
    };

    const handleNewPegawai = (peg: RefNama) => {
        setRefNama(prev => [...prev, peg].sort((a, b) => a.nama.localeCompare(b.nama)));
        if (pendingSelectRef.current) {
            pendingSelectRef.current(peg);
            pendingSelectRef.current = null;
        }
    };

    // ── State rows ────────────────────────────────────────────────────────────

    const [honorRows, setHonorRows] = useState<Record<number, NominatifRow[]>>(() => {
        const m: Record<number, NominatifRow[]> = {};
        for (const item of items_honor) {
            m[item.id] = item.nominatif.length > 0
                ? item.nominatif.map(n => rowFromExisting(n, item.id))
                : [makeEmptyHonorRow(item)];
        }
        return m;
    });

    const [perjadinRows, setPerjadinRows] = useState<Record<number, NominatifRow[]>>(() => {
        const m: Record<number, NominatifRow[]> = {};
        for (const item of items_perjadin) {
            m[item.id] = item.nominatif.length > 0
                ? item.nominatif.map(n => rowFromExisting(n, item.id))
                : [makeEmptyPerjadinRow(item)];
        }
        return m;
    });

    // ── Handlers ──────────────────────────────────────────────────────────────

    const setHonorRow = (id: number, idx: number, f: keyof NominatifRow, v: string) =>
        setHonorRows(prev => { const r = [...(prev[id]??[])]; r[idx] = {...r[idx],[f]:v}; return {...prev,[id]:r}; });
    const addHonorRow = (item: Item) =>
        setHonorRows(prev => ({...prev, [item.id]: [...(prev[item.id]??[]), makeEmptyHonorRow(item)]}));
    const removeHonorRow = (id: number, idx: number) =>
        setHonorRows(prev => ({...prev, [id]: (prev[id]??[]).filter((_,i)=>i!==idx)}));

    const setPerjadinRow = (id: number, idx: number, f: keyof NominatifRow, v: string) =>
        setPerjadinRows(prev => { const r = [...(prev[id]??[])]; r[idx] = {...r[idx],[f]:v}; return {...prev,[id]:r}; });
    const addPerjadinRow = (item: Item) =>
        setPerjadinRows(prev => ({...prev, [item.id]: [...(prev[item.id]??[]), makeEmptyPerjadinRow(item)]}));
    const removePerjadinRow = (id: number, idx: number) =>
        setPerjadinRows(prev => ({...prev, [id]: (prev[id]??[]).filter((_,i)=>i!==idx)}));

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = () => {
        const allRows: NominatifRow[] = [];
        for (const item of items_honor)   allRows.push(...(honorRows[item.id]??[]).filter(r => r.nama.trim()));
        for (const item of items_perjadin) allRows.push(...(perjadinRows[item.id]??[]).filter(r => r.nama.trim()));

        setSaving(true);
        router.post(`/pumk/permohonan-dana/${permohonan.id}/nominatif/simpan`, { nominatif: allRows }, {
            onFinish: () => setSaving(false),
        });
    };

    const hasHonor    = items_honor.length > 0;
    const hasPerjadin = items_perjadin.length > 0;

    if (!hasHonor && !hasPerjadin) {
        return (
            <AppLayout>
                <Head title="Input Nominatif" />
                <div className="p-6 max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center py-16 text-center">
                            <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
                            <p className="font-medium">Tidak Ada Item Nominatif</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Permohonan ini tidak memiliki item yang memerlukan daftar nominatif.
                            </p>
                            <Button variant="outline" className="mt-4 gap-2" onClick={() => router.visit('/pumk/permohonan-dana')}>
                                <ArrowLeft className="h-4 w-4" /> Kembali
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`Input Nominatif — ${permohonan.nomor_permohonan}`} />

            {/* Dialog tambah pegawai */}
            <TambahPegawaiDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSuccess={handleNewPegawai}
            />

            <div className="flex flex-col gap-5 p-4 md:p-6 max-w-full mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <button onClick={() => router.visit('/pumk/permohonan-dana')}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gray-900 mb-1 transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Daftar
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight">Input Daftar Nominatif</h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-mono text-xs text-blue-700 font-semibold">{permohonan.nomor_permohonan}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground truncate max-w-md">{permohonan.keperluan}</span>
                            <Badge variant="outline" className="text-xs">{permohonan.status_label}</Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => openAddDialog('')} className="gap-2">
                                    <UserPlus className="h-4 w-4" /> Pegawai Baru
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Tambah pegawai ke master ref pegawai</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Menyimpan...' : 'Simpan Nominatif'}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Simpan semua baris nominatif</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Tab — hanya muncul kalau ada kedua tipe */}
                {hasHonor && hasPerjadin && (
                    <div className="flex gap-1 border-b">
                        <button onClick={() => setActiveTab('honor')} className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === 'honor'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-muted-foreground hover:text-gray-700',
                        )}>
                            Honorarium <span className="ml-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-1.5 py-0.5">{items_honor.length}</span>
                        </button>
                        <button onClick={() => setActiveTab('perjadin')} className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === 'perjadin'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-muted-foreground hover:text-gray-700',
                        )}>
                            Perjalanan Dinas <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 rounded-full px-1.5 py-0.5">{items_perjadin.length}</span>
                        </button>
                    </div>
                )}

                {/* Honor */}
                {(activeTab === 'honor' || !hasPerjadin) && hasHonor && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <span className="w-2 h-4 rounded bg-orange-400 shrink-0" />
                                Daftar Nominatif Honorarium
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-visible">
                            {items_honor.map(item => (
                                <HonorItemGroup
                                    key={item.id}
                                    item={item}
                                    rows={honorRows[item.id] ?? []}
                                    onChange={(idx, f, v) => setHonorRow(item.id, idx, f, v)}
                                    onAdd={() => addHonorRow(item)}
                                    onRemove={idx => removeHonorRow(item.id, idx)}
                                    refNama={refNama}
                                    onOpenAddDialog={prefill => openAddDialog(prefill)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Perjadin */}
                {(activeTab === 'perjadin' || !hasHonor) && hasPerjadin && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <span className="w-2 h-4 rounded bg-blue-400 shrink-0" />
                                Daftar Nominatif Perjalanan Dinas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {items_perjadin.map(item => (
                                <PerjadinItemGroup
                                    key={item.id}
                                    item={item}
                                    rows={perjadinRows[item.id] ?? []}
                                    onChange={(idx, f, v) => setPerjadinRow(item.id, idx, f, v)}
                                    onAdd={() => addPerjadinRow(item)}
                                    onRemove={idx => removePerjadinRow(item.id, idx)}
                                    refNama={refNama}
                                    onOpenAddDialog={prefill => openAddDialog(prefill)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end pb-6">
                    <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Semua Nominatif'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
