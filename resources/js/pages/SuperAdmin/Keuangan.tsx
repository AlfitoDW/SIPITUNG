import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Wallet,
    TrendingUp,
    TrendingDown,
    Download,
    Search,
    Filter,
    Eye,
    Calendar,
    Building2,
    FileText,
    DollarSign,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Keuangan',
        href: '#',
    },
];

// Types
interface FinanceProps {
    summary: {
        totalAnggaran: number;
        totalTerpakai: number;
        totalSisa: number;
        persentaseTerpakai: number;
    };
    dipaData: DipaItem[];
    permohonanData: PermohonanItem[];
    pencairanData: PencairanItem[];
    units: UnitOption[];
}

interface DipaItem {
    id: number;
    mak: string;
    program: string;
    kegiatan: string;
    paguAnggaran: number;
    realisasi: number;
    sisa: number;
    tahun: string;
}

interface PermohonanItem {
    id: number;
    nomor: string;
    unitKerja: string;
    tanggal: string;
    jumlah: number;
    status: 'pending' | 'approved' | 'rejected' | 'disbursed';
    keterangan: string;
}

interface PencairanItem {
    id: number;
    nomor: string;
    tanggal: string;
    unitKerja: string;
    penerima: string;
    jumlah: number;
    metode: string;
    status: 'success' | 'pending' | 'failed';
}

interface UnitOption {
    id: number;
    name: string;
}

// Helper function
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

export default function Keuangan({
    summary,
    dipaData,
    permohonanData,
    pencairanData,
    units,
}: FinanceProps) {
    // State untuk filters
    const [searchDipa, setSearchDipa] = useState('');
    const [searchPermohonan, setSearchPermohonan] = useState('');
    const [searchPencairan, setSearchPencairan] = useState('');
    const [filterUnit, setFilterUnit] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Handler export
    const handleExport = (type: 'dipa' | 'permohonan' | 'pencairan') => {
        // TODO: Implement actual export logic
        console.log(`Exporting ${type} data...`);
        alert(`Export ${type} akan segera diunduh`);
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending', color: 'bg-yellow-500' },
            approved: { variant: 'default' as const, label: 'Approved', color: 'bg-blue-500' },
            rejected: { variant: 'destructive' as const, label: 'Rejected', color: 'bg-red-500' },
            disbursed: { variant: 'default' as const, label: 'Dicairkan', color: 'bg-green-500' },
            success: { variant: 'default' as const, label: 'Success', color: 'bg-green-500' },
            failed: { variant: 'destructive' as const, label: 'Failed', color: 'bg-red-500' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Keuangan - Super Admin" />
            
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Monitoring Keuangan</h1>
                    <p className="text-muted-foreground">
                        Monitor dan analisis data keuangan LLDIKTI Wilayah III Jakarta
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Anggaran</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(summary.totalAnggaran)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                DIPA Tahun 2024
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Terpakai</CardTitle>
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(summary.totalTerpakai)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {summary.persentaseTerpakai}% dari total anggaran
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sisa Anggaran</CardTitle>
                            <TrendingDown className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.totalSisa)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tersisa {100 - summary.persentaseTerpakai}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Tabs */}
                <Tabs defaultValue="dipa" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dipa">
                            <FileText className="mr-2 h-4 w-4" />
                            Data DIPA
                        </TabsTrigger>
                        <TabsTrigger value="permohonan">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Permohonan Dana
                        </TabsTrigger>
                        <TabsTrigger value="pencairan">
                            <Wallet className="mr-2 h-4 w-4" />
                            Pencairan Dana
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab DIPA */}
                    <TabsContent value="dipa" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Daftar Isian Pelaksanaan Anggaran (DIPA)</CardTitle>
                                        <CardDescription>
                                            Data pagu anggaran per MAK dan realisasinya
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => handleExport('dipa')} size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search */}
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari MAK, Program, atau Kegiatan..."
                                            value={searchDipa}
                                            onChange={(e) => setSearchDipa(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>MAK</TableHead>
                                                <TableHead>Program</TableHead>
                                                <TableHead>Kegiatan</TableHead>
                                                <TableHead className="text-right">Pagu Anggaran</TableHead>
                                                <TableHead className="text-right">Realisasi</TableHead>
                                                <TableHead className="text-right">Sisa</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dipaData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.mak}
                                                    </TableCell>
                                                    <TableCell>{item.program}</TableCell>
                                                    <TableCell className="max-w-xs">
                                                        {item.kegiatan}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(item.paguAnggaran)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-orange-600">
                                                        {formatCurrency(item.realisasi)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(item.sisa)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Permohonan Dana */}
                    <TabsContent value="permohonan" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Daftar Permohonan Dana</CardTitle>
                                        <CardDescription>
                                            Monitoring semua permohonan dana dari unit kerja
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => handleExport('permohonan')} size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-col gap-4 md:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nomor permohonan..."
                                            value={searchPermohonan}
                                            onChange={(e) => setSearchPermohonan(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Select value={filterUnit} onValueChange={setFilterUnit}>
                                        <SelectTrigger className="w-[200px]">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Semua Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Unit</SelectItem>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                    {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-[200px]">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="disbursed">Dicairkan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nomor</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Unit Kerja</TableHead>
                                                <TableHead className="text-right">Jumlah</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {permohonanData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.nomor}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDate(item.tanggal)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{item.unitKerja}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(item.jumlah)}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {item.keterangan}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Pencairan Dana */}
                    <TabsContent value="pencairan" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Riwayat Pencairan Dana</CardTitle>
                                        <CardDescription>
                                            History semua pencairan dana yang telah dilakukan
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => handleExport('pencairan')} size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Search */}
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nomor pencairan atau penerima..."
                                            value={searchPencairan}
                                            onChange={(e) => setSearchPencairan(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                    <Select value={filterUnit} onValueChange={setFilterUnit}>
                                        <SelectTrigger className="w-[200px]">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Semua Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Unit</SelectItem>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                                    {unit.name}
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
                                                <TableHead>Nomor</TableHead>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Unit Kerja</TableHead>
                                                <TableHead>Penerima</TableHead>
                                                <TableHead className="text-right">Jumlah</TableHead>
                                                <TableHead>Metode</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pencairanData.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">
                                                        {item.nomor}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            {formatDate(item.tanggal)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{item.unitKerja}</TableCell>
                                                    <TableCell>{item.penerima}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(item.jumlah)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{item.metode}</Badge>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

// Default props untuk development/testing
Keuangan.defaultProps = {
    summary: {
        totalAnggaran: 8500000000,
        totalTerpakai: 5700000000,
        totalSisa: 2800000000,
        persentaseTerpakai: 67,
    },
    dipaData: [
        {
            id: 1,
            mak: '521111',
            program: 'Peningkatan Kualitas Perguruan Tinggi',
            kegiatan: 'Workshop Pengembangan SDM Dosen',
            paguAnggaran: 500000000,
            realisasi: 350000000,
            sisa: 150000000,
            tahun: '2024',
        },
        {
            id: 2,
            mak: '521211',
            program: 'Penelitian dan Pengabdian Masyarakat',
            kegiatan: 'Hibah Penelitian Kompetitif',
            paguAnggaran: 1200000000,
            realisasi: 800000000,
            sisa: 400000000,
            tahun: '2024',
        },
        {
            id: 3,
            mak: '524111',
            program: 'Pengembangan Infrastruktur TI',
            kegiatan: 'Upgrade Server dan Jaringan',
            paguAnggaran: 800000000,
            realisasi: 650000000,
            sisa: 150000000,
            tahun: '2024',
        },
    ],
    permohonanData: [
        {
            id: 1,
            nomor: 'PD/2024/001',
            unitKerja: 'Unit Perencanaan',
            tanggal: '2024-02-10',
            jumlah: 75000000,
            status: 'approved',
            keterangan: 'Dana workshop pengembangan SDM',
        },
        {
            id: 2,
            nomor: 'PD/2024/002',
            unitKerja: 'Unit Penelitian',
            tanggal: '2024-02-12',
            jumlah: 120000000,
            status: 'pending',
            keterangan: 'Hibah penelitian dosen junior',
        },
        {
            id: 3,
            nomor: 'PD/2024/003',
            unitKerja: 'Unit IT',
            tanggal: '2024-02-13',
            jumlah: 85000000,
            status: 'disbursed',
            keterangan: 'Pengadaan perangkat keras',
        },
        {
            id: 4,
            nomor: 'PD/2024/004',
            unitKerja: 'Unit Akademik',
            tanggal: '2024-02-14',
            jumlah: 45000000,
            status: 'rejected',
            keterangan: 'Dana tidak mencukupi untuk periode ini',
        },
    ],
    pencairanData: [
        {
            id: 1,
            nomor: 'PC/2024/001',
            tanggal: '2024-02-11',
            unitKerja: 'Unit Perencanaan',
            penerima: 'Dr. Ahmad Fauzi',
            jumlah: 75000000,
            metode: 'Transfer Bank',
            status: 'success',
        },
        {
            id: 2,
            nomor: 'PC/2024/002',
            tanggal: '2024-02-14',
            unitKerja: 'Unit IT',
            penerima: 'CV. Teknologi Maju',
            jumlah: 85000000,
            metode: 'Transfer Bank',
            status: 'success',
        },
        {
            id: 3,
            nomor: 'PC/2024/003',
            tanggal: '2024-02-15',
            unitKerja: 'Unit Penelitian',
            penerima: 'Prof. Siti Rahma',
            jumlah: 60000000,
            metode: 'Transfer Bank',
            status: 'pending',
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