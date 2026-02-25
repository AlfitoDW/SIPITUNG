import {
    LayoutDashboard,
    ClipboardPenLine,
    ClipboardCheck,
    HandCoins,
    FileCheck,
    FolderOpen,
} from 'lucide-react';
import type { NavGroup } from '@/types';

const ketuaTimNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: '/ketua-tim/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'Perencanaan',
        items: [
            {
                title: 'Perjanjian Kinerja',
                icon: ClipboardPenLine,
                children: [
                    {
                        title: 'Awal',
                        children: [
                            { title: 'Persiapan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan' },
                            { title: 'Progress',  href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/progress'  },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Persiapan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan' },
                            { title: 'Progress',  href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/progress'  },
                        ],
                    },
                ],
            },
            {
                title: 'Rencana Aksi',
                icon: ClipboardCheck,
                children: [
                    {
                        title: 'Awal',
                        children: [
                            { title: 'Persiapan', href: '/ketua-tim/perencanaan/rencana-aksi/awal/persiapan' },
                            { title: 'Progress',  href: '/ketua-tim/perencanaan/rencana-aksi/awal/progress'  },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Persiapan', href: '/ketua-tim/perencanaan/rencana-aksi/revisi/persiapan' },
                            { title: 'Progress',  href: '/ketua-tim/perencanaan/rencana-aksi/revisi/progress'  },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            {
                title: 'Permohonan Dana',
                href: '/ketua-tim/permohonan-dana',
                icon: HandCoins,
            },
        ],
    },
    {
        label: 'Pertanggungjawaban',
        items: [
            {
                title: 'LPJ',
                href: '/ketua-tim/lpj',
                icon: FileCheck,
            },
        ],
    },
    {
        label: 'Lainnya',
        items: [
            {
                title: 'Dokumen',
                href: '/ketua-tim/dokumen',
                icon: FolderOpen,
            },
        ],
    },
];

export default ketuaTimNav;
