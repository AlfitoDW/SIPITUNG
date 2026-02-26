import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
    user: {
        nama_lengkap: string;
        email: string;
    };
    timKerja: {
        id: number;
        nama: string;
        kode: string;
        nama_singkat?: string;
    } | null;
}

export default function Dashboard({ user, timKerja }: DashboardProps) {
    return (
        <AppLayout>
            <Head title="Dashboard Ketua Tim" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Dashboard Ketua Tim Kerja
                    </h1>
                    <p className="text-muted-foreground">
                        Selamat datang, {user.nama_lengkap}
                    </p>
                </div>

                {timKerja && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Tim Kerja Anda:</p>
                            <h3 className="text-xl font-bold text-blue-900">
                                {timKerja.nama}
                            </h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Kode: {timKerja.kode}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Rencana Kegiatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-600">5</p>
                            <p className="text-sm text-muted-foreground mt-1">Draft & Diajukan</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Approved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-600">12</p>
                            <p className="text-sm text-muted-foreground mt-1">Sudah disetujui</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                LPJ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-orange-600">3</p>
                            <p className="text-sm text-muted-foreground mt-1">Perlu diupload</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}