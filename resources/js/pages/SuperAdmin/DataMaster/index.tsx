import { Head } from '@inertiajs/react';
import { Tag, Users, Calendar, File } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';


import { KategoriTab } from './tabs/KategoriTab';
import { ManagementAccountTab } from './tabs/ManagementAccountTab';
import { TahunAnggaranTab } from './tabs/TahunAnggaranTab';
import { TemplateDokumenTab } from './tabs/TemplateDokumenTab';
import type {
    KategoriKegiatan,
    ManagementAccount,
    TimKerja,
    TahunAnggaran,
    TemplateDokumen,
} from './types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Data Master', href: '#' }];

interface DataMasterProps {
    kategoriKegiatan: KategoriKegiatan[];
    managementAccount: ManagementAccount[];
    timKerja: TimKerja[];
    tahunAnggaran: TahunAnggaran[];
    templateDokumen: TemplateDokumen[];
}

export default function DataMaster({
    kategoriKegiatan = [],
    managementAccount = [],
    timKerja = [],
    tahunAnggaran = [],
    templateDokumen = [],
}: DataMasterProps) {
    const [activeTab, setActiveTab] = useState('kategori');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Master - Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Data Master</h1>
                    <p className="text-muted-foreground">Kelola data master sistem perencanaan dan keuangan</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-auto! lg:grid-cols-4 lg:h-9">
                        <TabsTrigger value="kategori">
                            <Tag className="mr-2 h-4 w-4" />Kategori
                        </TabsTrigger>
                        <TabsTrigger value="account">
                            <Users className="mr-2 h-4 w-4" />Akun
                        </TabsTrigger>
                        <TabsTrigger value="tahun">
                            <Calendar className="mr-2 h-4 w-4" />Tahun
                        </TabsTrigger>
                        <TabsTrigger value="template">
                            <File className="mr-2 h-4 w-4" />Template
                        </TabsTrigger>
                    </TabsList>

                   
                    <TabsContent value="kategori" className="space-y-4">
                        <KategoriTab data={kategoriKegiatan} />
                    </TabsContent>
                    <TabsContent value="account" className="space-y-4">
                        <ManagementAccountTab accounts={managementAccount} timKerja={timKerja} />
                    </TabsContent>
                    <TabsContent value="tahun" className="space-y-4">
                        <TahunAnggaranTab data={tahunAnggaran} />
                    </TabsContent>
                    <TabsContent value="template" className="space-y-4">
                        <TemplateDokumenTab data={templateDokumen} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
