import { Head, router } from '@inertiajs/react';
import { CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, Eye } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'kabag_umum' | 'ppk';

type PkIndikator = {
    id: number; kode: string; nama: string; satuan: string; target: string;
    pic_tim_kerjas: { id: number; nama: string }[];
};
type PkSasaran = { id: number; kode: string; nama: string; indikators: PkIndikator[] };
type PkItem = {
    id: number; tim_kerja_nama: string; tim_kerja_kode: string;
    status: string; rekomendasi_kabag: string | null;
    updated_at: string;
    sasarans: PkSasaran[];
};

type RaIndikator = {
    id: number; kode: string; nama: string; satuan: string; target: string;
    target_tw1: string | null; target_tw2: string | null;
    target_tw3: string | null; target_tw4: string | null;
    sasaran: { kode: string; nama: string } | null;
};
type RaItem = {
    id: number; tim_kerja_nama: string; tim_kerja_kode: string;
    status: string; rekomendasi_kabag: string | null;
    updated_at: string;
    indikators: RaIndikator[];
};

type LaporanItem = {
    id: number; tim_kerja_nama: string; tim_kerja_kode: string;
    status: string; rekomendasi_kabag: string | null;
    submitted_at: string | null; approved_at: string | null;
    periode_triwulan: string; periode_id: number;
};

type SelectedPk     = { type: 'pk_awal' | 'pk_revisi'; item: PkItem };
type SelectedRa     = { type: 'ra'; item: RaItem };
type SelectedLaporan = { type: 'laporan'; item: LaporanItem };
type Selected = SelectedPk | SelectedRa | SelectedLaporan;

type Props = {
    tahun: { id: number; tahun: number; label: string };
    pks_awal: PkItem[];
    pks_revisi: PkItem[];
    ras: RaItem[];
    laporans: LaporanItem[];
    role: Role;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Persetujuan', href: '/pimpinan/persetujuan' },
];

const STATUS_LABELS: Record<string, string> = {
    submitted:      'Menunggu Review',
    kabag_approved: 'Disetujui',
    rejected:       'Dikembalikan',
};

const STATUS_CLASSES: Record<string, string> = {
    submitted:      'bg-amber-50 text-amber-700 border-amber-300',
    kabag_approved: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    rejected:       'bg-red-50 text-red-700 border-red-300',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function canAct(status: string, _type: string, role: Role): boolean {
    return role === 'kabag_umum' && status === 'submitted';
}

function approveUrl(type: string, id: number): string {
    if (type === 'pk_awal' || type === 'pk_revisi') return `/pimpinan/perencanaan/perjanjian-kinerja/${id}/approve`;
    if (type === 'ra') return `/pimpinan/perencanaan/rencana-aksi/${id}/approve`;
    return `/pimpinan/pengukuran/${id}/approve`;
}

function rejectUrl(type: string, id: number): string {
    if (type === 'pk_awal' || type === 'pk_revisi') return `/pimpinan/perencanaan/perjanjian-kinerja/${id}/reject`;
    if (type === 'ra') return `/pimpinan/perencanaan/rencana-aksi/${id}/reject`;
    return `/pimpinan/pengukuran/${id}/reject`;
}

function rejectedCount(items: { status: string }[]): number {
    return items.filter(i => i.status === 'rejected').length;
}

function pendingCount(items: { status: string }[], role: Role): number {
    return role === 'kabag_umum' ? items.filter(i => i.status === 'submitted').length : 0;
}

function isPkSelected(s: Selected): s is SelectedPk {
    return s.type === 'pk_awal' || s.type === 'pk_revisi';
}

// ── Small components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function TabCount({ count, rejCount }: { count: number; rejCount?: number }) {
    return (
        <>
            {count > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
                    {count}
                </span>
            )}
            {(rejCount ?? 0) > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {rejCount}
                </span>
            )}
        </>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Tidak ada {label} yang perlu direview</p>
        </div>
    );
}

// ── Approval timeline for PK / RA ─────────────────────────────────────────────

function PkRaTimeline({ status, rekomendasiKabag }: {
    status: string; rekomendasiKabag: string | null;
}) {
    const steps = [
        { key: 'submitted',      label: 'Tim Kerja Submit' },
        { key: 'kabag_approved', label: 'Disetujui Kabag Umum' },
    ];
    const order = ['submitted', 'kabag_approved'];
    const currentIdx = order.indexOf(status === 'rejected' ? 'submitted' : status);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
                {steps.map((step, i) => {
                    const stepIdx = order.indexOf(step.key);
                    const done = stepIdx < currentIdx || status === 'kabag_approved';
                    const active = stepIdx === currentIdx && status === 'submitted';
                    const failed = status === 'rejected' && stepIdx === currentIdx;
                    return (
                        <Fragment key={step.key}>
                            {i > 0 && <span className="text-muted-foreground text-xs">→</span>}
                            <span className={`flex items-center gap-1 ${done ? 'text-green-600' : active ? 'text-amber-600 font-medium' : failed ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                {done   ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                                 failed ? <XCircle className="h-3.5 w-3.5" /> :
                                 active ? <Clock className="h-3.5 w-3.5" /> :
                                          <AlertCircle className="h-3.5 w-3.5" />}
                                {step.label}
                            </span>
                        </Fragment>
                    );
                })}
                {status === 'rejected' && (
                    <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                        <XCircle className="h-3.5 w-3.5" />
                        Dikembalikan oleh Kabag Umum
                    </span>
                )}
            </div>

            {rekomendasiKabag && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                    <p className="mb-1 font-semibold text-blue-800">Catatan Kabag Umum</p>
                    <p className="text-blue-700 whitespace-pre-wrap">{rekomendasiKabag}</p>
                </div>
            )}
        </div>
    );
}

// ── Laporan timeline ──────────────────────────────────────────────────────────

function LaporanTimeline({ status, rekomendasiKabag, submittedAt, approvedAt }: {
    status: string; rekomendasiKabag: string | null;
    submittedAt: string | null; approvedAt: string | null;
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tim Kerja Submit
                    {submittedAt && <span className="ml-0.5 text-xs text-muted-foreground">({submittedAt})</span>}
                </span>
                <span className="text-muted-foreground text-xs">→</span>
                {status === 'kabag_approved' ? (
                    <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Disetujui Kabag Umum
                        {approvedAt && <span className="ml-0.5 text-xs text-muted-foreground">({approvedAt})</span>}
                    </span>
                ) : status === 'rejected' ? (
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        Dikembalikan Kabag Umum
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        Menunggu Review Kabag Umum
                    </span>
                )}
            </div>
            {rekomendasiKabag && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                    <p className="mb-1 font-semibold text-blue-800">Catatan Kabag Umum</p>
                    <p className="text-blue-700 whitespace-pre-wrap">{rekomendasiKabag}</p>
                </div>
            )}
        </div>
    );
}

// ── PK document content ───────────────────────────────────────────────────────

function PkContent({ sasarans }: { sasarans: PkSasaran[] }) {
    return (
        <div className="overflow-x-auto rounded border">
            <Table className="text-xs">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-24">Kode</TableHead>
                        <TableHead>Indikator Kinerja</TableHead>
                        <TableHead className="w-20 text-center">Target</TableHead>
                        <TableHead className="w-20 text-center">Satuan</TableHead>
                        <TableHead className="w-44">PIC Tim Kerja</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sasarans.map(s => (
                        <Fragment key={s.id}>
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={5} className="py-1.5 font-semibold">
                                    [{s.kode}] {s.nama}
                                </TableCell>
                            </TableRow>
                            {s.indikators.map(iku => (
                                <TableRow key={iku.id}>
                                    <TableCell className="pl-5 text-muted-foreground">{iku.kode}</TableCell>
                                    <TableCell className="pl-5">{iku.nama}</TableCell>
                                    <TableCell className="text-center">{iku.target}</TableCell>
                                    <TableCell className="text-center">{iku.satuan}</TableCell>
                                    <TableCell>
                                        {iku.pic_tim_kerjas.length > 0
                                            ? iku.pic_tim_kerjas.map((p, i) => (
                                                <Fragment key={p.id}>
                                                    {i + 1}. {p.nama}{i < iku.pic_tim_kerjas.length - 1 && <br />}
                                                </Fragment>
                                            ))
                                            : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// ── RA document content ───────────────────────────────────────────────────────

function RaContent({ indikators }: { indikators: RaIndikator[] }) {
    type Group = { sasaran: RaIndikator['sasaran']; items: RaIndikator[] };
    const groups: Group[] = [];
    for (const i of indikators) {
        const last = groups[groups.length - 1];
        if (last && last.sasaran?.kode === i.sasaran?.kode) last.items.push(i);
        else groups.push({ sasaran: i.sasaran, items: [i] });
    }

    return (
        <div className="overflow-x-auto rounded border">
            <Table className="text-xs">
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-24">Kode</TableHead>
                        <TableHead>Kegiatan / Indikator</TableHead>
                        <TableHead className="w-16 text-center">Target</TableHead>
                        <TableHead className="w-14 text-center">Satuan</TableHead>
                        <TableHead className="w-12 text-center">TW1</TableHead>
                        <TableHead className="w-12 text-center">TW2</TableHead>
                        <TableHead className="w-12 text-center">TW3</TableHead>
                        <TableHead className="w-12 text-center">TW4</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.map((g, gi) => (
                        <Fragment key={gi}>
                            {g.sasaran && (
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={8} className="py-1.5 font-semibold">
                                        [{g.sasaran.kode}] {g.sasaran.nama}
                                    </TableCell>
                                </TableRow>
                            )}
                            {g.items.map(i => (
                                <TableRow key={i.id}>
                                    <TableCell className="pl-5 text-muted-foreground">{i.kode}</TableCell>
                                    <TableCell className="pl-5">{i.nama}</TableCell>
                                    <TableCell className="text-center">{i.target}</TableCell>
                                    <TableCell className="text-center">{i.satuan}</TableCell>
                                    <TableCell className="text-center">{i.target_tw1 ?? '—'}</TableCell>
                                    <TableCell className="text-center">{i.target_tw2 ?? '—'}</TableCell>
                                    <TableCell className="text-center">{i.target_tw3 ?? '—'}</TableCell>
                                    <TableCell className="text-center">{i.target_tw4 ?? '—'}</TableCell>
                                </TableRow>
                            ))}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// ── List table per tab ────────────────────────────────────────────────────────

type AnyItem = { id: number; tim_kerja_nama: string; status: string };
type TabType = 'pk_awal' | 'pk_revisi' | 'ra' | 'laporan';

function ItemsTable<T extends AnyItem>({
    items, type, role, onOpen, extraCol,
}: {
    items: T[];
    type: TabType;
    role: Role;
    onOpen: (item: T) => void;
    extraCol?: (item: T) => React.ReactNode;
}) {
    if (items.length === 0) return <EmptyState label={type === 'laporan' ? 'laporan pengukuran' : type.replace('_', ' ')} />;

    return (
        <div className="rounded-xl border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-8 text-center">#</TableHead>
                        <TableHead>Tim Kerja</TableHead>
                        {extraCol && <TableHead>Periode</TableHead>}
                        <TableHead className="w-40">Status</TableHead>
                        <TableHead>Catatan Penolakan</TableHead>
                        <TableHead className="w-40">Terakhir Diupdate</TableHead>
                        <TableHead className="w-36 text-center">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => {
                        const isRejected = item.status === 'rejected';
                        const catatan = ('rekomendasi_kabag' in item ? (item as unknown as RaItem).rekomendasi_kabag : null);
                        return (
                            <TableRow
                                key={item.id}
                                className={isRejected
                                    ? 'bg-red-50/50 dark:bg-red-950/10'
                                    : item.status === (role === 'kabag_umum' ? 'submitted' : 'kabag_approved')
                                        ? 'bg-amber-50/40'
                                        : ''}
                            >
                                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {isRejected && <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                                        {item.tim_kerja_nama}
                                    </div>
                                </TableCell>
                                {extraCol && <TableCell>{extraCol(item)}</TableCell>}
                                <TableCell><StatusBadge status={item.status} /></TableCell>
                                <TableCell className="max-w-[200px]">
                                    {isRejected && catatan ? (
                                        <span className="text-xs text-red-700 dark:text-red-400 line-clamp-2">{catatan}</span>
                                    ) : (
                                        <span className="text-muted-foreground/40 text-xs">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {'submitted_at' in item
                                        ? (item as unknown as LaporanItem).submitted_at ?? '—'
                                        : (item as unknown as PkItem | RaItem).updated_at}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onOpen(item)}>
                                        <Eye className="h-3.5 w-3.5" />
                                        {canAct(item.status, type, role) ? 'Review' : 'Detail'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const VALID_TABS = ['pk_awal', 'pk_revisi', 'ra', 'laporan'] as const;
type TabValue = typeof VALID_TABS[number];

function getInitialTab(): TabValue {
    const param = new URLSearchParams(window.location.search).get('tab');
    return (VALID_TABS as readonly string[]).includes(param ?? '') ? (param as TabValue) : 'pk_awal';
}

export default function Index({ tahun, pks_awal, pks_revisi, ras, laporans, role }: Props) {
    const [selected, setSelected] = useState<Selected | null>(null);
    const [rekomendasi, setRekomendasi] = useState('');
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabValue>(getInitialTab);

    function openDialog(s: Selected) {
        setSelected(s);
        setRekomendasi('');
    }

    function closeDialog() {
        setSelected(null);
    }

    function submitAction(action: 'approve' | 'reject') {
        if (!selected) return;
        const url = action === 'approve'
            ? approveUrl(selected.type, selected.item.id)
            : rejectUrl(selected.type, selected.item.id);
        setProcessing(true);
        router.post(url, { rekomendasi }, {
            onFinish: () => setProcessing(false),
            onSuccess: closeDialog,
        });
    }

    const pkAwalPending    = pendingCount(pks_awal, role);
    const pkRevisiPending  = pendingCount(pks_revisi, role);
    const raPending        = pendingCount(ras, role);
    const laporanPending   = role === 'kabag_umum' ? laporans.filter(l => l.status === 'submitted').length : 0;
    const totalPending     = pkAwalPending + pkRevisiPending + raPending + laporanPending;

    const pkAwalRej    = rejectedCount(pks_awal);
    const pkRevisiRej  = rejectedCount(pks_revisi);
    const raRej        = rejectedCount(ras);
    const laporanRej   = rejectedCount(laporans);

    const typeLabel: Record<string, string> = {
        pk_awal:  'Perjanjian Kinerja Awal',
        pk_revisi: 'Perjanjian Kinerja Revisi',
        ra:       'Rencana Aksi',
        laporan:  'Laporan Pengukuran',
    };

    const actLabel = role === 'kabag_umum' ? 'Kabag Umum' : 'PPK';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hub Persetujuan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── Header ── */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Hub Persetujuan</h1>
                    <p className="text-muted-foreground">
                        {tahun.label} · Login sebagai <span className="font-medium">{actLabel}</span>
                        {totalPending > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                                {totalPending} menunggu review
                            </span>
                        )}
                    </p>
                </div>

                {/* ── Tabs ── */}
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="pk_awal">
                            PK Awal <TabCount count={pkAwalPending} rejCount={pkAwalRej} />
                        </TabsTrigger>
                        <TabsTrigger value="pk_revisi">
                            PK Revisi <TabCount count={pkRevisiPending} rejCount={pkRevisiRej} />
                        </TabsTrigger>
                        <TabsTrigger value="ra">
                            Rencana Aksi <TabCount count={raPending} rejCount={raRej} />
                        </TabsTrigger>
                        <TabsTrigger value="laporan">
                            Pengukuran <TabCount count={laporanPending} rejCount={laporanRej} />
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pk_awal">
                        <ItemsTable
                            items={pks_awal}
                            type="pk_awal"
                            role={role}
                            onOpen={item => openDialog({ type: 'pk_awal', item })}
                        />
                    </TabsContent>

                    <TabsContent value="pk_revisi">
                        <ItemsTable
                            items={pks_revisi}
                            type="pk_revisi"
                            role={role}
                            onOpen={item => openDialog({ type: 'pk_revisi', item })}
                        />
                    </TabsContent>

                    <TabsContent value="ra">
                        <ItemsTable
                            items={ras}
                            type="ra"
                            role={role}
                            onOpen={item => openDialog({ type: 'ra', item })}
                        />
                    </TabsContent>

                    <TabsContent value="laporan">
                        <ItemsTable
                            items={laporans}
                            type="laporan"
                            role={role}
                            onOpen={item => openDialog({ type: 'laporan', item })}
                            extraCol={item => (item as LaporanItem).periode_triwulan}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── Detail & Review Dialog ── */}
            <Dialog open={!!selected} onOpenChange={open => !open && closeDialog()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selected && (() => {
                        const item = selected.item;
                        const type = selected.type;
                        const acting = canAct(item.status, type, role);

                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex flex-wrap items-center gap-2">
                                        <span>{typeLabel[type]}</span>
                                        <span className="text-muted-foreground font-normal">—</span>
                                        <span>{item.tim_kerja_nama}</span>
                                        <StatusBadge status={item.status} />
                                    </DialogTitle>
                                </DialogHeader>

                                <div className="space-y-5 pt-1">

                                    {/* ── Status timeline ── */}
                                    <section>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Riwayat Status</p>
                                        {type === 'laporan' ? (
                                            <LaporanTimeline
                                                status={item.status}
                                                rekomendasiKabag={(item as LaporanItem).rekomendasi_kabag}
                                                submittedAt={(item as LaporanItem).submitted_at}
                                                approvedAt={(item as LaporanItem).approved_at}
                                            />
                                        ) : (
                                            <PkRaTimeline
                                                status={item.status}
                                                rekomendasiKabag={(item as PkItem | RaItem).rekomendasi_kabag}
                                            />
                                        )}
                                    </section>

                                    <Separator />

                                    {/* ── Document content ── */}
                                    <section>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Isi Dokumen</p>
                                        {type === 'laporan' ? (
                                            <div className="space-y-3 text-sm">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border p-3">
                                                    <div><span className="font-medium">Tim Kerja:</span> {item.tim_kerja_nama}</div>
                                                    <div><span className="font-medium">Periode:</span> {(item as LaporanItem).periode_triwulan}</div>
                                                    {(item as LaporanItem).submitted_at && (
                                                        <div><span className="font-medium">Tanggal Submit:</span> {(item as LaporanItem).submitted_at}</div>
                                                    )}
                                                    {(item as LaporanItem).approved_at && (
                                                        <div><span className="font-medium">Disetujui:</span> {(item as LaporanItem).approved_at}</div>
                                                    )}
                                                </div>
                                                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                                                    <a
                                                        href={`/pimpinan/pengukuran/kinerja?periode_id=${(item as LaporanItem).periode_id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Lihat Matriks Pengukuran
                                                    </a>
                                                </Button>
                                            </div>
                                        ) : isPkSelected(selected) ? (
                                            <PkContent sasarans={(item as PkItem).sasarans} />
                                        ) : (
                                            <RaContent indikators={(item as RaItem).indikators} />
                                        )}
                                    </section>

                                    {/* ── Approve / Reject form ── */}
                                    {acting && (
                                        <>
                                            <Separator />
                                            <section>
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Keputusan {actLabel}
                                                </p>
                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="rekomendasi" className="text-sm">
                                                            Catatan / Rekomendasi <span className="font-normal text-muted-foreground">(opsional)</span>
                                                        </Label>
                                                        <Textarea
                                                            id="rekomendasi"
                                                            rows={4}
                                                            placeholder="Tuliskan catatan atau rekomendasi..."
                                                            value={rekomendasi}
                                                            onChange={e => setRekomendasi(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                                            loading={processing}
                                                            onClick={() => submitAction('approve')}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Setujui
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            className="gap-1.5"
                                                            loading={processing}
                                                            onClick={() => submitAction('reject')}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Kembalikan
                                                        </Button>
                                                        <Button variant="ghost" onClick={closeDialog} disabled={processing}>
                                                            Batal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </section>
                                        </>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
