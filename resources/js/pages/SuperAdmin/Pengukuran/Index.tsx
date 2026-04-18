import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengukuran', href: '#' },
    { title: 'Kelola Periode', href: '/super-admin/pengukuran' },
];

type Periode = {
    id: number;
    triwulan: 'TW1' | 'TW2' | 'TW3' | 'TW4';
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
    is_active: boolean;
};
type Tahun = { id: number; tahun: number; label: string };
type Props = { tahun: Tahun; periodes: Periode[] };

const TW_LABELS: Record<string, string> = {
    TW1: 'Triwulan I',
    TW2: 'Triwulan II',
    TW3: 'Triwulan III',
    TW4: 'Triwulan IV',
};
const TW_COLORS: Record<string, string> = {
    TW1: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30',
    TW2: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30',
    TW3: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30',
    TW4: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30',
};

function PeriodeDialog({ open, onClose, triwulan, existing }: {
    open: boolean; onClose: () => void;
    tahunId: number; triwulan: string; existing?: Periode;
}) {
    const form = useForm({
        triwulan,
        tanggal_mulai: existing?.tanggal_mulai ?? '',
        tanggal_selesai: existing?.tanggal_selesai ?? '',
    });

    function submit(e: React.SyntheticEvent) {
        e.preventDefault();
        form.post('/super-admin/pengukuran/periode', { onSuccess: onClose });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{existing ? 'Edit' : 'Atur'} Periode {TW_LABELS[triwulan]}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
                    <div className="grid gap-1.5">
                        <Label>Tanggal Mulai</Label>
                        <Input type="date" value={form.data.tanggal_mulai}
                            onChange={e => form.setData('tanggal_mulai', e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Tanggal Selesai</Label>
                        <Input type="date" value={form.data.tanggal_selesai}
                            onChange={e => form.setData('tanggal_selesai', e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" loading={form.processing}>Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function PengukuranIndex({ tahun, periodes }: Props) {
    const [dialog, setDialog] = useState<{ open: boolean; triwulan: string }>({ open: false, triwulan: 'TW1' });
    const allTW: Array<'TW1' | 'TW2' | 'TW3' | 'TW4'> = ['TW1', 'TW2', 'TW3', 'TW4'];

    function togglePeriode(id: number) {
        router.patch(`/super-admin/pengukuran/periode/${id}/toggle`);
    }

    function formatDate(d: string | null) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengukuran Kinerja — Kelola Periode" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Kelola Periode Pengukuran</h1>
                    <p className="text-muted-foreground">Tahun Anggaran — {tahun.label}</p>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                        <a href="/super-admin/pengukuran/realisasi">Lihat Realisasi Kinerja &rarr;</a>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {allTW.map(tw => {
                        const periode = periodes.find(p => p.triwulan === tw);
                        return (
                            <Card key={tw} className={`border ${TW_COLORS[tw]}`}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4" />
                                        {TW_LABELS[tw]}
                                        {periode?.is_active && (
                                            <Badge className="ml-auto bg-green-500 text-white text-xs">Aktif</Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    {periode ? (
                                        <>
                                            <div className="text-sm text-muted-foreground space-y-0.5">
                                                <p>Mulai: <span className="text-foreground">{formatDate(periode.tanggal_mulai)}</span></p>
                                                <p>Selesai: <span className="text-foreground">{formatDate(periode.tanggal_selesai)}</span></p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{periode.is_active ? 'Buka' : 'Tutup'}</span>
                                                <Switch checked={periode.is_active} onCheckedChange={() => togglePeriode(periode.id)} />
                                            </div>
                                            <Button size="sm" variant="outline" className="w-full"
                                                onClick={() => setDialog({ open: true, triwulan: tw })}>
                                                Edit Tanggal
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground italic">Belum diatur</p>
                                            <Button size="sm" variant="outline" className="w-full gap-1.5"
                                                onClick={() => setDialog({ open: true, triwulan: tw })}>
                                                <Plus className="h-3.5 w-3.5" /> Atur Periode
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <PeriodeDialog
                open={dialog.open}
                triwulan={dialog.triwulan}
                tahunId={tahun.id}
                existing={periodes.find(p => p.triwulan === dialog.triwulan)}
                onClose={() => setDialog(d => ({ ...d, open: false }))}
            />
        </AppLayout>
    );
}
