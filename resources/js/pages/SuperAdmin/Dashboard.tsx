import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { StatisticCard } from '@/components/StatisticCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users,
    Building2,
    Activity,
    Wallet,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    ArrowUpRight,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

// Data statistik utama
const stats = [
    {
        title: 'Total Users',
        value: '47',
        icon: Users,
        description: '+12% dari bulan lalu',
        trend: 'up',
    },
    {
        title: 'Total Unit Kerja',
        value: '11',
        icon: Building2,
        description: '3 unit aktif hari ini',
        trend: 'neutral',
    },
    {
        title: 'Total Kegiatan',
        value: '156',
        icon: Activity,
        description: '23 pending approval',
        trend: 'up',
    },
    {
        title: 'Total Anggaran',
        value: 'Rp 8.5M',
        icon: Wallet,
        description: '67% terserap',
        trend: 'up',
    },
];

// Data breakdown user per role
const usersByRole = [
    { role: 'Super Admin', count: 2, color: 'bg-purple-500' },
    { role: 'Admin Perencanaan & Keuangan', count: 5, color: 'bg-blue-500' },
    { role: 'Pimpinan', count: 12, color: 'bg-green-500' },
    { role: 'Operator', count: 28, color: 'bg-orange-500' },
];

// Data penyerapan anggaran per unit
const budgetAbsorption = [
    { unit: 'Unit Perencanaan', budget: 1200000000, used: 850000000, percentage: 71 },
    { unit: 'Unit Keuangan', budget: 980000000, used: 720000000, percentage: 73 },
    { unit: 'Unit Akademik', budget: 1500000000, used: 950000000, percentage: 63 },
    { unit: 'Unit SDM', budget: 800000000, used: 580000000, percentage: 73 },
    { unit: 'Unit IT', budget: 650000000, used: 420000000, percentage: 65 },
];

// Data status kegiatan
const activityStatus = [
    { status: 'Draft', count: 12, color: 'bg-gray-500', icon: FileText },
    { status: 'Pending', count: 23, color: 'bg-yellow-500', icon: Clock },
    { status: 'Approved', count: 98, color: 'bg-green-500', icon: CheckCircle2 },
    { status: 'Rejected', count: 23, color: 'bg-red-500', icon: XCircle },
];

// Data alert/notifikasi penting
const alerts = [
    {
        type: 'warning',
        title: '5 User baru menunggu aktivasi',
        description: 'Perlu verifikasi dan approval',
        time: '2 jam yang lalu',
        action: 'Lihat Detail',
    },
    {
        type: 'danger',
        title: '15 Pengajuan pending lebih dari 7 hari',
        description: 'Memerlukan tindak lanjut segera',
        time: '3 jam yang lalu',
        action: 'Tinjau',
    },
    {
        type: 'info',
        title: '3 Unit hampir mencapai batas anggaran',
        description: 'Unit Akademik, Unit SDM, Unit Keuangan',
        time: '5 jam yang lalu',
        action: 'Lihat Laporan',
    },
];

// Data activity logs terbaru
const recentLogs = [
    {
        user: 'Ahmad Fadhil',
        role: 'Operator',
        action: 'Membuat rencana kegiatan baru',
        detail: 'Workshop Pengembangan SDM',
        timestamp: '2024-02-13 14:35:22',
        status: 'success',
    },
    {
        user: 'Dr. Siti Aminah',
        role: 'Pimpinan',
        action: 'Menyetujui pengajuan dana',
        detail: 'Pengadaan Peralatan Lab - Rp 45.000.000',
        timestamp: '2024-02-13 14:20:15',
        status: 'success',
    },
    {
        user: 'Budi Santoso',
        role: 'Admin',
        action: 'Mencairkan dana',
        detail: 'Transfer ke Unit IT - Rp 25.000.000',
        timestamp: '2024-02-13 13:45:08',
        status: 'success',
    },
    {
        user: 'Rina Wati',
        role: 'Operator',
        action: 'Upload LPJ',
        detail: 'LPJ Seminar Nasional',
        timestamp: '2024-02-13 13:12:45',
        status: 'success',
    },
    {
        user: 'Prof. Agus Wiranto',
        role: 'Pimpinan',
        action: 'Menolak rencana kegiatan',
        detail: 'Alasan: Budget tidak mencukupi',
        timestamp: '2024-02-13 12:55:30',
        status: 'error',
    },
];

// Helper function untuk format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Super Admin" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 md:p-6">
                {/* Welcome Section */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Super Admin</h1>
                    <p className="text-muted-foreground">
                        Selamat datang! Berikut adalah overview sistem perencanaan dan keuangan.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <StatisticCard key={stat.title} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Users by Role */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Users per Role
                            </CardTitle>
                            <CardDescription>Distribusi pengguna berdasarkan role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {usersByRole.map((item) => (
                                <div key={item.role} className="flex items-center gap-3">
                                    <div className={`h-10 w-1 rounded ${item.color}`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.role}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.count} users
                                        </p>
                                    </div>
                                    <Badge variant="secondary">{item.count}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Activity Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Status Kegiatan
                            </CardTitle>
                            <CardDescription>Overview status semua kegiatan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activityStatus.map((item) => (
                                <div key={item.status} className="flex items-center gap-3">
                                    <div className={`rounded-full p-2 ${item.color}`}>
                                        <item.icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.status}</p>
                                    </div>
                                    <Badge variant="outline">{item.count}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* System Alerts */}
                    <Card className="md:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                System Alerts
                            </CardTitle>
                            <CardDescription>Notifikasi penting yang perlu ditindaklanjuti</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {alerts.map((alert, index) => (
                                <div
                                    key={index}
                                    className={`rounded-lg border p-4 ${
                                        alert.type === 'danger'
                                            ? 'border-red-200 bg-red-50'
                                            : alert.type === 'warning'
                                              ? 'border-yellow-200 bg-yellow-50'
                                              : 'border-blue-200 bg-blue-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{alert.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {alert.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Budget Absorption */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Penyerapan Anggaran per Unit
                        </CardTitle>
                        <CardDescription>
                            Real-time tracking penggunaan anggaran setiap unit kerja
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {budgetAbsorption.map((item) => (
                                <div key={item.unit} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{item.unit}</span>
                                        <span className="text-muted-foreground">
                                            {formatCurrency(item.used)} / {formatCurrency(item.budget)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Progress value={item.percentage} className="flex-1" />
                                        <Badge
                                            variant={
                                                item.percentage >= 80
                                                    ? 'destructive'
                                                    : item.percentage >= 60
                                                      ? 'default'
                                                      : 'secondary'
                                            }
                                        >
                                            {item.percentage}%
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Recent Activity Logs
                        </CardTitle>
                        <CardDescription>Log aktivitas sistem untuk audit trail</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Detail</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{log.user}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.role}</Badge>
                                            </TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {log.detail}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {log.timestamp}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {log.status === 'success' ? (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        Success
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Error
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" size="sm">
                                View All Logs
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}