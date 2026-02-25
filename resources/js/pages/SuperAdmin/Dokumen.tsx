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
    Search,
    Filter,
    Download,
    Eye,
    Trash2,
    Building2,
    FolderOpen,
    MoreVertical,
    FileText,
    Image,
    Receipt,
    File,
    Calendar,
    User,
    HardDrive,
    Plus,
    Edit,
    Settings,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dokumen',
        href: '#',
    },
];

// Types
interface DokumenProps {
    summary: {
        totalDokumen: number;
        totalSize: number;
        kategoriBanyak: string;
    };
    dokumenData: DokumenItem[];
    kategoriList: KategoriOption[];
    units: UnitOption[];
}

interface DokumenItem {
    id: number;
    namaFile: string;
    nomorDokumen: string;
    tipeDokumen: string;
    kategoriId: number;
    unitKerja: string;
    ukuranFile: number;
    ukuranReadable: string;
    tanggalUpload: string;
    diuploadOleh: string;
    fileUrl: string;
    fileType: 'pdf' | 'image' | 'excel' | 'word' | 'other';
}

interface KategoriOption {
    id: number;
    nama: string;
    jumlahDokumen: number;
}

interface UnitOption {
    id: number;
    name: string;
}

// Helper functions
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function Dokumen({
    summary,
    dokumenData,
    kategoriList,
    units,
}: DokumenProps) {
    // State untuk filters
    const [search, setSearch] = useState('');
    const [filterKategori, setFilterKategori] = useState('all');
    const [filterUnit, setFilterUnit] = useState('all');
    
    // State untuk preview
    const [selectedDokumen, setSelectedDokumen] = useState<DokumenItem | null>(null);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    
    // State untuk delete
    const [dokumenToDelete, setDokumenToDelete] = useState<DokumenItem | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
    // State untuk manage kategori
    const [showKategoriDialog, setShowKategoriDialog] = useState(false);
    const [editingKategori, setEditingKategori] = useState<KategoriOption | null>(null);

    // Handler preview
    const handlePreview = (dokumen: DokumenItem) => {
        setSelectedDokumen(dokumen);
        setShowPreviewDialog(true);
    };

    // Handler download
    const handleDownload = (dokumen: DokumenItem) => {
        console.log(`Download: ${dokumen.namaFile}`);
        alert(`Download ${dokumen.namaFile} akan segera dimulai`);
    };

    // Handler delete
    const handleDeleteConfirm = () => {
        if (dokumenToDelete) {
            console.log(`Delete dokumen ID: ${dokumenToDelete.id}`);
            alert(`Dokumen ${dokumenToDelete.namaFile} berhasil dihapus`);
            setShowDeleteDialog(false);
            setDokumenToDelete(null);
        }
    };

    // Handler manage kategori
    const handleSaveKategori = () => {
        console.log('Save kategori');
        alert('Kategori berhasil disimpan');
        setShowKategoriDialog(false);
    };

    // File icon helper
    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf':
                return FileText;
            case 'image':
                return Image;
            case 'excel':
                return FileText;
            case 'word':
                return FileText;
            default:
                return File;
        }
    };

    // File type badge helper
    const getFileTypeBadge = (fileType: string) => {
        const typeConfig: Record<string, { color: string; label: string }> = {
            pdf: { color: 'bg-red-100 text-red-700 border-red-300', label: 'PDF' },
            image: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Image' },
            excel: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Excel' },
            word: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Word' },
            other: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'File' },
        };

        const config = typeConfig[fileType] || typeConfig.other;
        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    // Filter data
    const filteredData = dokumenData.filter((item) => {
        const matchSearch =
            search === '' ||
            item.namaFile.toLowerCase().includes(search.toLowerCase()) ||
            item.nomorDokumen.toLowerCase().includes(search.toLowerCase());

        const matchKategori =
            filterKategori === 'all' || item.kategoriId.toString() === filterKategori;
        const matchUnit = filterUnit === 'all' || item.unitKerja === filterUnit;

        return matchSearch && matchKategori && matchUnit;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Repository Dokumen</h1>
                    <p className="text-muted-foreground">
                        Kelola dan monitor semua dokumen digital dari unit kerja
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Dokumen</CardTitle>
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.totalDokumen}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                File tersimpan di sistem
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatFileSize(summary.totalSize)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Storage terpakai
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kategori Terbanyak</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.kategoriBanyak}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Jenis dokumen terbanyak
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Daftar Dokumen</CardTitle>
                                <CardDescription>
                                    Semua dokumen yang diupload ke sistem
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowKategoriDialog(true)}
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Kelola Kategori
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari nama file atau nomor dokumen..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterKategori} onValueChange={setFilterKategori}>
                                <SelectTrigger className="w-full md:w-[220px]">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {kategoriList.map((kategori) => (
                                        <SelectItem key={kategori.id} value={kategori.id.toString()}>
                                            {kategori.nama} ({kategori.jumlahDokumen})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama File</TableHead>
                                        <TableHead>Nomor Dokumen</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Unit Kerja</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Ukuran</TableHead>
                                        <TableHead>Tanggal Upload</TableHead>
                                        <TableHead>Diupload Oleh</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item) => {
                                            const FileIcon = getFileIcon(item.fileType);
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {item.namaFile}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.nomorDokumen}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {item.tipeDokumen}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            {item.unitKerja}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getFileTypeBadge(item.fileType)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {item.ukuranReadable}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {formatDate(item.tanggalUpload)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {item.diuploadOleh}
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
                                                                    onClick={() => handlePreview(item)}
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Preview
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDownload(item)}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setDokumenToDelete(item);
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
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center text-muted-foreground h-24"
                                            >
                                                Tidak ada dokumen
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
                                    Menampilkan {filteredData.length} dari {dokumenData.length}{' '}
                                    dokumen
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Preview Dokumen</DialogTitle>
                        <DialogDescription>
                            {selectedDokumen?.namaFile}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedDokumen && (
                        <div className="space-y-4">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Nomor:</span>
                                    <span className="ml-2 font-medium">
                                        {selectedDokumen.nomorDokumen}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Ukuran:</span>
                                    <span className="ml-2 font-medium">
                                        {selectedDokumen.ukuranReadable}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Unit:</span>
                                    <span className="ml-2 font-medium">
                                        {selectedDokumen.unitKerja}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Upload:</span>
                                    <span className="ml-2 font-medium">
                                        {formatDate(selectedDokumen.tanggalUpload)}
                                    </span>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="border rounded-lg overflow-hidden bg-muted/30">
                                {selectedDokumen.fileType === 'pdf' ? (
                                    <div className="h-[500px] flex items-center justify-center">
                                        <div className="text-center space-y-2">
                                            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                PDF Preview akan muncul di sini
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                (Implementasi iframe PDF viewer)
                                            </p>
                                        </div>
                                    </div>
                                ) : selectedDokumen.fileType === 'image' ? (
                                    <div className="h-[500px] flex items-center justify-center p-4">
                                        <div className="text-center space-y-2">
                                            <Image className="h-16 w-16 mx-auto text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Image preview akan muncul di sini
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                (Implementasi image viewer)
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[500px] flex items-center justify-center">
                                        <div className="text-center space-y-2">
                                            <File className="h-16 w-16 mx-auto text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Preview tidak tersedia untuk tipe file ini
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={() => handleDownload(selectedDokumen)}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Download File
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowPreviewDialog(false)}
                        >
                            Tutup
                        </Button>
                        {selectedDokumen && (
                            <Button onClick={() => handleDownload(selectedDokumen)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus dokumen{' '}
                            <strong>{dokumenToDelete?.namaFile}</strong>? Tindakan ini tidak dapat
                            dibatalkan.
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

            {/* Manage Kategori Dialog */}
            <Dialog open={showKategoriDialog} onOpenChange={setShowKategoriDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Kelola Kategori Dokumen</DialogTitle>
                        <DialogDescription>
                            Tambah, edit, atau hapus kategori dokumen
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Nama kategori baru..." />
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {kategoriList.map((kategori) => (
                                <div
                                    key={kategori.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{kategori.nama}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {kategori.jumlahDokumen} dokumen
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowKategoriDialog(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
Dokumen.defaultProps = {
    summary: {
        totalDokumen: 127,
        totalSize: 458000000, // ~458 MB
        kategoriBanyak: 'LPJ',
    },
    dokumenData: [
        {
            id: 1,
            namaFile: 'Laporan_Workshop_SDM_2024.pdf',
            nomorDokumen: 'DOC/LPJ/2024/001',
            tipeDokumen: 'LPJ',
            kategoriId: 3,
            unitKerja: 'Unit Perencanaan',
            ukuranFile: 2500000,
            ukuranReadable: '2.5 MB',
            tanggalUpload: '2024-02-10T14:30:00',
            diuploadOleh: 'Ahmad Fadhil',
            fileUrl: '#',
            fileType: 'pdf',
        },
        {
            id: 2,
            namaFile: 'TOR_Penelitian_Kompetitif.docx',
            nomorDokumen: 'DOC/TOR/2024/002',
            tipeDokumen: 'TOR',
            kategoriId: 1,
            unitKerja: 'Unit Penelitian',
            ukuranFile: 850000,
            ukuranReadable: '850 KB',
            tanggalUpload: '2024-02-08T10:15:00',
            diuploadOleh: 'Siti Rahma',
            fileUrl: '#',
            fileType: 'word',
        },
        {
            id: 3,
            namaFile: 'RAB_Upgrade_Server.xlsx',
            nomorDokumen: 'DOC/RAB/2024/003',
            tipeDokumen: 'RAB',
            kategoriId: 2,
            unitKerja: 'Unit IT',
            ukuranFile: 450000,
            ukuranReadable: '450 KB',
            tanggalUpload: '2024-02-07T16:45:00',
            diuploadOleh: 'Budi Santoso',
            fileUrl: '#',
            fileType: 'excel',
        },
        {
            id: 4,
            namaFile: 'Foto_Kegiatan_Workshop.jpg',
            nomorDokumen: 'DOC/FOTO/2024/004',
            tipeDokumen: 'Foto Kegiatan',
            kategoriId: 5,
            unitKerja: 'Unit Perencanaan',
            ukuranFile: 3200000,
            ukuranReadable: '3.2 MB',
            tanggalUpload: '2024-02-10T15:00:00',
            diuploadOleh: 'Ahmad Fadhil',
            fileUrl: '#',
            fileType: 'image',
        },
        {
            id: 5,
            namaFile: 'Kwitansi_Pembayaran_Vendor.pdf',
            nomorDokumen: 'DOC/KWT/2024/005',
            tipeDokumen: 'Kwitansi',
            kategoriId: 4,
            unitKerja: 'Unit Keuangan',
            ukuranFile: 1200000,
            ukuranReadable: '1.2 MB',
            tanggalUpload: '2024-02-09T11:30:00',
            diuploadOleh: 'Rina Wati',
            fileUrl: '#',
            fileType: 'pdf',
        },
        {
            id: 6,
            namaFile: 'DIPA_2024_Full.pdf',
            nomorDokumen: 'DOC/DIPA/2024/001',
            tipeDokumen: 'DIPA',
            kategoriId: 6,
            unitKerja: 'Unit Keuangan',
            ukuranFile: 5800000,
            ukuranReadable: '5.8 MB',
            tanggalUpload: '2024-01-15T09:00:00',
            diuploadOleh: 'Admin Keuangan',
            fileUrl: '#',
            fileType: 'pdf',
        },
    ],
    kategoriList: [
        { id: 1, nama: 'TOR (Term of Reference)', jumlahDokumen: 15 },
        { id: 2, nama: 'RAB (Rencana Anggaran Biaya)', jumlahDokumen: 18 },
        { id: 3, nama: 'LPJ (Laporan Pertanggungjawaban)', jumlahDokumen: 32 },
        { id: 4, nama: 'Kwitansi & Bukti Bayar', jumlahDokumen: 45 },
        { id: 5, nama: 'Foto Kegiatan', jumlahDokumen: 28 },
        { id: 6, nama: 'DIPA', jumlahDokumen: 5 },
        { id: 7, nama: 'Surat Keputusan', jumlahDokumen: 12 },
    ],
    units: [
        { id: 1, name: 'Unit Perencanaan' },
        { id: 2, name: 'Unit Penelitian' },
        { id: 3, name: 'Unit IT' },
        { id: 4, name: 'Unit Akademik' },
        { id: 5, name: 'Unit Keuangan' },
    ],
};