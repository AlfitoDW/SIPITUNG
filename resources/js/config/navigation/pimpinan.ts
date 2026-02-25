import {
    LayoutDashboard,
    ShieldCheck,
    Scale,
    ChartColumnIncreasing,
} from 'lucide-react';
import type { NavGroup } from '@/types';

const pimpinanNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: '/pimpinan/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'Persetujuan',
        items: [
            {
                title: 'Approval',
                href: '/pimpinan/approval',
                icon: ShieldCheck,
            },
            {
                title: 'Validasi',
                href: '/pimpinan/validasi',
                icon: Scale,
            },
        ],
    },
    {
        label: 'Laporan',
        items: [
            {
                title: 'Laporan',
                href: '/pimpinan/laporan',
                icon: ChartColumnIncreasing,
            },
        ],
    },
];

export default pimpinanNav;
