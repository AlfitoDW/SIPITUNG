import { FileText, LayoutDashboard, ClipboardCheck } from 'lucide-react';
import type { NavGroup } from '@/types';

const picKeuanganNav: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: '/pic-keuangan/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            {
                title: 'Verifikasi Permohonan',
                href: '/pic-keuangan/permohonan-dana',
                icon: ClipboardCheck,
            },
            {
                title: 'Verifikasi LPJ',
                href: '/pic-keuangan/verifikasi-lpj',
                icon: FileText,
            },
        ],
    },
];

export default picKeuanganNav;
