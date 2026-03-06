import {
    LayoutDashboard,
    ClipboardList,
    ShieldCheck,
    Scale,
    ChartColumnIncreasing,
    BellRingIcon,
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
        label: 'Perencanaan',
        items: [
            {
                title: 'Perjanjian Kinerja Awal',
                href: '/pimpinan/perencanaan/perjanjian-kinerja/awal',
                icon: ClipboardList,
            },
            {
                title: 'Perjanjian Kinerja Revisi',
                href: '/pimpinan/perencanaan/perjanjian-kinerja/revisi',
                icon: ClipboardList,
            },
            {
                title: 'Rencana Aksi',
                href: '/pimpinan/perencanaan/rencana-aksi',
                icon: ClipboardList,
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
    {
        label: 'Misc',
        items: [
            {
                title: 'Notifikasi',
                href: '/pimpinan/notifikasi',
                icon: BellRingIcon,
            }
        ]
    }
];

export default pimpinanNav;
