import {
    LayoutDashboard,
    ClipboardPenLine,
    ClipboardCheck,
    ChartNoAxesColumn,
    HandCoins,
    Database,
    BellRingIcon,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavGroup } from '@/types';

const superAdminNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
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
                            { title: 'Penyusunan', href: '/super-admin/perencanaan/perjanjian-kinerja/awal/penyusunan' },
                            { title: 'Progress',   href: '/super-admin/perencanaan/perjanjian-kinerja/awal/progress'   },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Penyusunan', href: '/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan' },
                            { title: 'Progress',   href: '/super-admin/perencanaan/perjanjian-kinerja/revisi/progress'   },
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
                        href: '/super-admin/perencanaan/rencana-aksi/penyusunan',
                    },
                    {
                        title: 'Progress',
                        href: '/super-admin/perencanaan/rencana-aksi/progress',
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
                icon: ChartNoAxesColumn,
                children: [
                    { title: 'Penyusunan', href: '#' },
                    { title: 'Progress',   href: '#' },
                ],
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            {
                title: 'Permohonan & Pencairan',
                icon: HandCoins,
                children: [
                    {
                        title: 'Permohonan Dana',
                        href: '/keuangan/permohonan-dana',
                    },
                    {
                        title: 'Pencairan Dana',
                        href: '/keuangan/pencairan-dana',
                    },
                ],
            },
        ],
    },
    {
        label: 'Misc',
        items: [
            {
                title: 'Data Master',
                href: '/super-admin/data-master',
                icon: Database,
            },
            {
                title: 'Notifikasi',
                href: '/super-admin/notifikasi',
                icon: BellRingIcon,
            }
        ],
    },
];

export default superAdminNav;
