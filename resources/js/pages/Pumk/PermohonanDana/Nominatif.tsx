import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
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
    ref_nama_id: number | string | null;
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

type RincianItem = {
    id: number;
    kode_akun: string;
    nama_akun: string;
    nama_item: string;
    satuan: string;
    harga_satuan: number;
    pagu_total: number;
    terpakai: number;
    sisa_anggaran: number;
    volume: number;
    harga_satuan_aktual: number;
    total: number;
    jumlah_permintaan: number;
    tipe_nominatif: 'honor' | 'perjadin' | 'non_nominatif';
    nominatif_count: number;
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
    rincian_biaya: RincianItem[][];
    ref_nama: RefNama[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID').format(Number.isNaN(num) ? 0 : num);
};

const statusColor = (s: string) => s === 'PNS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';

const JABATAN_OPTIONS = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Anggota', 'Penanggung Jawab', 'Narasumber', 'Moderator'];

const GOL_PNS = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];

// ── Empty Row Factories ─────────────────────────────────────────────────────────

function makeEmptyHonorRow(itemId: number, hargaDefault: number): NominatifRow {
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', harga_satuan: String(hargaDefault),
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function makeEmptyPerjadinRow(itemId: number): NominatifRow {
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', harga_satuan: '0',
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function rowFromExisting(nom: RincianItem['nominatif'][0], itemId: number): NominatifRow {
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

// ── Dialog Tambah Pegawai Baru ──────────────────────────────────────────────

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

    const BANK_OPTIONS = ['BNI', 'BRI', 'Mandiri', 'BTN', 'BSI', 'BCA', 'Lainnya'];
    const [bankSelect, setBankSelect] = useState('');
    const [bankCustom, setBankCustom] = useState('');

    const set = (k: keyof NewPegawaiForm, v: string) => {
        setForm(f => {
            const next = { ...f, [k]: v };
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

        // ── CSRF guard ──
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        const csrf = meta?.content;
        if (!csrf) {
            setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/pumk/ref-pegawai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ...form,
                    gol_ruang: form.status_kepegawaian === 'Non-PNS' ? 'Non PNS' : form.gol_ruang,
                }),
            });

            // ── 419 Session Expired ──
            if (res.status === 419) {
                setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' });
                return;
            }

            // ── Success ──
            if (res.ok) {
                const data: RefNama = await res.json();
                onSuccess(data);
                onClose();
                setForm({ nama: '', nip: '', nik: '', npwp: '', status_kepegawaian: 'PNS', gol_ruang: 'III/a', nama_rekening: '', no_rekening: '', nama_bank: '', email: '' });
                setBankSelect('');
                setBankCustom('');
                return;
            }

            // ── Validation / Server Error ──
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const err = await res.json();
                setErrors(err.errors || { nama: err.message || 'Gagal menyimpan pegawai.' });
            } else {
                const text = await res.text();
                console.error('Server error:', text.slice(0, 200));
                setErrors({ nama: `Server error ${res.status}. Silakan coba lagi.` });
            }
        } catch {
            setErrors({ nama: 'Terjadi kesalahan jaringan. Silakan coba lagi.' });
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
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

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
                            <span className={cn(
                                'ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium',
                                p.status_kepegawaian === 'PNS'
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-orange-600 bg-orange-50'
                            )}>
                                {p.gol_ruang || p.status_kepegawaian}
                            </span>
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

// ── Icon Action with Tooltip ──────────────────────────────────────────────────

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
                    className={cn('p-1.5 rounded transition-colors', className)}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
        </Tooltip>
    );
}

// ── Honor Nominatif Table ─────────────────────────────────────────────────────

function HonorNominatifTable({
    itemId,
    kodeAkun,
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
    showJabatan,
    itemTotal,
}: {
    itemId: number;
    kodeAkun: string;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    showJabatan: boolean;
    itemTotal: number;
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
        onChange(idx, 'pph21_persen', peg?.pph21_persen ?? '0');
    };

    const totalNominatif = rows.reduce((s, r) => {
        const vol = parseFloat(r.volume) || 0;
        const harga = parseFloat(r.harga_satuan) || 0;
        return s + (vol * harga);
    }, 0);

    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;

    return (
        <div className="mt-3">
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b bg-orange-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48">Nama</th>
                            {showJabatan && <th className="text-left px-2 py-1.5 w-32">Jabatan</th>}
                            <th className="text-right px-2 py-1.5 w-16">Vol</th>
                            <th className="text-right px-2 py-1.5 w-28">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-16">PPh21%</th>
                            <th className="text-right px-2 py-1.5 w-28">Bruto</th>
                            <th className="text-right px-2 py-1.5 w-28">Pajak</th>
                            <th className="text-right px-2 py-1.5 w-28">Diterima</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const vol = parseFloat(row.volume) || 0;
                            const harga = parseFloat(row.harga_satuan) || 0;
                            const bruto = vol * harga;
                            const pph21 = parseFloat(row.pph21_persen) || 0;
                            const pajak = bruto * pph21 / 100;
                            const diterima = bruto - pajak;

                            const matchedPegawai = row.ref_nama_id
                                ? refNama.find(p => p.id === Number(row.ref_nama_id))
                                : row.nama ? refNama.find(p => p.nama === row.nama) : null;

                            return (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/50">
                                    <td className="px-2 py-1.5 align-top">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                        />
                                        {matchedPegawai && (
                                            <div className="mt-0.5 flex items-center gap-1">
                                                <span className={cn('text-[9px] px-1 py-0.5 rounded', statusColor(matchedPegawai.status_kepegawaian))}>
                                                    {matchedPegawai.status_kepegawaian}
                                                </span>
                                                {matchedPegawai.nip && <span className="text-[9px] text-muted-foreground">{matchedPegawai.nip}</span>}
                                            </div>
                                        )}
                                    </td>
                                    {showJabatan && (
                                        <td className="px-2 py-1.5 align-top">
                                            <Select value={row.jabatan} onValueChange={v => onChange(idx, 'jabatan', v)}>
                                                <SelectTrigger className="h-7 text-xs">
                                                    <SelectValue placeholder="Jabatan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {JABATAN_OPTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                    )}
                                    <td className="px-2 py-1.5 align-top">
                                        <Input
                                            type="number" min="0" step="0.5"
                                            value={row.volume}
                                            onChange={e => onChange(idx, 'volume', e.target.value)}
                                            className="h-7 text-xs text-right"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input
                                            type="number" min="0"
                                            value={row.harga_satuan}
                                            onChange={e => onChange(idx, 'harga_satuan', e.target.value)}
                                            className="h-7 text-xs text-right"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input
                                            type="number" min="0" max="100" step="0.5"
                                            value={row.pph21_persen}
                                            onChange={e => onChange(idx, 'pph21_persen', e.target.value)}
                                            className="h-7 text-xs text-right"
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-gray-700">{fmt(bruto)}</td>
                                    <td className="px-2 py-1.5 text-right tabular-nums text-amber-600">{fmt(pajak)}</td>
                                    <td className="px-2 py-1.5 text-right tabular-nums font-medium text-emerald-700">{fmt(diterima)}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <ActionBtn
                                            title="Hapus peserta"
                                            onClick={() => onRemove(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </ActionBtn>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50">
                            <td colSpan={showJabatan ? 5 : 4} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">
                                Total Nominatif:
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-gray-800">{fmt(totalNominatif)}</td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-amber-600">
                                {fmt(rows.reduce((s, r) => {
                                    const vol = parseFloat(r.volume) || 0;
                                    const harga = parseFloat(r.harga_satuan) || 0;
                                    const bruto = vol * harga;
                                    const pph = parseFloat(r.pph21_persen) || 0;
                                    return s + (bruto * pph / 100);
                                }, 0))}
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-emerald-700">
                                {fmt(rows.reduce((s, r) => {
                                    const vol = parseFloat(r.volume) || 0;
                                    const harga = parseFloat(r.harga_satuan) || 0;
                                    const bruto = vol * harga;
                                    const pph = parseFloat(r.pph21_persen) || 0;
                                    return s + (bruto - (bruto * pph / 100));
                                }, 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    className="h-7 text-xs gap-1 text-orange-600 border-orange-200 hover:text-orange-700 hover:bg-orange-50"
                >
                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                </Button>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Jml Permintaan (Rincian):</span>
                    <span className="font-semibold tabular-nums">Rp {fmt(itemTotal)}</span>
                    <span className="mx-1">|</span>
                    <span className="text-muted-foreground">Nominatif:</span>
                    <span className={cn('font-semibold tabular-nums', isMatch ? 'text-emerald-600' : 'text-red-600')}>
                        Rp {fmt(totalNominatif)}
                        {!isMatch && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </span>
                </div>
            </div>
            {!isMatch && (
                <p className="text-xs text-red-600 mt-1">
                    Total nominatif (Rp {fmt(totalNominatif)}) tidak sama dengan jumlah permintaan (Rp {fmt(itemTotal)}). Selisih: Rp {fmt(Math.abs(totalNominatif - itemTotal))}
                </p>
            )}
        </div>
    );
}

// ── Perjadin Nominatif Table ──────────────────────────────────────────────────

function PerjadinNominatifTable({
    itemId,
    kodeAkun,
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
    itemTotal,
}: {
    itemId: number;
    kodeAkun: string;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    itemTotal: number;
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

    const calcJumlah = (vol: string, sat: string) => (parseFloat(vol) || 0) * (parseFloat(sat) || 0);

    const totalNominatif = rows.reduce((s, r) => {
        const uh = calcJumlah(r.uang_harian_vol, r.uang_harian_satuan);
        const fb = calcJumlah(r.fullboard_vol, r.fullboard_satuan);
        const fd = calcJumlah(r.fullday_vol, r.fullday_satuan);
        return s + (parseFloat(r.transport) || 0) + uh + fb + fd
            + (parseFloat(r.representasi) || 0) + (parseFloat(r.taksi_pp) || 0)
            + (parseFloat(r.tiket_pesawat) || 0) + (parseFloat(r.hotel) || 0);
    }, 0);

    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;

    return (
        <div className="mt-3">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 900 }}>
                    <thead>
                        <tr className="border-b bg-blue-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48">Nama</th>
                            <th className="text-right px-2 py-1.5 w-20">Transport</th>
                            <th className="text-right px-2 py-1.5 w-20">UH Biasa</th>
                            <th className="text-right px-2 py-1.5 w-20">UH Fullboard</th>
                            <th className="text-right px-2 py-1.5 w-20">UH Fullday</th>
                            <th className="text-right px-2 py-1.5 w-20">Representasi</th>
                            <th className="text-right px-2 py-1.5 w-20">Taksi PP</th>
                            <th className="text-right px-2 py-1.5 w-20">Tiket</th>
                            <th className="text-right px-2 py-1.5 w-20">Hotel</th>
                            <th className="text-right px-2 py-1.5 w-24">Total</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const uhJml = calcJumlah(row.uang_harian_vol, row.uang_harian_satuan);
                            const fbJml = calcJumlah(row.fullboard_vol, row.fullboard_satuan);
                            const fdJml = calcJumlah(row.fullday_vol, row.fullday_satuan);
                            const total = (parseFloat(row.transport) || 0) + uhJml + fbJml + fdJml
                                + (parseFloat(row.representasi) || 0) + (parseFloat(row.taksi_pp) || 0)
                                + (parseFloat(row.tiket_pesawat) || 0) + (parseFloat(row.hotel) || 0);

                            const matchedPegawai = row.ref_nama_id
                                ? refNama.find(p => p.id === Number(row.ref_nama_id))
                                : row.nama ? refNama.find(p => p.nama === row.nama) : null;

                            return (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/50">
                                    <td className="px-2 py-1.5 align-top">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                        />
                                        {matchedPegawai && (
                                            <div className="mt-0.5 flex items-center gap-1">
                                                <span className={cn('text-[9px] px-1 py-0.5 rounded', statusColor(matchedPegawai.status_kepegawaian))}>
                                                    {matchedPegawai.status_kepegawaian}
                                                </span>
                                                {matchedPegawai.nip && <span className="text-[9px] text-muted-foreground">{matchedPegawai.nip}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input type="number" min="0" value={row.transport} onChange={e => onChange(idx, 'transport', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <div className="flex gap-1">
                                            <Input type="number" min="0" value={row.uang_harian_vol} onChange={e => onChange(idx, 'uang_harian_vol', e.target.value)} className="h-7 text-xs text-right w-12 px-1" placeholder="Vol" />
                                            <Input type="number" min="0" value={row.uang_harian_satuan} onChange={e => onChange(idx, 'uang_harian_satuan', e.target.value)} className="h-7 text-xs text-right w-16 px-1" placeholder="Hrg" />
                                        </div>
                                        <div className="text-right text-[10px] text-gray-500 mt-0.5">{fmt(uhJml)}</div>
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <div className="flex gap-1">
                                            <Input type="number" min="0" value={row.fullboard_vol} onChange={e => onChange(idx, 'fullboard_vol', e.target.value)} className="h-7 text-xs text-right w-12 px-1" placeholder="Vol" />
                                            <Input type="number" min="0" value={row.fullboard_satuan} onChange={e => onChange(idx, 'fullboard_satuan', e.target.value)} className="h-7 text-xs text-right w-16 px-1" placeholder="Hrg" />
                                        </div>
                                        <div className="text-right text-[10px] text-gray-500 mt-0.5">{fmt(fbJml)}</div>
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <div className="flex gap-1">
                                            <Input type="number" min="0" value={row.fullday_vol} onChange={e => onChange(idx, 'fullday_vol', e.target.value)} className="h-7 text-xs text-right w-12 px-1" placeholder="Vol" />
                                            <Input type="number" min="0" value={row.fullday_satuan} onChange={e => onChange(idx, 'fullday_satuan', e.target.value)} className="h-7 text-xs text-right w-16 px-1" placeholder="Hrg" />
                                        </div>
                                        <div className="text-right text-[10px] text-gray-500 mt-0.5">{fmt(fdJml)}</div>
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input type="number" min="0" value={row.representasi} onChange={e => onChange(idx, 'representasi', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input type="number" min="0" value={row.taksi_pp} onChange={e => onChange(idx, 'taksi_pp', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input type="number" min="0" value={row.tiket_pesawat} onChange={e => onChange(idx, 'tiket_pesawat', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top">
                                        <Input type="number" min="0" value={row.hotel} onChange={e => onChange(idx, 'hotel', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700">{fmt(total)}</td>
                                    <td className="px-2 py-1.5 text-center">
                                        <ActionBtn
                                            title="Hapus peserta"
                                            onClick={() => onRemove(idx)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </ActionBtn>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50">
                            <td colSpan={9} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">
                                Total Nominatif:
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700">
                                {fmt(totalNominatif)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Plus className="h-3.5 w-3.5" /> Tambah Peserta
                </Button>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Jml Permintaan (Rincian):</span>
                    <span className="font-semibold tabular-nums">Rp {fmt(itemTotal)}</span>
                    <span className="mx-1">|</span>
                    <span className="text-muted-foreground">Nominatif:</span>
                    <span className={cn('font-semibold tabular-nums', isMatch ? 'text-emerald-600' : 'text-red-600')}>
                        Rp {fmt(totalNominatif)}
                        {!isMatch && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                    </span>
                </div>
            </div>
            {!isMatch && (
                <p className="text-xs text-red-600 mt-1">
                    Total nominatif (Rp {fmt(totalNominatif)}) tidak sama dengan jumlah permintaan (Rp {fmt(itemTotal)}). Selisih: Rp {fmt(Math.abs(totalNominatif - itemTotal))}
                </p>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Nominatif({ permohonan, rincian_biaya, ref_nama: initialRefNama }: Props) {
    const [saving, setSaving] = useState(false);
    const [refNama, setRefNama] = useState<RefNama[]>(initialRefNama);

    // Dialog tambah pegawai baru
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addDialogPrefill, setAddDialogPrefill] = useState('');
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

    // ── State: expanded items + nominatif rows ────────────────────────────────
    const [expanded, setExpanded] = useState<Set<number>>(() => {
        // Auto-expand items that need nominatif (honor/perjadin with volume > 0)
        const s = new Set<number>();
        rincian_biaya.flat().forEach(item => {
            if ((item.tipe_nominatif === 'honor' || item.tipe_nominatif === 'perjadin') && item.volume > 0) {
                s.add(item.id);
            }
        });
        return s;
    });

    const [nominatifRows, setNominatifRows] = useState<Record<number, NominatifRow[]>>(() => {
        const m: Record<number, NominatifRow[]> = {};
        rincian_biaya.flat().forEach(item => {
            if (item.nominatif.length > 0) {
                m[item.id] = item.nominatif.map(n => rowFromExisting(n, item.id));
            } else if (item.tipe_nominatif === 'honor' && item.volume > 0) {
                m[item.id] = [makeEmptyHonorRow(item.id, item.harga_satuan_aktual)];
            } else if (item.tipe_nominatif === 'perjadin' && item.volume > 0) {
                m[item.id] = [makeEmptyPerjadinRow(item.id)];
            } else {
                m[item.id] = [];
            }
        });
        return m;
    });

    const toggleExpand = (itemId: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const setRow = (itemId: number, idx: number, f: keyof NominatifRow, v: string) =>
        setNominatifRows(prev => {
            const rows = [...(prev[itemId] ?? [])];
            rows[idx] = { ...rows[idx], [f]: v };
            return { ...prev, [itemId]: rows };
        });

    const addRow = (item: RincianItem) =>
        setNominatifRows(prev => {
            const rows = [...(prev[item.id] ?? [])];
            if (item.tipe_nominatif === 'honor') {
                rows.push(makeEmptyHonorRow(item.id, item.harga_satuan_aktual));
            } else {
                rows.push(makeEmptyPerjadinRow(item.id));
            }
            return { ...prev, [item.id]: rows };
        });

    const removeRow = (itemId: number, idx: number) =>
        setNominatifRows(prev => ({
            ...prev,
            [itemId]: (prev[itemId] ?? []).filter((_, i) => i !== idx),
        }));

    // ── Validation ────────────────────────────────────────────────────────────
    const isItemValid = (item: RincianItem) => {
        if (item.tipe_nominatif === 'non_nominatif') return true;
        if (item.volume === 0) return true; // no nominatif needed
        const rows = nominatifRows[item.id] ?? [];
        if (rows.length === 0) return false;

        // Check total match
        let totalNominatif = 0;
        if (item.tipe_nominatif === 'honor') {
            totalNominatif = rows.reduce((s, r) => {
                const vol = parseFloat(r.volume) || 0;
                const harga = parseFloat(r.harga_satuan) || 0;
                return s + (vol * harga);
            }, 0);
        } else if (item.tipe_nominatif === 'perjadin') {
            totalNominatif = rows.reduce((s, r) => {
                const uh = (parseFloat(r.uang_harian_vol) || 0) * (parseFloat(r.uang_harian_satuan) || 0);
                const fb = (parseFloat(r.fullboard_vol) || 0) * (parseFloat(r.fullboard_satuan) || 0);
                const fd = (parseFloat(r.fullday_vol) || 0) * (parseFloat(r.fullday_satuan) || 0);
                return s + (parseFloat(r.transport) || 0) + uh + fb + fd
                    + (parseFloat(r.representasi) || 0) + (parseFloat(r.taksi_pp) || 0)
                    + (parseFloat(r.tiket_pesawat) || 0) + (parseFloat(r.hotel) || 0);
            }, 0);
        }
        return Math.abs(totalNominatif - item.total) <= 0.01;
    };

    const invalidItems = rincian_biaya.flat().filter(item =>
        (item.tipe_nominatif === 'honor' || item.tipe_nominatif === 'perjadin') &&
        item.volume > 0 &&
        !isItemValid(item)
    );

    const canSave = invalidItems.length === 0;

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = () => {
        if (!canSave) {
            toast.error('Terdapat item yang total nominatifnya tidak sesuai dengan rincian biaya.');
            return;
        }

        const payload: NominatifRow[] = [];
        rincian_biaya.flat().forEach(item => {
            if (item.tipe_nominatif === 'non_nominatif' || item.volume === 0) return;
            const rows = nominatifRows[item.id] ?? [];
            rows.forEach(row => payload.push(row));
        });

        setSaving(true);
        router.post(
            `/pumk/permohonan-dana/${permohonan.id}/nominatif/simpan`,
            { nominatif: payload },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onError: (errs: Record<string, string>) => {
                    toast.error(Object.values(errs)[0] ?? 'Gagal menyimpan nominatif.');
                },
            },
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout>
            <Head title={`Nominatif - ${permohonan.nomor_permohonan}`} />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1 mb-3"
                            onClick={() => router.visit('/pumk/permohonan-dana')}
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
                        </Button>
                        <h1 className="text-xl font-bold text-gray-900">Input Nominatif</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {permohonan.nomor_permohonan} — {permohonan.keperluan}
                        </p>
                        <Badge variant={permohonan.status === 'draft' ? 'outline' : 'secondary'} className="mt-2 text-xs">
                            {permohonan.status_label}
                        </Badge>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !canSave}
                        className="h-9 text-sm gap-2"
                    >
                        {saving ? 'Menyimpan...' : <><Save className="h-4 w-4" /> Simpan Nominatif</>}
                    </Button>
                </div>

                {/* Summary of invalid items */}
                {invalidItems.length > 0 && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">
                                    Total nominatif belum sesuai dengan rincian biaya
                                </p>
                                <p className="text-xs text-red-700 mt-0.5">
                                    Item berikut memerlukan perbaikan:
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {invalidItems.map(item => {
                                        const rows = nominatifRows[item.id] ?? [];
                                        let totalNominatif = 0;
                                        if (item.tipe_nominatif === 'honor') {
                                            totalNominatif = rows.reduce((s, r) => {
                                                const vol = parseFloat(r.volume) || 0;
                                                const harga = parseFloat(r.harga_satuan) || 0;
                                                return s + (vol * harga);
                                            }, 0);
                                        } else {
                                            totalNominatif = rows.reduce((s, r) => {
                                                const uh = (parseFloat(r.uang_harian_vol) || 0) * (parseFloat(r.uang_harian_satuan) || 0);
                                                const fb = (parseFloat(r.fullboard_vol) || 0) * (parseFloat(r.fullboard_satuan) || 0);
                                                const fd = (parseFloat(r.fullday_vol) || 0) * (parseFloat(r.fullday_satuan) || 0);
                                                return s + (parseFloat(r.transport) || 0) + uh + fb + fd
                                                    + (parseFloat(r.representasi) || 0) + (parseFloat(r.taksi_pp) || 0)
                                                    + (parseFloat(r.tiket_pesawat) || 0) + (parseFloat(r.hotel) || 0);
                                            }, 0);
                                        }
                                        return (
                                            <li key={item.id} className="text-xs text-red-800">
                                                <span className="font-mono font-bold">[{item.kode_akun}]</span>{' '}
                                                {item.nama_item}
                                                <span className="block text-red-600 mt-0.5">
                                                    Nominatif: Rp {fmt(totalNominatif)} ≠ Rincian: Rp {fmt(item.total)}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rincian Biaya Cards */}
                <div className="space-y-6">
                    {rincian_biaya.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Tidak ada rincian biaya yang memerlukan nominatif.</p>
                    ) : (
                        rincian_biaya.map((group, gi) => {
                            const first = group[0];
                            return (
                                <Card key={gi} className="overflow-hidden">
                                    <CardHeader className="bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {first.kode_akun}
                                                </Badge>
                                                <span className="text-sm font-semibold text-gray-700">{first.nama_akun}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">
                                                Pagu: <span className="text-gray-700 font-bold">Rp {fmt(group.reduce((s, item) => s + Number(item.pagu_total ?? 0), 0))}</span>
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        <th className="text-left px-3 py-2">Uraian</th>
                                                        <th className="text-right px-2 py-2 w-28">Pagu Anggaran</th>
                                                        <th className="text-center px-2 py-2 w-16">Vol</th>
                                                        <th className="text-center px-2 py-2 w-14">Sat.</th>
                                                        <th className="text-right px-2 py-2 w-32">Harga Satuan</th>
                                                        <th className="text-right px-2 py-2 w-28 text-orange-600">Terpakai</th>
                                                        <th className="text-right px-2 py-2 w-32 text-blue-700">Jml Permintaan</th>
                                                        <th className="text-right px-3 py-2 w-28 text-emerald-600">Sisa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.map(item => (
                                                        <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                            <td className="px-3 py-2 text-gray-700 leading-snug">{item.nama_item}</td>
                                                            <td className="px-2 py-2 text-right text-gray-600 font-medium whitespace-nowrap">{fmt(item.pagu_total ?? 0)}</td>
                                                            <td className="px-2 py-2 text-center font-medium">{fmt(item.volume ?? 0)}</td>
                                                            <td className="px-2 py-2 text-center text-gray-500">{item.satuan}</td>
                                                            <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap">
                                                                Rp {fmt(item.harga_satuan_aktual ?? 0)}
                                                                {item.harga_satuan_aktual < item.harga_satuan && (
                                                                    <span className="block text-[10px] text-amber-600">SBM: {fmt(item.harga_satuan)}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-2 text-right text-orange-600 whitespace-nowrap">{fmt(item.terpakai ?? 0)}</td>
                                                            <td className="px-2 py-2 text-right font-semibold whitespace-nowrap text-blue-700">Rp {fmt(item.total ?? 0)}</td>
                                                            <td className={cn('px-3 py-2 text-right whitespace-nowrap font-medium', (item.sisa_anggaran - item.total) < 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                                {fmt(Math.max(0, (item.sisa_anggaran ?? 0) - (item.total ?? 0)))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-gray-50 border-t">
                                                        <td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                                            Total {first.kode_akun}:
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 whitespace-nowrap">
                                                            Rp {fmt(group.reduce((s, item) => s + (item.total ?? 0), 0))}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Nominatif per item */}
                                        {group.map(item => {
                                            if (item.tipe_nominatif === 'non_nominatif' || item.volume === 0) return null;
                                            const isExpanded = expanded.has(item.id);
                                            const rows = nominatifRows[item.id] ?? [];
                                            const isValid = isItemValid(item);

                                            return (
                                                <div key={item.id} className="border-t bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-xs font-mono',
                                                                    item.tipe_nominatif === 'honor'
                                                                        ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                                                )}
                                                            >
                                                                {item.kode_akun}
                                                            </Badge>
                                                            <span className="text-xs font-medium text-gray-700">{item.nama_item}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                · {rows.length} peserta
                                                            </span>
                                                            {isValid ? (
                                                                <span className="text-[10px] text-emerald-600 font-medium">✓ Sesuai</span>
                                                            ) : (
                                                                <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                                                                    <AlertTriangle className="h-3 w-3" /> Belum sesuai
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            Jml Permintaan: <span className="font-semibold text-gray-700">Rp {fmt(item.total)}</span>
                                                        </span>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4">
                                                            {item.tipe_nominatif === 'honor' ? (
                                                                <HonorNominatifTable
                                                                    itemId={item.id}
                                                                    kodeAkun={item.kode_akun}
                                                                    rows={rows}
                                                                    onChange={(idx, f, v) => setRow(item.id, idx, f, v)}
                                                                    onAdd={() => addRow(item)}
                                                                    onRemove={(idx) => removeRow(item.id, idx)}
                                                                    refNama={refNama}
                                                                    onOpenAddDialog={openAddDialog}
                                                                    showJabatan={item.kode_akun !== '521115'}
                                                                    itemTotal={item.total}
                                                                />
                                                            ) : (
                                                                <PerjadinNominatifTable
                                                                    itemId={item.id}
                                                                    kodeAkun={item.kode_akun}
                                                                    rows={rows}
                                                                    onChange={(idx, f, v) => setRow(item.id, idx, f, v)}
                                                                    onAdd={() => addRow(item)}
                                                                    onRemove={(idx) => removeRow(item.id, idx)}
                                                                    refNama={refNama}
                                                                    onOpenAddDialog={openAddDialog}
                                                                    itemTotal={item.total}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            <TambahPegawaiDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSuccess={handleNewPegawai}
            />
        </AppLayout>
    );
}
