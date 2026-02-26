import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Edit, Trash2, Upload, Download, MoreVertical } from 'lucide-react';
import { JenisAnggaran } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface JenisAnggaranForm {
    kode: string;
    nama: string;
    sumberDana: string;
}

const defaultForm: JenisAnggaranForm = { kode: '', nama: '', sumberDana: '' };

export function JenisAnggaranTab({ data }: { data: JenisAnggaran[] }) {
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<JenisAnggaran | null>(null);
    const [form, setForm] = useState<JenisAnggaranForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const filtered = data.filter((item) =>
        [item.nama, item.kode, item.sumberDana].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: JenisAnggaran) => {
        setEditingItem(item);
        setForm({ kode: item.kode, nama: item.nama, sumberDana: item.sumberDana });
        setShowDialog(true);
    };

    const handleSave = () => {
        alert(`Data jenis anggaran berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}`);
        setShowDialog(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Jenis Anggaran</CardTitle>
                            <CardDescription>Kelola jenis dan sumber anggaran</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Import</Button>
                            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
                            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Tambah</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari jenis anggaran..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Jenis</TableHead>
                                    <TableHead>Sumber Dana</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.kode}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell>{item.sumberDana}</TableCell>
                                        <TableCell><StatusBadge status={item.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => alert('Status berhasil diubah')}>
                                                        {item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                            Tidak ada data jenis anggaran
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} Jenis Anggaran</DialogTitle>
                        <DialogDescription>Isi data jenis anggaran di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kode <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: DIPA" value={form.kode}
                                onChange={(e) => setForm({ ...form, kode: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Jenis <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: DIPA Reguler" value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sumber Dana <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: APBN" value={form.sumberDana}
                                onChange={(e) => setForm({ ...form, sumberDana: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
                        <Button onClick={handleSave}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => { alert('Data berhasil dihapus'); setShowDeleteDialog(false); }}
            />
        </>
    );
}
