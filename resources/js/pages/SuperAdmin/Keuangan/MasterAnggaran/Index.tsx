import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Trash2, Power, Plus, Upload, Database, Filter, X, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DataTableControls } from '@/components/data-table-controls';
import { DataTablePagination } from '@/components/data-table-pagination';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaginatedTable } from '@/hooks/use-paginated-table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface DjaBase { id: number; kode: string; nama: string; pagu: number; is_aktif: boolean; }
interface Program extends DjaBase { tahun_anggaran: string; }
interface Sasaran extends DjaBase { program_id: number; program?: { id: number; kode: string; nama: string }; }
interface Kro extends DjaBase { sasaran_id: number; sasaran?: { id: number; kode: string; nama: string }; }
interface Ro extends DjaBase { kro_id: number; kro?: { id: number; kode: string; nama: string }; }
interface Komponen extends DjaBase { ro_id: number; jenis: 'Utama' | 'Pendukung'; ro?: { id: number; kode: string; nama: string }; }

interface Kegiatan extends DjaBase {
  komponen_id: number;
  komponen?: {
    id: number; kode: string; nama: string; ro_id: number;
    ro?: { id: number; kode: string; nama: string; kro_id: number;
      kro?: { id: number; kode: string; nama: string; sasaran_id: number;
        sasaran?: { id: number; kode: string; nama: string; program_id: number;
          program?: { id: number; kode: string; nama: string } } } } }
}

interface Rincian {
  id: number; kegiatan_id: number; kode_akun: string; nama_akun: string; nama_item: string;
  satuan: string; harga_satuan: number; pagu_total: number; urutan: number; is_aktif: boolean;
  kegiatan?: Kegiatan;
}

interface Tahun { id: number; tahun: string; label: string; }

interface ImportPreviewItem {
  level: string;
  kode: string;
  nama: string;
  pagu: number;
  jenis?: string;
  pagu_lama?: number;
  pagu_baru?: number;
  status_eksekusi?: string;
  keterangan?: string;
  overbudget?: number;
  overbudget_label?: string;
  children: ImportPreviewItem[];
}

interface ImportPreview {
  is_revisi: boolean;
  is_full_replace?: boolean;
  summary: {
    added: number;
    changed: number;
    removed: number;
    skipped?: number;
    blocked: number;
    overbudget_count: number;
    overbudget_total: number;
    overbudget_total_formatted: string;
  };
  hierarchical: ImportPreviewItem[];
}

interface Props {
  tahun: Tahun;
  programs: Program[];
  sasarans: Sasaran[];
  kros: Kro[];
  ros: Ro[];
  komponens: Komponen[];
  kegiatans: Kegiatan[];
  rincians: Rincian[];
  importPreview?: ImportPreview;
  importKey?: string;
}

const fmt = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildKegiatanPath(k: Kegiatan): string {
  const parts: string[] = [];
  const p = k.komponen?.ro?.kro?.sasaran?.program;
  const s = k.komponen?.ro?.kro?.sasaran;
  const kr = k.komponen?.ro?.kro;
  const r = k.komponen?.ro;
  const c = k.komponen;
  if (p) parts.push(p.kode);
  if (s) parts.push(s.kode);
  if (kr) parts.push(kr.kode);
  if (r) parts.push(r.kode);
  if (c) parts.push(c.kode);
  parts.push(k.kode);
  return parts.join(' › ');
}

function buildKegiatanLabel(k: Kegiatan): string {
  const path = buildKegiatanPath(k);
  return `${path} — ${k.nama}`;
}

// ── Import Excel Dialog ─────────────────────────────────────────────────────

function ImportDialog({ preview, importKey }: { preview?: ImportPreview; importKey?: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Perbarui state open berdasarkan ada tidaknya preview
  const isPreviewOpen = !!preview && !!importKey;

  const doImport = () => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    router.post('/super-admin/keuangan/master-anggaran/import', form, {
      onFinish: () => { setUploading(false); },
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4" /> Import Excel
      </Button>

      {/* Dialog upload file */}
      <AlertDialog open={open && !isPreviewOpen} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Data DJA dari Excel</AlertDialogTitle>
            <AlertDialogDescription>
              Upload file Excel (.xlsx) dengan format kolom:
              A=Kode, B=Nama, F=Pagu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={doImport} disabled={uploading || !file}>
              {uploading ? 'Memproses...' : 'Pratinjau'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog preview perubahan */}
      <ImportPreviewDialog
        preview={preview}
        importKey={importKey}
        open={isPreviewOpen}
        onClose={() => {
          // Reload halaman tanpa preview
          router.get('/super-admin/keuangan/master-anggaran');
        }}
      />
    </>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────

function DeleteConfirm({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void; }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
          <AlertDialogDescription>
            Semua data turunan akan ikut terhapus. Data yang masih digunakan oleh permohonan dana tidak dapat dihapus. Nonaktifkan saja jika tidak lagi digunakan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onConfirm}>Hapus</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Import Preview Dialog ───────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  program: 'Program',
  sasaran: 'Sasaran',
  kro: 'KRO',
  ro: 'RO',
  komponen: 'Komponen',
  kegiatan: 'Kegiatan',
  rincian_biaya: 'Rincian Biaya',
};

const JENIS_COLORS: Record<string, string> = {
  tambah: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  ubah: 'text-amber-600 bg-amber-50 border-amber-200',
  hapus: 'text-red-600 bg-red-50 border-red-200',
  skip: 'text-blue-600 bg-blue-50 border-blue-200',
};

const JENIS_LABELS: Record<string, string> = {
  tambah: 'Baru',
  ubah: 'Berubah',
  hapus: 'Dihapus',
  skip: 'Dilewati',
};

function ImportPreviewDialog({ preview, importKey, open, onClose }: {
  preview?: ImportPreview;
  importKey?: string;
  open: boolean;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [catatan, setCatatan] = useState('');

  if (!preview) return null;

  const doConfirm = (e: React.MouseEvent) => {
    e.preventDefault(); // cegah AlertDialogAction auto-close
    setConfirming(true);
    router.post('/super-admin/keuangan/master-anggaran/import/confirm', {
      import_key: importKey,
      catatan,
    }, {
      onSuccess: () => {
        setConfirming(false);
        // onSuccess sudah redirect via Inertia, tidak perlu onClose
      },
      onError: () => {
        setConfirming(false);
      },
      onFinish: () => {
        // fallback kalau onSuccess tidak trigger
        setConfirming(false);
      },
    });
  };

  const { summary, hierarchical, is_revisi } = preview;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !confirming) onClose(); }}>
      <AlertDialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <AlertDialogHeader className="shrink-0">
          <AlertDialogTitle className="flex items-center gap-2">
            {is_revisi ? 'Pratinjau Revisi Anggaran' : 'Pratinjau Impor Anggaran'}
            {summary.overbudget_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ {summary.overbudget_count} Overbudget
              </Badge>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Tinjau perubahan di bawah sebelum konfirmasi.
            {is_revisi && ' Perubahan akan tercatat sebagai revisi baru.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-5 gap-2 shrink-0 py-2">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-emerald-700">{summary.added}</p>
            <p className="text-xs text-emerald-600">Tambah</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-amber-700">{summary.changed}</p>
            <p className="text-xs text-amber-600">Berubah</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-red-700">{summary.removed}</p>
            <p className="text-xs text-red-600">Dihapus</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-blue-700">{summary.skipped ?? 0}</p>
            <p className="text-xs text-blue-600">Dilewati</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-orange-700">{summary.blocked}</p>
            <p className="text-xs text-orange-600">Diblokir</p>
          </div>
        </div>

        {summary.overbudget_count > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-2 shrink-0">
            <p className="text-sm font-semibold text-red-700">
              Potensi Overbudget: {summary.overbudget_total_formatted}
            </p>
            <p className="text-xs text-red-600">
              {summary.overbudget_count} rincian biaya pagu turun di bawah realisasi. Perlu diselesaikan manual oleh keuangan.
            </p>
          </div>
        )}

        {preview.is_revisi && !preview.is_full_replace && (summary.skipped ?? 0) > 0 && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 py-2 shrink-0">
            <p className="text-xs text-blue-700">
              Impor parsial terdeteksi. {summary.skipped ?? 0} item yang tidak muncul di Excel tidak akan dihapus.
              Untuk menghapus item, gunakan menu edit manual atau impor file lengkap (≥80% data).
            </p>
          </div>
        )}
        {summary.blocked > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-2 shrink-0">
            <p className="text-xs text-orange-700">
              {summary.blocked} item gagal dihapus karena masih terikat permohonan dana aktif.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto border rounded-lg bg-white mt-2">
          <div className="p-3">
            {hierarchical?.length > 0 ? (
              <PreviewTree items={hierarchical} depth={0} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Tidak ada perubahan terdeteksi.</p>
            )}
          </div>
        </div>

        <div className="shrink-0 py-2">
          <Label className="text-xs">Catatan Revisi (opsional)</Label>
          <Input
            className="mt-1 h-8 text-sm"
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Alasan revisi..."
            maxLength={500}
          />
        </div>

        <AlertDialogFooter className="shrink-0">
          <AlertDialogCancel onClick={onClose}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={doConfirm} disabled={confirming}>
            {confirming ? 'Menerapkan...' : 'Konfirmasi & Terapkan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PreviewTree({ items, depth }: { items: ImportPreviewItem[]; depth: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ul className={depth === 0 ? 'space-y-1' : 'ml-4 mt-0.5 space-y-0.5'}>
      {items.map((item, idx) => {
        const key = `${item.level}:${item.kode}:${idx}`;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expanded[key] ?? true;
        const jenis = item.jenis;
        const isBlocked = item.status_eksekusi === 'gagal_hapus_terikat';

        return (
          <li key={key} className="text-xs">
            <div
              className={`flex items-start gap-1.5 px-2 py-1 rounded border ${
                jenis ? JENIS_COLORS[jenis] ?? 'border-gray-100' : 'border-gray-100'
              } ${isBlocked ? 'border-orange-300 bg-orange-50' : ''}`}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(key)}
                  className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? (
                    <svg className="w-3 h-3 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  ) : (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  )}
                </button>
              ) : (
                <span className="w-3 shrink-0" />
              )}

              <span className="shrink-0 text-[10px] text-gray-400 uppercase w-14 font-mono">
                {LEVEL_LABELS[item.level] ?? item.level}
              </span>

              <span className="shrink-0 font-mono text-blue-700">{item.kode}</span>

              <span className={`flex-1 min-w-0 truncate ${jenis === 'hapus' ? 'line-through text-red-400' : ''}`}>
                {item.nama || '-'}
              </span>

              {jenis === 'ubah' && item.pagu_lama !== undefined && item.pagu_baru !== undefined && (
                <span className="shrink-0 text-amber-700">
                  {fmt(item.pagu_lama)} → {fmt(item.pagu_baru)}
                </span>
              )}
              {jenis === 'tambah' && (
                <span className="shrink-0 text-emerald-700">{fmt(item.pagu)}</span>
              )}
              {jenis === 'hapus' && (
                <span className="shrink-0 text-red-400 line-through">{fmt(item.pagu_lama ?? 0)}</span>
              )}

              {jenis && (
                <Badge variant="outline" className={`shrink-0 text-[10px] h-4 px-1 ${JENIS_COLORS[jenis]}`}>
                  {JENIS_LABELS[jenis] ?? jenis}
                </Badge>
              )}

              {item.overbudget && (
                <Badge variant="destructive" className="shrink-0 text-[10px] h-4 px-1">
                  {item.overbudget_label}
                </Badge>
              )}

              {isBlocked && item.keterangan && (
                <span className="shrink-0 text-[10px] text-orange-600 italic">{item.keterangan}</span>
              )}
            </div>

            {hasChildren && isExpanded && (
              <PreviewTree items={item.children} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Status Badge ────────────────────────────────────────────────────────────

function AktifBadge({ aktif }: { aktif: boolean }) {
  return (
    <Badge variant={aktif ? 'default' : 'secondary'} className={cn('text-xs', aktif ? 'bg-emerald-500' : '')}>
      {aktif ? 'Aktif' : 'Nonaktif'}
    </Badge>
  );
}

// ── Program Tab ─────────────────────────────────────────────────────────────

function ProgramTab({ programs }: { programs: Program[] }) {
  const { data, setData, post, processing, reset, errors } = useForm({ kode: '', nama: '', pagu: '' });
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const editForm = useForm({ kode: '', nama: '', pagu: '' });

  const table = usePaginatedTable(programs, ['kode', 'nama'], { pageSize: 10 });

  const store = (e: React.FormEvent) => {
    e.preventDefault();
    post('/super-admin/keuangan/master-anggaran/program', { onSuccess: () => reset() });
  };

  const startEdit = (p: Program) => {
    setEditing(p);
    editForm.setData({ kode: p.kode, nama: p.nama, pagu: String(p.pagu) });
  };

  const update = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editForm.put(`/super-admin/keuangan/master-anggaran/program/${editing.id}`, {
      onSuccess: () => setEditing(null),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah Program</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={store} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs">Kode <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" value={data.kode} onChange={e => setData('kode', e.target.value)} placeholder="023.01.DK" />
              {errors.kode && <p className="text-[10px] text-red-500 mt-0.5">{errors.kode}</p>}
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <Label className="text-xs">Nama <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" value={data.nama} onChange={e => setData('nama', e.target.value)} placeholder="Program Pendidikan Tinggi" />
            </div>
            <div>
              <Label className="text-xs">Pagu (Rp) <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu} onChange={e => setData('pagu', e.target.value)} placeholder="0" />
            </div>
            <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableControls {...table} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2">Kode</th>
              <th className="text-left px-4 py-2">Nama</th>
              <th className="text-right px-4 py-2">Pagu</th>
              <th className="text-center px-4 py-2">Status</th>
              <th className="text-center px-4 py-2 w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {table.paginated.map(p => (
              <tr key={p.id} className={cn('border-b last:border-0', !p.is_aktif && 'opacity-50')}>
                <td className="px-4 py-2 font-mono text-blue-700 text-xs">{p.kode}</td>
                <td className="px-4 py-2">{p.nama}</td>
                <td className="px-4 py-2 text-right text-xs text-gray-600">{fmt(p.pagu)}</td>
                <td className="px-4 py-2 text-center"><AktifBadge aktif={p.is_aktif} /></td>
                <td className="px-4 py-2">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => startEdit(p)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => router.patch(`/super-admin/keuangan/master-anggaran/program/${p.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {table.paginated.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination page={table.page} totalPages={table.totalPages} goPage={table.goPage} />

      <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader><AlertDialogTitle>Edit Program</AlertDialogTitle></AlertDialogHeader>
          <form onSubmit={update} className="space-y-3 py-2">
            <div><Label className="text-sm">Kode</Label>
              <Input className="mt-1" value={editForm.data.kode} onChange={e => editForm.setData('kode', e.target.value)} />
            </div>
            <div><Label className="text-sm">Nama</Label>
              <Input className="mt-1" value={editForm.data.nama} onChange={e => editForm.setData('nama', e.target.value)} />
            </div>
            <div><Label className="text-sm">Pagu (Rp)</Label>
              <Input className="mt-1" type="number" value={editForm.data.pagu} onChange={e => editForm.setData('pagu', e.target.value)} />
            </div>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirm
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) router.delete(`/super-admin/keuangan/master-anggaran/program/${deleting}`, { onFinish: () => setDeleting(null) }); }}
      />
    </div>
  );
}

// ── Generic Level Table with Filter (Sasaran / KRO / RO / Komponen / Kegiatan) ─

interface LevelItem extends DjaBase {
  parent_id: number;
  parent?: { id: number; kode: string; nama: string };
  jenis?: string;
}

interface LevelConfig {
  label: string;
  parentLabel: string;
  parents: { id: number; kode: string; nama: string }[];
  parentKey: string;
  baseUrl: string;
  withJenis?: boolean;
}

function GenericLevelTab({ items, config }: { items: LevelItem[]; config: LevelConfig }) {
  const initData = { [`${config.parentKey}`]: '', kode: '', nama: '', pagu: '', jenis: 'Utama' };
  const { data, setData, post, processing, reset, errors } = useForm(initData as Record<string, string>);
  const [editing, setEditing] = useState<LevelItem | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterParent, setFilterParent] = useState<string>('');
  const editForm = useForm({ kode: '', nama: '', pagu: '', jenis: 'Utama' });

  // Filter items by selected parent
  const filteredItems = useMemo(() => {
    if (!filterParent) return items;
    return items.filter(item => String(item.parent_id) === filterParent);
  }, [items, filterParent]);

  const searchKeys = ['kode', 'nama', 'parent.kode', 'parent.nama'];
  const table = usePaginatedTable(filteredItems, searchKeys, { pageSize: 10 });

  const store = (e: React.FormEvent) => {
    e.preventDefault();
    post(config.baseUrl, { onSuccess: () => reset() });
  };

  const startEdit = (item: LevelItem) => {
    setEditing(item);
    editForm.setData({ kode: item.kode, nama: item.nama, pagu: String(item.pagu), jenis: item.jenis ?? 'Utama' });
  };

  const update = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editForm.put(`${config.baseUrl}/${editing.id}`, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-muted-foreground shrink-0">Filter:</span>
        <Select value={filterParent} onValueChange={setFilterParent}>
          <SelectTrigger className="h-auto min-h-8 text-xs max-w-[16rem] w-full [&>span]:whitespace-normal [&>span]:break-words">
            <SelectValue placeholder={`Semua ${config.parentLabel}`} />
          </SelectTrigger>
          <SelectContent className="max-w-[20rem]">
            {config.parents.map(p => (
              <SelectItem key={p.id} value={String(p.id)} className="text-xs whitespace-normal">
                <span className="font-mono text-blue-700 mr-1 text-xs">{p.kode}</span>
                <span className="break-words">{p.nama}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterParent && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setFilterParent('')}>
            <X className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah {config.label}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={store} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <Label className="text-xs">{config.parentLabel} <span className="text-red-500">*</span></Label>
              <Select value={data[config.parentKey]} onValueChange={v => setData(config.parentKey, v)}>
                <SelectTrigger className="mt-1 h-auto min-h-8 text-xs [&>span]:whitespace-normal [&>span]:break-words">
                  <SelectValue placeholder={`Pilih ${config.parentLabel}...`} />
                </SelectTrigger>
                <SelectContent className="max-w-[20rem]">
                  {config.parents.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs whitespace-normal">
                      <span className="font-mono text-blue-700 mr-1 text-xs">{p.kode}</span>
                      <span className="break-words">{p.nama}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Kode <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" value={data.kode} onChange={e => setData('kode', e.target.value)} />
            </div>
            <div className={config.withJenis ? 'col-span-1' : 'col-span-2'}>
              <Label className="text-xs">Nama <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" value={data.nama} onChange={e => setData('nama', e.target.value)} />
            </div>
            {config.withJenis && (
              <div>
                <Label className="text-xs">Jenis</Label>
                <Select value={data.jenis} onValueChange={v => setData('jenis', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utama">Utama</SelectItem>
                    <SelectItem value="Pendukung">Pendukung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Pagu (Rp) <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu} onChange={e => setData('pagu', e.target.value)} />
            </div>
            <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableControls {...table} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left px-3 py-2">{config.parentLabel}</th>
              <th className="text-left px-3 py-2">Kode</th>
              <th className="text-left px-3 py-2">Nama</th>
              {config.withJenis && <th className="text-center px-3 py-2">Jenis</th>}
              <th className="text-right px-3 py-2">Pagu</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-center px-3 py-2 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {table.paginated.map(item => (
              <tr key={item.id} className={cn('border-b last:border-0 text-xs', !item.is_aktif && 'opacity-50')}>
                <td className="px-3 py-2 text-gray-500 font-mono break-words">
                  {item.parent ? `${item.parent.kode}` : item.parent_id}
                </td>
                <td className="px-3 py-2 font-mono text-blue-700 break-words">{item.kode}</td>
                <td className="px-3 py-2 text-gray-700 max-w-xs break-words">{item.nama}</td>
                {config.withJenis && <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-xs">{item.jenis}</Badge></td>}
                <td className="px-3 py-2 text-right text-gray-500">{fmt(item.pagu)}</td>
                <td className="px-3 py-2 text-center"><AktifBadge aktif={item.is_aktif} /></td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => startEdit(item)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => router.patch(`${config.baseUrl}/${item.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(item.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {table.paginated.length === 0 && (
              <tr><td colSpan={config.withJenis ? 7 : 6} className="text-center py-6 text-gray-400 text-sm">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination page={table.page} totalPages={table.totalPages} goPage={table.goPage} />

      {/* Edit Modal with Parent Info */}
      <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit {config.label}</AlertDialogTitle>
          </AlertDialogHeader>

          {/* Parent Info Panel */}
          {editing?.parent && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <span className="font-medium shrink-0">{config.parentLabel}:</span>
                <span className="font-mono shrink-0">{editing.parent.kode}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="break-words">{editing.parent.nama}</span>
              </div>
            </div>
          )}

          <form onSubmit={update} className="space-y-3 py-2">
            <div><Label className="text-sm">Kode</Label>
              <Input className="mt-1" value={editForm.data.kode} onChange={e => editForm.setData('kode', e.target.value)} /></div>
            <div><Label className="text-sm">Nama</Label>
              <Input className="mt-1" value={editForm.data.nama} onChange={e => editForm.setData('nama', e.target.value)} /></div>
            {config.withJenis && (
              <div><Label className="text-sm">Jenis</Label>
                <Select value={editForm.data.jenis} onValueChange={v => editForm.setData('jenis', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utama">Utama</SelectItem>
                    <SelectItem value="Pendukung">Pendukung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label className="text-sm">Pagu (Rp)</Label>
              <Input className="mt-1" type="number" value={editForm.data.pagu} onChange={e => editForm.setData('pagu', e.target.value)} /></div>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirm
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) router.delete(`${config.baseUrl}/${deleting}`, { onFinish: () => setDeleting(null) }); }}
      />
    </div>
  );
}

// ── Rincian Biaya Tab with Full Path ───────────────────────────────────────

function RincianTab({ rincians, kegiatans }: { rincians: Rincian[]; kegiatans: Kegiatan[] }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    kegiatan_id: '', kode_akun: '', nama_akun: '', nama_item: '',
    satuan: 'OK', harga_satuan: '', pagu_total: '', urutan: '',
  });
  const [editing, setEditing] = useState<Rincian | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterKegiatan, setFilterKegiatan] = useState<string>('');
  const [filterKodeAkun, setFilterKodeAkun] = useState('');
  const [filterNamaItem, setFilterNamaItem] = useState('');
  const editForm = useForm({ kode_akun: '', nama_akun: '', nama_item: '', satuan: '', harga_satuan: '', pagu_total: '', urutan: '' });

  // Filter rincians
  const filteredRincians = useMemo(() => {
    return rincians.filter(r => {
      if (filterKegiatan && String(r.kegiatan_id) !== filterKegiatan) return false;
      if (filterKodeAkun && !r.kode_akun.toLowerCase().includes(filterKodeAkun.toLowerCase())) return false;
      if (filterNamaItem && !r.nama_item.toLowerCase().includes(filterNamaItem.toLowerCase())) return false;
      return true;
    });
  }, [rincians, filterKegiatan, filterKodeAkun, filterNamaItem]);

  const table = usePaginatedTable(filteredRincians, ['kode_akun', 'nama_akun', 'nama_item', 'kegiatan.kode'], { pageSize: 25 });

  const store = (e: React.FormEvent) => {
    e.preventDefault();
    post('/super-admin/keuangan/master-anggaran/rincian', { onSuccess: () => reset() });
  };

  const startEdit = (r: Rincian) => {
    setEditing(r);
    editForm.setData({
      kode_akun: r.kode_akun, nama_akun: r.nama_akun, nama_item: r.nama_item,
      satuan: r.satuan, harga_satuan: String(r.harga_satuan),
      pagu_total: String(r.pagu_total), urutan: String(r.urutan),
    });
  };

  const update = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    editForm.put(`/super-admin/keuangan/master-anggaran/rincian/${editing.id}`, { onSuccess: () => setEditing(null) });
  };

  const SATUAN_OPTIONS = ['OK', 'OH', 'OJ', 'OB', 'ORKAL', 'KEG', 'PAKET', 'ls', 'buah'];

  const hasFilters = filterKegiatan || filterKodeAkun || filterNamaItem;

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>

        <Select value={filterKegiatan} onValueChange={setFilterKegiatan}>
          <SelectTrigger className="h-auto min-h-8 text-xs max-w-[20rem] w-full [&>span]:whitespace-normal [&>span]:break-words">
            <SelectValue placeholder="Semua Kegiatan" />
          </SelectTrigger>
          <SelectContent className="max-h-72 max-w-[24rem]">
            {kegiatans.map(k => (
              <SelectItem key={k.id} value={String(k.id)} className="text-xs whitespace-normal">
                <span className="text-xs break-words">{buildKegiatanLabel(k)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="h-8 text-xs max-w-[8rem] w-full"
          placeholder="Kode Akun..."
          value={filterKodeAkun}
          onChange={e => setFilterKodeAkun(e.target.value)}
        />

        <Input
          className="h-8 text-xs max-w-[10rem] w-full"
          placeholder="Nama Item..."
          value={filterNamaItem}
          onChange={e => setFilterNamaItem(e.target.value)}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => { setFilterKegiatan(''); setFilterKodeAkun(''); setFilterNamaItem(''); }}>
            <X className="w-3 h-3" /> Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Tambah Rincian Biaya</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={store} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Kegiatan <span className="text-red-500">*</span></Label>
                <Select value={data.kegiatan_id} onValueChange={v => setData('kegiatan_id', v)}>
                  <SelectTrigger className="mt-1 h-auto min-h-8 text-xs [&>span]:whitespace-normal [&>span]:break-words">
                    <SelectValue placeholder="Pilih Kegiatan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 max-w-[24rem]">
                    {kegiatans.map(k => (
                      <SelectItem key={k.id} value={String(k.id)} className="text-xs whitespace-normal">
                        <span className="text-xs break-words">{buildKegiatanLabel(k)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Kode Akun <span className="text-red-500">*</span></Label>
                <Input className="mt-1 h-8 text-sm font-mono" value={data.kode_akun} onChange={e => setData('kode_akun', e.target.value)} placeholder="521213" />
              </div>
              <div>
                <Label className="text-xs">Nama Akun <span className="text-red-500">*</span></Label>
                <Input className="mt-1 h-8 text-sm" value={data.nama_akun} onChange={e => setData('nama_akun', e.target.value)} placeholder="Belanja Honor Output Kegiatan" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Nama Item / Uraian <span className="text-red-500">*</span></Label>
              <Input className="mt-1 h-8 text-sm" value={data.nama_item} onChange={e => setData('nama_item', e.target.value)} placeholder="Honorarium Ketua Panitia" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <Label className="text-xs">Satuan <span className="text-red-500">*</span></Label>
                <Select value={data.satuan} onValueChange={v => setData('satuan', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{SATUAN_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Harga Satuan <span className="text-red-500">*</span></Label>
                <Input className="mt-1 h-8 text-sm" type="number" value={data.harga_satuan} onChange={e => setData('harga_satuan', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Pagu Total <span className="text-red-500">*</span></Label>
                <Input className="mt-1 h-8 text-sm" type="number" value={data.pagu_total} onChange={e => setData('pagu_total', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Urutan</Label>
                <Input className="mt-1 h-8 text-sm" type="number" value={data.urutan} onChange={e => setData('urutan', e.target.value)} placeholder="0" />
              </div>
            </div>
            <Button size="sm" disabled={processing} className="gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableControls {...table} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left px-3 py-2">Path Kegiatan</th>
              <th className="text-left px-3 py-2">Kode Akun</th>
              <th className="text-left px-3 py-2">Nama Item</th>
              <th className="text-center px-2 py-2">Sat.</th>
              <th className="text-right px-3 py-2">Harga Satuan</th>
              <th className="text-right px-3 py-2">Pagu Total</th>
              <th className="text-center px-2 py-2">Status</th>
              <th className="text-center px-2 py-2 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {table.paginated.map(r => (
              <tr key={r.id} className={cn('border-b last:border-0', !r.is_aktif && 'opacity-50')}>
                <td className="px-3 py-2 text-gray-600 text-[10px] max-w-[12rem] break-words">
                  {r.kegiatan ? buildKegiatanPath(r.kegiatan) : r.kegiatan_id}
                </td>
                <td className="px-3 py-2 font-mono text-blue-700 font-semibold break-words">{r.kode_akun}</td>
                <td className="px-3 py-2 text-gray-700 max-w-xs break-words">{r.nama_item}</td>
                <td className="px-2 py-2 text-center text-gray-500">{r.satuan}</td>
                <td className="px-3 py-2 text-right">{fmt(r.harga_satuan)}</td>
                <td className="px-3 py-2 text-right">{fmt(r.pagu_total)}</td>
                <td className="px-2 py-2 text-center"><AktifBadge aktif={r.is_aktif} /></td>
                <td className="px-2 py-2">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => startEdit(r)} className="p-1 text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => router.patch(`/super-admin/keuangan/master-anggaran/rincian/${r.id}/toggle`)} className="p-1 text-amber-500 hover:text-amber-700"><Power className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleting(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {table.paginated.length === 0 && (
              <tr><td colSpan={8} className="text-center py-6 text-gray-400 text-sm">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination page={table.page} totalPages={table.totalPages} goPage={table.goPage} />

      {/* Edit Modal with Parent Info */}
      <AlertDialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>Edit Rincian Biaya</AlertDialogTitle></AlertDialogHeader>

          {/* Parent Info Panel */}
          {editing?.kegiatan && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2">
              <div className="text-xs text-blue-700">
                <span className="font-medium">Kegiatan:</span>{' '}
                <span className="font-mono">{editing.kegiatan.kode}</span>
                <ChevronRight className="w-3 h-3 inline mx-0.5" />
                <span>{editing.kegiatan.nama}</span>
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5 font-mono break-words">
                {buildKegiatanPath(editing.kegiatan)}
              </div>
            </div>
          )}

          <form onSubmit={update} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Kode Akun</Label><Input className="mt-1 font-mono" value={editForm.data.kode_akun} onChange={e => editForm.setData('kode_akun', e.target.value)} /></div>
              <div><Label className="text-sm">Nama Akun</Label><Input className="mt-1" value={editForm.data.nama_akun} onChange={e => editForm.setData('nama_akun', e.target.value)} /></div>
            </div>
            <div><Label className="text-sm">Nama Item</Label><Input className="mt-1" value={editForm.data.nama_item} onChange={e => editForm.setData('nama_item', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Satuan</Label><Input className="mt-1" value={editForm.data.satuan} onChange={e => editForm.setData('satuan', e.target.value)} /></div>
              <div><Label className="text-sm">Urutan</Label><Input className="mt-1" type="number" value={editForm.data.urutan} onChange={e => editForm.setData('urutan', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Harga Satuan</Label><Input className="mt-1" type="number" value={editForm.data.harga_satuan} onChange={e => editForm.setData('harga_satuan', e.target.value)} /></div>
              <div><Label className="text-sm">Pagu Total</Label><Input className="mt-1" type="number" value={editForm.data.pagu_total} onChange={e => editForm.setData('pagu_total', e.target.value)} /></div>
            </div>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={update} disabled={editForm.processing}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirm
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) router.delete(`/super-admin/keuangan/master-anggaran/rincian/${deleting}`, { onFinish: () => setDeleting(null) }); }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MasterAnggaranIndex({ tahun, programs, sasarans, kros, ros, komponens, kegiatans, rincians, importPreview, importKey }: Props) {
  return (
    <AppLayout>
      <Head title="Master Anggaran DJA" />
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Master Anggaran DJA</h1>
              <p className="text-sm text-muted-foreground">Tahun Anggaran {tahun.tahun} — Kelola hierarki program dan rincian biaya</p>
            </div>
          </div>
          <ImportDialog preview={importPreview} importKey={importKey} />
        </div>

        <div className="grid grid-cols-7 gap-3">
          {[
            ['Program', programs.length],
            ['Sasaran', sasarans.length],
            ['KRO', kros.length],
            ['RO', ros.length],
            ['Komponen', komponens.length],
            ['Kegiatan', kegiatans.length],
            ['Rincian', rincians.length],
          ].map(([label, count]) => (
            <div key={label} className="bg-white border rounded-lg px-3 py-2 text-center">
              <p className="text-2xl font-bold tabular-nums">{count}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="program">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="program">Program</TabsTrigger>
            <TabsTrigger value="sasaran">Sasaran</TabsTrigger>
            <TabsTrigger value="kro">KRO</TabsTrigger>
            <TabsTrigger value="ro">RO</TabsTrigger>
            <TabsTrigger value="komponen">Komponen</TabsTrigger>
            <TabsTrigger value="kegiatan">Kegiatan</TabsTrigger>
            <TabsTrigger value="rincian">Rincian Biaya</TabsTrigger>
          </TabsList>

          <TabsContent value="program" className="mt-4"><ProgramTab programs={programs} /></TabsContent>

          <TabsContent value="sasaran" className="mt-4">
            <GenericLevelTab
              items={sasarans.map(s => ({ ...s, parent_id: s.program_id, parent: s.program }))}
              config={{ label: 'Sasaran', parentLabel: 'Program', parentKey: 'program_id',
                parents: programs.map(p => ({ id: p.id, kode: p.kode, nama: p.nama })),
                baseUrl: '/super-admin/keuangan/master-anggaran/sasaran' }}
            />
          </TabsContent>

          <TabsContent value="kro" className="mt-4">
            <GenericLevelTab
              items={kros.map(k => ({ ...k, parent_id: k.sasaran_id, parent: k.sasaran }))}
              config={{ label: 'KRO', parentLabel: 'Sasaran', parentKey: 'sasaran_id',
                parents: sasarans.map(s => ({ id: s.id, kode: s.kode, nama: s.nama })),
                baseUrl: '/super-admin/keuangan/master-anggaran/kro' }}
            />
          </TabsContent>

          <TabsContent value="ro" className="mt-4">
            <GenericLevelTab
              items={ros.map(r => ({ ...r, parent_id: r.kro_id, parent: r.kro }))}
              config={{ label: 'RO', parentLabel: 'KRO', parentKey: 'kro_id',
                parents: kros.map(k => ({ id: k.id, kode: k.kode, nama: k.nama })),
                baseUrl: '/super-admin/keuangan/master-anggaran/ro' }}
            />
          </TabsContent>

          <TabsContent value="komponen" className="mt-4">
            <GenericLevelTab
              items={komponens.map(k => ({ ...k, parent_id: k.ro_id, parent: k.ro }))}
              config={{ label: 'Komponen', parentLabel: 'RO', parentKey: 'ro_id',
                parents: ros.map(r => ({ id: r.id, kode: r.kode, nama: r.nama })),
                baseUrl: '/super-admin/keuangan/master-anggaran/komponen', withJenis: true }}
            />
          </TabsContent>

          <TabsContent value="kegiatan" className="mt-4">
            <GenericLevelTab
              items={kegiatans.map(k => ({ ...k, parent_id: k.komponen_id, parent: k.komponen }))}
              config={{ label: 'Kegiatan', parentLabel: 'Komponen', parentKey: 'komponen_id',
                parents: komponens.map(k => ({ id: k.id, kode: k.kode, nama: k.nama })),
                baseUrl: '/super-admin/keuangan/master-anggaran/kegiatan' }}
            />
          </TabsContent>

          <TabsContent value="rincian" className="mt-4">
            <RincianTab rincians={rincians} kegiatans={kegiatans} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
