import {
    LayoutDashboard,
    ClipboardPenLine,
    ClipboardCheck,
    ChartNoAxesColumn,
    HandCoins,
    FolderOpen,
    BellRingIcon,
    Activity,
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
            {
                title: 'Monitoring',
                href: '/ketua-tim/monitoring',
                icon: Activity,
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
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Penyusunan', href: '/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan' },
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
                        href: '/ketua-tim/perencanaan/rencana-aksi/penyusunan',
                    },
                ],
            },
        ],
    },
    {
        label: 'Pengukuran',
        items: [
            {
                title: 'Pengukuran Kinerja',
                href: '/ketua-tim/pengukuran',
                icon: ChartNoAxesColumn,
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
        label: 'Lainnya',
        items: [
            // {
            //     title: 'Dokumen',
            //     href: '/ketua-tim/dokumen',
            //     icon: FolderOpen,
            // },
            // {
            //     title: 'Notifikasi',
            //     href: '/ketua-tim/notifikasi',
            //     icon: BellRingIcon,
            // }
        ],
    },
];

export default ketuaTimNav;
