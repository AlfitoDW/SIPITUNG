import {
    LayoutDashboard,
    ClipboardPenLine,
    ClipboardCheck,
    HandCoins,
    FileCheck,
    FolderOpen,
    BellRingIcon,
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
                            { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan' },
                            { title: 'Progress',   href: '/ketua-tim/perencanaan/perjanjian-kinerja/awal/progress'  },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan' },
                            { title: 'Progress',   href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/progress'  },
                        ],
                    },
                ],
            },
            {
                title: 'Rencana Aksi',
                icon: ClipboardCheck,
                children: [
                    {
                        title: 'Penyusunan',
                        href : '/ketua-tim/perencanaan/rencana-aksi/penyusunan',
                    },
                    {
                        title: 'Progress',
                        href : '/ketua-tim/perencanaan/rencana-aksi/progress',
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
            {
                title: 'Notifikasi',
                href: '/ketua-tim/notifikasi',
                icon: BellRingIcon,
            }
        ],
    },
];

export default ketuaTimNav;
