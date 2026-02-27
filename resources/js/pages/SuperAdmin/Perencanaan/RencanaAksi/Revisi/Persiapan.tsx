import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/perencanaan' },
    { title: 'Rencana Aksi', href: '#' },
    { title: 'Revisi', href: '#' },
    { title: 'Persiapan', href: '/perencanaan/rencana-aksi/revisi/persiapan' },
];

export default function Persiapan() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Persiapan Revisi — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Persiapan Revisi</h1>
                    <p className="text-muted-foreground">Rencana Aksi — Revisi</p>
                </div>
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-muted-foreground">Konten halaman Persiapan Revisi akan ditampilkan di sini.</p>
                </div>
            </div>
        </AppLayout>
    );
}
