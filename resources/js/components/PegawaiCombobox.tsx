import { Pencil, UserPlus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

interface Props {
    value: string;
    onChange: (nama: string, pegawai: RefNama | null) => void;
    options: RefNama[];
    onOpenAddDialog: (prefill: string, onSelect?: (peg: RefNama) => void) => void;
    onOpenEditDialog: (pegawai: RefNama) => void;
}

export type { RefNama as PegawaiComboboxRefNama };
export default function PegawaiCombobox({
    value, onChange, options, onOpenAddDialog, onOpenEditDialog,
}: Props) {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

    const reposition = useCallback(() => {
        if (!inputRef.current) return;
        const r = inputRef.current.getBoundingClientRect();
        setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: Math.max(280, r.width), zIndex: 9999 });
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
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = query.trim().length === 0
        ? options.slice(0, 30)
        : options.filter(p => p.nama.toLowerCase().includes(query.toLowerCase())).slice(0, 30);

    return (
        <div ref={containerRef} className="relative">
            <Input ref={inputRef} value={query}
                onChange={e => { setQuery(e.target.value); handleOpen(); if (!e.target.value) onChange('', null); }}
                onFocus={handleOpen} placeholder="Cari nama..." className="h-8 text-xs w-full" />
            {open && (
                <div style={style} className="rounded-md border bg-white shadow-xl text-xs max-h-60 overflow-y-auto">
                    <button className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600 border-b font-medium flex items-center gap-1.5 sticky top-0 bg-white"
                        onMouseDown={e => { e.preventDefault(); setOpen(false); onOpenAddDialog(query); }}>
                        <UserPlus className="h-3.5 w-3.5" />
                        Tambah pegawai baru{query.trim() ? ` "${query.trim()}"` : ''}
                    </button>
                    {filtered.length === 0 && (
                        <div className="px-3 py-3 text-muted-foreground text-center">Tidak ditemukan</div>
                    )}
                    {filtered.map(p => (
                        <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b last:border-0 group">
                            <button className="flex-1 text-left"
                                onMouseDown={e => { e.preventDefault(); setQuery(p.nama); onChange(p.nama, p); setOpen(false); }}>
                                <span className="font-medium">{p.nama}</span>
                                {p.nip && <span className="text-muted-foreground ml-2 text-[10px]">{p.nip}</span>}
                                <span className={cn('ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium',
                                    p.status_kepegawaian === 'PNS' ? 'text-blue-600 bg-blue-50' : p.status_kepegawaian === 'P3K' ? 'text-violet-600 bg-violet-50' : 'text-orange-600 bg-orange-50')}>
                                    {p.gol_ruang || p.status_kepegawaian}
                                </span>
                                {p.pph21_persen !== '0.00' && <span className="ml-1 text-[10px] text-amber-600">PPh21: {p.pph21_persen}%</span>}
                            </button>
                            <button onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setOpen(false); onOpenEditDialog(p); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-100 text-blue-500 transition-opacity" title="Edit data pegawai">
                                <Pencil className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
