import { router } from '@inertiajs/react';
import { Plus, Edit, Trash2, MoreVertical, CheckCircle2, XCircle, Star, Copy, Users, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { TahunAnggaran, UserAssignment } from '../types';

interface TahunAnggaranForm {
    tahun: string;
    label: string;
    is_active: boolean;
    is_default: boolean;
}

const defaultForm: TahunAnggaranForm = { tahun: '', label: '', is_active: true, is_default: false };

interface TahunAnggaranTabProps {
    data: TahunAnggaran[];
    userAssignments: Record<string, UserAssignment[]>;
}

export function TahunAnggaranTab({ data, userAssignments }: TahunAnggaranTabProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<TahunAnggaran | null>(null);
    const [form, setForm] = useState<TahunAnggaranForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingItem, setDeletingItem] = useState<TahunAnggaran | null>(null);

    // Clone dialog state
    const [showCloneDialog, setShowCloneDialog] = useState(false);
    const [cloneTarget, setCloneTarget] = useState<TahunAnggaran | null>(null);
    const [sourceTahunId, setSourceTahunId] = useState<string>('');
    const [cloneProcessing, setCloneProcessing] = useState(false);
    const [cloneErrors, setCloneErrors] = useState<Record<string, string>>({});

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

    const openClone = (item: TahunAnggaran) => {
        setCloneTarget(item);
        setSourceTahunId('');
        setShowCloneDialog(true);
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

    const handleClone = () => {
        if (!cloneTarget || !sourceTahunId) return;

        setCloneProcessing(true);
        setCloneErrors({});

        router.post(`/super-admin/data-master/tahun-anggaran/${cloneTarget.id}/clone-users`, {
            source_tahun_anggaran_id: sourceTahunId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCloneProcessing(false);
                setShowCloneDialog(false);
                setCloneTarget(null);
                setSourceTahunId('');
            },
            onError: (errors) => {
                setCloneProcessing(false);
                setCloneErrors(errors as Record<string, string>);
            },
        });
    };

    // Tahun yang punya user assignments untuk dropdown clone
    const sourceOptions = data.filter((t) => t.has_user_assignments && userAssignments[String(t.id)]?.length > 0);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Tahun Anggaran</CardTitle>
                            <CardDescription>Kelola tahun anggaran aktif dan salin user assignment dari tahun sebelumnya</CardDescription>
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
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? data.map((item) => {
                                    const userCount = userAssignments[String(item.id)]?.length ?? 0;
                                    const canClone = !item.has_user_assignments && sourceOptions.length > 0;

                                    return (
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
                                            <TableCell>
                                                {item.has_user_assignments ? (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                                                        <Users className="mr-1 h-3 w-3" />{userCount} user
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">
                                                        <XCircle className="mr-1 h-3 w-3" />Kosong
                                                    </Badge>
                                                )}
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
                                                        {canClone && (
                                                            <DropdownMenuItem onClick={() => openClone(item)}>
                                                                <Copy className="mr-2 h-4 w-4" />Ambil User dari Tahun Lain
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setDeletingItem(item); setShowDeleteDialog(true); }} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                            Tidak ada data tahun anggaran
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Clone Dialog */}
            <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5" />
                            Ambil User dari Tahun Lain
                        </DialogTitle>
                        <DialogDescription>
                            Clone user assignment dari tahun sumber ke tahun <strong>{cloneTarget?.tahun}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {cloneProcessing && (
                        <div className="space-y-3">
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                            <p className="text-sm text-muted-foreground text-center">Sedang meng-clone user assignments...</p>
                        </div>
                    )}

                    {!cloneProcessing && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tahun Sumber <span className="text-red-500">*</span></Label>
                                <Select value={sourceTahunId} onValueChange={setSourceTahunId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tahun sumber..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sourceOptions.map((t) => {
                                            const count = userAssignments[String(t.id)]?.length ?? 0;
                                            return (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.tahun} — {t.label} ({count} user)
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {cloneErrors.source_tahun_anggaran_id && (
                                    <p className="text-xs text-red-500">{cloneErrors.source_tahun_anggaran_id}</p>
                                )}
                            </div>

                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Catatan:</p>
                                        <ul className="mt-1 space-y-1 text-xs list-disc list-inside">
                                            <li>Hanya user non-super_admin yang akan di-clone</li>
                                            <li>Role, tim kerja, dan status aktif akan disalin persis</li>
                                            <li>Clone hanya bisa dilakukan sekali per tahun</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloneDialog(false)} disabled={cloneProcessing}>Batal</Button>
                        <Button onClick={handleClone} disabled={cloneProcessing || !sourceTahunId}>
                            {cloneProcessing ? 'Meng-clone...' : 'Clone User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Dialog */}
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
                title="Hapus Tahun Anggaran?"
                description={`Tahun anggaran ${deletingItem?.tahun} akan dihapus permanen. Tahun anggaran yang masih memiliki histori permohonan dana tidak dapat dihapus. Nonaktifkan saja jika tidak lagi digunakan.`}
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
