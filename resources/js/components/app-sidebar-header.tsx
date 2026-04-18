import { router, usePage } from '@inertiajs/react';
import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
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
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import tahunAnggaranRoutes from '@/routes/tahun-anggaran';
import type { BreadcrumbItem as BreadcrumbItemType, SharedData } from '@/types';

type TahunItem = { id: number; tahun: number; label: string };

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { tahun_anggaran, tahun_anggaran_list } = usePage<SharedData>().props;
    const [pending, setPending] = useState<TahunItem | null>(null);

    const handleConfirm = () => {
        if (!pending) return;
        router.post(tahunAnggaranRoutes.switch.url(), { tahun_anggaran_id: pending.id });
        setPending(null);
    };

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                {(tahun_anggaran_list ?? []).length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto h-8 gap-1.5 text-xs"
                            >
                                <CalendarDays className="size-3.5" />
                                <span>{tahun_anggaran ? tahun_anggaran.label : 'Pilih Tahun'}</span>
                                <ChevronDown className="size-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Tahun Anggaran
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(tahun_anggaran_list ?? []).map((item) => (
                                <DropdownMenuItem
                                    key={item.id}
                                    className="cursor-pointer"
                                    onSelect={() => setPending(item)}
                                >
                                    <span className="flex-1">{item.label}</span>
                                    {tahun_anggaran?.id === item.id && (
                                        <Check className="size-3.5 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </header>

            <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Ganti Tahun Anggaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan beralih ke <strong>{pending?.label}</strong>. Data yang
                            ditampilkan akan disesuaikan dengan tahun anggaran yang dipilih.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>Ya, Ganti</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
