import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NominatifItem {
    id: number;
    nama: string;
    nip: string | null;
    nik: string | null;
    npwp: string | null;
    gol_ruang: string | null;
    nama_rekening: string | null;
    no_rekening: string | null;
    nama_bank: string | null;
    email: string | null;
    pph21_persen: string | number;
    jabatan: string | null;
    volume: string | number;
    harga_satuan: string | number;
    jumlah_bruto: string | number;
    jumlah_pajak: string | number;
    jumlah_diterima: string | number;
    transport: string | number;
    uang_harian_jumlah: string | number;
    fullboard_jumlah: string | number;
    fullday_jumlah: string | number;
    representasi: string | number;
    taksi_pp: string | number;
    tiket_pesawat: string | number;
    hotel: string | number;
    jumlah_perjadin: string | number;
}

export interface ItemWithNominatif {
    id: number;
    kode_akun: string | null;
    uraian: string;
    satuan?: string;
    total: string | number;
    nominatif?: NominatifItem[];
}

interface Props {
    items: ItemWithNominatif[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: string | number | null | undefined) => {
    const num = Number(n);
    return new Intl.NumberFormat('id-ID').format(Number.isNaN(num) ? 0 : num);
};

const HONOR_AKUN = ['521115', '521213', '522151'];
const PERJADIN_AKUN = ['524111', '524113', '524114', '524119'];

const getTipe = (kode: string | null): 'honor' | 'perjadin' | 'other' => {
    if (!kode) return 'other';
    if (HONOR_AKUN.includes(kode)) return 'honor';
    if (PERJADIN_AKUN.includes(kode)) return 'perjadin';
    return 'other';
};

// ── Honor Table (read-only, seperti di Nominatif PUMK) ────────────────────────

function HonorTable({ rows, itemTotal, satuan }: { rows: NominatifItem[]; itemTotal: number; satuan?: string }) {
    const totalNominatif = rows.reduce(
        (s, r) => s + (Number(r.volume) * Number(r.harga_satuan)), 0
    );
    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;

    return (
        <div className="mt-3 rounded-lg border border-orange-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-orange-100 text-[10px] font-semibold text-amber-800 uppercase tracking-wider shadow-sm">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-orange-200/60">Nama</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-orange-200/60">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-orange-200/60">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-orange-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-orange-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-orange-200/60">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-24 border-r border-orange-200/60">PPh 21</th>
                            <th className="text-right px-2 py-1.5 w-28">Jumlah Diterima</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const vol = Number(r.volume);
                            const harga = Number(r.harga_satuan);
                            const bruto = vol * harga;
                            const pajak = Number(r.jumlah_pajak);
                            const diterima = Number(r.jumlah_diterima);

                            return (
                                <tr key={r.id} className="border-b last:border-0 even:bg-orange-50/30 hover:bg-amber-50/60 transition-colors duration-150">
                                    <td className="px-2 py-2 align-top border-r border-slate-100">
                                        <div className="font-medium text-slate-800">{r.nama}</div>
                                        {r.jabatan && (
                                            <div className="text-[10px] text-amber-700 mt-0.5">{r.jabatan}</div>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100">
                                        {r.nik && <div><span className="text-gray-400">NIK:</span> {r.nik}</div>}
                                        {r.nip && <div><span className="text-gray-400">NIP:</span> {r.nip}</div>}
                                        {r.npwp && <div><span className="text-gray-400">NPWP:</span> {r.npwp}</div>}
                                        {r.gol_ruang && <div><span className="text-gray-400">Gol:</span> {r.gol_ruang}</div>}
                                    </td>
                                    <td className="px-2 py-2 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100">
                                        {r.no_rekening && <div><span className="text-gray-400">No.Rek:</span> {r.no_rekening}</div>}
                                        {r.nama_rekening && <div><span className="text-gray-400">a.n:</span> {r.nama_rekening}</div>}
                                        {r.nama_bank && <div><span className="text-gray-400">Bank:</span> {r.nama_bank}</div>}
                                    </td>
                                    <td className="px-2 py-2 align-top text-right tabular-nums border-r border-slate-100">{vol}</td>
                                    <td className="px-2 py-2 align-top text-center text-muted-foreground border-r border-slate-100">{satuan ?? '-'}</td>
                                    <td className="px-2 py-2 align-top text-right tabular-nums border-r border-slate-100">{fmt(harga)}</td>
                                    <td className="px-2 py-2 align-top text-right tabular-nums border-r border-slate-100">
                                        <div className="text-amber-600 text-[10px]">{Number(r.pph21_persen)}%</div>
                                        <div className="text-amber-700 text-[11px]">{fmt(pajak)}</div>
                                    </td>
                                    <td className="px-2 py-2 align-top text-right font-bold tabular-nums text-emerald-700">{fmt(diterima)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-t-orange-200 bg-orange-50/60">
                            <td colSpan={6} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">
                                Total Nominatif:
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-amber-700 border-r border-slate-100">
                                {fmt(rows.reduce((s, r) => s + Number(r.jumlah_pajak), 0))}
                            </td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-emerald-700">
                                {fmt(rows.reduce((s, r) => s + Number(r.jumlah_diterima), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between mt-2 px-3 pb-2 text-xs">
                <span className="text-muted-foreground">{rows.length} peserta</span>
                <div className="flex items-center gap-2">
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
        </div>
    );
}

// ── Perjadin Table (read-only) ────────────────────────────────────────────────

function PerjadinTable({ rows, itemTotal, satuan }: { rows: NominatifItem[]; itemTotal: number; satuan?: string }) {
    const totalNominatif = rows.reduce(
        (s, r) => s + (Number(r.volume) * Number(r.harga_satuan)), 0
    );
    const isMatch = Math.abs(totalNominatif - itemTotal) <= 0.01;

    return (
        <div className="mt-3 rounded-lg border border-blue-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-blue-100 text-[10px] font-semibold text-blue-800 uppercase tracking-wider shadow-sm">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-blue-200/60">Nama</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-blue-200/60">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-blue-200/60">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-16 border-r border-blue-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-16 border-r border-blue-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-28 border-r border-blue-200/60">Harga Satuan</th>
                            <th className="text-right px-2 py-1.5 w-28">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const vol = Number(r.volume);
                            const harga = Number(r.harga_satuan);
                            const jumlah = vol * harga;

                            return (
                                <tr key={r.id} className="border-b last:border-0 even:bg-blue-50/30 hover:bg-blue-50/60 transition-colors duration-150">
                                    <td className="px-2 py-2 align-top border-r border-slate-100">
                                        <div className="font-medium text-slate-800">{r.nama}</div>
                                    </td>
                                    <td className="px-2 py-2 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100">
                                        {r.nik && <div><span className="text-gray-400">NIK:</span> {r.nik}</div>}
                                        {r.nip && <div><span className="text-gray-400">NIP:</span> {r.nip}</div>}
                                        {r.npwp && <div><span className="text-gray-400">NPWP:</span> {r.npwp}</div>}
                                        {r.gol_ruang && <div><span className="text-gray-400">Gol:</span> {r.gol_ruang}</div>}
                                    </td>
                                    <td className="px-2 py-2 align-top text-[10px] text-gray-600 leading-snug border-r border-slate-100">
                                        {r.no_rekening && <div><span className="text-gray-400">No.Rek:</span> {r.no_rekening}</div>}
                                        {r.nama_rekening && <div><span className="text-gray-400">a.n:</span> {r.nama_rekening}</div>}
                                        {r.nama_bank && <div><span className="text-gray-400">Bank:</span> {r.nama_bank}</div>}
                                    </td>
                                    <td className="px-2 py-2 align-top text-right tabular-nums border-r border-slate-100">{vol}</td>
                                    <td className="px-2 py-2 align-top text-center text-muted-foreground border-r border-slate-100">{satuan ?? '-'}</td>
                                    <td className="px-2 py-2 align-top text-right tabular-nums border-r border-slate-100">{fmt(harga)}</td>
                                    <td className="px-2 py-2 align-top text-right font-bold tabular-nums text-blue-700">{fmt(jumlah)}</td>
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
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex items-center justify-between mt-2 px-3 pb-2 text-xs">
                <span className="text-muted-foreground">{rows.length} peserta</span>
                <div className="flex items-center gap-2">
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
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NominatifViewer({ items }: Props) {
    const itemsNominatif = items.filter(i => getTipe(i.kode_akun) !== 'other');

    // Auto-expand semua items yang ada nominatifnya
    const [expanded, setExpanded] = useState<Set<number>>(() => {
        const s = new Set<number>();
        itemsNominatif.forEach(i => {
            if ((i.nominatif?.length ?? 0) > 0) s.add(i.id);
        });
        return s;
    });

    const toggleExpand = (id: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (itemsNominatif.length === 0) return null;

    const totalPeserta = itemsNominatif.reduce((s, i) => s + (i.nominatif?.length ?? 0), 0);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Daftar Nominatif Peserta</h3>
                {totalPeserta > 0 && (
                    <Badge variant="outline" className="text-xs">{totalPeserta} orang</Badge>
                )}
            </div>

            {itemsNominatif.map(item => {
                const tipe = getTipe(item.kode_akun);
                const rows = item.nominatif ?? [];
                const itemTotal = Number(item.total);
                const totalNominatif = rows.reduce((s, r) => s + (Number(r.volume) * Number(r.harga_satuan)), 0);
                const isValid = rows.length > 0 && Math.abs(totalNominatif - itemTotal) <= 0.01;
                const isExpanded = expanded.has(item.id);
                const isHonor = tipe === 'honor';

                return (
                    <div
                        key={item.id}
                        className={cn(
                            'rounded-lg border bg-white overflow-hidden',
                            isHonor ? 'border-l-4 border-l-amber-300' : 'border-l-4 border-l-blue-300'
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                )}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-xs font-mono shadow-sm',
                                        isHonor
                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                            : 'bg-blue-50 border-blue-200 text-blue-700'
                                    )}
                                >
                                    {item.kode_akun}
                                </Badge>
                                <span className="text-xs font-semibold text-slate-700">{item.uraian}</span>
                                <span className="text-xs text-slate-400">· {rows.length} peserta</span>
                                {rows.length === 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-100">
                                        <AlertTriangle className="h-3 w-3" /> Belum diisi
                                    </span>
                                ) : isValid ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                                        <CheckCircle2 className="h-3 w-3" /> Sesuai
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-100">
                                        <AlertTriangle className="h-3 w-3" /> Tidak Sesuai
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                                Jml Permintaan: <span className="font-semibold text-slate-700">Rp {fmt(itemTotal)}</span>
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4">
                                {rows.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-4 py-6 text-center text-xs text-amber-700">
                                        ⚠️ Belum ada data peserta yang diisi oleh PUMK
                                    </div>
                                ) : isHonor ? (
                                    <HonorTable rows={rows} itemTotal={itemTotal} satuan={item.satuan} />
                                ) : (
                                    <PerjadinTable rows={rows} itemTotal={itemTotal} satuan={item.satuan} />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
