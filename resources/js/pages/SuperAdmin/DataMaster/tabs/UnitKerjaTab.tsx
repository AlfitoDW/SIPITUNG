import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Edit, Trash2, Upload, Download, MoreVertical } from 'lucide-react';
import { UnitKerja } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface UnitKerjaForm {
    kode: string;
    nama: string;
}

const defaultForm: UnitKerjaForm = { kode: '', nama: '' };

export function UnitKerjaTab({ data }: { data: UnitKerja[] }) {
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<UnitKerja | null>(null);
    const [form, setForm] = useState<UnitKerjaForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const filtered = data.filter((item) =>
        [item.nama, item.kode].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: UnitKerja) => {
        setEditingItem(item);
        setForm({ kode: item.kode, nama: item.nama });
        setShowDialog(true);
    };

    const handleSave = () => {
        alert(`Data unit kerja berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}`);
        setShowDialog(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Unit Kerja</CardTitle>
                            <CardDescription>Kelola data unit kerja organisasi</CardDescription>
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
                            placeholder="Cari nama atau kode unit..."
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
                                    <TableHead>Nama Unit Kerja</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.kode}</TableCell>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell><StatusBadge status={item.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
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
                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                            Tidak ada data unit kerja
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
                        <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} Unit Kerja</DialogTitle>
                        <DialogDescription>Isi data unit kerja di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Kode <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: UP" value={form.kode}
                                onChange={(e) => setForm({ ...form, kode: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Unit <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: Unit Perencanaan" value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })} />
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
