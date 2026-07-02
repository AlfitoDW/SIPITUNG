import { Pencil, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    updated_at?: string;
};

const GOL_PNS = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];

// ── Dialog Edit Pegawai ─────────────────────────────────────────────────────

type EditPegawaiForm = {
    nama: string; nip: string; nik: string; npwp: string;
    status_kepegawaian: string; gol_ruang: string;
    nama_rekening: string; no_rekening: string; nama_bank: string; email: string;
};

export default function EditPegawaiDialog({
    open,
    onClose,
    onSuccess,
    onToggleStatus,
    pegawai,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: (pegawai: RefNama) => void;
    onToggleStatus: (pegawai: RefNama) => void;
    pegawai: RefNama | null;
}) {
    const [form, setForm] = useState<EditPegawaiForm>({
        nama: pegawai?.nama ?? '',
        nip: pegawai?.nip ?? '',
        nik: pegawai?.nik ?? '',
        npwp: pegawai?.npwp ?? '',
        status_kepegawaian: pegawai?.status_kepegawaian ?? 'PNS',
        gol_ruang: pegawai?.gol_ruang ?? 'III/a',
        nama_rekening: pegawai?.nama_rekening ?? '',
        no_rekening: pegawai?.no_rekening ?? '',
        nama_bank: pegawai?.nama_bank ?? '',
        email: pegawai?.email ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    const BANK_OPTIONS = ['BNI', 'BRI', 'Mandiri', 'BTN', 'BSI', 'BCA', 'Lainnya'];
    const [bankSelect, setBankSelect] = useState(
        BANK_OPTIONS.includes(pegawai?.nama_bank ?? '') ? (pegawai?.nama_bank ?? '') : (pegawai?.nama_bank ? 'Lainnya' : '')
    );
    const [bankCustom, setBankCustom] = useState(
        BANK_OPTIONS.includes(pegawai?.nama_bank ?? '') ? '' : (pegawai?.nama_bank ?? '')
    );

    const set = (k: keyof EditPegawaiForm, v: string) => {
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
        if (!pegawai) return;
        setErrors({});
        if (bankSelect === 'Lainnya' && !bankCustom.trim()) {
            setErrors({ nama_bank: 'Nama bank wajib diisi' });
            return;
        }

        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        const csrf = meta?.content;
        if (!csrf) {
            setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/pumk/ref-pegawai/${pegawai.id}`, {
                method: 'PUT',
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

            if (res.status === 419) {
                setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' });
                return;
            }

            if (res.ok) {
                const data: RefNama = await res.json();
                onSuccess(data);
                onClose();
                return;
            }

            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const err = await res.json();
                setErrors(err.errors || { nama: err.message || 'Gagal menyimpan perubahan.' });
            } else {
                setErrors({ nama: `Server error ${res.status}. Silakan coba lagi.` });
            }
        } catch {
            setErrors({ nama: 'Terjadi kesalahan jaringan. Silakan coba lagi.' });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!pegawai) return;
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        const csrf = meta?.content;
        if (!csrf) return;

        try {
            const res = await fetch(`/pumk/ref-pegawai/${pegawai.id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                const data = await res.json();
                onToggleStatus({ ...pegawai, ...data });
                setShowDeactivateConfirm(false);
                onClose();
            }
        } catch {
            setErrors({ nama: 'Gagal mengubah status pegawai.' });
        }
    };

    const field = (label: string, key: keyof EditPegawaiForm, placeholder = '') => (
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

    const lastUpdated = pegawai?.updated_at
        ? new Date(pegawai.updated_at).toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
        : null;

    if (!pegawai) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={o => !o && onClose()}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit Data Pegawai
                        </DialogTitle>
                    </DialogHeader>

                    {lastUpdated && (
                        <p className="text-[10px] text-muted-foreground -mt-2">
                            Terakhir diubah: {lastUpdated}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">{field('Nama Lengkap *', 'nama', 'Nama lengkap dengan gelar')}</div>

                        <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Status Kepegawaian</Label>
                            <Select value={form.status_kepegawaian} onValueChange={v => set('status_kepegawaian', v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PNS">PNS</SelectItem>
                                    <SelectItem value="Non-PNS">Non-PNS</SelectItem>
                                    <SelectItem value="P3K">P3K</SelectItem>
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

                    {errors.nama && <p className="text-xs text-red-500 mt-2">{errors.nama}</p>}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeactivateConfirm(true)}
                            disabled={saving}
                        >
                            Nonaktifkan
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                            {saving ? 'Menyimpan...' : <><Pencil className="h-4 w-4" /> Simpan Perubahan</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Deactivate Dialog */}
            <Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Nonaktifkan Pegawai?
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-600">
                        Pegawai <strong>{pegawai.nama}</strong> akan dinonaktifkan dan tidak akan muncul lagi di daftar pencarian.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        Data pegawai pada permohonan yang sudah dibuat tetap aman dan tidak berubah.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleToggleStatus}>
                            Ya, Nonaktifkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
