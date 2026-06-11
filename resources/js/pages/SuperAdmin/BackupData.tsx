import { Head, useForm, router } from '@inertiajs/react';
import {
    Database,
    Download,
    Trash2,
    HardDrive,
    Table2,
    Clock,
    Archive,
    AlertTriangle,
    Search,
    ArrowUpDown,
    Calendar,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Backup Data',
        href: '#',
    },
];

interface Backup {
    filename: string;
    size: string;
    size_raw: number;
    created_at: string;
}

interface DbInfo {
    tables: number;
    connection: string;
    database: string;
    total_size: string;
    total_size_raw: number;
}

interface Props {
    backups: Backup[];
    dbInfo: DbInfo;
}

export default function BackupData({ backups, dbInfo }: Props) {
    const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
    const backupForm = useForm();

    // Pagination & Filter States
    const [search, setSearch] = useState('');
    const [filterMonth, setFilterMonth] = useState('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'smallest'>('newest');
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Extract unique months from backups
    const availableMonths = useMemo(() => {
        const months = new Map<string, string>();
        backups.forEach((b) => {
            const date = new Date(b.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            months.set(key, label);
        });
        return Array.from(months.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, label]) => ({ key, label }));
    }, [backups]);

    // Filter & Sort Logic
    const filtered = useMemo(() => {
        let result = backups.filter((b) => {
            const matchSearch = search === '' ||
                b.filename.toLowerCase().includes(search.toLowerCase());
            const matchMonth = filterMonth === 'all' ||
                b.created_at.startsWith(filterMonth + '-');
            return matchSearch && matchMonth;
        });

        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'largest':
                    return b.size_raw - a.size_raw;
                case 'smallest':
                    return a.size_raw - b.size_raw;
                default:
                    return 0;
            }
        });

        return result;
    }, [backups, search, filterMonth, sortBy]);

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);
    const startEntry = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1;
    const endEntry = Math.min(safePage * perPage, filtered.length);

    // Reset page when filter/sort/perPage changes
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleFilterMonthChange = (value: string) => {
        setFilterMonth(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value: 'newest' | 'oldest' | 'largest' | 'smallest') => {
        setSortBy(value);
        setCurrentPage(1);
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(Number(value));
        setCurrentPage(1);
    };

    function handleBackup() {
        backupForm.post('/super-admin/backup-data', {
            preserveScroll: true,
        });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/super-admin/backup-data/${deleteTarget.filename}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const totalBackupSize = backups.reduce((sum, b) => sum + b.size_raw, 0);
    const totalBackupSizeFormatted = formatBytes(totalBackupSize);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Backup Data" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Backup Data</h1>
                        <p className="text-muted-foreground">
                            Kelola backup database sistem SIPITUNG
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleBackup}
                        disabled={backupForm.processing}
                    >
                        {backupForm.processing ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Membackup...
                            </>
                        ) : (
                            <>
                                <Database className="mr-1.5 h-4 w-4" />
                                Backup Sekarang
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Database
                            </CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.database}</div>
                            <p className="text-xs text-muted-foreground">
                                {dbInfo.connection}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Jumlah Tabel
                            </CardTitle>
                            <Table2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.tables}</div>
                            <p className="text-xs text-muted-foreground">
                                Total tabel
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ukuran Database
                            </CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dbInfo.total_size}</div>
                            <p className="text-xs text-muted-foreground">
                                Total size
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Backup
                            </CardTitle>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{backups.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {totalBackupSizeFormatted} total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Processing Alert */}
                {backupForm.processing && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Sedang Membackup</AlertTitle>
                        <AlertDescription>
                            Mohon tunggu, proses backup database sedang berjalan. Jangan tutup halaman ini.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Backup List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Backup</CardTitle>
                        <CardDescription>
                            File backup yang tersimpan di sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filter & Controls */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama file backup..."
                                        value={search}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="pl-8 w-full sm:w-72"
                                    />
                                </div>
                                {/* Filter Bulan */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <Select value={filterMonth} onValueChange={handleFilterMonthChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Semua Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Bulan</SelectItem>
                                            {availableMonths.map((month) => (
                                                <SelectItem key={month.key} value={month.key}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Sort */}
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={sortBy}
                                        onValueChange={(val) => handleSortChange(val as typeof sortBy)}
                                    >
                                        <SelectTrigger className="w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Terbaru</SelectItem>
                                            <SelectItem value="oldest">Terlama</SelectItem>
                                            <SelectItem value="largest">Ukuran Terbesar</SelectItem>
                                            <SelectItem value="smallest">Ukuran Terkecil</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {/* Per Page */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Tampilkan</span>
                                <Select
                                    value={String(perPage)}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="h-8 w-20">
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
                        </div>

                        {/* Info Text */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                Menampilkan {startEntry} - {endEntry} dari {filtered.length} total
                            </span>
                            <span>
                                {filtered.length !== backups.length && (
                                    <span className="text-xs">
                                        (difilter dari {backups.length} total)
                                    </span>
                                )}
                            </span>
                        </div>

                        {backups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Belum Ada Backup</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Klik tombol "Backup Sekarang" untuk membuat backup pertama.
                                </p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Tidak Ada Hasil</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Tidak ada backup yang sesuai dengan filter.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-xl border shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent" style={{ backgroundColor: '#003580' }}>
                                                <TableHead className="border-r border-white/20 text-center font-semibold text-white w-16">No</TableHead>
                                                <TableHead className="border-r border-white/20 font-semibold text-white">Nama File</TableHead>
                                                <TableHead className="border-r border-white/20 font-semibold text-white w-32">Ukuran</TableHead>
                                                <TableHead className="border-r border-white/20 font-semibold text-white w-44">Tanggal Dibuat</TableHead>
                                                <TableHead className="text-center font-semibold text-white w-32">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map((backup, index) => (
                                                <TableRow key={backup.filename} className="align-top">
                                                    <TableCell className="text-center text-sm">
                                                        {(safePage - 1) * perPage + index + 1}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        {backup.filename}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {backup.size}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {backup.created_at}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7"
                                                                title="Download"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={`/super-admin/backup-data/download/${backup.filename}`}
                                                                    download
                                                                >
                                                                    <Download className="h-4 w-4 text-primary" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                title="Hapus"
                                                                onClick={() => setDeleteTarget(backup)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            Halaman {safePage} dari {totalPages}
                                        </div>
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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirm Dialog */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            File <strong>{deleteTarget?.filename}</strong> akan dihapus permanen.
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

function formatBytes(bytes: number, precision = 2): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const pow = Math.floor(Math.log(bytes) / Math.log(1024));
    const clampedPow = Math.min(pow, units.length - 1);
    const size = bytes / Math.pow(1024, clampedPow);
    return size.toFixed(precision) + ' ' + units[clampedPow];
}
