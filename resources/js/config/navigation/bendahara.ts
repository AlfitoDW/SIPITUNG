import {
    LayoutDashboard,
    Banknote,
    ClipboardCheck,
    ChartColumnIncreasing,
    BellRingIcon,
} from 'lucide-react';
import type { NavGroup } from '@/types';

const bendaharaNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: '/bendahara/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            {
                title: 'Pencairan Dana',
                href: '/bendahara/pencairan',
                icon: Banknote,
            },
            {
                title: 'Verifikasi LPJ',
                href: '/bendahara/verifikasi-lpj',
                icon: ClipboardCheck,
            },
            {
                title: 'Laporan Keuangan',
                href: '/bendahara/laporan',
                icon: ChartColumnIncreasing,
            },
        ],
    },
    {
        label: 'Misc',
        items: [
            {
                title: 'Notifikasi',
                href: '/bendahara/notifikasi',
                icon: BellRingIcon,
            }
        ]
    }
];

export default bendaharaNav;
