import { Head } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    Download,
    Eye,
    Building2,
    TrendingUp,
    DollarSign,
    Receipt,
    Shield,
    BarChart3,
    FileSpreadsheet,
    Printer,
    Clock,
    Play,
} from 'lucide-react';
import { useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Laporan',
        href: '#',
    },
];

// Types
interface LaporanProps {
    jenisLaporan: JenisLaporanOption[];
    units: UnitOption[];
    periods: PeriodOption[];
}

interface JenisLaporanOption {
    id: string;
    nama: string;
    deskripsi: string;
    icon: React.ElementType;
}

interface UnitOption {
    id: number;
    name: string;
}

interface PeriodOption {
    id: string;
    label: string;
}

interface LaporanDetail {
    id: number;
    item: string;
    unit: string;
    anggaran: number;
    realisasi: number;
    selisih: number;
}

interface LaporanData {
    summary: {
        totalAnggaran: number;
        totalRealisasi: number;
        persentase: number;
        selisih: number;
    };
    details: LaporanDetail[];
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
        month: 'long',
        year: 'numeric',
    });
};

export default function Laporan({ jenisLaporan, units, periods }: LaporanProps) {
    // State untuk filters
    const [selectedJenis, setSelectedJenis] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // State untuk preview
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewData, setPreviewData] = useState<LaporanData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Handler generate laporan
    const handleGenerate = () => {
        if (!selectedJenis) {
            alert('Pilih jenis laporan terlebih dahulu');
            return;
        }

        setIsGenerating(true);
        
        // Simulate API call
        setTimeout(() => {
            // Mock data
            const mockData: LaporanData = {
                summary: {
                    totalAnggaran: 500000000,
                    totalRealisasi: 335000000,
                    persentase: 67,
                    selisih: 165000000,
                },
                details: [
                    {
                        id: 1,
                        item: 'Workshop Pengembangan Kompetensi Dosen',
                        unit: 'Unit Perencanaan',
                        anggaran: 75000000,
                        realisasi: 74500000,
                        selisih: 500000,
                    },
                    {
                        id: 2,
                        item: 'Hibah Penelitian Kompetitif',
                        unit: 'Unit Penelitian',
                        anggaran: 120000000,
                        realisasi: 119800000,
                        selisih: 200000,
                    },
                    {
                        id: 3,
                        item: 'Upgrade Infrastruktur Server',
                        unit: 'Unit IT',
                        anggaran: 85000000,
                        realisasi: 84200000,
                        selisih: 800000,
                    },
                ],
            };

            setPreviewData(mockData);
            setShowPreviewDialog(true);
            setIsGenerating(false);
        }, 1500);
    };

    // Handler export
    const handleExport = (format: 'excel' | 'pdf') => {
        console.log(`Export to ${format}`);
        alert(`Export laporan ke ${format.toUpperCase()} akan segera diunduh`);
    };

    // Handler print
    const handlePrint = () => {
        console.log('Print laporan');
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Generate Laporan</h1>
                    <p className="text-muted-foreground">
                        Buat dan export berbagai jenis laporan untuk monitoring dan evaluasi
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Panel - Form Generate */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Laporan</CardTitle>
                                <CardDescription>
                                    Pilih jenis dan parameter laporan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Jenis Laporan */}
                                <div className="space-y-2">
                                    <Label>Jenis Laporan</Label>
                                    <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis laporan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jenisLaporan.map((jenis) => (
                                                <SelectItem key={jenis.id} value={jenis.id}>
                                                    <div className="flex items-center gap-2">
                                                        <jenis.icon className="h-4 w-4" />
                                                        {jenis.nama}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {selectedJenis && (
                                        <p className="text-xs text-muted-foreground">
                                            {
                                                jenisLaporan.find((j) => j.id === selectedJenis)
                                                    ?.deskripsi
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Unit Kerja */}
                                <div className="space-y-2">
                                    <Label>Unit Kerja</Label>
                                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                        <SelectTrigger>
                                            <Building2 className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Pilih unit" />
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

                                {/* Periode Preset */}
                                <div className="space-y-2">
                                    <Label>Periode</Label>
                                    <Select
                                        value={selectedPeriod}
                                        onValueChange={setSelectedPeriod}
                                    >
                                        <SelectTrigger>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Pilih periode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {periods.map((period) => (
                                                <SelectItem key={period.id} value={period.id}>
                                                    {period.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Custom Date Range */}
                                <div className="space-y-2">
                                    <Label>atau Custom Date Range</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Dari</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Sampai</Label>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    className="w-full"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Generate Laporan
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Info & Quick Access */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Jenis Laporan Cards */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Jenis Laporan Tersedia</CardTitle>
                                <CardDescription>
                                    Pilih jenis laporan yang ingin digenerate
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {jenisLaporan.map((jenis) => {
                                        const Icon = jenis.icon;
                                        return (
                                            <div
                                                key={jenis.id}
                                                className={`rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${
                                                    selectedJenis === jenis.id
                                                        ? 'border-primary bg-primary/5'
                                                        : ''
                                                }`}
                                                onClick={() => setSelectedJenis(jenis.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-md bg-primary/10 p-2">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{jenis.nama}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {jenis.deskripsi}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Reports */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Laporan Terbaru</CardTitle>
                                <CardDescription>
                                    Laporan yang baru saja digenerate
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[
                                        {
                                            id: 1,
                                            nama: 'Laporan Realisasi Anggaran Q1 2024',
                                            tanggal: '2024-02-15T14:30:00',
                                            user: 'Super Admin',
                                        },
                                        {
                                            id: 2,
                                            nama: 'Laporan Pencairan Dana Januari 2024',
                                            tanggal: '2024-02-10T10:15:00',
                                            user: 'Super Admin',
                                        },
                                        {
                                            id: 3,
                                            nama: 'Laporan Audit Trail Approval',
                                            tanggal: '2024-02-08T16:45:00',
                                            user: 'Super Admin',
                                        },
                                    ].map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-md bg-primary/10 p-2">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {report.nama}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(report.tanggal)} • {report.user}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview Laporan</DialogTitle>
                        <DialogDescription>
                            {selectedJenis &&
                                jenisLaporan.find((j) => j.id === selectedJenis)?.nama}
                        </DialogDescription>
                    </DialogHeader>

                    {previewData && (
                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="rounded-lg border p-4 bg-muted/50">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Unit:</span>
                                        <span className="ml-2 font-medium">
                                            {selectedUnit === 'all'
                                                ? 'Semua Unit'
                                                : units.find(
                                                      (u) => u.id.toString() === selectedUnit
                                                  )?.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Periode:</span>
                                        <span className="ml-2 font-medium">
                                            {selectedPeriod
                                                ? periods.find((p) => p.id === selectedPeriod)
                                                      ?.label
                                                : `${startDate} - ${endDate}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Tanggal:</span>
                                        <span className="ml-2 font-medium">
                                            {formatDate(new Date().toISOString())}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Anggaran</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(previewData.summary.totalAnggaran)}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Realisasi</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(previewData.summary.totalRealisasi)}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Persentase</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {previewData.summary.persentase}%
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Selisih</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(previewData.summary.selisih)}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detail Table */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No</TableHead>
                                            <TableHead>Item Kegiatan</TableHead>
                                            <TableHead>Unit Kerja</TableHead>
                                            <TableHead className="text-right">Anggaran</TableHead>
                                            <TableHead className="text-right">Realisasi</TableHead>
                                            <TableHead className="text-right">Selisih</TableHead>
                                            <TableHead className="text-right">%</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.details.map((item, index) => {
                                            const persen = Math.round(
                                                (item.realisasi / item.anggaran) * 100
                                            );
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.item}
                                                    </TableCell>
                                                    <TableCell>{item.unit}</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(item.anggaran)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-orange-600">
                                                        {formatCurrency(item.realisasi)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-green-600">
                                                        {formatCurrency(item.selisih)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge
                                                            variant={
                                                                persen >= 80
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {persen}%
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowPreviewDialog(false)}
                        >
                            Tutup
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('excel')}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button onClick={() => handleExport('pdf')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
Laporan.defaultProps = {
    jenisLaporan: [
        {
            id: 'realisasi_anggaran',
            nama: 'Laporan Realisasi Anggaran',
            deskripsi: 'Laporan penyerapan anggaran per unit kerja dan periode',
            icon: TrendingUp,
        },
        {
            id: 'rencana_vs_realisasi',
            nama: 'Laporan Rencana vs Realisasi',
            deskripsi: 'Perbandingan rencana dan realisasi kegiatan',
            icon: BarChart3,
        },
        {
            id: 'permohonan_dana',
            nama: 'Laporan Permohonan Dana',
            deskripsi: 'Rekap semua permohonan dana berdasarkan status',
            icon: DollarSign,
        },
        {
            id: 'pencairan',
            nama: 'Laporan Pencairan Dana',
            deskripsi: 'History pencairan dana yang sudah dilakukan',
            icon: Receipt,
        },
        {
            id: 'lpj',
            nama: 'Laporan LPJ',
            deskripsi: 'Rekap laporan pertanggungjawaban per periode',
            icon: FileText,
        },
        {
            id: 'audit_trail',
            nama: 'Laporan Approval (Audit Trail)',
            deskripsi: 'History approval untuk audit dan compliance',
            icon: Shield,
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
        { id: 'Q1-2024', label: 'Q1 2024 (Jan - Mar)' },
        { id: 'Q2-2024', label: 'Q2 2024 (Apr - Jun)' },
        { id: 'Q3-2024', label: 'Q3 2024 (Jul - Sep)' },
        { id: 'Q4-2024', label: 'Q4 2024 (Okt - Des)' },
        { id: 'JAN-2024', label: 'Januari 2024' },
        { id: 'FEB-2024', label: 'Februari 2024' },
        { id: 'YEAR-2024', label: 'Tahun 2024 (Full Year)' },
    ],
};