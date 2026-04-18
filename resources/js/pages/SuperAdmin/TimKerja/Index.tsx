import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Master Data', href: '#' },
    { title: 'Tim Kerja', href: '/super-admin/master/tim-kerja' },
];

type TimKerja = {
    id: number;
    kode: string;
    nama: string;
    nama_singkat: string | null;
    deskripsi: string | null;
    is_active: boolean;
};

type Props = { timKerjas: TimKerja[] };

type FormFields = {
    kode: string;
    nama: string;
    nama_singkat: string;
    deskripsi: string;
};

export default function TimKerjaIndex({ timKerjas }: Props) {
    const [addOpen, setAddOpen]     = useState(false);
    const [editTarget, setEditTarget] = useState<TimKerja | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TimKerja | null>(null);

    const addForm = useForm<FormFields>({ kode: '', nama: '', nama_singkat: '', deskripsi: '' });
    const editForm = useForm<FormFields>({ kode: '', nama: '', nama_singkat: '', deskripsi: '' });

    function openEdit(tim: TimKerja) {
        editForm.setData({
            kode: tim.kode,
            nama: tim.nama,
            nama_singkat: tim.nama_singkat ?? '',
            deskripsi: tim.deskripsi ?? '',
        });
        setEditTarget(tim);
    }

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post('/super-admin/master/tim-kerja', {
            onSuccess: () => { setAddOpen(false); addForm.reset(); },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editTarget) return;
        editForm.put(`/super-admin/master/tim-kerja/${editTarget.id}`, {
            onSuccess: () => setEditTarget(null),
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/super-admin/master/tim-kerja/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function toggleActive(tim: TimKerja) {
        router.patch(`/super-admin/master/tim-kerja/${tim.id}/toggle-active`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Tim Kerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Master Tim Kerja</h1>
                        <p className="text-muted-foreground">Kelola daftar divisi / tim kerja dalam organisasi</p>
                    </div>
                    <Button size="sm" onClick={() => setAddOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" /> Tambah Tim Kerja
                    </Button>
                </div>

                <div className="rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                <TableHead className="border-r border-white/20 text-center font-semibold text-white w-28">Kode</TableHead>
                                <TableHead className="border-r border-white/20 font-semibold text-white">Nama Tim Kerja</TableHead>
                                <TableHead className="border-r border-white/20 font-semibold text-white w-44">Nama Singkat</TableHead>
                                <TableHead className="border-r border-white/20 font-semibold text-white">Deskripsi</TableHead>
                                <TableHead className="border-r border-white/20 text-center font-semibold text-white w-24">Status</TableHead>
                                <TableHead className="text-center font-semibold text-white w-28">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timKerjas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        Belum ada data tim kerja.
                                    </TableCell>
                                </TableRow>
                            )}
                            {timKerjas.map(tim => (
                                <TableRow key={tim.id} className="align-top">
                                    <TableCell className="text-center font-mono text-sm font-semibold">{tim.kode}</TableCell>
                                    <TableCell className="text-sm">{tim.nama}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{tim.nama_singkat ?? '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{tim.deskripsi ?? '—'}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={tim.is_active ? 'default' : 'secondary'} className="text-xs">
                                            {tim.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                title={tim.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                onClick={() => toggleActive(tim)}
                                            >
                                                {tim.is_active
                                                    ? <ToggleRight className="h-4 w-4 text-green-600" />
                                                    : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                                }
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                title="Edit"
                                                onClick={() => openEdit(tim)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                title="Hapus"
                                                onClick={() => setDeleteTarget(tim)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Tim Kerja</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitAdd} className="flex flex-col gap-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="add-kode">Kode <span className="text-destructive">*</span></Label>
                                <Input
                                    id="add-kode"
                                    value={addForm.data.kode}
                                    onChange={e => addForm.setData('kode', e.target.value)}
                                    placeholder="TK-XXX"
                                    className="uppercase"
                                />
                                {addForm.errors.kode && <p className="text-xs text-destructive">{addForm.errors.kode}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="add-singkat">Nama Singkat</Label>
                                <Input
                                    id="add-singkat"
                                    value={addForm.data.nama_singkat}
                                    onChange={e => addForm.setData('nama_singkat', e.target.value)}
                                    placeholder="Nama ringkas"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="add-nama">Nama Lengkap <span className="text-destructive">*</span></Label>
                            <Input
                                id="add-nama"
                                value={addForm.data.nama}
                                onChange={e => addForm.setData('nama', e.target.value)}
                                placeholder="Tim Kerja ..."
                            />
                            {addForm.errors.nama && <p className="text-xs text-destructive">{addForm.errors.nama}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="add-deskripsi">Deskripsi</Label>
                            <Textarea
                                id="add-deskripsi"
                                value={addForm.data.deskripsi}
                                onChange={e => addForm.setData('deskripsi', e.target.value)}
                                rows={3}
                                placeholder="Tanggung jawab dan fungsi tim..."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                            <Button type="submit" loading={addForm.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Tim Kerja</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="flex flex-col gap-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="edit-kode">Kode <span className="text-destructive">*</span></Label>
                                <Input
                                    id="edit-kode"
                                    value={editForm.data.kode}
                                    onChange={e => editForm.setData('kode', e.target.value)}
                                    className="uppercase"
                                />
                                {editForm.errors.kode && <p className="text-xs text-destructive">{editForm.errors.kode}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="edit-singkat">Nama Singkat</Label>
                                <Input
                                    id="edit-singkat"
                                    value={editForm.data.nama_singkat}
                                    onChange={e => editForm.setData('nama_singkat', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-nama">Nama Lengkap <span className="text-destructive">*</span></Label>
                            <Input
                                id="edit-nama"
                                value={editForm.data.nama}
                                onChange={e => editForm.setData('nama', e.target.value)}
                            />
                            {editForm.errors.nama && <p className="text-xs text-destructive">{editForm.errors.nama}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="edit-deskripsi">Deskripsi</Label>
                            <Textarea
                                id="edit-deskripsi"
                                value={editForm.data.deskripsi}
                                onChange={e => editForm.setData('deskripsi', e.target.value)}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Batal</Button>
                            <Button type="submit" loading={editForm.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tim Kerja?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteTarget?.nama}</strong> akan dihapus permanen. Tim kerja yang masih memiliki anggota tidak dapat dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
