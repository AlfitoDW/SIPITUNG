import { Head, router } from '@inertiajs/react';
import { Pencil, Send, CheckCircle2, Circle, Lock, Loader2, AlertCircle, Users, List, Plus, Trash2, Save, X } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Penyusunan', href: '/ketua-tim/perencanaan/rencana-aksi/penyusunan' },
];

function targetPlaceholder(satuan: string): string {
    const s = satuan.trim().toLowerCase();
    if (s === '%' || s === 'persen') return 'Contoh: 89,75';
    return 'Masukkan nilai target';
}

type Kegiatan = { id: number; triwulan: number; urutan: number; nama_kegiatan: string };

type Indikator = {
    id: number; kode: string; nama: string; satuan: string; target: string;
    target_tw1: string | null; target_tw2: string | null; target_tw3: string | null; target_tw4: string | null;
    kegiatans: Kegiatan[];
};
type Sasaran = { id: number; kode: string; nama: string; indikators: Indikator[] };
type RA = { id: number; status: 'draft' | 'submitted' | 'kabag_approved' | 'rejected'; rekomendasi_kabag: string | null };
type RaGroup = {
    peer_id: number | null;
    peer_nama: string;
    ra: RA;
    sasarans: Sasaran[];
    ind_count: number;
    filled_count: number;
    collaborator: { submitted_by: string; status: 'submitted' | 'kabag_approved' } | null;
    collab_rejected: { submitted_by: string; rekomendasi_kabag: string | null } | null;
};
type Tahun = { id: number; tahun: number; label: string };
type Props = { tahun: Tahun; raGroups: RaGroup[] };

const STATUS_CONFIG = {
    draft:          { label: 'Draft',          className: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
    submitted:      { label: 'Menunggu Kabag', className: 'bg-yellow-100 text-yellow-800 border-yellow-400' },
    kabag_approved: { label: 'Disetujui',      className: 'bg-green-100 text-green-800 border-green-400' },
    rejected:       { label: 'Ditolak',        className: 'bg-red-100 text-red-800 border-red-400' },
};

const sasaranColors: Record<string, { sasaranBg: string; kodeBadge: string; accent: string }> = {
    'S 1': { sasaranBg: 'bg-blue-50 dark:bg-blue-950/40',       kodeBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',           accent: 'border-l-4 border-l-blue-500' },
    'S 2': { sasaranBg: 'bg-emerald-50 dark:bg-emerald-950/40', kodeBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', accent: 'border-l-4 border-l-emerald-500' },
    'S 3': { sasaranBg: 'bg-violet-50 dark:bg-violet-950/40',   kodeBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',    accent: 'border-l-4 border-l-violet-500' },
    'S 4': { sasaranBg: 'bg-amber-50 dark:bg-amber-950/40',     kodeBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',        accent: 'border-l-4 border-l-amber-500' },
};
function getColor(kode: string) { return sasaranColors[kode] ?? sasaranColors['S 1']; }

type TwForm = { target: string; target_tw1: string; target_tw2: string; target_tw3: string; target_tw4: string };
const EMPTY_TW: TwForm = { target: '', target_tw1: '', target_tw2: '', target_tw3: '', target_tw4: '' };

const TW_CONFIG = [
    null,
    { label: 'Triwulan I',   roman: 'I',   pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',   border: 'border-blue-200 dark:border-blue-800',   accent: 'border-l-2 border-l-blue-400' },
    { label: 'Triwulan II',  roman: 'II',  pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200', border: 'border-emerald-200 dark:border-emerald-800', accent: 'border-l-2 border-l-emerald-400' },
    { label: 'Triwulan III', roman: 'III', pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',   border: 'border-violet-200 dark:border-violet-800',   accent: 'border-l-2 border-l-violet-400' },
    { label: 'Triwulan IV',  roman: 'IV',  pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',     border: 'border-amber-200 dark:border-amber-800',     accent: 'border-l-2 border-l-amber-400' },
] as const;

// ─── Kegiatan Sheet ───────────────────────────────────────────────────────────

function KegiatanSheet({ iku, isEditable, peerNama, onClose }: {
    iku: Indikator;
    isEditable: boolean;
    peerNama?: string | null;
    onClose: () => void;
}) {
    const [newKegiatan, setNewKegiatan] = useState<Record<number, string>>({ 1: '', 2: '', 3: '', 4: '' });
    const [editingId, setEditingId]     = useState<number | null>(null);
    const [editText, setEditText]       = useState('');
    const [saving, setSaving]           = useState<Record<string, boolean>>({});

    const kegiatanByTw = (tw: number) =>
        iku.kegiatans.filter(k => k.triwulan === tw).sort((a, b) => a.urutan - b.urutan);

    function addKegiatan(tw: number) {
        const text = newKegiatan[tw]?.trim();
        if (!text) return;
        setSaving(s => ({ ...s, [`add-${tw}`]: true }));
        router.post(`/ketua-tim/perencanaan/rencana-aksi/indikator/${iku.id}/kegiatan`, {
            triwulan: tw,
            nama_kegiatan: text,
        }, {
            preserveScroll: true,
            onSuccess: () => setNewKegiatan(n => ({ ...n, [tw]: '' })),
            onFinish: () => setSaving(s => ({ ...s, [`add-${tw}`]: false })),
        });
    }

    function startEdit(k: Kegiatan) {
        setEditingId(k.id);
        setEditText(k.nama_kegiatan);
    }

    function saveEdit(k: Kegiatan) {
        if (!editText.trim()) return;
        setSaving(s => ({ ...s, [`edit-${k.id}`]: true }));
        router.patch(`/ketua-tim/perencanaan/rencana-aksi/kegiatan/${k.id}`, {
            nama_kegiatan: editText.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
            onFinish: () => setSaving(s => ({ ...s, [`edit-${k.id}`]: false })),
        });
    }

    function deleteKegiatan(k: Kegiatan) {
        setSaving(s => ({ ...s, [`del-${k.id}`]: true }));
        router.delete(`/ketua-tim/perencanaan/rencana-aksi/kegiatan/${k.id}`, {
            preserveScroll: true,
            onFinish: () => setSaving(s => ({ ...s, [`del-${k.id}`]: false })),
        });
    }

    const totalKegiatan = iku.kegiatans.length;

    return (
        <Sheet open onOpenChange={(v) => !v && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
                <SheetHeader className="px-5 pt-5 pb-3 border-b">
                    <SheetTitle className="text-base leading-tight">Rencana Kegiatan / Aktivitas</SheetTitle>
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm mt-1">
                        <p className="text-xs text-muted-foreground">{iku.kode}</p>
                        <p className="font-medium leading-snug">{iku.nama}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {peerNama && (
                            <span className="text-xs text-muted-foreground">
                                Kolaborasi dengan <span className="font-medium text-foreground">{peerNama}</span>
                            </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {totalKegiatan} kegiatan tersimpan{isEditable ? ' — tekan Enter atau klik Tambah' : ''}
                        </span>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    {([1, 2, 3, 4] as const).map((tw) => {
                        const cfg    = TW_CONFIG[tw]!;
                        const list   = kegiatanByTw(tw);
                        const twTarget = iku[`target_tw${tw}` as keyof Indikator] as string | null;
                        return (
                            <div key={tw} className="space-y-2">
                                {/* TW header pill */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${cfg.pill}`}>
                                            TW {cfg.roman} — {cfg.label}
                                        </span>
                                        {twTarget && (
                                            <span className="text-xs text-muted-foreground">
                                                Target: <span className="font-semibold">{twTarget}</span> {iku.satuan}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{list.length} kegiatan</span>
                                </div>

                                {/* Kegiatan list */}
                                <div className={`rounded-lg border divide-y ${cfg.border}`}>
                                    {list.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic px-3 py-2.5">
                                            Belum ada kegiatan{isEditable ? ' — tambahkan di bawah' : ''}.
                                        </p>
                                    )}
                                    {list.map((k, idx) => (
                                        <div key={k.id} className={`flex items-start gap-2 px-3 py-2 group ${cfg.accent}`}>
                                            <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0 text-right">
                                                {idx + 1}.
                                            </span>
                                            {isEditable && editingId === k.id ? (
                                                <div className="flex-1 flex items-start gap-1.5">
                                                    <Textarea
                                                        value={editText}
                                                        onChange={e => setEditText(e.target.value)}
                                                        className="min-h-15 text-sm flex-1"
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(k); }
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <div className="flex flex-col gap-1 shrink-0">
                                                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => saveEdit(k)} disabled={saving[`edit-${k.id}`]}>
                                                            {saving[`edit-${k.id}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-start justify-between gap-2">
                                                    <p className="text-sm leading-snug flex-1">{k.nama_kegiatan}</p>
                                                    {isEditable && (
                                                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => startEdit(k)}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteKegiatan(k)} disabled={saving[`del-${k.id}`]}>
                                                                {saving[`del-${k.id}`] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add form */}
                                {isEditable && (
                                    <div className="flex gap-2 items-end">
                                        <Textarea
                                            placeholder={`Tambah kegiatan TW ${cfg.roman}… (Enter untuk simpan)`}
                                            value={newKegiatan[tw]}
                                            onChange={e => setNewKegiatan(n => ({ ...n, [tw]: e.target.value }))}
                                            className="min-h-13 text-sm flex-1 resize-none"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addKegiatan(tw); }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 shrink-0 gap-1.5"
                                            onClick={() => addKegiatan(tw)}
                                            disabled={!newKegiatan[tw]?.trim() || saving[`add-${tw}`]}
                                        >
                                            {saving[`add-${tw}`] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                            Tambah
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function RaGroupCard({ group, onEdit, onSubmit, onOpenKegiatan }: {
    group: RaGroup;
    onEdit: (iku: Indikator) => void;
    onSubmit: (group: RaGroup) => void;
    onOpenKegiatan: (iku: Indikator, editable: boolean, peerNama?: string | null) => void;
}) {
    const ra             = group.ra;
    const isSubmitted    = ra.status === 'submitted';
    const isApproved     = ra.status === 'kabag_approved';
    const isRejected     = ra.status === 'rejected';
    const collabLocked   = group.collaborator?.status === 'submitted';
    const collabApproved = group.collaborator?.status === 'kabag_approved';
    const isLocked       = collabLocked || collabApproved || isSubmitted || isApproved;
    const isEditable     = !isLocked && (ra.status === 'draft' || ra.status === 'rejected');

    const isSolo     = group.peer_id === null;
    const peerName   = isSolo ? 'IKU Mandiri' : group.peer_nama;
    const twFilled   = group.sasarans.reduce((s, sar) => s + sar.indikators.filter(i => i.target_tw1 || i.target_tw2 || i.target_tw3 || i.target_tw4).length, 0);
    const totalInd   = group.sasarans.reduce((s, sar) => s + sar.indikators.length, 0);

    const progress = isApproved || collabApproved ? 100
        : isSubmitted || collabLocked ? 80
        : totalInd > 0 ? Math.round((twFilled / totalInd) * 60)
        : 10;

    const canSubmit = isEditable && totalInd > 0;

    const headerClass = isApproved || collabApproved
        ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
        : collabLocked || isSubmitted
        ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
        : isRejected
        ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
        : 'border-border bg-card';

    return (
        <div className={`rounded-xl border shadow-sm overflow-hidden ${headerClass}`}>
            {/* Group header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {isSolo ? (
                        <span className="text-sm font-semibold text-foreground">IKU Mandiri</span>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="text-sm font-semibold text-foreground">
                                Kolaborasi dengan <span className="text-blue-700 dark:text-blue-400">{peerName}</span>
                            </span>
                        </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                        ({twFilled}/{totalInd} target TW terisi)
                    </span>

                    {isApproved && (
                        <Badge variant="outline" className={STATUS_CONFIG.kabag_approved.className}>Disetujui</Badge>
                    )}
                    {collabApproved && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-400 text-xs">
                            Selesai (via {group.collaborator!.submitted_by})
                        </Badge>
                    )}
                    {isSubmitted && (
                        <Badge variant="outline" className={STATUS_CONFIG.submitted.className}>Menunggu Kabag</Badge>
                    )}
                    {collabLocked && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-400 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Terkunci — {group.collaborator!.submitted_by} telah submit
                        </Badge>
                    )}
                    {isRejected && !isLocked && (
                        <Badge variant="outline" className={STATUS_CONFIG.rejected.className}>Ditolak</Badge>
                    )}
                    {ra.status === 'draft' && !isLocked && (
                        <Badge variant="outline" className={STATUS_CONFIG.draft.className}>Draft</Badge>
                    )}
                </div>

                {canSubmit && (
                    <Button size="sm" onClick={() => onSubmit(group)} className="gap-1.5 h-8 text-xs">
                        <Send className="h-3 w-3" />
                        {isRejected ? 'Submit Ulang' : 'Submit ke Kabag'}
                    </Button>
                )}
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 border-b bg-muted/10">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Kesiapan</span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>

            {/* Inline banners */}
            <div className="space-y-2 px-4 py-2.5">
                {isRejected && !collabApproved && (
                    <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-800 dark:text-red-400">
                        <span className="font-semibold">Dikembalikan Kabag Umum.</span>
                        {ra.rekomendasi_kabag ? ` Rekomendasi: "${ra.rekomendasi_kabag}"` : ' Silakan perbaiki dan submit ulang.'}
                    </div>
                )}
                {isApproved && (
                    <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs text-green-800 dark:text-green-400">
                        <span className="font-semibold">Disetujui Kabag Umum.</span>
                    </div>
                )}
                {isSubmitted && (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-400 flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                        <span><span className="font-semibold">Menunggu review Kabag Umum.</span> Dokumen tidak dapat diubah.</span>
                    </div>
                )}
                {collabLocked && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
                        <Lock className="inline h-3 w-3 mr-1" />
                        <span className="font-semibold">{group.collaborator!.submitted_by}</span> telah mengajukan RA untuk kelompok IKU ini. Menunggu review Kabag.
                    </div>
                )}
                {collabApproved && (
                    <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs text-green-800 dark:text-green-400">
                        <span className="font-semibold">Selesai</span> — RA kelompok ini telah diajukan dan disetujui oleh{' '}
                        <span className="font-semibold">{group.collaborator!.submitted_by}</span>.
                    </div>
                )}
                {group.collab_rejected && !isApproved && !collabApproved && (
                    <div className="rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-xs text-orange-800 dark:text-orange-400">
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        RA yang diajukan <span className="font-semibold">{group.collab_rejected.submitted_by}</span> ditolak.
                        {' '}Tim Anda dapat mengajukan sendiri untuk kelompok ini.
                        {group.collab_rejected.rekomendasi_kabag && (
                            <span className="block mt-1 italic">Catatan Kabag: "{group.collab_rejected.rekomendasi_kabag}"</span>
                        )}
                    </div>
                )}
            </div>

            {/* IKU Table */}
            {group.sasarans.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground italic border-t">
                    Belum ada indikator untuk kelompok ini.
                </div>
            ) : (
                <div className="overflow-x-auto border-t">
                    {isEditable && (
                        <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground">
                            Isi kolom <span className="font-semibold text-foreground">Target per Triwulan</span> untuk setiap IKU, kemudian isi <span className="font-semibold text-foreground">Rencana Kegiatan</span> via tombol <List className="inline h-3 w-3 mx-0.5" />, lalu submit ke Kabag Umum.
                        </div>
                    )}
                    <Table className="[&_td]:border-b [&_td]:border-r [&_th]:border-r">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-60">Sasaran</TableHead>
                                <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white">Indikator</TableHead>
                                <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-24">Satuan</TableHead>
                                <TableHead rowSpan={2} className="border-r border-white/20 text-center align-middle font-semibold text-white w-20">Target</TableHead>
                                <TableHead colSpan={4} className="text-center font-semibold text-white border-b border-white/20">Triwulan</TableHead>
                                <TableHead rowSpan={2} className="text-center font-semibold text-white w-24">Aksi</TableHead>
                            </TableRow>
                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                {(['I', 'II', 'III', 'IV'] as const).map((tw, i) => (
                                    <TableHead key={tw} className={`text-center font-semibold text-white w-20${i < 3 ? ' border-r border-white/20' : ''}`}>{tw}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {group.sasarans.flatMap((sasaran) => {
                                const color   = getColor(sasaran.kode);
                                const count   = sasaran.indikators.length;
                                const rowSpan = Math.max(count, 1);

                                if (count === 0) {
                                    return [(
                                        <tr key={`${sasaran.id}-empty`} className="hover:bg-muted/20">
                                            <td rowSpan={rowSpan} className={`align-top text-sm p-3 border-b border-r ${color.sasaranBg} ${color.accent}`}>
                                                <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                            </td>
                                            <td colSpan={6} className="text-center text-sm text-muted-foreground py-4 italic border-b">Belum ada indikator</td>
                                        </tr>
                                    )];
                                }

                                return sasaran.indikators.map((iku, idx) => {
                                    const kegiatanCount = iku.kegiatans.length;
                                    return (
                                        <TableRow key={iku.id} className="align-top hover:bg-muted/30">
                                            {idx === 0 && (
                                                <TableCell rowSpan={rowSpan} className={`align-top text-sm ${color.sasaranBg} ${color.accent}`}>
                                                    <span className={`inline-block mb-1.5 rounded px-1.5 py-0.5 text-xs font-bold ${color.kodeBadge}`}>{sasaran.kode}</span>
                                                    <p className="leading-snug text-foreground">{sasaran.nama}</p>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm align-top">
                                                <span className="inline-block mb-1 text-xs font-semibold text-muted-foreground">{iku.kode}</span>
                                                <p className="leading-snug">{iku.nama}</p>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">{iku.satuan}</TableCell>
                                            <TableCell className="text-center text-sm font-semibold">{iku.target}</TableCell>
                                            <TableCell className="text-center text-sm">{iku.target_tw1 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-center text-sm">{iku.target_tw2 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-center text-sm">{iku.target_tw3 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-center text-sm">{iku.target_tw4 ?? <span className="text-muted-foreground">-</span>}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {isEditable && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(iku)} title="Isi target triwulan">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 relative"
                                                        onClick={() => onOpenKegiatan(iku, isEditable, group.peer_id !== null ? group.peer_nama : null)}
                                                        title="Rencana Kegiatan"
                                                    >
                                                        <List className="h-3.5 w-3.5" />
                                                        {kegiatanCount > 0 && (
                                                            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                                                                {kegiatanCount}
                                                            </span>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                });
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

// ─── Submit Dialog per Group ───────────────────────────────────────────────────

function SubmitRaDialog({ group, onClose, onConfirm, submitting }: {
    group: RaGroup; onClose: () => void; onConfirm: () => void; submitting: boolean;
}) {
    const isSolo     = group.peer_id === null;
    const isRejected = group.ra.status === 'rejected';
    return (
        <AlertDialog open onOpenChange={(v) => !v && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isRejected ? 'Submit Ulang' : 'Submit'} Rencana Aksi — {isSolo ? 'IKU Mandiri' : `Kolaborasi dengan ${group.peer_nama}`}?
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm">
                            <p>
                                Rencana Aksi kelompok ini akan dikirim ke Kabag Umum. Anda tidak dapat mengedit dokumen sebelum dikembalikan atau disetujui.
                            </p>
                            {!isSolo && (
                                <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                                    <Users className="inline h-3 w-3 mr-1" />
                                    Setelah submit, tim <strong>{group.peer_nama}</strong> tidak dapat mengajukan RA yang mencakup IKU yang sama.
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={submitting}>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={submitting}>
                        {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Ya, Submit
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Penyusunan({ tahun, raGroups }: Props) {
    const [editDialog, setEditDialog]     = useState<{ open: boolean; iku: Indikator | null }>({ open: false, iku: null });
    const [form, setForm]                 = useState<TwForm>(EMPTY_TW);
    const [submitGroup, setSubmitGroup]   = useState<RaGroup | null>(null);
    const [saving, setSaving]             = useState(false);
    const [submitting, setSubmitting]     = useState(false);
    const [kegiatanSheet, setKegiatanSheet] = useState<{ iku: Indikator; editable: boolean; peerNama?: string | null } | null>(null);

    function openEdit(iku: Indikator) {
        setForm({
            target:     iku.target ?? '',
            target_tw1: iku.target_tw1 ?? '',
            target_tw2: iku.target_tw2 ?? '',
            target_tw3: iku.target_tw3 ?? '',
            target_tw4: iku.target_tw4 ?? '',
        });
        setEditDialog({ open: true, iku });
    }

    function saveEdit() {
        if (!editDialog.iku) return;
        const norm = (v: string) => v.replace(',', '.');
        const payload = {
            target:     norm(form.target),
            target_tw1: form.target_tw1 ? norm(form.target_tw1) : null,
            target_tw2: form.target_tw2 ? norm(form.target_tw2) : null,
            target_tw3: form.target_tw3 ? norm(form.target_tw3) : null,
            target_tw4: form.target_tw4 ? norm(form.target_tw4) : null,
        };
        setSaving(true);
        router.patch(`/ketua-tim/perencanaan/rencana-aksi/indikator/${editDialog.iku.id}/target`, payload, {
            onSuccess: () => setEditDialog({ open: false, iku: null }),
            onFinish: () => setSaving(false),
        });
    }

    function doSubmitGroup() {
        if (!submitGroup) return;
        setSubmitting(true);
        router.patch('/ketua-tim/perencanaan/rencana-aksi/submit', {
            peer_tim_kerja_id: submitGroup.peer_id ?? null,
        }, {
            onSuccess: () => setSubmitGroup(null),
            onFinish: () => setSubmitting(false),
        });
    }

    const totalInd    = raGroups.reduce((s, g) => s + g.ind_count, 0);
    const totalFilled = raGroups.reduce((s, g) => s + g.filled_count, 0);
    const allApproved = raGroups.length > 0 && raGroups.every(
        g => g.ra.status === 'kabag_approved' || g.collaborator?.status === 'kabag_approved'
    );
    const anySubmitted = raGroups.some(
        g => g.ra.status === 'submitted' || g.collaborator?.status === 'submitted'
    );
    const overallProgress = allApproved ? 100
        : anySubmitted ? 80
        : totalInd > 0 ? Math.round((totalFilled / totalInd) * 60)
        : 10;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusunan — Rencana Aksi" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Penyusunan Rencana Aksi</h1>
                    <p className="text-muted-foreground">Target kinerja per triwulan — {tahun.label}</p>
                </div>

                {/* Overall progress */}
                {raGroups.length > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progres Keseluruhan</span>
                            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
                        </div>
                        <Progress value={overallProgress} className="h-2" />
                        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                            {[
                                { done: raGroups.length > 0,                           label: 'Dokumen dibuat' },
                                { done: totalInd > 0,                                  label: `IKU tersedia (${totalInd})` },
                                { done: totalFilled === totalInd && totalInd > 0,       label: `Target TW diisi (${totalFilled}/${totalInd})` },
                                { done: anySubmitted || allApproved,                   label: 'Ada RA tersubmit' },
                                { done: allApproved,                                   label: 'Semua disetujui Kabag' },
                            ].map(({ done, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    {done ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> : <Circle className="h-5 w-5 text-red-400 shrink-0" />}
                                    <span className={`text-base font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {raGroups.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-950/30">
                        Belum ada sasaran. Buat Perjanjian Kinerja Awal terlebih dahulu agar sasaran dapat digunakan di sini.
                    </div>
                ) : (
                    raGroups.map((group) => (
                        <RaGroupCard
                            key={group.peer_id ?? 'solo'}
                            group={group}
                            onEdit={openEdit}
                            onSubmit={setSubmitGroup}
                            onOpenKegiatan={(iku, editable, peerNama) => setKegiatanSheet({ iku, editable, peerNama })}
                        />
                    ))
                )}
            </div>

            {/* Dialog: Edit Target TW */}
            <Dialog open={editDialog.open} onOpenChange={(v) => setEditDialog(d => ({ ...d, open: v }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Isi Target Triwulan</DialogTitle>
                    </DialogHeader>
                    {editDialog.iku && (
                        <div className="grid gap-4 py-2">
                            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                                <p className="text-xs text-muted-foreground mb-0.5">{editDialog.iku.kode}</p>
                                <p className="font-medium leading-snug">{editDialog.iku.nama}</p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Target Tahunan ({editDialog.iku.satuan})</Label>
                                <Input
                                    value={form.target}
                                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                                    placeholder={targetPlaceholder(editDialog.iku.satuan)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5"><Label>Target TW I</Label><Input value={form.target_tw1} onChange={e => setForm(f => ({ ...f, target_tw1: e.target.value }))} placeholder={targetPlaceholder(editDialog.iku.satuan)} /></div>
                                <div className="grid gap-1.5"><Label>Target TW II</Label><Input value={form.target_tw2} onChange={e => setForm(f => ({ ...f, target_tw2: e.target.value }))} placeholder={targetPlaceholder(editDialog.iku.satuan)} /></div>
                                <div className="grid gap-1.5"><Label>Target TW III</Label><Input value={form.target_tw3} onChange={e => setForm(f => ({ ...f, target_tw3: e.target.value }))} placeholder={targetPlaceholder(editDialog.iku.satuan)} /></div>
                                <div className="grid gap-1.5"><Label>Target TW IV</Label><Input value={form.target_tw4} onChange={e => setForm(f => ({ ...f, target_tw4: e.target.value }))} placeholder={targetPlaceholder(editDialog.iku.satuan)} /></div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialog({ open: false, iku: null })} disabled={saving}>Batal</Button>
                        <Button onClick={saveEdit} loading={saving} disabled={!form.target.trim()}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit Group Dialog */}
            {submitGroup && (
                <SubmitRaDialog
                    group={submitGroup}
                    onClose={() => setSubmitGroup(null)}
                    onConfirm={doSubmitGroup}
                    submitting={submitting}
                />
            )}

            {/* Kegiatan Sheet */}
            {kegiatanSheet && (
                <KegiatanSheet
                    iku={kegiatanSheet.iku}
                    isEditable={kegiatanSheet.editable}
                    peerNama={kegiatanSheet.peerNama}
                    onClose={() => setKegiatanSheet(null)}
                />
            )}
        </AppLayout>
    );
}
