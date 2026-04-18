import { router } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, CheckCircle2, XCircle, Star } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { TahunAnggaran } from '../types';

interface TahunAnggaranForm {
    tahun: string;
    label: string;
    is_active: boolean;
    is_default: boolean;
}

const defaultForm: TahunAnggaranForm = { tahun: '', label: '', is_active: true, is_default: false };

export function TahunAnggaranTab({ data }: { data: TahunAnggaran[] }) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<TahunAnggaran | null>(null);
    const [form, setForm] = useState<TahunAnggaranForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingItem, setDeletingItem] = useState<TahunAnggaran | null>(null);

    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: TahunAnggaran) => {
        setEditingItem(item);
        setForm({ tahun: String(item.tahun), label: item.label, is_active: item.is_active, is_default: item.is_default });
        setShowDialog(true);
    };

    const handleSave = () => {
        if (editingItem) {
            router.put(`/super-admin/data-master/tahun-anggaran/${editingItem.id}`, { ...form }, {
                onSuccess: () => setShowDialog(false),
            });
        } else {
            router.post('/super-admin/data-master/tahun-anggaran', { ...form }, {
                onSuccess: () => setShowDialog(false),
            });
        }
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
                                    <TableHead>Label</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-lg font-semibold">{item.tahun}</TableCell>
                                        <TableCell>{item.label}</TableCell>
                                        <TableCell>
                                            {item.is_default
                                                ? <Badge variant="default" className="bg-blue-500"><Star className="mr-1 h-3 w-3" />Default</Badge>
                                                : <Badge variant="outline" className="text-muted-foreground"><XCircle className="mr-1 h-3 w-3" />-</Badge>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {item.is_active
                                                ? <Badge variant="default" className="bg-green-500 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Aktif</Badge>
                                                : <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300"><XCircle className="mr-1 h-3 w-3" />Nonaktif</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.patch(`/super-admin/data-master/tahun-anggaran/${item.id}/toggle-default`)}>
                                                        Tetapkan sebagai Default
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => { setDeletingItem(item); setShowDeleteDialog(true); }} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
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
                            <Input type="number" placeholder="2026" value={form.tahun}
                                onChange={(e) => setForm({ ...form, tahun: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Label <span className="text-red-500">*</span></Label>
                            <Input type="text" placeholder="TA 2026" value={form.label}
                                onChange={(e) => setForm({ ...form, label: e.target.value })} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Aktif</Label>
                            <Switch checked={form.is_active}
                                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Set as Default</Label>
                            <Switch checked={form.is_default}
                                onCheckedChange={(checked) => setForm({ ...form, is_default: checked })} />
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
                onConfirm={() => {
                    if (deletingItem) {
                        router.delete(`/super-admin/data-master/tahun-anggaran/${deletingItem.id}`, {
                            onSuccess: () => { setShowDeleteDialog(false); setDeletingItem(null); },
                        });
                    }
                }}
            />
        </>
    );
}
