import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PegawaiComboboxRefNama } from '@/components/PegawaiCombobox';

const GOL_PNS = ['II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
const BANK_OPTIONS = ['BNI', 'BRI', 'Mandiri', 'BTN', 'BSI', 'BCA', 'Lainnya'];

type NewPegawaiForm = {
    nama: string; nip: string; nik: string; npwp: string;
    status_kepegawaian: string; gol_ruang: string;
    nama_rekening: string; no_rekening: string; nama_bank: string; email: string;
};

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (pegawai: PegawaiComboboxRefNama) => void;
}

export default function TambahPegawaiDialog({ open, onClose, onSuccess }: Props) {
    const [form, setForm] = useState<NewPegawaiForm>({
        nama: '', nip: '', nik: '', npwp: '',
        status_kepegawaian: 'PNS', gol_ruang: 'III/a',
        nama_rekening: '', no_rekening: '', nama_bank: '', email: '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
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
        if (v !== 'Lainnya') { set('nama_bank', v); setBankCustom(''); }
        else { set('nama_bank', bankCustom); }
    };

    const handleBankCustom = (v: string) => { setBankCustom(v); if (bankSelect === 'Lainnya') set('nama_bank', v); };

    const handleSubmit = async () => {
        setErrors({});
        if (bankSelect === 'Lainnya' && !bankCustom.trim()) { setErrors({ nama_bank: 'Nama bank wajib diisi' }); return; }

        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        const csrf = meta?.content;
        if (!csrf) { setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' }); return; }

        setSaving(true);
        try {
            const res = await fetch('/pumk/ref-pegawai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ ...form, gol_ruang: form.status_kepegawaian !== 'PNS' ? 'Non PNS' : form.gol_ruang }),
            });
            if (res.status === 419) { setErrors({ nama: 'Sesi telah berakhir. Silakan refresh halaman dan coba lagi.' }); return; }
            if (res.ok) {
                const data = await res.json();
                onSuccess(data);
                onClose();
                setForm({ nama: '', nip: '', nik: '', npwp: '', status_kepegawaian: 'PNS', gol_ruang: 'III/a', nama_rekening: '', no_rekening: '', nama_bank: '', email: '' });
                setBankSelect(''); setBankCustom('');
                return;
            }
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
        } finally { setSaving(false); }
    };

    const field = (label: string, key: keyof NewPegawaiForm, placeholder = '') => (
        <div className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                className={cn('h-8 text-sm', errors[key] && 'border-red-400')} />
            {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={o => !o && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader><DialogTitle>Tambah Pegawai Baru</DialogTitle></DialogHeader>
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
                                <SelectContent>{GOL_PNS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-1"><Label className="text-xs">Golongan/Ruang</Label><Input value="Non PNS" disabled className="h-8 text-sm bg-muted" /></div>
                    )}
                    {field('NIP', 'nip', 'Kosongkan jika Non-PNS')}
                    {field('NIK (KTP)', 'nik', '16 digit')}
                    {field('NPWP', 'npwp', 'Kosongkan jika tidak ada')}
                    {field('Email', 'email', 'email@domain.com')}
                    <div className="col-span-2 border-t pt-3"><p className="text-xs font-medium text-muted-foreground mb-2">Informasi Rekening Bank</p></div>
                    {field('Nama di Rekening', 'nama_rekening', 'Sesuai nama di rekening bank')}
                    {field('Nomor Rekening', 'no_rekening', '')}
                    <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Nama Bank</Label>
                        <Select value={bankSelect} onValueChange={handleBankSelect}>
                            <SelectTrigger className={cn('h-8 text-sm', errors.nama_bank && 'border-red-400')}><SelectValue placeholder="Pilih bank..." /></SelectTrigger>
                            <SelectContent>{BANK_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                        {bankSelect === 'Lainnya' && <Input className="h-8 text-sm mt-1.5" placeholder="Masukkan nama bank..." value={bankCustom} onChange={e => handleBankCustom(e.target.value)} />}
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
