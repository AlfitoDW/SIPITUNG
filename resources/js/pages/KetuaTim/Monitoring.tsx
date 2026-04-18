import { Head } from '@inertiajs/react';
import {
    CheckCircle2, Clock, AlertCircle, FileText, ChartNoAxesColumn,
    Loader2, Minus, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/ketua-tim/dashboard' },
    { title: 'Monitoring', href: '/ketua-tim/monitoring' },
];

type Tahun = { id: number; tahun: number; label: string } | null;
type TimKerja = { id: number; kode: string; nama: string; nama_singkat: string | null };
type RaIndikator = {
    id: number; kode: string; nama: string; satuan: string | null;
    target: string | null; target_tw1: string | null; target_tw2: string | null;
    target_tw3: string | null; target_tw4: string | null;
};
type RaEntry = { ra_id: number; peer_kode: string | null; peer_nama: string; status: string; indikators: RaIndikator[] };
type RaTimRow = {
    tim_kerja_id: number; tim_kerja_kode: string; tim_kerja_nama: string;
    best_status: string | null; ind_count: number; filled_count: number;
    peers: string[]; ras: RaEntry[];
};
type LaporanRow = {
    tim_kerja_id: number; tim_kerja_kode: string; tim_kerja_nama: string;
    status: string; submitted_at: string | null; approved_at: string | null;
};
type RealisasiRow = {
    iku_kode: string; iku_nama: string; iku_satuan: string | null;
    iku_target: string | null; realisasi: string | null; progress: string | null;
    kendala: string | null; input_by_kode: string | null; input_by_nama: string | null;
    pics: string[];
};
type SasaranRow = { sasaran_kode: string; sasaran_nama: string; indikators: RealisasiRow[] };
type PeriodeData = {
    periode_id: number; triwulan: string;
    laporans: LaporanRow[]; sasarans: SasaranRow[];
    iku_total: number; iku_filled: number;
};
type Props = {
    tahun: Tahun;
    allTim: TimKerja[];
    rasAll: RaTimRow[];
    laporanPerPeriode: PeriodeData[];
};

const RA_STATUS: Record<string, { label: string; dot: string; text: string; bg: string; spinner?: boolean }> = {
    draft:          { label: 'Draft',          dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950/20' },
    submitted:      { label: 'Menunggu Kabag', dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950/20',    spinner: true },
    kabag_approved: { label: 'Disetujui',      dot: 'bg-emerald-400',text: 'text-emerald-700',bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    rejected:       { label: 'Dikembalikan',   dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50 dark:bg-red-950/20' },
};

const LAPORAN_STATUS: Record<string, { icon: React.ElementType; text: string; label: string }> = {
    submitted:      { icon: Clock,         text: 'text-amber-600',  label: 'Menunggu' },
    kabag_approved: { icon: CheckCircle2,  text: 'text-emerald-600',label: 'Disetujui' },
    rejected:       { icon: AlertCircle,   text: 'text-red-600',    label: 'Dikembalikan' },
};

function StatusPill({ status }: { status: string | null }) {
    if (!status) return <span className="text-xs text-muted-foreground italic">Belum ada</span>;
    const cfg = RA_STATUS[status] ?? RA_STATUS['draft'];
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.spinner
                ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                : <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            }
            {cfg.label}
        </span>
    );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
    if (total === 0) return <span className="text-xs text-muted-foreground italic">–</span>;
    const pct = Math.round((value / total) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                <div className="h-full bg-[#003580] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground w-14 text-right shrink-0">{value}/{total} TW</span>
        </div>
    );
}

// ─── RA Tab ────────────────────────────────────────────────────────────────────

function RaTimRow({ row }: { row: RaTimRow; allTim?: TimKerja[] }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setExpanded(v => !v)}
            >
                <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{row.tim_kerja_kode}</span>
                        <span className="font-medium text-xs truncate">{row.tim_kerja_nama}</span>
                    </div>
                </td>
                <td className="py-3 pr-4">
                    <StatusPill status={row.best_status} />
                </td>
                <td className="py-3 pr-4 hidden md:table-cell">
                    {row.peers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {row.peers.map(p => (
                                <span key={p} className="text-[10px] font-mono bg-muted px-1 py-0.5 rounded text-muted-foreground">{p}</span>
                            ))}
                        </div>
                    ) : (
                        <Minus className="h-3 w-3 text-muted-foreground/40" />
                    )}
                </td>
                <td className="py-3 min-w-[140px]">
                    <ProgressBar value={row.filled_count} total={row.ind_count} />
                </td>
                <td className="py-3 pl-2 w-6">
                    {expanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
                    }
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={5} className="pb-4 px-0">
                        <div className="mx-0 rounded-lg border bg-muted/30 divide-y">
                            {row.ras.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic p-4">Belum ada data rencana aksi</p>
                            ) : row.ras.map(ra => (
                                <div key={ra.ra_id} className="p-4">
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <span className="text-xs font-semibold text-muted-foreground">Kelompok:</span>
                                        <span className="text-xs font-bold">{ra.peer_nama}</span>
                                        <StatusPill status={ra.status} />
                                    </div>
                                    {ra.indikators.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic">Belum ada indikator</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="pb-2 text-left font-medium text-muted-foreground pr-4 w-20">Kode</th>
                                                        <th className="pb-2 text-left font-medium text-muted-foreground pr-4">Indikator</th>
                                                        <th className="pb-2 text-left font-medium text-muted-foreground pr-3 w-20">Satuan</th>
                                                        <th className="pb-2 text-center font-medium text-muted-foreground px-2 w-14">TW1</th>
                                                        <th className="pb-2 text-center font-medium text-muted-foreground px-2 w-14">TW2</th>
                                                        <th className="pb-2 text-center font-medium text-muted-foreground px-2 w-14">TW3</th>
                                                        <th className="pb-2 text-center font-medium text-muted-foreground px-2 w-14">TW4</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {ra.indikators.map(ind => (
                                                        <tr key={ind.id} className="hover:bg-background/60 transition-colors">
                                                            <td className="py-2 pr-4 font-mono font-semibold text-[10px] text-muted-foreground">{ind.kode}</td>
                                                            <td className="py-2 pr-4 leading-snug">{ind.nama}</td>
                                                            <td className="py-2 pr-3 text-muted-foreground text-[10px]">{ind.satuan ?? '–'}</td>
                                                            {[ind.target_tw1, ind.target_tw2, ind.target_tw3, ind.target_tw4].map((t, i) => (
                                                                <td key={i} className="py-2 px-2 text-center tabular-nums">
                                                                    {t != null ? (
                                                                        <span className="font-semibold">{t}</span>
                                                                    ) : (
                                                                        <span className="text-muted-foreground/40">–</span>
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Pengukuran Tab ────────────────────────────────────────────────────────────

function PengukuranPeriode({ p, allTim }: { p: PeriodeData; allTim: TimKerja[] }) {
    const [view, setView] = useState<'status' | 'realisasi'>('status');
    const laporanByTim = Object.fromEntries(p.laporans.map(l => [l.tim_kerja_id, l]));

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="h-0.5 w-full bg-indigo-500" />
            <div className="p-4">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                            <ChartNoAxesColumn className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{p.triwulan}</p>
                            <p className="text-xs text-muted-foreground">
                                {p.iku_filled}/{p.iku_total} IKU terisi realisasi
                            </p>
                        </div>
                        {p.iku_total > 0 && (
                            <div className="flex items-center gap-2 ml-2">
                                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${Math.round((p.iku_filled / p.iku_total) * 100)}%` }} />
                                </div>
                                <span className="text-xs font-bold text-indigo-600 tabular-nums">
                                    {Math.round((p.iku_filled / p.iku_total) * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Toggle view */}
                    <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
                        {[
                            { key: 'status' as const, label: 'Status Tim' },
                            { key: 'realisasi' as const, label: 'Tabel Realisasi' },
                        ].map(({ key, label }) => (
                            <button key={key} onClick={() => setView(key)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                                    view === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Tim Grid */}
                {view === 'status' && (
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {allTim.map(t => {
                            const laporan = laporanByTim[t.id];
                            const cfg = laporan ? (LAPORAN_STATUS[laporan.status] ?? LAPORAN_STATUS['submitted']) : null;
                            const Icon = cfg?.icon;
                            return (
                                <div key={t.id} className={`rounded-lg border p-3 ${cfg ? '' : 'border-dashed opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-mono text-[10px] font-bold text-muted-foreground">{t.kode}</span>
                                        {Icon && <Icon className={`h-3.5 w-3.5 ${cfg!.text}`} />}
                                    </div>
                                    <p className="text-xs font-medium truncate">{t.nama_singkat ?? t.nama}</p>
                                    {cfg ? (
                                        <p className={`text-[11px] mt-0.5 ${cfg.text} font-medium`}>{cfg.label}</p>
                                    ) : (
                                        <p className="text-[11px] mt-0.5 text-muted-foreground">Belum submit</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Realisasi Table */}
                {view === 'realisasi' && (
                    p.sasarans.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-8">Belum ada realisasi yang diinput</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b">
                                        <th className="pb-3 text-left font-medium text-muted-foreground pr-3 w-16">Kode</th>
                                        <th className="pb-3 text-left font-medium text-muted-foreground pr-3">Indikator</th>
                                        <th className="pb-3 text-left font-medium text-muted-foreground pr-3 w-14">Target</th>
                                        <th className="pb-3 text-left font-medium text-muted-foreground pr-3 w-20">Realisasi</th>
                                        <th className="pb-3 text-left font-medium text-muted-foreground pr-3 hidden lg:table-cell">Progress</th>
                                        <th className="pb-3 text-left font-medium text-muted-foreground w-24">PIC / Input</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {p.sasarans.map(s => (
                                        <>
                                            <tr key={`s-${s.sasaran_kode}`} className="bg-muted/40">
                                                <td colSpan={6} className="py-2 px-1">
                                                    <span className="font-mono text-[10px] font-bold text-muted-foreground mr-2">{s.sasaran_kode}</span>
                                                    <span className="text-[11px] font-semibold">{s.sasaran_nama}</span>
                                                </td>
                                            </tr>
                                            {s.indikators.map((iku, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-2.5 pr-3 font-mono text-[10px] text-muted-foreground">{iku.iku_kode}</td>
                                                    <td className="py-2.5 pr-3 leading-snug">{iku.iku_nama}</td>
                                                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                                                        {iku.iku_target != null ? iku.iku_target : '–'}
                                                        {iku.iku_satuan && <span className="text-[10px] ml-0.5">{iku.iku_satuan}</span>}
                                                    </td>
                                                    <td className="py-2.5 pr-3 tabular-nums font-semibold">
                                                        {iku.realisasi != null ? (
                                                            <span className={iku.iku_target && Number(iku.realisasi) >= Number(iku.iku_target) ? 'text-emerald-600' : 'text-foreground'}>
                                                                {iku.realisasi}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground/40">–</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-3 hidden lg:table-cell max-w-[200px]">
                                                        <span className="line-clamp-2 text-muted-foreground leading-snug">{iku.progress ?? '–'}</span>
                                                    </td>
                                                    <td className="py-2.5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {iku.pics.map(p => (
                                                                <span key={p} className="font-mono text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">{p}</span>
                                                            ))}
                                                        </div>
                                                        {iku.input_by_kode && iku.input_by_kode !== iku.pics[0] && (
                                                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono">↑{iku.input_by_kode}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Monitoring({ tahun, allTim, rasAll, laporanPerPeriode }: Props) {
    const [activeTab, setActiveTab] = useState<'ra' | 'pengukuran'>('ra');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Semua Tim" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Monitoring</h1>
                    <p className="text-muted-foreground text-sm">
                        Data read-only — progres semua tim kerja {tahun ? `(${tahun.label})` : ''}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
                    {([
                        { key: 'ra' as const,         label: 'Rencana Aksi',       icon: FileText },
                        { key: 'pengukuran' as const, label: 'Pengukuran Kinerja', icon: ChartNoAxesColumn },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}>
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Rencana Aksi ── */}
                {activeTab === 'ra' && (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="h-0.5 w-full bg-[#003580]" />
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#003580]/10">
                                    <FileText className="h-4 w-4 text-[#003580]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Status Rencana Aksi</p>
                                    <p className="text-xs text-muted-foreground">{allTim.length} tim kerja — klik baris untuk lihat detail indikator</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Tim Kerja</th>
                                            <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                                            <th className="pb-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Kolaborator</th>
                                            <th className="pb-3 text-left text-xs font-medium text-muted-foreground">Target TW Terisi</th>
                                            <th className="pb-3 w-6" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {allTim.map(t => {
                                            const row = rasAll.find(r => r.tim_kerja_id === t.id);
                                            if (!row) {
                                                return (
                                                    <tr key={t.id} className="opacity-50">
                                                        <td className="py-3 pr-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-[11px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.kode}</span>
                                                                <span className="text-xs truncate">{t.nama_singkat ?? t.nama}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-xs text-muted-foreground italic" colSpan={4}>Belum ada RA</td>
                                                    </tr>
                                                );
                                            }
                                            return <RaTimRow key={t.id} row={row} allTim={allTim} />;
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Pengukuran Kinerja ── */}
                {activeTab === 'pengukuran' && (
                    <div className="space-y-4">
                        {laporanPerPeriode.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-12 text-center">
                                <ChartNoAxesColumn className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">Belum ada periode pengukuran aktif</p>
                            </div>
                        ) : (
                            laporanPerPeriode.map(p => (
                                <PengukuranPeriode key={p.periode_id} p={p} allTim={allTim} />
                            ))
                        )}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
