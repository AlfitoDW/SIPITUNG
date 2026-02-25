import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard Bendahara" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Bendahara</h1>
                    <p className="text-muted-foreground">
                        Kelola pencairan dana dan verifikasi LPJ
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Pencairan Dana</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
                        <p className="text-sm text-muted-foreground mt-1">Menunggu pencairan</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">LPJ Verified</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">45</p>
                        <p className="text-sm text-muted-foreground mt-1">Sudah diverifikasi</p>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Pending Review</h3>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">8</p>
                        <p className="text-sm text-muted-foreground mt-1">Butuh review</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}