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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Calendar,
    Search,
    Filter,
    Download,
    Eye,
    FileText,
    Building2,
    ClipboardCheck,
    MoreVertical,
    CheckCircle2,
    Clock,
    XCircle,
    FileEdit,
    Shield,
    Image,
    Receipt,
    File,
    FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pertanggungjawaban',
        href: '#',
    },
];

// Types
interface PertanggungjawabanProps {
    summary: {
        totalLpj: number;
        totalDraft: number;
        totalDiajukan: number;
        totalVerified: number;
        totalApproved: number;
        totalRejected: number;
    };
    lpjData: LpjItem[];
    units: UnitOption[];
    periods: PeriodOption[];
}

interface LpjItem {
    id: number;
    nomorLpj: string;
    namaKegiatan: string;
    unitKerja: string;
    tanggalUpload: string;
    status: 'draft' | 'diajukan' | 'verified' | 'approved' | 'rejected';
    periode: string;
    totalBiaya: number;
    dokumen: DokumenItem[];
}

interface DokumenItem {
    id: number;
    nama: string;
    type: 'laporan' | 'foto' | 'kwitansi' | 'pendukung';
    url: string;
    size: string;
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

export default function Pertanggungjawaban({
    summary,
    lpjData,
    units,
    periods,
}: PertanggungjawabanProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterUnit, setFilterUnit] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPeriode, setFilterPeriode] = useState('all');
    const [selectedLpj, setSelectedLpj] = useState<LpjItem | null>(null);
    const [showDokumenDialog, setShowDokumenDialog] = useState(false);

    // Handler export
    const handleExport = (format: 'excel' | 'pdf') => {
        console.log(`Exporting to ${format}...`);
        alert(`Export ke ${format.toUpperCase()} akan segera diunduh`);
    };

    // Handler view detail
    const handleViewDetail = (id: number) => {
        console.log(`View detail LPJ ID: ${id}`);
        // TODO: Navigate to detail page
    };

    // Handler view dokumen
    const handleViewDokumen = (lpj: LpjItem) => {
        setSelectedLpj(lpj);
        setShowDokumenDialog(true);
    };

    // Handler download dokumen
    const handleDownloadDoc = (dokumen: DokumenItem) => {
        console.log(`Download dokumen: ${dokumen.nama}`);
        alert(`Download ${dokumen.nama} akan segera dimulai`);
    };

    // Handler download all dokumen
    const handleDownloadAll = (lpj: LpjItem) => {
        console.log(`Download all dokumen for LPJ ID: ${lpj.id}`);
        alert(`Download semua dokumen ${lpj.nomorLpj} akan segera dimulai`);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: {
                variant: 'secondary' as const,
                label: 'Draft',
                icon: FileEdit,
                className: 'bg-gray-100 text-gray-700 border-gray-300',
            },
            diajukan: {
                variant: 'secondary' as const,
                label: 'Diajukan',
                icon: Clock,
                className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            },
            verified: {
                variant: 'secondary' as const,
                label: 'Verified',
                icon: Shield,
                className: 'bg-blue-100 text-blue-700 border-blue-300',
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

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        const StatusIcon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    // Dokumen icon helper
    const getDokumenIcon = (type: string) => {
        switch (type) {
            case 'laporan':
                return FileText;
            case 'foto':
                return Image;
            case 'kwitansi':
                return Receipt;
            default:
                return File;
        }
    };

    // Filter data
    const filteredData = lpjData.filter((item) => {
        const matchSearch =
            search === '' ||
            item.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
            item.nomorLpj.toLowerCase().includes(search.toLowerCase());

        const matchUnit = filterUnit === 'all' || item.unitKerja === filterUnit;
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchPeriode = filterPeriode === 'all' || item.periode === filterPeriode;

        return matchSearch && matchUnit && matchStatus && matchPeriode;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pertanggungjawaban - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Monitoring Pertanggungjawaban (LPJ)
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor dan analisis laporan pertanggungjawaban dari semua unit kerja
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total LPJ</CardTitle>
                            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalLpj}</div>
                            <p className="text-xs text-muted-foreground mt-1">Semua LPJ</p>
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
                            <p className="text-xs text-muted-foreground mt-1">Belum diajukan</p>
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
                            <p className="text-xs text-muted-foreground mt-1">Menunggu verifikasi</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verified</CardTitle>
                            <Shield className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {summary.totalVerified}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Terverifikasi</p>
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
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Daftar Laporan Pertanggungjawaban</CardTitle>
                                <CardDescription>
                                    Monitoring semua LPJ dari unit kerja
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
                                    placeholder="Cari nomor LPJ atau nama kegiatan..."
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
                                    <SelectItem value="verified">Verified</SelectItem>
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
                                        <TableHead>Nomor LPJ</TableHead>
                                        <TableHead>Nama Kegiatan</TableHead>
                                        <TableHead>Unit Kerja</TableHead>
                                        <TableHead className="text-right">Total Biaya</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Tanggal Upload</TableHead>
                                        <TableHead className="text-center">Dokumen</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.nomorLpj}
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div className="font-medium">
                                                        {item.namaKegiatan}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {item.unitKerja}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCurrency(item.totalBiaya)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                <TableCell>{item.periode}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDate(item.tanggalUpload)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDokumen(item)}
                                                    >
                                                        <FolderOpen className="h-4 w-4 text-blue-500" />
                                                        <span className="ml-1 text-xs">
                                                            {item.dokumen.length}
                                                        </span>
                                                    </Button>
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
                                                                onClick={() =>
                                                                    handleViewDetail(item.id)
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Detail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleViewDokumen(item)}
                                                            >
                                                                <FolderOpen className="mr-2 h-4 w-4" />
                                                                Lihat Dokumen
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDownloadAll(item)}
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download Semua
                                                            </DropdownMenuItem>
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
                                                Tidak ada data LPJ
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
                                    Menampilkan {filteredData.length} dari {lpjData.length} LPJ
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Dokumen */}
            <Dialog open={showDokumenDialog} onOpenChange={setShowDokumenDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dokumen LPJ</DialogTitle>
                        <DialogDescription>
                            {selectedLpj?.nomorLpj} - {selectedLpj?.namaKegiatan}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedLpj?.dokumen && selectedLpj.dokumen.length > 0 ? (
                            <div className="space-y-2">
                                {selectedLpj.dokumen.map((dok) => {
                                    const DokIcon = getDokumenIcon(dok.type);
                                    return (
                                        <div
                                            key={dok.id}
                                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-md bg-primary/10 p-2">
                                                    <DokIcon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{dok.nama}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dok.type.charAt(0).toUpperCase() +
                                                            dok.type.slice(1)}{' '}
                                                        • {dok.size}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadDoc(dok)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                Tidak ada dokumen
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDokumenDialog(false)}
                            >
                                Tutup
                            </Button>
                            {selectedLpj && selectedLpj.dokumen.length > 0 && (
                                <Button onClick={() => handleDownloadAll(selectedLpj)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Semua
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
Pertanggungjawaban.defaultProps = {
    summary: {
        totalLpj: 38,
        totalDraft: 5,
        totalDiajukan: 8,
        totalVerified: 10,
        totalApproved: 12,
        totalRejected: 3,
    },
    lpjData: [
        {
            id: 1,
            nomorLpj: 'LPJ/2024/001',
            namaKegiatan: 'Workshop Pengembangan Kompetensi Dosen',
            unitKerja: 'Unit Perencanaan',
            tanggalUpload: '2024-02-10',
            status: 'approved',
            periode: 'Q1 2024',
            totalBiaya: 74500000,
            dokumen: [
                {
                    id: 1,
                    nama: 'Laporan Kegiatan Workshop.pdf',
                    type: 'laporan',
                    url: '#',
                    size: '2.5 MB',
                },
                {
                    id: 2,
                    nama: 'Dokumentasi Foto Kegiatan.zip',
                    type: 'foto',
                    url: '#',
                    size: '15.2 MB',
                },
                {
                    id: 3,
                    nama: 'Kwitansi dan Bukti Transfer.pdf',
                    type: 'kwitansi',
                    url: '#',
                    size: '1.8 MB',
                },
            ],
        },
        {
            id: 2,
            nomorLpj: 'LPJ/2024/002',
            namaKegiatan: 'Hibah Penelitian Kompetitif Dosen Junior',
            unitKerja: 'Unit Penelitian',
            tanggalUpload: '2024-02-12',
            status: 'verified',
            periode: 'Q1 2024',
            totalBiaya: 119800000,
            dokumen: [
                {
                    id: 4,
                    nama: 'Laporan Penelitian.pdf',
                    type: 'laporan',
                    url: '#',
                    size: '5.3 MB',
                },
                {
                    id: 5,
                    nama: 'Bukti Pengeluaran.pdf',
                    type: 'kwitansi',
                    url: '#',
                    size: '3.2 MB',
                },
            ],
        },
        {
            id: 3,
            nomorLpj: 'LPJ/2024/003',
            namaKegiatan: 'Upgrade Infrastruktur Server dan Jaringan',
            unitKerja: 'Unit IT',
            tanggalUpload: '2024-02-14',
            status: 'diajukan',
            periode: 'Q1 2024',
            totalBiaya: 84200000,
            dokumen: [
                {
                    id: 6,
                    nama: 'Laporan Implementasi.pdf',
                    type: 'laporan',
                    url: '#',
                    size: '1.9 MB',
                },
                {
                    id: 7,
                    nama: 'Foto Before After.jpg',
                    type: 'foto',
                    url: '#',
                    size: '8.5 MB',
                },
                {
                    id: 8,
                    nama: 'Invoice Vendor.pdf',
                    type: 'kwitansi',
                    url: '#',
                    size: '890 KB',
                },
                {
                    id: 9,
                    nama: 'Berita Acara Serah Terima.pdf',
                    type: 'pendukung',
                    url: '#',
                    size: '650 KB',
                },
            ],
        },
        {
            id: 4,
            nomorLpj: 'LPJ/2024/004',
            namaKegiatan: 'Seminar Nasional Pendidikan Tinggi',
            unitKerja: 'Unit Akademik',
            tanggalUpload: '2024-02-08',
            status: 'rejected',
            periode: 'Q1 2024',
            totalBiaya: 45000000,
            dokumen: [
                {
                    id: 10,
                    nama: 'Laporan Seminar.pdf',
                    type: 'laporan',
                    url: '#',
                    size: '3.1 MB',
                },
            ],
        },
        {
            id: 5,
            nomorLpj: 'LPJ/2024/005',
            namaKegiatan: 'Pelatihan Manajemen Keuangan untuk Staf',
            unitKerja: 'Unit Keuangan',
            tanggalUpload: '2024-02-15',
            status: 'draft',
            periode: 'Q1 2024',
            totalBiaya: 0,
            dokumen: [],
        },
        {
            id: 6,
            nomorLpj: 'LPJ/2024/006',
            namaKegiatan: 'Pengadaan Peralatan Laboratorium',
            unitKerja: 'Unit Akademik',
            tanggalUpload: '2024-02-16',
            status: 'approved',
            periode: 'Q2 2024',
            totalBiaya: 148500000,
            dokumen: [
                {
                    id: 11,
                    nama: 'Laporan Pengadaan.pdf',
                    type: 'laporan',
                    url: '#',
                    size: '2.2 MB',
                },
                {
                    id: 12,
                    nama: 'Foto Barang.zip',
                    type: 'foto',
                    url: '#',
                    size: '12.8 MB',
                },
                {
                    id: 13,
                    nama: 'Kwitansi Pembelian.pdf',
                    type: 'kwitansi',
                    url: '#',
                    size: '1.5 MB',
                },
            ],
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