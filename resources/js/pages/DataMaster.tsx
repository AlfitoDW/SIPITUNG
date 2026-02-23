import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Database,
    Search,
    Plus,
    Edit,
    Trash2,
    Download,
    Upload,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Building2,
    Tag,
    DollarSign,
    Users,
    Calendar,
    File,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Data Master',
        href: '#',
    },
];

// Types
interface DataMasterProps {
    unitKerja: UnitKerja[];
    kategoriKegiatan: KategoriKegiatan[];
    jenisAnggaran: JenisAnggaran[];
    managementAccount: ManagementAccount[];
    tahunAnggaran: TahunAnggaran[];
    templateDokumen: TemplateDokumen[];
}

interface UnitKerja {
    id: number;
    nama: string;
    kode: string;
    status: 'active' | 'inactive';
}

interface KategoriKegiatan {
    id: number;
    nama: string;
    deskripsi: string;
    status: 'active' | 'inactive';
}

interface JenisAnggaran {
    id: number;
    nama: string;
    kode: string;
    sumberDana: string;
    status: 'active' | 'inactive';
}

interface ManagementAccount {
    id: number;
    username: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
}

interface TahunAnggaran {
    id: number;
    tahun: string;
    isActive: boolean;
    status: 'active' | 'inactive';
}

interface TemplateDokumen {
    id: number;
    nama: string;
    fileName: string;
    fileType: string;
    status: 'active' | 'inactive';
}

export default function DataMaster({
    unitKerja,
    kategoriKegiatan,
    jenisAnggaran,
    managementAccount,
    tahunAnggaran,
    templateDokumen,
}: DataMasterProps) {
    // State untuk tab aktif
    const [activeTab, setActiveTab] = useState('unit-kerja');

    // State untuk search
    const [searchUnit, setSearchUnit] = useState('');
    const [searchKategori, setSearchKategori] = useState('');
    const [searchJenis, setSearchJenis] = useState('');
    const [searchAccount, setSearchAccount] = useState('');
    const [searchTahun, setSearchTahun] = useState('');
    const [searchTemplate, setSearchTemplate] = useState('');

    // State untuk dialog
    const [showDialog, setShowDialog] = useState(false);
    const [dialogType, setDialogType] = useState<'unit' | 'kategori' | 'jenis' | 'account' | 'tahun' | 'template'>('unit');
    const [editingItem, setEditingItem] = useState<any>(null);

    // State untuk delete
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    // State untuk form
    const [formData, setFormData] = useState<any>({});

    // Handler add
    const handleAdd = (type: typeof dialogType) => {
        setDialogType(type);
        setEditingItem(null);
        setFormData(getDefaultFormData(type));
        setShowDialog(true);
    };

    // Handler edit
    const handleEdit = (type: typeof dialogType, item: any) => {
        setDialogType(type);
        setEditingItem(item);
        setFormData(item);
        setShowDialog(true);
    };

    // Handler save
    const handleSave = () => {
        console.log('Save:', dialogType, formData);
        alert(`Data ${dialogType} berhasil ${editingItem ? 'diupdate' : 'ditambahkan'}`);
        setShowDialog(false);
    };

    // Handler delete
    const handleDeleteConfirm = () => {
        console.log('Delete:', itemToDelete);
        alert('Data berhasil dihapus');
        setShowDeleteDialog(false);
        setItemToDelete(null);
    };

    // Handler toggle status
    const handleToggleStatus = (type: string, item: any) => {
        const newStatus = item.status === 'active' ? 'inactive' : 'active';
        console.log(`Toggle status ${type}:`, item.id, newStatus);
        alert(`Status berhasil diubah menjadi ${newStatus}`);
    };

    // Handler import
    const handleImport = (type: string) => {
        console.log(`Import ${type}`);
        alert('Fitur import akan segera tersedia');
    };

    // Handler export
    const handleExport = (type: string) => {
        console.log(`Export ${type}`);
        alert('Export Excel akan segera diunduh');
    };

    // Get default form data
    const getDefaultFormData = (type: typeof dialogType) => {
        switch (type) {
            case 'unit':
                return { nama: '', kode: '', status: true };
            case 'kategori':
                return { nama: '', deskripsi: '', status: true };
            case 'jenis':
                return { nama: '', kode: '', sumberDana: '', status: true };
            case 'account':
                return { username: '', email: '', role: '', status: true };
            case 'tahun':
                return { tahun: '', isActive: false, status: true };
            case 'template':
                return { nama: '', file: null, status: true };
            default:
                return {};
        }
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

    // Filter functions
    const filterData = (data: any[], search: string, fields: string[]) => {
        if (!search) return data;
        return data.filter((item) =>
            fields.some((field) =>
                item[field]?.toString().toLowerCase().includes(search.toLowerCase())
            )
        );
    };

    const filteredUnitKerja = filterData(unitKerja, searchUnit, ['nama', 'kode']);
    const filteredKategori = filterData(kategoriKegiatan, searchKategori, ['nama', 'deskripsi']);
    const filteredJenis = filterData(jenisAnggaran, searchJenis, ['nama', 'kode', 'sumberDana']);
    const filteredAccount = filterData(managementAccount, searchAccount, ['username', 'email', 'role']);
    const filteredTahun = filterData(tahunAnggaran, searchTahun, ['tahun']);
    const filteredTemplate = filterData(templateDokumen, searchTemplate, ['nama', 'fileName']);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Master - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Data Master</h1>
                    <p className="text-muted-foreground">
                        Kelola data master sistem perencanaan dan keuangan
                    </p>
                </div>

                {/* Main Content with Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                        <TabsTrigger value="unit-kerja">
                            <Building2 className="mr-2 h-4 w-4" />
                            Unit Kerja
                        </TabsTrigger>
                        <TabsTrigger value="kategori">
                            <Tag className="mr-2 h-4 w-4" />
                            Kategori
                        </TabsTrigger>
                        <TabsTrigger value="jenis-anggaran">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Jenis Anggaran
                        </TabsTrigger>
                        <TabsTrigger value="account">
                            <Users className="mr-2 h-4 w-4" />
                            Akun
                        </TabsTrigger>
                        <TabsTrigger value="tahun">
                            <Calendar className="mr-2 h-4 w-4" />
                            Tahun
                        </TabsTrigger>
                        <TabsTrigger value="template">
                            <File className="mr-2 h-4 w-4" />
                            Template
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Unit Kerja */}
                    <TabsContent value="unit-kerja" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Unit Kerja</CardTitle>
                                        <CardDescription>Kelola data unit kerja organisasi</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleImport('unit-kerja')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleExport('unit-kerja')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                        <Button size="sm" onClick={() => handleAdd('unit')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama atau kode unit..."
                                        value={searchUnit}
                                        onChange={(e) => setSearchUnit(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Unit Kerja</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUnitKerja.length > 0 ? (
                                                filteredUnitKerja.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-mono">{item.kode}</TableCell>
                                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
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
                                                                    <DropdownMenuItem onClick={() => handleEdit('unit', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus('unit', item)}>
                                                                        {item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                        Tidak ada data unit kerja
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Kategori Kegiatan */}
                    <TabsContent value="kategori" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Kategori Kegiatan</CardTitle>
                                        <CardDescription>Kelola kategori kegiatan</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleImport('kategori')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleExport('kategori')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                        <Button size="sm" onClick={() => handleAdd('kategori')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari kategori..."
                                        value={searchKategori}
                                        onChange={(e) => setSearchKategori(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Kategori</TableHead>
                                                <TableHead>Deskripsi</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredKategori.length > 0 ? (
                                                filteredKategori.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                                        <TableCell className="max-w-md">{item.deskripsi}</TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit('kategori', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus('kategori', item)}>
                                                                        {item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                        Tidak ada data kategori
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Jenis Anggaran */}
                    <TabsContent value="jenis-anggaran" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Jenis Anggaran</CardTitle>
                                        <CardDescription>Kelola jenis dan sumber anggaran</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleImport('jenis-anggaran')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleExport('jenis-anggaran')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                        <Button size="sm" onClick={() => handleAdd('jenis')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari jenis anggaran..."
                                        value={searchJenis}
                                        onChange={(e) => setSearchJenis(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Jenis</TableHead>
                                                <TableHead>Sumber Dana</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredJenis.length > 0 ? (
                                                filteredJenis.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-mono">{item.kode}</TableCell>
                                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                                        <TableCell>{item.sumberDana}</TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit('jenis', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus('jenis', item)}>
                                                                        {item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                        Tidak ada data jenis anggaran
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Management Account */}
                    <TabsContent value="account" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Management Account</CardTitle>
                                        <CardDescription>Kelola akun pengguna sistem</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleImport('account')}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleExport('account')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </Button>
                                        <Button size="sm" onClick={() => handleAdd('account')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari username atau email..."
                                        value={searchAccount}
                                        onChange={(e) => setSearchAccount(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Username</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAccount.length > 0 ? (
                                                filteredAccount.map((item: ManagementAccount) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.username}</TableCell>
                                                        <TableCell>{item.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{item.role}</Badge>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit('account', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleToggleStatus('account', item)}>
                                                                        {item.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                        Tidak ada data akun
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Tahun Anggaran */}
                    <TabsContent value="tahun" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Tahun Anggaran</CardTitle>
                                        <CardDescription>Kelola tahun anggaran aktif</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleAdd('tahun')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tahun</TableHead>
                                                <TableHead>Active</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tahunAnggaran.length > 0 ? (
                                                tahunAnggaran.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="text-lg font-semibold">{item.tahun}</TableCell>
                                                        <TableCell>
                                                            {item.isActive ? (
                                                                <Badge variant="default" className="bg-blue-500">Active Year</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit('tahun', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        Set as Active Year
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                                        Tidak ada data tahun anggaran
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Template Dokumen */}
                    <TabsContent value="template" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Template Dokumen</CardTitle>
                                        <CardDescription>Kelola template dokumen .docx / .xlsx</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleAdd('template')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Upload Template
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari template..."
                                        value={searchTemplate}
                                        onChange={(e) => setSearchTemplate(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Template</TableHead>
                                                <TableHead>File</TableHead>
                                                <TableHead>Tipe</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTemplate.length > 0 ? (
                                                filteredTemplate.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.nama}</TableCell>
                                                        <TableCell className="font-mono text-sm">{item.fileName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{item.fileType}</Badge>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem>
                                                                        <Download className="mr-2 h-4 w-4" />
                                                                        Download
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleEdit('template', item)}>
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setItemToDelete(item);
                                                                            setShowDeleteDialog(true);
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Hapus
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                                        Tidak ada template dokumen
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Form Dialog - Universal untuk semua jenis data */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'Edit' : 'Tambah'} {dialogType === 'unit' ? 'Unit Kerja' : 
                            dialogType === 'kategori' ? 'Kategori' :
                            dialogType === 'jenis' ? 'Jenis Anggaran' :
                            dialogType === 'account' ? 'Management Account' :
                            dialogType === 'tahun' ? 'Tahun Anggaran' : 'Template'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {dialogType === 'unit' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Kode <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: UP" value={formData.kode || ''} 
                                        onChange={(e) => setFormData({...formData, kode: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nama Unit <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: Unit Perencanaan" value={formData.nama || ''}
                                        onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                                </div>
                            </>
                        )}
                        {dialogType === 'kategori' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nama Kategori <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: Workshop & Pelatihan" value={formData.nama || ''}
                                        onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Deskripsi</Label>
                                    <Textarea placeholder="Deskripsi kategori..." value={formData.deskripsi || ''}
                                        onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} />
                                </div>
                            </>
                        )}
                        {dialogType === 'jenis' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Kode <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: DIPA" value={formData.kode || ''}
                                        onChange={(e) => setFormData({...formData, kode: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nama Jenis <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: DIPA Reguler" value={formData.nama || ''}
                                        onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sumber Dana <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: APBN" value={formData.sumberDana || ''}
                                        onChange={(e) => setFormData({...formData, sumberDana: e.target.value})} />
                                </div>
                            </>
                        )}
                        {dialogType === 'account' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Username <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Misal: admin" value={formData.username || ''}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email <span className="text-red-500">*</span></Label>
                                    <Input type="email" placeholder="Misal: admin@lldikti3.id" value={formData.email || ''}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role <span className="text-red-500">*</span></Label>
                                    <Select value={formData.role || ''} onValueChange={(val) => setFormData({...formData, role: val})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih role..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Super Admin">Super Admin</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                            <SelectItem value="Operator">Operator</SelectItem>
                                            <SelectItem value="Viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        {dialogType === 'tahun' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Tahun <span className="text-red-500">*</span></Label>
                                    <Input type="number" placeholder="2024" value={formData.tahun || ''}
                                        onChange={(e) => setFormData({...formData, tahun: e.target.value})} />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <Label>Set as Active Year</Label>
                                    <Switch checked={formData.isActive || false}
                                        onCheckedChange={(checked) => setFormData({...formData, isActive: checked})} />
                                </div>
                            </>
                        )}
                        {dialogType === 'template' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Nama Template <span className="text-red-500">*</span></Label>
                                    <Input placeholder="Template TOR" value={formData.nama || ''}
                                        onChange={(e) => setFormData({...formData, nama: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Upload File (.docx / .xlsx)</Label>
                                    <Input type="file" accept=".docx,.xlsx" />
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label>Status Aktif</Label>
                            <Switch checked={formData.status !== false}
                                onCheckedChange={(checked) => setFormData({...formData, status: checked})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
                        <Button onClick={handleSave}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

// Default props untuk development/testing
DataMaster.defaultProps = {
    unitKerja: [
        { id: 1, nama: 'Unit Perencanaan', kode: 'UP', status: 'active' },
        { id: 2, nama: 'Unit Penelitian', kode: 'UPLT', status: 'active' },
        { id: 3, nama: 'Unit IT', kode: 'UIT', status: 'active' },
        { id: 4, nama: 'Unit Akademik', kode: 'UAK', status: 'active' },
        { id: 5, nama: 'Unit Keuangan', kode: 'UK', status: 'inactive' },
    ],
    kategoriKegiatan: [
        { id: 1, nama: 'Workshop & Pelatihan', deskripsi: 'Kegiatan workshop dan pelatihan SDM', status: 'active' },
        { id: 2, nama: 'Penelitian', deskripsi: 'Kegiatan penelitian dan pengabdian masyarakat', status: 'active' },
        { id: 3, nama: 'Pengadaan', deskripsi: 'Pengadaan barang dan jasa', status: 'active' },
        { id: 4, nama: 'Seminar & Konferensi', deskripsi: 'Kegiatan seminar dan konferensi', status: 'active' },
    ],
    jenisAnggaran: [
        { id: 1, nama: 'DIPA Reguler', kode: 'DIPA-REG', sumberDana: 'APBN', status: 'active' },
        { id: 2, nama: 'DIPA Tambahan', kode: 'DIPA-TAM', sumberDana: 'APBN', status: 'active' },
        { id: 3, nama: 'PNBP', kode: 'PNBP', sumberDana: 'Non-APBN', status: 'active' },
    ],
    managementAccount: [
        { id: 1, username: 'superadmin', email: 'superadmin@lldikti3.id', role: 'Super Admin', status: 'active' },
        { id: 2, username: 'admin1', email: 'admin1@lldikti3.id', role: 'Admin', status: 'active' },
        { id: 3, username: 'operator1', email: 'operator1@lldikti3.id', role: 'Operator', status: 'active' },
        { id: 4, username: 'viewer1', email: 'viewer1@lldikti3.id', role: 'Viewer', status: 'inactive' },
    ],
    tahunAnggaran: [
        { id: 1, tahun: '2024', isActive: true, status: 'active' },
        { id: 2, tahun: '2023', isActive: false, status: 'active' },
        { id: 3, tahun: '2025', isActive: false, status: 'active' },
    ],
    templateDokumen: [
        { id: 1, nama: 'Template TOR', fileName: 'template_tor.docx', fileType: 'DOCX', status: 'active' },
        { id: 2, nama: 'Template RAB', fileName: 'template_rab.xlsx', fileType: 'XLSX', status: 'active' },
        { id: 3, nama: 'Template LPJ', fileName: 'template_lpj.docx', fileType: 'DOCX', status: 'active' },
    ],
};