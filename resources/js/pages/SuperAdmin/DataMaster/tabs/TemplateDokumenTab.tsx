import { Search, Plus, Edit, Trash2, Upload, Download, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import type { TemplateDokumen } from '../types';

interface TemplateDokumenForm {
    nama: string;
}

const defaultForm: TemplateDokumenForm = { nama: '' };

export function TemplateDokumenTab({ data }: { data: TemplateDokumen[] }) {
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<TemplateDokumen | null>(null);
    const [form, setForm] = useState<TemplateDokumenForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const filtered = data.filter((item) =>
        [item.nama, item.fileName].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: TemplateDokumen) => {
        setEditingItem(item);
        setForm({ nama: item.nama });
        setShowDialog(true);
    };

    const handleSave = () => {
        alert(`Template berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}`);
        setShowDialog(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Template Dokumen</CardTitle>
                            <CardDescription>Kelola template dokumen .docx / .xlsx</CardDescription>
                        </div>
                        <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Upload Template</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari template..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Template</TableHead>
                                    <TableHead>File</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? filtered.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                        <TableCell className="font-mono text-sm">{item.fileName}</TableCell>
                                        <TableCell><Badge variant="outline">{item.fileType}</Badge></TableCell>
                                        <TableCell><StatusBadge status={item.status} /></TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => alert('Download template')}>
                                                        <Download className="mr-2 h-4 w-4" />Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />Edit
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
                                            Tidak ada template dokumen
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
                        <DialogTitle>{editingItem ? 'Edit' : 'Upload'} Template</DialogTitle>
                        <DialogDescription>Upload file template dokumen (.docx / .xlsx).</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Template <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: Template TOR" value={form.nama}
                                onChange={(e) => setForm({ ...form, nama: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Upload File (.docx / .xlsx)</Label>
                            <Input type="file" accept=".docx,.xlsx" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
                        <Button onClick={handleSave}>
                            <Upload className="mr-2 h-4 w-4" />Simpan
                        </Button>
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
