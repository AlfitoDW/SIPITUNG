import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Perencanaan', href: '/ketua-tim/perencanaan' },
    { title: 'Perjanjian Kinerja', href: '#' },
    { title: 'Revisi', href: '#' },
    { title: 'Progress', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/progress' },
];

type Props = {
    tahun: { id: number; tahun: number; label: string };
    pk: { id: number; status: 'draft' | 'final' } | null;
};

export default function Progress({ tahun, pk }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Progress Revisi — Perjanjian Kinerja" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Progress Revisi</h1>
                    <p className="text-muted-foreground">Perjanjian Kinerja — {tahun.label}</p>
                </div>
                <div className="rounded-xl border p-6 shadow-sm flex items-center gap-4">
                    <span className="text-sm font-medium">Status Penyusunan</span>
                    {!pk ? (
                        <Badge variant="outline">Belum dimulai</Badge>
                    ) : pk.status === 'final' ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Final</Badge>
                    ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Draft</Badge>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
