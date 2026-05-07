import { LayoutDashboard, FilePlus2, FileText, ClipboardList, BarChart3 } from 'lucide-react';
import type { NavGroup } from '@/types';

const pumkNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: '/pumk/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'Permohonan Dana',
        items: [
            {
                title: 'Permohonan Baru',
                href: '/pumk/permohonan-dana/buat',
                icon: FilePlus2,
            },
            {
                title: 'TOR dan RAB',
                href: '#',
                icon: FileText,
            },
            {
                title: 'Daftar Permohonan',
                href: '/pumk/permohonan-dana',
                icon: ClipboardList,
            },
            {
                title: 'Daftar Realisasi(Log)',
                href: '#',
                icon: BarChart3,
            },
        ],
    },
];

export default pumkNav;
