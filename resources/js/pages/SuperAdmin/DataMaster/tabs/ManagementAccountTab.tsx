import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Edit, Trash2, Upload, Download, MoreVertical, KeyRound } from 'lucide-react';
import { ManagementAccount, TimKerja } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface Props {
    accounts: ManagementAccount[];
    timKerja: TimKerja[];
}

interface AccountForm {
    nama_lengkap: string;
    nip: string;
    username: string;
    email: string;
    password: string;
    role: string;
    pimpinan_type: string;
    tim_kerja_id: string;
}

const defaultForm: AccountForm = {
    nama_lengkap: '', nip: '', username: '', email: '', password: '', role: '', pimpinan_type: '', tim_kerja_id: '',
};

const roleLabel = (item: ManagementAccount): string => {
    if (item.role === 'super_admin') return 'Super Admin';
    if (item.role === 'bendahara') return 'Bendahara';
    if (item.role === 'ketua_tim_kerja') return 'Ketua Tim Kerja';
    if (item.role === 'pimpinan') return item.pimpinan_type === 'kabag_umum' ? 'Kabag Umum' : 'PPK';
    return item.role;
};

export function ManagementAccountTab({ accounts, timKerja }: Props) {
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<ManagementAccount | null>(null);
    const [form, setForm] = useState<AccountForm>(defaultForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ManagementAccount | null>(null);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [itemToReset, setItemToReset] = useState<ManagementAccount | null>(null);
    const [resetForm, setResetForm] = useState({ password: '', password_confirmation: '' });

    const filtered = accounts.filter((item) =>
        [item.nama_lengkap, item.nip, item.username, item.email, item.role].some((v) =>
            v?.toLowerCase().includes(search.toLowerCase())
        )
    );

const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
const safePage   = Math.min(currentPage, totalPages);
const paginated  = filtered.slice((safePage - 1) * perPage, safePage * perPage);


    const openAdd = () => {
        setEditingItem(null);
        setForm(defaultForm);
        setShowDialog(true);
    };

    const openEdit = (item: ManagementAccount) => {
        setEditingItem(item);
        setForm({
            nama_lengkap: item.nama_lengkap,
            nip: item.nip ?? '',
            username: item.username,
            email: item.email,
            password: '',
            role: item.role,
            pimpinan_type: item.pimpinan_type ?? '',
            tim_kerja_id: item.tim_kerja_id ? String(item.tim_kerja_id) : '',
        });
        setShowDialog(true);
    };

    const handleSave = () => {
        const payload = {
            nama_lengkap: form.nama_lengkap,
            nip: form.nip || null,
            username: form.username,
            email: form.email,
            role: form.role,
            pimpinan_type: form.role === 'pimpinan' ? form.pimpinan_type : null,
            tim_kerja_id: form.role === 'ketua_tim_kerja' ? form.tim_kerja_id : null,
        };

        if (editingItem) {
            router.put(`/super-admin/data-master/users/${editingItem.id}`, payload, {
                onSuccess: () => setShowDialog(false),
            });
        } else {
            router.post('/super-admin/data-master/users', { ...payload, password: form.password }, {
                onSuccess: () => setShowDialog(false),
            });
        }
    };

    const handleToggleStatus = (item: ManagementAccount) => {
        router.patch(`/super-admin/data-master/users/${item.id}/toggle-status`, {});
    };

    const handleResetPassword = () => {
        if (!itemToReset) return;
        router.patch(`/super-admin/data-master/users/${itemToReset.id}/reset-password`, resetForm, {
            onSuccess: () => {
                setShowResetDialog(false);
                setResetForm({ password: '', password_confirmation: '' });
            },
        });
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        router.delete(`/super-admin/data-master/users/${itemToDelete.id}`, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                setItemToDelete(null);
            },
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Management Account</CardTitle>
                            <CardDescription>Kelola akun pengguna sistem</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Tambah</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, username, atau email..."
                            value={search}
                            onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
                            className="pl-8"
                        />
                    </div>
                                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Tampilkan</span>
                            <Select
                                value={String(perPage)}
                                onValueChange={(val) => { setPerPage(Number(val)); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="h-8 w-17.5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>entri</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            Total {filtered.length} akun
                        </span>
                    </div>

                    <div className="rounded-md border"> 
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.length > 0 ? paginated.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.nama_lengkap}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.username}</TableCell>
                                        <TableCell>{item.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{roleLabel(item)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
                                        </TableCell>
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
                                                    <DropdownMenuItem onClick={() => { setItemToReset(item); setShowResetDialog(true); }}>
                                                        <KeyRound className="mr-2 h-4 w-4" />Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                                                        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => { setItemToDelete(item); setShowDeleteDialog(true); }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                            Tidak ada data akun
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                        {totalPages > 1 && (
                        <div className="flex justify-end">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            aria-disabled={safePage === 1}
                                            className={safePage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => setCurrentPage(page)}
                                                isActive={page === safePage}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            aria-disabled={safePage === totalPages}
                                            className={safePage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Form Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} Akun</DialogTitle>
                        <DialogDescription>Isi data akun pengguna di bawah ini.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: Budi Santoso" value={form.nama_lengkap}
                                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Username <span className="text-red-500">*</span></Label>
                            <Input placeholder="Misal: budi.santoso" value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                            <Input type="email" placeholder="Misal: budi@lldikti3.id" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        {!editingItem && (
                            <div className="space-y-2">
                                <Label>Password <span className="text-red-500">*</span></Label>
                                <Input type="password" placeholder="Minimal 8 karakter" value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Role <span className="text-red-500">*</span></Label>
                            <Select
                                value={form.role}
                                onValueChange={(val) => setForm({ ...form, role: val, pimpinan_type: '', tim_kerja_id: '' })}
                            >
                                <SelectTrigger><SelectValue placeholder="Pilih role..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="ketua_tim_kerja">Ketua Tim Kerja</SelectItem>
                                    <SelectItem value="pimpinan">Pimpinan</SelectItem>
                                    <SelectItem value="bendahara">Bendahara</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.role === 'pimpinan' && (
                            <div className="space-y-2">
                                <Label>Tipe Pimpinan <span className="text-red-500">*</span></Label>
                                <Select value={form.pimpinan_type} onValueChange={(val) => setForm({ ...form, pimpinan_type: val })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih tipe pimpinan..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kabag_umum">Kabag Umum</SelectItem>
                                        <SelectItem value="ppk">PPK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {form.role === 'ketua_tim_kerja' && (
                            <div className="space-y-2">
                                <Label>Tim Kerja <span className="text-red-500">*</span></Label>
                                <Select value={form.tim_kerja_id} onValueChange={(val) => setForm({ ...form, tim_kerja_id: val })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih tim kerja..." /></SelectTrigger>
                                    <SelectContent>
                                        {timKerja.map((tk) => (
                                            <SelectItem key={tk.id} value={String(tk.id)}>
                                                {tk.kode} — {tk.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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
                onConfirm={confirmDelete}
            />

            {/* Reset Password Dialog */}
            <Dialog open={showResetDialog} onOpenChange={(open) => {
                setShowResetDialog(open);
                if (!open) setResetForm({ password: '', password_confirmation: '' });
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set password baru untuk akun <strong>{itemToReset?.nama_lengkap}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Password Baru <span className="text-red-500">*</span></Label>
                            <Input
                                type="password"
                                placeholder="Minimal 8 karakter"
                                value={resetForm.password}
                                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Konfirmasi Password <span className="text-red-500">*</span></Label>
                            <Input
                                type="password"
                                placeholder="Ulangi password baru"
                                value={resetForm.password_confirmation}
                                onChange={(e) => setResetForm({ ...resetForm, password_confirmation: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowResetDialog(false)}>Batal</Button>
                        <Button onClick={handleResetPassword}>Reset Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
