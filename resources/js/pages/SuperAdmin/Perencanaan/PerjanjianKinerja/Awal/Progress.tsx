import { Head } from '@inertiajs/react';
import { SkeletonPageHeader, SkeletonTable } from '@/components/skeletons';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Awal', href: '#' },
    { title: 'Progres', href: '/perencanaan/perjanjian-kinerja/awal/progres' },
];

export default function Progres() {
    const isLoading = useNavigationLoading();
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Progres Awal — Perjanjian Kinerja" />
            {isLoading ? (
                <div className="p-4">
                    <SkeletonPageHeader />
                    <SkeletonTable rows={3} />
                </div>
            ) : (
                <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Progres Awal</h1>
                        <p className="text-muted-foreground">Perjanjian Kinerja — Awal</p>
                    </div>
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-muted-foreground">Konten halaman Progres Awal akan ditampilkan di sini.</p>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
