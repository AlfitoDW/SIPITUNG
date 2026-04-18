import { Head } from '@inertiajs/react';
import {
    Bell,
    Search,
    Filter,
    Eye,
    Trash2,
    CheckCircle2,
    Send,
    Settings as SettingsIcon,
    Clock,
    User,
    Calendar,
    Mail,
    Check,
    AlertCircle,
    DollarSign,
    FileText,
    Shield,
    Wrench,
} from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifikasi',
        href: '#',
    },
];

// Types
interface NotifikasiProps {
    summary: {
        totalNotifikasi: number;
        totalUnread: number;
        totalToday: number;
    };
    notifikasiData: NotifikasiItem[];
    tipeNotifikasi: TipeNotifikasiOption[];
    roleOptions: RoleOption[];
}

interface NotifikasiItem {
    id: number;
    judul: string;
    deskripsi: string;
    tipe: string;
    tipeIcon: React.ElementType;
    tipeColor: string;
    dikirimKe: string;
    tanggal: string;
    status: 'read' | 'unread';
    priority: 'low' | 'medium' | 'high';
}

interface TipeNotifikasiOption {
    id: string;
    nama: string;
    deskripsi: string;
    enabled: boolean;
}

interface RoleOption {
    id: string;
    nama: string;
}

// Helper functions
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
    return formatDate(dateString);
};

export default function Notifikasi({
    summary,
    notifikasiData,
    tipeNotifikasi,
    roleOptions,
}: NotifikasiProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterTipe, setFilterTipe] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // State untuk broadcast
    const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
    const [broadcastJudul, setBroadcastJudul] = useState('');
    const [broadcastPesan, setBroadcastPesan] = useState('');
    const [broadcastRole, setBroadcastRole] = useState('');
    const [broadcastPriority, setBroadcastPriority] = useState('medium');

    // State untuk settings
    const [notifSettings, setNotifSettings] = useState(tipeNotifikasi);

    // State untuk detail
    const [selectedNotif, setSelectedNotif] = useState<NotifikasiItem | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    // State untuk delete
    const [notifToDelete, setNotifToDelete] = useState<NotifikasiItem | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Handler broadcast
    const handleBroadcast = () => {
        if (!broadcastJudul || !broadcastPesan || !broadcastRole) {
            alert('Mohon lengkapi semua field');
            return;
        }

        console.log('Broadcast notification:', {
            judul: broadcastJudul,
            pesan: broadcastPesan,
            role: broadcastRole,
            priority: broadcastPriority,
        });

        alert('Notifikasi berhasil di-broadcast!');
        setShowBroadcastDialog(false);
        setBroadcastJudul('');
        setBroadcastPesan('');
        setBroadcastRole('');
    };

    // Handler mark as read
    const handleMarkAsRead = (id: number) => {
        console.log(`Mark as read: ${id}`);
        alert('Notifikasi ditandai sebagai dibaca');
    };

    // Handler delete
    const handleDeleteConfirm = () => {
        if (notifToDelete) {
            console.log(`Delete notification ID: ${notifToDelete.id}`);
            alert('Notifikasi berhasil dihapus');
            setShowDeleteDialog(false);
            setNotifToDelete(null);
        }
    };

    // Handler save settings
    const handleSaveSettings = () => {
        console.log('Save settings:', notifSettings);
        alert('Pengaturan notifikasi berhasil disimpan');
        setShowSettingsDialog(false);
    };

    // Handler toggle setting
    const handleToggleSetting = (id: string) => {
        setNotifSettings(
            notifSettings.map((setting) =>
                setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
            )
        );
    };

    // Priority badge helper
    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            low: { label: 'Low', className: 'bg-gray-100 text-gray-700 border-gray-300' },
            medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700 border-blue-300' },
            high: { label: 'High', className: 'bg-red-100 text-red-700 border-red-300' },
        };

        const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        );
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        if (status === 'unread') {
            return (
                <Badge variant="default" className="bg-blue-500">
                    <Mail className="mr-1 h-3 w-3" />
                    Unread
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-gray-100 text-gray-700">
                <Check className="mr-1 h-3 w-3" />
                Read
            </Badge>
        );
    };

    // Filter data
    const filteredData = notifikasiData.filter((item) => {
        const matchSearch =
            search === '' ||
            item.judul.toLowerCase().includes(search.toLowerCase()) ||
            item.deskripsi.toLowerCase().includes(search.toLowerCase());

        const matchTipe = filterTipe === 'all' || item.tipe === filterTipe;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;

        return matchSearch && matchTipe && matchStatus;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Notifikasi Sistem</h1>
                    <p className="text-muted-foreground">
                        Monitor, broadcast, dan kelola notifikasi sistem
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Notifikasi
                            </CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalNotifikasi}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Semua notifikasi sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Belum Dibaca</CardTitle>
                            <Mail className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {summary.totalUnread}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Notifikasi unread</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
                            <Clock className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.totalToday}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Notifikasi baru</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content with Tabs */}
                <Tabs defaultValue="all" className="w-full">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <TabsList>
                            <TabsTrigger value="all">Semua Notifikasi</TabsTrigger>
                            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
                            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => setShowBroadcastDialog(true)}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Broadcast Notifikasi
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettingsDialog(true)}
                            >
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                Pengaturan
                            </Button>
                        </div>
                    </div>

                    {/* Tab All Notifications */}
                    <TabsContent value="all" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daftar Notifikasi</CardTitle>
                                <CardDescription>
                                    Monitoring semua notifikasi yang dikirim sistem
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col gap-4 md:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari judul atau deskripsi..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Select value={filterTipe} onValueChange={setFilterTipe}>
                                        <SelectTrigger className="w-full md:w-[220px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Tipe Notifikasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            {tipeNotifikasi.map((tipe) => (
                                                <SelectItem key={tipe.id} value={tipe.id}>
                                                    {tipe.nama}
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
                                            <SelectItem value="unread">Unread</SelectItem>
                                            <SelectItem value="read">Read</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Notifikasi</TableHead>
                                                <TableHead>Tipe</TableHead>
                                                <TableHead>Dikirim Ke</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredData.length > 0 ? (
                                                filteredData.map((item) => {
                                                    const Icon = item.tipeIcon;
                                                    return (
                                                        <TableRow
                                                            key={item.id}
                                                            className={
                                                                item.status === 'unread'
                                                                    ? 'bg-blue-50/50'
                                                                    : ''
                                                            }
                                                        >
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-start gap-2">
                                                                        <div
                                                                            className={`rounded-full p-1.5 ${item.tipeColor}`}
                                                                        >
                                                                            <Icon className="h-3 w-3 text-white" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-medium text-sm">
                                                                                {item.judul}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                                                {item.deskripsi}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {item.tipe}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm">
                                                                        {item.dikirimKe}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="h-4 w-4" />
                                                                    {getRelativeTime(item.tanggal)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {getPriorityBadge(item.priority)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getStatusBadge(item.status)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex justify-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedNotif(item);
                                                                            setShowDetailDialog(true);
                                                                        }}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    {item.status === 'unread' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleMarkAsRead(
                                                                                    item.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setNotifToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        className="text-center text-muted-foreground h-24"
                                                    >
                                                        Tidak ada notifikasi
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
                                            Menampilkan {filteredData.length} dari{' '}
                                            {notifikasiData.length} notifikasi
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Broadcast */}
                    <TabsContent value="broadcast" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Broadcast History</CardTitle>
                                <CardDescription>
                                    Riwayat notifikasi yang di-broadcast
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center text-muted-foreground py-8">
                                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Fitur broadcast history akan segera hadir</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Settings */}
                    <TabsContent value="settings" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Notifikasi</CardTitle>
                                <CardDescription>
                                    Enable/disable tipe notifikasi tertentu
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {notifSettings.map((setting) => (
                                        <div
                                            key={setting.id}
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="flex-1">
                                                <h4 className="font-medium">{setting.nama}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {setting.deskripsi}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={setting.enabled}
                                                onCheckedChange={() =>
                                                    handleToggleSetting(setting.id)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button onClick={handleSaveSettings}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Simpan Pengaturan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Broadcast Dialog */}
            <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Broadcast Notifikasi</DialogTitle>
                        <DialogDescription>
                            Kirim notifikasi custom ke role tertentu
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul Notifikasi</Label>
                            <Input
                                placeholder="Masukkan judul notifikasi..."
                                value={broadcastJudul}
                                onChange={(e) => setBroadcastJudul(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Pesan</Label>
                            <Textarea
                                placeholder="Masukkan pesan notifikasi..."
                                rows={4}
                                value={broadcastPesan}
                                onChange={(e) => setBroadcastPesan(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kirim ke Role</Label>
                                <Select value={broadcastRole} onValueChange={setBroadcastRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={broadcastPriority}
                                    onValueChange={setBroadcastPriority}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowBroadcastDialog(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={handleBroadcast}>
                            <Send className="mr-2 h-4 w-4" />
                            Kirim Broadcast
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detail Notifikasi</DialogTitle>
                    </DialogHeader>
                    {selectedNotif && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Judul</Label>
                                <p className="font-medium">{selectedNotif.judul}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <p className="text-sm text-muted-foreground">
                                    {selectedNotif.deskripsi}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipe</Label>
                                    <Badge variant="outline">{selectedNotif.tipe}</Badge>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    {getPriorityBadge(selectedNotif.priority)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Dikirim Ke</Label>
                                <p className="text-sm">{selectedNotif.dikirimKe}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Tanggal</Label>
                                <p className="text-sm">{formatDate(selectedNotif.tanggal)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                {getStatusBadge(selectedNotif.status)}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Notifikasi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak
                            dapat dibatalkan.
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
Notifikasi.defaultProps = {
    summary: {
        totalNotifikasi: 48,
        totalUnread: 12,
        totalToday: 8,
    },
    notifikasiData: [
        {
            id: 1,
            judul: 'Rencana Kegiatan Baru Diajukan',
            deskripsi: 'Workshop Pengembangan SDM telah diajukan oleh Unit Perencanaan',
            tipe: 'Rencana Baru',
            tipeIcon: FileText,
            tipeColor: 'bg-blue-500',
            dikirimKe: 'Pimpinan',
            tanggal: '2024-02-16T10:30:00',
            status: 'unread',
            priority: 'medium',
        },
        {
            id: 2,
            judul: 'Permohonan Dana Disetujui',
            deskripsi: 'Permohonan dana untuk Penelitian Kompetitif telah disetujui Pimpinan',
            tipe: 'Approval',
            tipeIcon: Shield,
            tipeColor: 'bg-green-500',
            dikirimKe: 'Operator Unit Penelitian',
            tanggal: '2024-02-16T09:15:00',
            status: 'read',
            priority: 'high',
        },
        {
            id: 3,
            judul: 'Dana Dicairkan',
            deskripsi: 'Dana sebesar Rp 75.000.000 telah dicairkan untuk kegiatan Workshop SDM',
            tipe: 'Pencairan',
            tipeIcon: DollarSign,
            tipeColor: 'bg-orange-500',
            dikirimKe: 'Operator Unit Perencanaan',
            tanggal: '2024-02-15T14:20:00',
            status: 'read',
            priority: 'high',
        },
        {
            id: 4,
            judul: 'LPJ Diupload',
            deskripsi: 'LPJ Workshop Pengembangan SDM telah diupload oleh operator',
            tipe: 'LPJ Upload',
            tipeIcon: FileText,
            tipeColor: 'bg-purple-500',
            dikirimKe: 'Admin Keuangan',
            tanggal: '2024-02-15T11:45:00',
            status: 'unread',
            priority: 'medium',
        },
        {
            id: 5,
            judul: 'Reminder: Pending Approval',
            deskripsi: '3 dokumen menunggu approval Anda sejak 5 hari yang lalu',
            tipe: 'Reminder',
            tipeIcon: AlertCircle,
            tipeColor: 'bg-yellow-500',
            dikirimKe: 'Dr. Siti Aminah (Pimpinan)',
            tanggal: '2024-02-14T08:00:00',
            status: 'unread',
            priority: 'high',
        },
        {
            id: 6,
            judul: 'System Maintenance',
            deskripsi: 'Maintenance sistem dijadwalkan pada Minggu, 18 Feb 2024 pukul 00:00-04:00',
            tipe: 'System',
            tipeIcon: Wrench,
            tipeColor: 'bg-gray-500',
            dikirimKe: 'Semua User',
            tanggal: '2024-02-13T16:00:00',
            status: 'read',
            priority: 'low',
        },
    ],
    tipeNotifikasi: [
        {
            id: 'rencana_baru',
            nama: 'Rencana Baru Diajukan',
            deskripsi: 'Notifikasi ketika ada rencana kegiatan baru diajukan',
            enabled: true,
        },
        {
            id: 'permohonan_dana',
            nama: 'Permohonan Dana Diajukan',
            deskripsi: 'Notifikasi ketika ada permohonan dana baru',
            enabled: true,
        },
        {
            id: 'dana_dicairkan',
            nama: 'Dana Dicairkan',
            deskripsi: 'Notifikasi ketika dana berhasil dicairkan',
            enabled: true,
        },
        {
            id: 'lpj_upload',
            nama: 'LPJ Diupload',
            deskripsi: 'Notifikasi ketika LPJ baru diupload',
            enabled: true,
        },
        {
            id: 'approval',
            nama: 'Approval dari Pimpinan',
            deskripsi: 'Notifikasi hasil approval (approved/rejected)',
            enabled: true,
        },
        {
            id: 'reminder',
            nama: 'Reminder Pending Approval',
            deskripsi: 'Reminder otomatis untuk dokumen yang belum di-approve',
            enabled: true,
        },
        {
            id: 'system',
            nama: 'System Maintenance',
            deskripsi: 'Notifikasi terkait maintenance atau update sistem',
            enabled: false,
        },
    ],
    roleOptions: [
        { id: 'all', nama: 'Semua User' },
        { id: 'super_admin', nama: 'Super Admin' },
        { id: 'admin', nama: 'Admin' },
        { id: 'pimpinan', nama: 'Pimpinan' },
        { id: 'operator', nama: 'Operator' },
    ],
};