import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Calendar,
    Search,
    Filter,
    Download,
    Eye,
    FileText,
    Building2,
    Shield,
    CheckCircle2,
    Clock,
    XCircle,
    User,
    AlertCircle,
    ClipboardList,
    DollarSign,
    Receipt,
    FileEdit,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Validasi & Approval',
        href: '#',
    },
];

// Types
interface ValidasiProps {
    summary: {
        totalApproval: number;
        totalApproved: number;
        totalRejected: number;
        totalPending: number;
    };
    approvalData: ApprovalItem[];
    pimpinanList: PimpinanOption[];
    periods: PeriodOption[];
}

interface ApprovalItem {
    id: number;
    jenisdokumen: 'rencana' | 'permohonan_dana' | 'lpj';
    nomorDokumen: string;
    namaKegiatan: string;
    unitKerja: string;
    tanggalDiajukan: string;
    tanggalDisetujui: string | null;
    disetujuiOleh: string | null;
    status: 'approved' | 'rejected' | 'pending';
    catatan: string | null;
    nilaiDokumen?: number;
}

interface PimpinanOption {
    id: number;
    name: string;
}

interface PeriodOption {
    id: string;
    label: string;
}

// Helper functions
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function Validasi({
    summary,
    approvalData,
    pimpinanList,
    periods,
}: ValidasiProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterJenis, setFilterJenis] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPimpinan, setFilterPimpinan] = useState('all');
    const [filterPeriode, setFilterPeriode] = useState('all');
    const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    // Handler export
    const handleExport = (format: 'excel' | 'pdf') => {
        console.log(`Exporting to ${format}...`);
        alert(`Export audit trail ke ${format.toUpperCase()} akan segera diunduh`);
    };

    // Handler view detail
    const handleViewDetail = (item: ApprovalItem) => {
        setSelectedApproval(item);
        setShowDetailDialog(true);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: {
                variant: 'secondary' as const,
                label: 'Pending',
                icon: Clock,
                className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            },
            approved: {
                variant: 'default' as const,
                label: 'Approved',
                icon: CheckCircle2,
                className: 'bg-green-100 text-green-700 border-green-300',
            },
            rejected: {
                variant: 'destructive' as const,
                label: 'Rejected',
                icon: XCircle,
                className: 'bg-red-100 text-red-700 border-red-300',
            },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Jenis dokumen badge helper
    const getJenisBadge = (jenis: string) => {
        const jenisConfig = {
            rencana: {
                label: 'Rencana Kegiatan',
                icon: ClipboardList,
                className: 'bg-blue-100 text-blue-700 border-blue-300',
            },
            permohonan_dana: {
                label: 'Permohonan Dana',
                icon: DollarSign,
                className: 'bg-purple-100 text-purple-700 border-purple-300',
            },
            lpj: {
                label: 'LPJ',
                icon: Receipt,
                className: 'bg-orange-100 text-orange-700 border-orange-300',
            },
        };

        const config =
            jenisConfig[jenis as keyof typeof jenisConfig] || jenisConfig.rencana;
        const JenisIcon = config.icon;

        return (
            <Badge variant="outline" className={config.className}>
                <JenisIcon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Filter data
    const filteredData = approvalData.filter((item) => {
        const matchSearch =
            search === '' ||
            item.nomorDokumen.toLowerCase().includes(search.toLowerCase()) ||
            item.namaKegiatan.toLowerCase().includes(search.toLowerCase());

        const matchJenis = filterJenis === 'all' || item.jenisDocumen === filterJenis;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchPimpinan =
            filterPimpinan === 'all' || item.disetujuiOleh === filterPimpinan;
        const matchPeriode =
            filterPeriode === 'all' ||
            (item.tanggalDiajukan &&
                item.tanggalDiajukan.includes(filterPeriode.split('-')[1]));

        return matchSearch && matchJenis && matchStatus && matchPimpinan && matchPeriode;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Validasi & Approval - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header with Info Alert */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Monitoring Validasi & Approval
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor history approval yang dilakukan oleh Pimpinan (Read-only)
                        </p>
                    </div>

                    {/* Info Banner */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="flex items-start gap-3 p-4">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">
                                    Halaman Monitoring Only
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Super Admin hanya dapat melihat history approval untuk keperluan
                                    monitoring dan audit trail. Tidak ada aksi approve/reject di
                                    halaman ini.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Approval
                            </CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalApproval}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Semua dokumen approval
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {summary.totalApproved}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Disetujui</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {summary.totalRejected}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Ditolak</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {summary.totalPending}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Menunggu approval
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>History Approval</CardTitle>
                                <CardDescription>
                                    Audit trail semua approval yang dilakukan Pimpinan
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('excel')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport('pdf')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="relative lg:col-span-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nomor dokumen atau kegiatan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterJenis} onValueChange={setFilterJenis}>
                                <SelectTrigger>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Jenis Dokumen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="rencana">Rencana Kegiatan</SelectItem>
                                    <SelectItem value="permohonan_dana">
                                        Permohonan Dana
                                    </SelectItem>
                                    <SelectItem value="lpj">LPJ</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPimpinan} onValueChange={setFilterPimpinan}>
                                <SelectTrigger>
                                    <User className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Pimpinan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Pimpinan</SelectItem>
                                    {pimpinanList.map((pimpinan) => (
                                        <SelectItem key={pimpinan.id} value={pimpinan.name}>
                                            {pimpinan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Nomor Dokumen</TableHead>
                                        <TableHead>Nama Kegiatan</TableHead>
                                        <TableHead>Unit Kerja</TableHead>
                                        <TableHead>Tgl Diajukan</TableHead>
                                        <TableHead>Tgl Disetujui</TableHead>
                                        <TableHead>Disetujui Oleh</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Detail</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {getJenisBadge(item.jenisDocumen)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.nomorDokumen}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    {item.namaKegiatan}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {item.unitKerja}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(item.tanggalDiajukan)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.tanggalDisetujui ? (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDate(item.tanggalDisetujui)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.disetujuiOleh ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {item.disetujuiOleh}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(item.status)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetail(item)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center text-muted-foreground h-24"
                                            >
                                                Tidak ada data approval
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
                                    Menampilkan {filteredData.length} dari {approvalData.length}{' '}
                                    approval
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Detail */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail Approval</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap approval dokumen
                        </DialogDescription>
                    </DialogHeader>
                    {selectedApproval && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Jenis Dokumen
                                    </p>
                                    {getJenisBadge(selectedApproval.jenisDocumen)}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </p>
                                    {getStatusBadge(selectedApproval.status)}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nomor Dokumen
                                </p>
                                <p className="font-medium">{selectedApproval.nomorDokumen}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nama Kegiatan
                                </p>
                                <p className="font-medium">{selectedApproval.namaKegiatan}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Unit Kerja
                                </p>
                                <p>{selectedApproval.unitKerja}</p>
                            </div>

                            {selectedApproval.nilaiDokumen && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Nilai Dokumen
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(selectedApproval.nilaiDokumen)}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Tanggal Diajukan
                                    </p>
                                    <p className="text-sm">
                                        {formatDateTime(selectedApproval.tanggalDiajukan)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Tanggal Disetujui
                                    </p>
                                    <p className="text-sm">
                                        {formatDateTime(selectedApproval.tanggalDisetujui)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Disetujui Oleh
                                </p>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <p>{selectedApproval.disetujuiOleh || '-'}</p>
                                </div>
                            </div>

                            {selectedApproval.catatan && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Catatan dari Pimpinan
                                    </p>
                                    <div className="rounded-lg border bg-muted p-3">
                                        <p className="text-sm">{selectedApproval.catatan}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDetailDialog(false)}
                                >
                                    Tutup
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
Validasi.defaultProps = {
    summary: {
        totalApproval: 52,
        totalApproved: 35,
        totalRejected: 8,
        totalPending: 9,
    },
    approvalData: [
        {
            id: 1,
            jenisDocumen: 'rencana',
            nomorDokumen: 'RK/2024/001',
            namaKegiatan: 'Workshop Pengembangan Kompetensi Dosen',
            unitKerja: 'Unit Perencanaan',
            tanggalDiajukan: '2024-01-15T09:00:00',
            tanggalDisetujui: '2024-01-16T14:30:00',
            disetujuiOleh: 'Dr. Siti Aminah, M.Pd',
            status: 'approved',
            catatan: 'Rencana kegiatan sudah sesuai dengan program kerja tahun 2024',
            nilaiDokumen: 75000000,
        },
        {
            id: 2,
            jenisDocumen: 'permohonan_dana',
            nomorDokumen: 'PD/2024/001',
            namaKegiatan: 'Workshop Pengembangan Kompetensi Dosen',
            unitKerja: 'Unit Perencanaan',
            tanggalDiajukan: '2024-01-20T10:15:00',
            tanggalDisetujui: '2024-01-21T11:00:00',
            disetujuiOleh: 'Dr. Siti Aminah, M.Pd',
            status: 'approved',
            catatan: 'Disetujui sesuai rencana yang telah diapprove',
            nilaiDokumen: 75000000,
        },
        {
            id: 3,
            jenisDocumen: 'rencana',
            nomorDokumen: 'RK/2024/002',
            namaKegiatan: 'Hibah Penelitian Kompetitif Dosen Junior',
            unitKerja: 'Unit Penelitian',
            tanggalDiajukan: '2024-01-22T08:30:00',
            tanggalDisetujui: null,
            disetujuiOleh: null,
            status: 'pending',
            catatan: null,
            nilaiDokumen: 120000000,
        },
        {
            id: 4,
            jenisDocumen: 'rencana',
            nomorDokumen: 'RK/2024/003',
            namaKegiatan: 'Seminar Nasional Pendidikan Tinggi',
            unitKerja: 'Unit Akademik',
            tanggalDiajukan: '2024-01-25T13:45:00',
            tanggalDisetujui: '2024-01-26T09:20:00',
            disetujuiOleh: 'Prof. Agus Wiranto, Ph.D',
            status: 'rejected',
            catatan:
                'Budget tidak mencukupi untuk periode ini. Silakan ajukan kembali di periode berikutnya dengan penyesuaian anggaran.',
            nilaiDokumen: 45000000,
        },
        {
            id: 5,
            jenisDocumen: 'lpj',
            nomorDokumen: 'LPJ/2024/001',
            namaKegiatan: 'Workshop Pengembangan Kompetensi Dosen',
            unitKerja: 'Unit Perencanaan',
            tanggalDiajukan: '2024-02-10T15:30:00',
            tanggalDisetujui: '2024-02-11T10:00:00',
            disetujuiOleh: 'Dr. Siti Aminah, M.Pd',
            status: 'approved',
            catatan: 'LPJ lengkap dan sesuai dengan realisasi kegiatan',
            nilaiDokumen: 74500000,
        },
        {
            id: 6,
            jenisDocumen: 'permohonan_dana',
            nomorDokumen: 'PD/2024/002',
            namaKegiatan: 'Upgrade Infrastruktur Server dan Jaringan',
            unitKerja: 'Unit IT',
            tanggalDiajukan: '2024-02-05T11:20:00',
            tanggalDisetujui: '2024-02-06T14:15:00',
            disetujuiOleh: 'Dr. Ahmad Fauzi, M.T',
            status: 'approved',
            catatan: 'Urgent dan diperlukan untuk operasional',
            nilaiDokumen: 85000000,
        },
        {
            id: 7,
            jenisDocumen: 'lpj',
            nomorDokumen: 'LPJ/2024/002',
            namaKegiatan: 'Seminar Nasional Pendidikan Tinggi',
            unitKerja: 'Unit Akademik',
            tanggalDiajukan: '2024-02-08T09:00:00',
            tanggalDisetujui: '2024-02-09T16:30:00',
            disetujuiOleh: 'Prof. Agus Wiranto, Ph.D',
            status: 'rejected',
            catatan: 'Dokumen pendukung tidak lengkap, silakan lengkapi dan upload kembali',
            nilaiDokumen: 45000000,
        },
        {
            id: 8,
            jenisDocumen: 'rencana',
            nomorDokumen: 'RK/2024/004',
            namaKegiatan: 'Pelatihan Manajemen Keuangan untuk Staf',
            unitKerja: 'Unit Keuangan',
            tanggalDiajukan: '2024-02-12T10:00:00',
            tanggalDisetujui: null,
            disetujuiOleh: null,
            status: 'pending',
            catatan: null,
            nilaiDokumen: 35000000,
        },
    ],
    pimpinanList: [
        { id: 1, name: 'Dr. Siti Aminah, M.Pd' },
        { id: 2, name: 'Prof. Agus Wiranto, Ph.D' },
        { id: 3, name: 'Dr. Ahmad Fauzi, M.T' },
        { id: 4, name: 'Dr. Budi Santoso, M.M' },
    ],
    periods: [
        { id: 'Q1-2024', label: 'Q1 2024' },
        { id: 'Q2-2024', label: 'Q2 2024' },
        { id: 'Q3-2024', label: 'Q3 2024' },
        { id: 'Q4-2024', label: 'Q4 2024' },
    ],
};