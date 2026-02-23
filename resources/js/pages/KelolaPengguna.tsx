import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Key,
    Eye,
    MoreVertical,
    UserCheck,
    UserX,
    Shield,
    User,
    Building2,
    Clock,
    Activity as ActivityIcon,
    CheckCircle2,
    XCircle,
    Mail,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelola Pengguna',
        href: '#',
    },
];

// Types
interface KelolaPenggunaProps {
    summary: {
        totalUsers: number;
        totalSuperAdmin: number;
        totalAdmin: number;
        totalOperator: number;
        totalPimpinan: number;
        totalActive: number;
    };
    usersData: UserItem[];
    roles: RoleOption[];
    units: UnitOption[];
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    unitKerja: string | null;
    status: 'active' | 'inactive';
    lastLogin: string | null;
    createdAt: string;
}

interface RoleOption {
    id: string;
    name: string;
    description: string;
}

interface UnitOption {
    id: number;
    name: string;
}

interface ActivityLogItem {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    ipAddress: string;
}

// Helper functions
const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Belum pernah login';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
    return formatDate(dateString);
};

export default function KelolaPengguna({
    summary,
    usersData,
    roles,
    units,
}: KelolaPenggunaProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // State untuk form user
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        unitKerja: '',
        status: true,
    });

    // State untuk activity log
    const [showActivityDialog, setShowActivityDialog] = useState(false);
    const [selectedUserActivity, setSelectedUserActivity] = useState<UserItem | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

    // State untuk reset password
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [userToReset, setUserToReset] = useState<UserItem | null>(null);

    // State untuk delete
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

    // Handler tambah user
    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            unitKerja: 'none',
            status: true,
        });
        setShowUserDialog(true);
    };

    // Handler edit user
    const handleEditUser = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            unitKerja: user.unitKerja || 'none',
            status: user.status === 'active',
        });
        setShowUserDialog(true);
    };

    // Handler save user
    const handleSaveUser = () => {
        if (!formData.name || !formData.email || !formData.role) {
            alert('Mohon lengkapi semua field wajib');
            return;
        }

        if (!editingUser && !formData.password) {
            alert('Password wajib diisi untuk user baru');
            return;
        }

        console.log('Save user:', formData);
        alert(editingUser ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
        setShowUserDialog(false);
    };

    // Handler toggle status
    const handleToggleStatus = (user: UserItem) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        console.log(`Toggle status user ${user.id} to ${newStatus}`);
        alert(`User ${user.name} ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`);
    };

    // Handler reset password
    const handleResetPassword = () => {
        if (userToReset) {
            console.log(`Reset password for user ${userToReset.id}`);
            alert(`Password untuk ${userToReset.name} berhasil direset. Password baru telah dikirim ke email.`);
            setShowResetDialog(false);
            setUserToReset(null);
        }
    };

    // Handler delete
    const handleDeleteConfirm = () => {
        if (userToDelete) {
            console.log(`Delete user ${userToDelete.id}`);
            alert(`User ${userToDelete.name} berhasil dihapus`);
            setShowDeleteDialog(false);
            setUserToDelete(null);
        }
    };

    // Handler view activity
    const handleViewActivity = (user: UserItem) => {
        setSelectedUserActivity(user);
        // Mock activity logs
        setActivityLogs([
            {
                id: 1,
                action: 'Login',
                description: 'User login ke sistem',
                timestamp: '2024-02-16T10:30:00',
                ipAddress: '192.168.1.100',
            },
            {
                id: 2,
                action: 'Buat Rencana',
                description: 'Membuat rencana kegiatan baru: Workshop SDM',
                timestamp: '2024-02-16T10:45:00',
                ipAddress: '192.168.1.100',
            },
            {
                id: 3,
                action: 'Upload Dokumen',
                description: 'Upload TOR Workshop SDM',
                timestamp: '2024-02-16T11:15:00',
                ipAddress: '192.168.1.100',
            },
            {
                id: 4,
                action: 'Logout',
                description: 'User logout dari sistem',
                timestamp: '2024-02-16T14:30:00',
                ipAddress: '192.168.1.100',
            },
        ]);
        setShowActivityDialog(true);
    };

    // Role badge helper
    const getRoleBadge = (role: string) => {
        const roleConfig: Record<string, { color: string; icon: any }> = {
            'Super Admin': { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Shield },
            'Admin': { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: UserCheck },
            'Pimpinan': { color: 'bg-green-100 text-green-700 border-green-300', icon: User },
            'Operator': { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: User },
        };

        const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: User };
        const Icon = config.icon;

        return (
            <Badge variant="outline" className={config.color}>
                <Icon className="mr-1 h-3 w-3" />
                {role}
            </Badge>
        );
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                <XCircle className="mr-1 h-3 w-3" />
                Inactive
            </Badge>
        );
    };

    // Filter data
    const filteredData = usersData.filter((item) => {
        const matchSearch =
            search === '' ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.email.toLowerCase().includes(search.toLowerCase());

        const matchRole = filterRole === 'all' || item.role === filterRole;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;

        return matchSearch && matchRole && matchStatus;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Pengguna - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
                    <p className="text-muted-foreground">
                        Manajemen user, role, dan akses sistem
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalUsers}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.totalActive} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Super Admin</CardTitle>
                            <Shield className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {summary.totalSuperAdmin}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Admin</CardTitle>
                            <UserCheck className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {summary.totalAdmin}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pimpinan</CardTitle>
                            <User className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.totalPimpinan}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Operator</CardTitle>
                            <User className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {summary.totalOperator}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.totalActive}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Daftar Pengguna</CardTitle>
                                <CardDescription>
                                    Kelola user dan hak akses sistem
                                </CardDescription>
                            </div>
                            <Button onClick={handleAddUser}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah User
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama atau email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.name}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Unit Kerja</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{user.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell>
                                                    {user.unitKerja ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            {user.unitKerja}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(user.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        {getRelativeTime(user.lastLogin)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditUser(user)}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewActivity(user)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Activity Log
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setUserToReset(user);
                                                                    setShowResetDialog(true);
                                                                }}
                                                            >
                                                                <Key className="mr-2 h-4 w-4" />
                                                                Reset Password
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleStatus(user)}
                                                            >
                                                                {user.status === 'active' ? (
                                                                    <>
                                                                        <UserX className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setUserToDelete(user);
                                                                    setShowDeleteDialog(true);
                                                                }}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center text-muted-foreground h-24"
                                            >
                                                Tidak ada data user
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Info */}
                        {filteredData.length > 0 && (
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Menampilkan {filteredData.length} dari {usersData.length} users
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit User Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Edit User' : 'Tambah User Baru'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Update informasi user'
                                : 'Tambahkan user baru ke sistem'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="Masukkan nama lengkap"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {!editingUser && (
                            <div className="space-y-2">
                                <Label>
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Password akan dikirim ke email user
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>
                                    Role <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                <div>
                                                    <p className="font-medium">{role.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {role.description}
                                                    </p>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Unit Kerja</Label>
                                <Select
                                    value={formData.unitKerja}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, unitKerja: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih unit (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tidak ada</SelectItem>
                                        {units.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.name}>
                                                {unit.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Status Aktif</Label>
                                <p className="text-sm text-muted-foreground">
                                    User dapat login dan mengakses sistem
                                </p>
                            </div>
                            <Switch
                                checked={formData.status}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, status: checked })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveUser}>
                            {editingUser ? 'Update' : 'Tambah'} User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activity Log Dialog */}
            <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Activity Log</DialogTitle>
                        <DialogDescription>
                            {selectedUserActivity?.name} - {selectedUserActivity?.email}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {activityLogs.length > 0 ? (
                            <div className="space-y-2">
                                {activityLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 rounded-lg border p-3"
                                    >
                                        <div className="rounded-full bg-primary/10 p-2">
                                            <ActivityIcon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{log.action}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {log.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>
                                                    <Clock className="inline h-3 w-3 mr-1" />
                                                    {formatDate(log.timestamp)}
                                                </span>
                                                <span>IP: {log.ipAddress}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                Tidak ada activity log
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Password untuk <strong>{userToReset?.name}</strong> akan direset dan
                            password baru akan dikirim ke email{' '}
                            <strong>{userToReset?.email}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>
                            Reset Password
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus user{' '}
                            <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat
                            dibatalkan dan semua data terkait akan dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
KelolaPengguna.defaultProps = {
    summary: {
        totalUsers: 47,
        totalSuperAdmin: 2,
        totalAdmin: 5,
        totalOperator: 28,
        totalPimpinan: 12,
        totalActive: 42,
    },
    usersData: [
        {
            id: 1,
            name: 'Admin System',
            email: 'admin@lldikti3.go.id',
            role: 'Super Admin',
            unitKerja: null,
            status: 'active',
            lastLogin: '2024-02-16T10:30:00',
            createdAt: '2024-01-01T00:00:00',
        },
        {
            id: 2,
            name: 'Dr. Siti Aminah, M.Pd',
            email: 'siti.aminah@lldikti3.go.id',
            role: 'Pimpinan',
            unitKerja: 'Unit Perencanaan',
            status: 'active',
            lastLogin: '2024-02-16T09:15:00',
            createdAt: '2024-01-05T00:00:00',
        },
        {
            id: 3,
            name: 'Ahmad Fadhil',
            email: 'ahmad.fadhil@lldikti3.go.id',
            role: 'Operator',
            unitKerja: 'Unit Perencanaan',
            status: 'active',
            lastLogin: '2024-02-16T08:45:00',
            createdAt: '2024-01-10T00:00:00',
        },
        {
            id: 4,
            name: 'Budi Santoso',
            email: 'budi.santoso@lldikti3.go.id',
            role: 'Admin',
            unitKerja: 'Unit Keuangan',
            status: 'active',
            lastLogin: '2024-02-15T16:20:00',
            createdAt: '2024-01-08T00:00:00',
        },
        {
            id: 5,
            name: 'Rina Wati',
            email: 'rina.wati@lldikti3.go.id',
            role: 'Operator',
            unitKerja: 'Unit IT',
            status: 'inactive',
            lastLogin: '2024-02-10T14:30:00',
            createdAt: '2024-01-15T00:00:00',
        },
        {
            id: 6,
            name: 'Prof. Agus Wiranto, Ph.D',
            email: 'agus.wiranto@lldikti3.go.id',
            role: 'Pimpinan',
            unitKerja: 'Unit Akademik',
            status: 'active',
            lastLogin: null,
            createdAt: '2024-01-20T00:00:00',
        },
    ],
    roles: [
        {
            id: 'super_admin',
            name: 'Super Admin',
            description: 'Akses penuh ke seluruh sistem',
        },
        {
            id: 'admin',
            name: 'Admin',
            description: 'Mengelola data keuangan dan pencairan',
        },
        {
            id: 'pimpinan',
            name: 'Pimpinan',
            description: 'Approval dan validasi dokumen',
        },
        {
            id: 'operator',
            name: 'Operator',
            description: 'Input data kegiatan dan laporan',
        },
    ],
    units: [
        { id: 1, name: 'Unit Perencanaan' },
        { id: 2, name: 'Unit Penelitian' },
        { id: 3, name: 'Unit IT' },
        { id: 4, name: 'Unit Akademik' },
        { id: 5, name: 'Unit Keuangan' },
    ],
};