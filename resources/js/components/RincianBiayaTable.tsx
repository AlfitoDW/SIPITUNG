import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useState, Fragment } from 'react';
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

export interface RincianItem {
    id: number;
    kode_akun: string | null;
    uraian: string;
    volume: string | number;
    satuan: string;
    harga_satuan: string | number;
    total: string | number;
    pagu_total?: string | number;
    sbm?: string | number;
    terpakai?: string | number;
    sisa_anggaran?: string | number;
    nominatif?: NominatifItem[];
}

interface Props {
    items: RincianItem[];
    totalAnggaran: string | number;
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

// ── Honor sub-table ───────────────────────────────────────────────────────────

function HonorSubTable({ rows, satuan }: { rows: NominatifItem[]; satuan?: string }) {
    return (
        <div className="rounded-lg border border-orange-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-orange-100 text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-orange-200/60">Nama</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-orange-200/60">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-orange-200/60">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-14 border-r border-orange-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-14 border-r border-orange-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-24 border-r border-orange-200/60">Harga Sat</th>
                            <th className="text-right px-2 py-1.5 w-24 border-r border-orange-200/60">PPh 21</th>
                            <th className="text-right px-2 py-1.5 w-28">Diterima</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const vol = Number(r.volume);
                            const harga = Number(r.harga_satuan);
                            const pajak = Number(r.jumlah_pajak);
                            const diterima = Number(r.jumlah_diterima);

                            return (
                                <tr key={r.id} className="border-b last:border-0 even:bg-orange-50/30 hover:bg-amber-50/60 transition-colors">
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
                            <td colSpan={6} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">Total</td>
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
        </div>
    );
}

// ── Perjadin sub-table ────────────────────────────────────────────────────────

function PerjadinSubTable({ rows, satuan }: { rows: NominatifItem[]; satuan?: string }) {
    const totalNominatif = rows.reduce((s, r) => s + (Number(r.volume) * Number(r.harga_satuan)), 0);

    return (
        <div className="rounded-lg border border-blue-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 720 }}>
                    <thead>
                        <tr className="border-b bg-blue-100 text-[10px] font-semibold text-blue-800 uppercase tracking-wider">
                            <th className="text-left px-2 py-1.5 w-48 border-r border-blue-200/60">Nama</th>
                            <th className="text-left px-2 py-1.5 w-40 border-r border-blue-200/60">Detail Identitas</th>
                            <th className="text-left px-2 py-1.5 w-36 border-r border-blue-200/60">Rekening</th>
                            <th className="text-right px-2 py-1.5 w-14 border-r border-blue-200/60">Vol</th>
                            <th className="text-center px-2 py-1.5 w-14 border-r border-blue-200/60">Sat</th>
                            <th className="text-right px-2 py-1.5 w-24 border-r border-blue-200/60">Harga Sat</th>
                            <th className="text-right px-2 py-1.5 w-28">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const vol = Number(r.volume);
                            const harga = Number(r.harga_satuan);
                            const jumlah = vol * harga;

                            return (
                                <tr key={r.id} className="border-b last:border-0 even:bg-blue-50/30 hover:bg-blue-50/60 transition-colors">
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
                            <td colSpan={6} className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-600">Total</td>
                            <td className="px-2 py-1.5 text-right font-bold tabular-nums text-blue-700">{fmt(totalNominatif)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RincianBiayaTable({ items, totalAnggaran }: Props) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const toggleExpand = (id: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (items.length === 0) {
        return <p className="text-sm text-gray-400 text-center py-6">Belum ada rincian biaya</p>;
    }

    return (
        <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 1100 }}>
                <thead>
                    <tr className="bg-slate-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-2 py-2.5 text-center w-8"></th>
                        <th className="px-3 py-2.5 text-left">Kode Akun</th>
                        <th className="px-3 py-2.5 text-left">Uraian</th>
                        <th className="px-3 py-2.5 text-right w-28">Pagu</th>
                        <th className="px-3 py-2.5 text-right w-16">Vol</th>
                        <th className="px-3 py-2.5 text-left w-14">Sat</th>
                        <th className="px-3 py-2.5 text-right w-32">Harga Satuan</th>
                        <th className="px-3 py-2.5 text-right w-28 text-orange-600">Terpakai</th>
                        <th className="px-3 py-2.5 text-right w-32 text-blue-700">Jml Permintaan</th>
                        <th className="px-3 py-2.5 text-right w-28 text-emerald-600">Sisa</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {items.map(item => {
                        const tipe = getTipe(item.kode_akun);
                        const hasNominatif = tipe !== 'other';
                        const rows = item.nominatif ?? [];
                        const isExpanded = expanded.has(item.id);
                        const itemTotal = Number(item.total);
                        const totalNom = rows.reduce((s, r) => s + (Number(r.volume) * Number(r.harga_satuan)), 0);
                        const isMatch = rows.length > 0 && Math.abs(totalNom - itemTotal) <= 0.01;
                        const isHonor = tipe === 'honor';

                        return (
                            <Fragment key={item.id}>
                                <tr
                                    className={cn(
                                        'transition-colors',
                                        hasNominatif ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-gray-50/60',
                                        isExpanded && (isHonor ? 'bg-amber-50/40' : 'bg-blue-50/40')
                                    )}
                                    onClick={() => hasNominatif && toggleExpand(item.id)}
                                >
                                    <td className="px-2 py-2.5 text-center">
                                        {hasNominatif ? (
                                            isExpanded ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-slate-500 inline" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 inline" />
                                            )
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-2.5 font-mono text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <span>{item.kode_akun ?? '-'}</span>
                                            {hasNominatif ? (
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider',
                                                        isHonor
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    )}
                                                >
                                                    {isHonor ? 'Honor' : 'Perjadin'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                                                    Lainnya
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div>{item.uraian}</div>
                                        {hasNominatif && (
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                                <Users className="h-3 w-3 text-slate-400" />
                                                <span className="text-slate-500">{rows.length} peserta</span>
                                                {rows.length === 0 ? (
                                                    <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium">
                                                        <AlertTriangle className="h-2.5 w-2.5" /> Belum diisi
                                                    </span>
                                                ) : isMatch ? (
                                                    <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full font-medium">
                                                        <CheckCircle2 className="h-2.5 w-2.5" /> Sesuai
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full font-medium">
                                                        <AlertTriangle className="h-2.5 w-2.5" /> Tidak Sesuai
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(item.pagu_total ?? 0)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{Number(item.volume)}</td>
                                    <td className="px-3 py-2.5 text-muted-foreground">{item.satuan}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(item.harga_satuan)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-orange-600">{fmt(item.terpakai ?? 0)}</td>
                                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-blue-700">{fmt(item.total)}</td>
                                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">{fmt(Math.max(0, Number(item.sisa_anggaran ?? 0) - Number(item.total ?? 0)))}</td>
                                </tr>

                                {hasNominatif && isExpanded && (
                                    <tr className={cn(isHonor ? 'bg-amber-50/30' : 'bg-blue-50/30')}>
                                        <td colSpan={10} className="px-4 py-3">
                                            {rows.length === 0 ? (
                                                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 px-4 py-4 text-center text-xs text-amber-700">
                                                    ⚠️ Belum ada data peserta yang diisi oleh PUMK
                                                </div>
                                            ) : isHonor ? (
                                                <HonorSubTable rows={rows} satuan={item.satuan} />
                                            ) : (
                                                <PerjadinSubTable rows={rows} satuan={item.satuan} />
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-blue-50 border-t font-bold">
                        <td colSpan={8} className="px-3 py-2.5 text-right text-xs text-gray-600">Total Permintaan</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">{fmt(totalAnggaran)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
