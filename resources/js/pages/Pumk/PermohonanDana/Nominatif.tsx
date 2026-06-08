import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, Save, ArrowLeft, AlertTriangle, UserPlus, ChevronDown, ChevronRight, CheckCircle2, Pencil } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
import EditPegawaiDialog from './EditPegawaiDialog';

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
    satuan: string;
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

// Hitung tarif PPh21 real-time (mirror logic PHP RefNama::hitungPph21)
function hitungPph21(status: string, gol: string | null, npwp: string | null): number {
    if (status === 'Non-PNS') {
        return npwp ? 3.0 : 2.5;
    }
    if (!gol) return 0;
    const g = gol.toUpperCase();
    if (g.startsWith('IV')) return 15.0;
    if (g.startsWith('III')) return 5.0;
    return 0.0;
}

const JABATAN_OPTIONS_521213 = [
    'Honorarium Penanggungjawab',
    'Honorarium Ketua',
    'Honorarium Wakil Ketua',
    'Honorarium Sekretaris',
    'Honorarium Anggota',
];

const JABATAN_OPTIONS_522151 = [
    'Honorarium Narasumber (Pejabat Eselon II)',
    'Honorarium Narasumber (Pejabat Eselon III)',
    'Honorarium Moderator',
    'Honorarium Redaktur (Managing Editor)',
    'Honorarium Penyunting/Editor',
    'Honorarium Sekretariat',
    'Honorarium Pembawa Acara',
];

function getJabatanOptions(kodeAkun: string): string[] {
    if (kodeAkun === '521213') return JABATAN_OPTIONS_521213;
    if (kodeAkun === '522151') return JABATAN_OPTIONS_522151;
    return [];
}

const GOL_PNS = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];

// ── Empty Row Factories ─────────────────────────────────────────────────────────

function makeEmptyHonorRow(itemId: number, satuan: string, hargaDefault: number, kodeAkun: string, rowIndex: number = 0): NominatifRow {
    const jabatanOptions = getJabatanOptions(kodeAkun);
    let defaultJabatan = '';
    if (kodeAkun === '521213') {
        if (rowIndex === 0) defaultJabatan = jabatanOptions[1] ?? ''; // Honorarium Ketua
        else if (rowIndex === 1) defaultJabatan = jabatanOptions[2] ?? ''; // Honorarium Wakil Ketua
    } else if (kodeAkun === '522151') {
        defaultJabatan = jabatanOptions[0] ?? ''; // Honorarium Narasumber (Pejabat Eselon II)
    }
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: defaultJabatan, volume: '1', satuan: satuan, harga_satuan: String(hargaDefault),
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function makeEmptyPerjadinRow(itemId: number, satuan: string, hargaSatuan: number): NominatifRow {
    return {
        item_id: itemId, ref_nama_id: null,
        nama: '', nip: '', nik: '', npwp: '', gol_ruang: '',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '', pph21_persen: '0',
        jabatan: '', volume: '1', satuan: satuan, harga_satuan: String(hargaSatuan),
        transport: '0', uang_harian_vol: '0', uang_harian_satuan: '0',
        fullboard_vol: '0', fullboard_satuan: '0', fullday_vol: '0', fullday_satuan: '0',
        representasi: '0', taksi_pp: '0', tiket_pesawat: '0', hotel: '0',
    };
}

function rowFromExisting(nom: RincianItem['nominatif'][0], itemId: number): NominatifRow {
    // For perjadin items with component data, compute generic total
    const perjadinTotal =
        (parseFloat(String(nom.transport)) || 0) +
        ((parseFloat(String(nom.uang_harian_vol)) || 0) * (parseFloat(String(nom.uang_harian_satuan)) || 0)) +
        ((parseFloat(String(nom.fullboard_vol)) || 0) * (parseFloat(String(nom.fullboard_satuan)) || 0)) +
        ((parseFloat(String(nom.fullday_vol)) || 0) * (parseFloat(String(nom.fullday_satuan)) || 0)) +
        (parseFloat(String(nom.representasi)) || 0) +
        (parseFloat(String(nom.taksi_pp)) || 0) +
        (parseFloat(String(nom.tiket_pesawat)) || 0) +
        (parseFloat(String(nom.hotel)) || 0);

    const isGeneric = perjadinTotal === 0 && (parseFloat(String(nom.harga_satuan)) || 0) > 0;

    return {
        item_id: itemId, ref_nama_id: nom.ref_nama_id,
        nama: nom.nama, nip: nom.nip ?? '', nik: nom.nik ?? '',
        npwp: nom.npwp ?? '', gol_ruang: nom.gol_ruang ?? '',
        nama_rekening: nom.nama_rekening ?? '', no_rekening: nom.no_rekening ?? '',
        nama_bank: nom.nama_bank ?? '', email: nom.email ?? '',
        pph21_persen: nom.pph21_persen,
        jabatan: nom.jabatan ?? '',
        volume: isGeneric ? nom.volume : (perjadinTotal > 0 ? '1' : nom.volume),
        satuan: '',
        harga_satuan: isGeneric ? nom.harga_satuan : (perjadinTotal > 0 ? String(perjadinTotal) : nom.harga_satuan),
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
    onOpenEditDialog,
}: {
    value: string;
    onChange: (nama: string, pegawai: RefNama | null) => void;
    options: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
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
                        <div
                            key={p.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b last:border-0 group"
                        >
                            <button
                                className="flex-1 text-left"
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
                            <button
                                onMouseDown={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(false);
                                    onOpenEditDialog(p);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 text-blue-500 transition-opacity"
                                title="Edit data pegawai"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                        </div>
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
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
    onOpenEditDialog,
    itemTotal,
    defaultSatuan,
    defaultHargaSatuan,
    kodeAkun,
}: {
    itemId: number;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
    itemTotal: number;
    defaultSatuan: string;
    defaultHargaSatuan: number;
    kodeAkun: string;
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
        const pph = peg ? String(hitungPph21(peg.status_kepegawaian, peg.gol_ruang, peg.npwp)) : '0';
        onChange(idx, 'pph21_persen', pph);
    };

    const totalNominatif = rows.reduce((s, r) => {
        const vol = parseFloat(r.volume) || 0;
        const harga = parseFloat(r.harga_satuan) || 0;
        return s + (vol * harga);
    }, 0);

    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;
    const jabatanOptions = getJabatanOptions(kodeAkun);

    return (
        <div className="mt-3 rounded-lg border border-orange-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-orange-100 text-[10px] font-semibold text-amber-800 uppercase tracking-wider shadow-sm">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-orange-200/60 last:border-r-0">Nama</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-orange-200/60 last:border-r-0">Jabatan</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-orange-200/60 last:border-r-0">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-orange-200/60 last:border-r-0">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-orange-200/60 last:border-r-0">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-orange-200/60 last:border-r-0">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-orange-200/60 last:border-r-0">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-orange-200/60 last:border-r-0">Jumlah</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const vol = parseFloat(row.volume) || 0;
                            const harga = parseFloat(row.harga_satuan) || 0;
                            const jumlah = vol * harga;

                            return (
                                <tr key={idx} className="border-b last:border-0 even:bg-orange-50/30 hover:bg-amber-50/60 transition-colors duration-150">
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                            onOpenEditDialog={onOpenEditDialog}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        {jabatanOptions.length > 0 ? (
                                            <Select value={row.jabatan} onValueChange={v => onChange(idx, 'jabatan', v)}>
                                                <SelectTrigger className="h-7 text-xs w-full">
                                                    <SelectValue placeholder="Pilih jabatan..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {jabatanOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100 last:border-r-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                {row.nik && <div><span className="text-gray-400">NIK:</span> {row.nik}</div>}
                                                {row.nip && <div><span className="text-gray-400">NIP:</span> {row.nip}</div>}
                                                {row.npwp && <div><span className="text-gray-400">NPWP:</span> {row.npwp}</div>}
                                                {row.gol_ruang && <div><span className="text-gray-400">Gol:</span> {row.gol_ruang}</div>}
                                            </div>
                                            {row.ref_nama_id && (
                                                <button
                                                    onClick={() => {
                                                        const peg = refNama.find(p => String(p.id) === String(row.ref_nama_id));
                                                        if (peg) onOpenEditDialog(peg);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-blue-100 text-blue-500 ml-1"
                                                    title="Edit data pegawai"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100 last:border-r-0">
                                        {row.no_rekening && <div><span className="text-gray-400">No.Rek:</span> {row.no_rekening}</div>}
                                        {row.nama_rekening && <div><span className="text-gray-400">a.n:</span> {row.nama_rekening}</div>}
                                        {row.nama_bank && <div><span className="text-gray-400">Bank:</span> {row.nama_bank}</div>}
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="number" min="0" step="0.5" value={row.volume} onChange={e => onChange(idx, 'volume', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="text" value={row.satuan || defaultSatuan} onChange={e => onChange(idx, 'satuan', e.target.value)} className="h-7 text-xs text-center" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="number" min="0" value={row.harga_satuan || String(defaultHargaSatuan)} onChange={e => onChange(idx, 'harga_satuan', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold tabular-nums text-orange-700 border-r border-slate-100 last:border-r-0">{fmt(jumlah)}</td>
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
                        <tr className="border-t-2 border-t-orange-200 bg-orange-50/60">
                            <td colSpan={7} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">
                                Total Nominatif:
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-orange-700">
                                {fmt(totalNominatif)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    className="h-7 text-xs gap-1 text-orange-700 border-orange-300 hover:text-white hover:bg-orange-500 hover:border-orange-500 transition-colors"
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
                <p className="text-xs text-red-600 mt-1 px-1">
                    Total nominatif (Rp {fmt(totalNominatif)}) tidak sama dengan jumlah permintaan (Rp {fmt(itemTotal)}). Selisih: Rp {fmt(Math.abs(totalNominatif - itemTotal))}
                </p>
            )}
        </div>
    );
}

// ── Perjadin Nominatif Table ──────────────────────────────────────────────────

function PerjadinNominatifTable({
    itemId,
    rows,
    onChange,
    onAdd,
    onRemove,
    refNama,
    onOpenAddDialog,
    onOpenEditDialog,
    itemTotal,
    defaultSatuan,
    defaultHargaSatuan,
}: {
    itemId: number;
    rows: NominatifRow[];
    onChange: (idx: number, field: keyof NominatifRow, val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    refNama: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
    itemTotal: number;
    defaultSatuan: string;
    defaultHargaSatuan: number;
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

    const totalNominatif = rows.reduce((s, r) => {
        const vol = parseFloat(r.volume) || 0;
        const harga = parseFloat(r.harga_satuan) || 0;
        return s + (vol * harga);
    }, 0);

    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;

    return (
        <div className="mt-3 rounded-lg border border-blue-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-blue-100 text-[10px] font-semibold text-blue-800 uppercase tracking-wider shadow-sm">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-blue-200/60 last:border-r-0">Nama</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-blue-200/60 last:border-r-0">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-blue-200/60 last:border-r-0">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-blue-200/60 last:border-r-0">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-blue-200/60 last:border-r-0">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-blue-200/60 last:border-r-0">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-blue-200/60 last:border-r-0">Jumlah</th>
                            <th className="text-center px-2 py-1.5 w-10">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => {
                            const vol = parseFloat(row.volume) || 0;
                            const harga = parseFloat(row.harga_satuan) || 0;
                            const jumlah = vol * harga;

                            return (
                                <tr key={idx} className="border-b last:border-0 even:bg-blue-50/30 hover:bg-sky-50/60 transition-colors duration-150">
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <PegawaiCombobox
                                            value={row.nama}
                                            options={refNama}
                                            onChange={(nama, peg) => fillFromPegawai(idx, nama, peg)}
                                            onOpenAddDialog={(prefill) => onOpenAddDialog(prefill, (peg) => fillFromPegawai(idx, peg.nama, peg))}
                                            onOpenEditDialog={onOpenEditDialog}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100 last:border-r-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                {row.nik && <div><span className="text-gray-400">NIK:</span> {row.nik}</div>}
                                                {row.nip && <div><span className="text-gray-400">NIP:</span> {row.nip}</div>}
                                                {row.npwp && <div><span className="text-gray-400">NPWP:</span> {row.npwp}</div>}
                                                {row.gol_ruang && <div><span className="text-gray-400">Gol:</span> {row.gol_ruang}</div>}
                                            </div>
                                            {row.ref_nama_id && (
                                                <button
                                                    onClick={() => {
                                                        const peg = refNama.find(p => String(p.id) === String(row.ref_nama_id));
                                                        if (peg) onOpenEditDialog(peg);
                                                    }}
                                                    className="p-0.5 rounded hover:bg-blue-100 text-blue-500 ml-1"
                                                    title="Edit data pegawai"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1.5 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100 last:border-r-0">
                                        {row.no_rekening && <div><span className="text-gray-400">No.Rek:</span> {row.no_rekening}</div>}
                                        {row.nama_rekening && <div><span className="text-gray-400">a.n:</span> {row.nama_rekening}</div>}
                                        {row.nama_bank && <div><span className="text-gray-400">Bank:</span> {row.nama_bank}</div>}
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="number" min="0" step="0.5" value={row.volume} onChange={e => onChange(idx, 'volume', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="text" value={row.harga_satuan ? defaultSatuan : ''} onChange={e => onChange(idx, 'satuan', e.target.value)} className="h-7 text-xs text-center" />
                                    </td>
                                    <td className="px-2 py-1.5 align-top border-r border-slate-100 last:border-r-0">
                                        <Input type="number" min="0" value={row.harga_satuan} onChange={e => onChange(idx, 'harga_satuan', e.target.value)} className="h-7 text-xs text-right" />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700 border-r border-slate-100 last:border-r-0">{fmt(jumlah)}</td>
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
                        <tr className="border-t-2 border-t-blue-200 bg-blue-50/60">
                            <td colSpan={6} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">
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

            <div className="flex items-center justify-between mt-2 px-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAdd}
                    className="h-7 text-xs gap-1 text-blue-700 border-blue-300 hover:text-white hover:bg-blue-500 hover:border-blue-500 transition-colors"
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
                <p className="text-xs text-red-600 mt-1 px-1">
                    Total nominatif (Rp {fmt(totalNominatif)}) tidak sama dengan jumlah permintaan (Rp {fmt(itemTotal)}). Selisih: Rp {fmt(Math.abs(totalNominatif - itemTotal))}
                </p>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Nominatif({ permohonan, rincian_biaya, ref_nama: initialRefNama }: Props) {
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
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

    // Dialog edit pegawai
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingPegawai, setEditingPegawai] = useState<RefNama | null>(null);

    const openEditDialog = (pegawai: RefNama) => {
        setEditingPegawai(pegawai);
        setEditDialogOpen(true);
    };

    const handleUpdatePegawai = (peg: RefNama) => {
        setRefNama(prev => {
            const next = prev.map(p => p.id === peg.id ? peg : p).sort((a, b) => a.nama.localeCompare(b.nama));
            return next;
        });

        // Update nominatif rows yang menggunakan pegawai ini
        setNominatifRows(prev => {
            const next: Record<number, NominatifRow[]> = {};
            Object.keys(prev).forEach(itemId => {
                const itemIdNum = Number(itemId);
                next[itemIdNum] = prev[itemIdNum].map(row => {
                    if (String(row.ref_nama_id) === String(peg.id)) {
                        return {
                            ...row,
                            nama: peg.nama,
                            nip: peg.nip ?? '',
                            nik: peg.nik ?? '',
                            npwp: peg.npwp ?? '',
                            gol_ruang: peg.gol_ruang ?? '',
                            nama_rekening: peg.nama_rekening ?? '',
                            no_rekening: peg.no_rekening ?? '',
                            nama_bank: peg.nama_bank ?? '',
                            email: peg.email ?? '',
                            pph21_persen: String(hitungPph21(peg.status_kepegawaian, peg.gol_ruang, peg.npwp)),
                        };
                    }
                    return row;
                });
            });
            return next;
        });

        setHasChanges(true);
        toast.success(`Data pegawai ${peg.nama} berhasil diperbarui.`);
    };

    const handleToggleStatusPegawai = (peg: RefNama) => {
        setRefNama(prev => prev.filter(p => p.id !== peg.id));
        toast.success(`Pegawai ${peg.nama} telah dinonaktifkan.`);
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
                m[item.id] = [makeEmptyHonorRow(item.id, item.satuan, item.harga_satuan_aktual, item.kode_akun)];
            } else if (item.tipe_nominatif === 'perjadin' && item.volume > 0) {
                m[item.id] = [makeEmptyPerjadinRow(item.id, item.satuan, item.harga_satuan_aktual)];
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

    const setRow = (itemId: number, idx: number, f: keyof NominatifRow, v: string) => {
        setHasChanges(true);
        setNominatifRows(prev => {
            const rows = [...(prev[itemId] ?? [])];
            rows[idx] = { ...rows[idx], [f]: v };
            return { ...prev, [itemId]: rows };
        });
    };

    const addRow = (item: RincianItem) => {
        setHasChanges(true);
        setNominatifRows(prev => {
            const rows = [...(prev[item.id] ?? [])];
            if (item.tipe_nominatif === 'honor') {
                rows.push(makeEmptyHonorRow(item.id, item.satuan, item.harga_satuan_aktual, item.kode_akun, rows.length));
            } else {
                rows.push(makeEmptyPerjadinRow(item.id, item.satuan, item.harga_satuan_aktual));
            }
            return { ...prev, [item.id]: rows };
        });
    };

    const removeRow = (itemId: number, idx: number) => {
        setHasChanges(true);
        setNominatifRows(prev => ({
            ...prev,
            [itemId]: (prev[itemId] ?? []).filter((_, i) => i !== idx),
        }));
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const isItemValid = (item: RincianItem) => {
        if (item.tipe_nominatif === 'non_nominatif') return true;
        if (item.volume === 0) return true; // no nominatif needed
        const rows = nominatifRows[item.id] ?? [];
        if (rows.length === 0) return false;

        // Check total match (generic: volume × harga_satuan for both honor and perjadin)
        const totalNominatif = rows.reduce((s, r) => {
            const vol = parseFloat(r.volume) || 0;
            const harga = parseFloat(r.harga_satuan) || 0;
            return s + (vol * harga);
        }, 0);
        return Math.abs(totalNominatif - Number(item.total)) <= 0.01;
    };

    const invalidItems = rincian_biaya.flat().filter(item =>
        (item.tipe_nominatif === 'honor' || item.tipe_nominatif === 'perjadin') &&
        item.volume > 0 &&
        !isItemValid(item)
    );

    const canSave = invalidItems.length === 0;

    // ── Beforeunload guard ────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasChanges]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = () => {
        if (!canSave) {
            const ok = window.confirm(
                `Ada ${invalidItems.length} item yang total nominatifnya belum sesuai dengan rincian biaya.\n\nYakin ingin menyimpan data saat ini?`
            );
            if (!ok) return;
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
                onSuccess: () => {
                    setHasChanges(false);
                    toast.success('Nominatif berhasil disimpan.');
                },
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
                        disabled={saving}
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
                                        const totalNominatif = rows.reduce((s, r) => {
                                            const vol = parseFloat(r.volume) || 0;
                                            const harga = parseFloat(r.harga_satuan) || 0;
                                            return s + (vol * harga);
                                        }, 0);
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
                                <Card key={gi} className="overflow-hidden shadow-sm border-slate-200">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 border-b border-slate-100">
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
                                                    <tr className="border-b bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase tracking-wider shadow-sm">
                                                        <th className="text-left px-3 py-2 border-r border-slate-200 last:border-r-0">Uraian</th>
                                                        <th className="text-right px-2 py-2 w-28 border-r border-slate-200 last:border-r-0">Pagu Anggaran</th>
                                                        <th className="text-center px-2 py-2 w-16 border-r border-slate-200 last:border-r-0">Vol</th>
                                                        <th className="text-center px-2 py-2 w-14 border-r border-slate-200 last:border-r-0">Sat.</th>
                                                        <th className="text-right px-2 py-2 w-32 border-r border-slate-200 last:border-r-0">Harga Satuan</th>
                                                        <th className="text-right px-2 py-2 w-28 text-orange-600 border-r border-slate-200 last:border-r-0">Terpakai</th>
                                                        <th className="text-right px-2 py-2 w-32 text-blue-700 border-r border-slate-200 last:border-r-0">Jml Permintaan</th>
                                                        <th className="text-right px-3 py-2 w-28 text-emerald-600">Sisa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.map(item => (
                                                        <tr key={item.id} className="border-b last:border-0 even:bg-slate-50/60 hover:bg-blue-50/40 transition-colors duration-150">
                                                            <td className="px-3 py-2 text-gray-700 leading-snug border-r border-slate-100 last:border-r-0">{item.nama_item}</td>
                                                            <td className="px-2 py-2 text-right text-gray-600 font-medium whitespace-nowrap border-r border-slate-100 last:border-r-0">{fmt(item.pagu_total ?? 0)}</td>
                                                            <td className="px-2 py-2 text-center font-medium border-r border-slate-100 last:border-r-0">{fmt(item.volume ?? 0)}</td>
                                                            <td className="px-2 py-2 text-center text-gray-500 border-r border-slate-100 last:border-r-0">{item.satuan}</td>
                                                            <td className="px-2 py-2 text-right text-gray-600 whitespace-nowrap border-r border-slate-100 last:border-r-0">
                                                                Rp {fmt(item.harga_satuan_aktual ?? 0)}
                                                                {item.harga_satuan_aktual < item.harga_satuan && (
                                                                    <span className="block text-[10px] text-amber-600">SBM: {fmt(item.harga_satuan)}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-2 text-right text-orange-600 whitespace-nowrap border-r border-slate-100 last:border-r-0">{fmt(item.terpakai ?? 0)}</td>
                                                            <td className="px-2 py-2 text-right font-semibold whitespace-nowrap text-blue-700 border-r border-slate-100 last:border-r-0">Rp {fmt(item.total ?? 0)}</td>
                                                            <td className={cn('px-3 py-2 text-right whitespace-nowrap font-medium', (item.sisa_anggaran - Number(item.total)) < 0 ? 'text-red-600' : 'text-emerald-600')}>
                                                                {fmt(Math.max(0, (item.sisa_anggaran ?? 0) - (item.total ?? 0)))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                    <tfoot>
                                                        <tr className="bg-slate-50/80 border-t-2 border-t-slate-200">
                                                        <td colSpan={6} className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                                            Total {first.kode_akun}:
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-xs font-bold text-blue-700 whitespace-nowrap">
                                                            Rp {fmt(group.reduce((s, item) => s + Number(item.total ?? 0), 0))}
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
                                                <div key={item.id} className={cn(
                                                    "border-t bg-white",
                                                    item.tipe_nominatif === 'honor'
                                                        ? 'border-l-4 border-l-amber-300'
                                                        : 'border-l-4 border-l-blue-300'
                                                )}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-xs font-mono shadow-sm',
                                                                    item.tipe_nominatif === 'honor'
                                                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                                                )}
                                                            >
                                                                {item.kode_akun}
                                                            </Badge>
                                                            <span className="text-xs font-semibold text-slate-700">{item.nama_item}</span>
                                                            <span className="text-xs text-slate-400">
                                                                · {rows.length} peserta
                                                            </span>
                                                            {isValid ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                                                                    <CheckCircle2 className="h-3 w-3" /> Sesuai
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-100">
                                                                    <AlertTriangle className="h-3 w-3" /> Belum sesuai
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400">
                                                            Jml Permintaan: <span className="font-semibold text-slate-700">Rp {fmt(item.total)}</span>
                                                        </span>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4">
                                                            {item.tipe_nominatif === 'honor' ? (
                                                                <>
                                                                    <HonorNominatifTable
                                                                        itemId={item.id}
                                                                        rows={rows}
                                                                        onChange={(idx, f, v) => setRow(item.id, idx, f, v)}
                                                                        onAdd={() => addRow(item)}
                                                                        onRemove={(idx) => removeRow(item.id, idx)}
                                                                        refNama={refNama}
                                                                        onOpenAddDialog={openAddDialog}
                                                                        onOpenEditDialog={openEditDialog}
                                                                        itemTotal={item.total}
                                                                        defaultSatuan={item.satuan}
                                                                        defaultHargaSatuan={item.harga_satuan_aktual}
                                                                        kodeAkun={item.kode_akun}
                                                                    />
                                                                </>
                                                            ) : (
                                                                <PerjadinNominatifTable
                                                                    itemId={item.id}
                                                                    rows={rows}
                                                                    onChange={(idx, f, v) => setRow(item.id, idx, f, v)}
                                                                    onAdd={() => addRow(item)}
                                                                    onRemove={(idx) => removeRow(item.id, idx)}
                                                                    refNama={refNama}
                                                                    onOpenAddDialog={openAddDialog}
                                                                    onOpenEditDialog={openEditDialog}
                                                                    itemTotal={item.total}
                                                                    defaultSatuan={item.satuan}
                                                                    defaultHargaSatuan={item.harga_satuan_aktual}
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

            {editingPegawai && (
                <EditPegawaiDialog
                    open={editDialogOpen}
                    onClose={() => { setEditDialogOpen(false); setEditingPegawai(null); }}
                    onSuccess={handleUpdatePegawai}
                    onToggleStatus={handleToggleStatusPegawai}
                    pegawai={editingPegawai}
                />
            )}
        </AppLayout>
    );
}
