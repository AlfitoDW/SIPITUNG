import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { TahunAnggaran } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface TahunAnggaranForm {
    tahun: string;
    isActive: boolean;
}

const defaultForm: TahunAnggaranForm = { tahun: '', isActive: false };

export function TahunAnggaranTab({ data }: { data: TahunAnggaran[] }) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<TahunAnggaran | null>(null);
    const [form, setForm] = useState<TahunAnggaranForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: TahunAnggaran) => {
        setEditingItem(item);
        setForm({ tahun: item.tahun, isActive: item.isActive });
        setShowDialog(true);
    };

    const handleSave = () => {
        alert(`Data tahun anggaran berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}`);
        setShowDialog(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Tahun Anggaran</CardTitle>
                            <CardDescription>Kelola tahun anggaran aktif</CardDescription>
                        </div>
                        <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Tambah</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tahun</TableHead>
                                    <TableHead>Tahun Aktif</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-lg font-semibold">{item.tahun}</TableCell>
                                        <TableCell>
                                            {item.isActive
                                                ? <Badge variant="default" className="bg-blue-500">Active Year</Badge>
                                                : <span className="text-muted-foreground">-</span>
                                            }
                                        </TableCell>
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
                                                    <DropdownMenuItem onClick={() => alert('Tahun aktif berhasil diubah')}>
                                                        Set as Active Year
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
                                            Tidak ada data tahun anggaran
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
                        <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} Tahun Anggaran</DialogTitle>
                        <DialogDescription>Isi data tahun anggaran di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tahun <span className="text-red-500">*</span></Label>
                            <Input type="number" placeholder="2024" value={form.tahun}
                                onChange={(e) => setForm({ ...form, tahun: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Set as Active Year</Label>
                            <Switch checked={form.isActive}
                                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
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
