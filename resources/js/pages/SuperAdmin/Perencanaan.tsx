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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Calendar,
    Search,
    Filter,
    Download,
    Eye,
    FileText,
    Building2,
    ClipboardList,
    MoreVertical,
    CheckCircle2,
    Clock,
    XCircle,
    FileEdit,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Perencanaan',
        href: '#',
    },
];

// Types
interface PerencanaanProps {
    summary: {
        totalRencana: number;
        totalDraft: number;
        totalDiajukan: number;
        totalApproved: number;
        totalRejected: number;
    };
    rencanaData: RencanaItem[];
    units: UnitOption[];
    periods: PeriodOption[];
}

interface RencanaItem {
    id: number;
    nomorRencana: string;
    namaKegiatan: string;
    unitKerja: string;
    anggaran: number;
    status: 'draft' | 'diajukan' | 'approved' | 'rejected';
    tanggalDibuat: string;
    periode: string;
    hasTor: boolean;
    hasRab: boolean;
}

interface UnitOption {
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

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function Perencanaan({
    summary,
    rencanaData,
    units,
    periods,
}: PerencanaanProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterUnit, setFilterUnit] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPeriode, setFilterPeriode] = useState('all');

    // Handler export
    const handleExport = (format: 'excel' | 'pdf') => {
        console.log(`Exporting to ${format}...`);
        alert(`Export ke ${format.toUpperCase()} akan segera diunduh`);
    };

    // Handler view detail
    const handleViewDetail = (id: number) => {
        console.log(`View detail rencana ID: ${id}`);
        // TODO: Navigate to detail page atau buka modal
    };

    // Handler download document
    const handleDownloadDoc = (type: 'tor' | 'rab', id: number) => {
        console.log(`Download ${type.toUpperCase()} for rencana ID: ${id}`);
        alert(`Download ${type.toUpperCase()} akan segera dimulai`);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { 
                variant: 'secondary' as const, 
                label: 'Draft', 
                icon: FileEdit,
                className: 'bg-gray-100 text-gray-700 border-gray-300'
            },
            diajukan: { 
                variant: 'secondary' as const, 
                label: 'Diajukan', 
                icon: Clock,
                className: 'bg-yellow-100 text-yellow-700 border-yellow-300'
            },
            approved: { 
                variant: 'default' as const, 
                label: 'Approved', 
                icon: CheckCircle2,
                className: 'bg-green-100 text-green-700 border-green-300'
            },
            rejected: { 
                variant: 'destructive' as const, 
                label: 'Rejected', 
                icon: XCircle,
                className: 'bg-red-100 text-red-700 border-red-300'
            },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        const StatusIcon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Filter data
    const filteredData = rencanaData.filter((item) => {
        const matchSearch = 
            search === '' ||
            item.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
            item.nomorRencana.toLowerCase().includes(search.toLowerCase());
        
        const matchUnit = filterUnit === 'all' || item.unitKerja === filterUnit;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchPeriode = filterPeriode === 'all' || item.periode === filterPeriode;

        return matchSearch && matchUnit && matchStatus && matchPeriode;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Perencanaan - Super Admin" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Monitoring Perencanaan</h1>
                    <p className="text-muted-foreground">
                        Monitor dan analisis data perencanaan kegiatan dari semua unit kerja
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rencana</CardTitle>
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalRencana}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Semua rencana kegiatan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Draft</CardTitle>
                            <FileEdit className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">
                                {summary.totalDraft}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Belum diajukan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Diajukan</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {summary.totalDiajukan}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Menunggu approval
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
                            <p className="text-xs text-muted-foreground mt-1">
                                Sudah disetujui
                            </p>
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
                            <p className="text-xs text-muted-foreground mt-1">
                                Ditolak
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Daftar Rencana Kegiatan</CardTitle>
                                <CardDescription>
                                    Monitoring semua rencana kegiatan dari unit kerja
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('excel')}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Export to Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Export to PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama kegiatan atau nomor rencana..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterUnit} onValueChange={setFilterUnit}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Semua Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Unit</SelectItem>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.name}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="diajukan">Diajukan</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Semua Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Periode</SelectItem>
                                    {periods.map((period) => (
                                        <SelectItem key={period.id} value={period.id}>
                                            {period.label}
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
                                        <TableHead>Nomor Rencana</TableHead>
                                        <TableHead>Nama Kegiatan</TableHead>
                                        <TableHead>Unit Kerja</TableHead>
                                        <TableHead className="text-right">Anggaran</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Tanggal Dibuat</TableHead>
                                        <TableHead className="text-center">Dokumen</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.nomorRencana}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div className="font-medium">{item.namaKegiatan}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {item.unitKerja}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(item.anggaran)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                <TableCell>{item.periode}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDate(item.tanggalDibuat)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {item.hasTor && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadDoc('tor', item.id)}
                                                                title="Download TOR"
                                                            >
                                                                <FileText className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        )}
                                                        {item.hasRab && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDownloadDoc('rab', item.id)}
                                                                title="Download RAB"
                                                            >
                                                                <FileText className="h-4 w-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                        {!item.hasTor && !item.hasRab && (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
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
                                                                onClick={() => handleViewDetail(item.id)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Detail
                                                            </DropdownMenuItem>
                                                            {item.hasTor && (
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleDownloadDoc('tor', item.id)}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download TOR
                                                                </DropdownMenuItem>
                                                            )}
                                                            {item.hasRab && (
                                                                <DropdownMenuItem 
                                                                    onClick={() => handleDownloadDoc('rab', item.id)}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download RAB
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center text-muted-foreground h-24"
                                            >
                                                Tidak ada data rencana kegiatan
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
                                    Menampilkan {filteredData.length} dari {rencanaData.length} rencana
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

// Default props untuk development/testing
Perencanaan.defaultProps = {
    summary: {
        totalRencana: 45,
        totalDraft: 8,
        totalDiajukan: 12,
        totalApproved: 20,
        totalRejected: 5,
    },
    rencanaData: [
        {
            id: 1,
            nomorRencana: 'RK/2024/001',
            namaKegiatan: 'Workshop Pengembangan Kompetensi Dosen',
            unitKerja: 'Unit Perencanaan',
            anggaran: 75000000,
            status: 'approved',
            tanggalDibuat: '2024-01-15',
            periode: 'Q1 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 2,
            nomorRencana: 'RK/2024/002',
            namaKegiatan: 'Hibah Penelitian Kompetitif Dosen Junior',
            unitKerja: 'Unit Penelitian',
            anggaran: 120000000,
            status: 'diajukan',
            tanggalDibuat: '2024-01-20',
            periode: 'Q1 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 3,
            nomorRencana: 'RK/2024/003',
            namaKegiatan: 'Upgrade Infrastruktur Server dan Jaringan',
            unitKerja: 'Unit IT',
            anggaran: 85000000,
            status: 'approved',
            tanggalDibuat: '2024-01-22',
            periode: 'Q1 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 4,
            nomorRencana: 'RK/2024/004',
            namaKegiatan: 'Seminar Nasional Pendidikan Tinggi',
            unitKerja: 'Unit Akademik',
            anggaran: 45000000,
            status: 'rejected',
            tanggalDibuat: '2024-01-25',
            periode: 'Q1 2024',
            hasTor: true,
            hasRab: false,
        },
        {
            id: 5,
            nomorRencana: 'RK/2024/005',
            namaKegiatan: 'Pelatihan Manajemen Keuangan untuk Staf',
            unitKerja: 'Unit Keuangan',
            anggaran: 35000000,
            status: 'draft',
            tanggalDibuat: '2024-02-01',
            periode: 'Q1 2024',
            hasTor: false,
            hasRab: false,
        },
        {
            id: 6,
            nomorRencana: 'RK/2024/006',
            namaKegiatan: 'Pengadaan Peralatan Laboratorium',
            unitKerja: 'Unit Akademik',
            anggaran: 150000000,
            status: 'diajukan',
            tanggalDibuat: '2024-02-05',
            periode: 'Q2 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 7,
            nomorRencana: 'RK/2024/007',
            namaKegiatan: 'Monitoring dan Evaluasi Program Studi',
            unitKerja: 'Unit Perencanaan',
            anggaran: 60000000,
            status: 'approved',
            tanggalDibuat: '2024-02-08',
            periode: 'Q2 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 8,
            nomorRencana: 'RK/2024/008',
            namaKegiatan: 'Pengembangan Sistem Informasi Akademik',
            unitKerja: 'Unit IT',
            anggaran: 200000000,
            status: 'diajukan',
            tanggalDibuat: '2024-02-10',
            periode: 'Q2 2024',
            hasTor: true,
            hasRab: true,
        },
        {
            id: 9,
            nomorRencana: 'RK/2024/009',
            namaKegiatan: 'Penyusunan Rencana Strategis 2025-2029',
            unitKerja: 'Unit Perencanaan',
            anggaran: 40000000,
            status: 'draft',
            tanggalDibuat: '2024-02-12',
            periode: 'Q2 2024',
            hasTor: false,
            hasRab: false,
        },
        {
            id: 10,
            nomorRencana: 'RK/2024/010',
            namaKegiatan: 'Workshop Publikasi Jurnal Internasional',
            unitKerja: 'Unit Penelitian',
            anggaran: 55000000,
            status: 'approved',
            tanggalDibuat: '2024-02-14',
            periode: 'Q2 2024',
            hasTor: true,
            hasRab: true,
        },
    ],
    units: [
        { id: 1, name: 'Unit Perencanaan' },
        { id: 2, name: 'Unit Penelitian' },
        { id: 3, name: 'Unit IT' },
        { id: 4, name: 'Unit Akademik' },
        { id: 5, name: 'Unit Keuangan' },
    ],
    periods: [
        { id: 'Q1-2024', label: 'Q1 2024' },
        { id: 'Q2-2024', label: 'Q2 2024' },
        { id: 'Q3-2024', label: 'Q3 2024' },
        { id: 'Q4-2024', label: 'Q4 2024' },
    ],
};