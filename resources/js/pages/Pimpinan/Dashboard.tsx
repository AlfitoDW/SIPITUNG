import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
    user: {
        nama_lengkap: string;
        email: string;
    };
    pimpinanType: 'kabag_umum' | 'ppk';
}

export default function Dashboard({ user, pimpinanType }: DashboardProps) {
    const roleLabel = pimpinanType === 'kabag_umum' 
        ? 'Kepala Bagian Umum' 
        : 'Pejabat Pembuat Komitmen (PPK)';

    return (
        <AppLayout>
            <Head title="Dashboard Pimpinan" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard Pimpinan</h1>
                    <p className="text-muted-foreground">
                        Selamat datang, {user.nama_lengkap}
                    </p>
                </div>

                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground mb-1">Jabatan:</p>
                        <h3 className="text-xl font-bold text-green-900">
                            {roleLabel}
                        </h3>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Approval
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-yellow-600">15</p>
                            <p className="text-sm text-muted-foreground mt-1">Menunggu persetujuan</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Approved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">82</p>
                            <p className="text-sm text-muted-foreground mt-1">Sudah disetujui</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-red-600">3</p>
                            <p className="text-sm text-muted-foreground mt-1">Ditolak</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}