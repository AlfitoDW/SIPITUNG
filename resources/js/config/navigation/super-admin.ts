import {
    LayoutDashboard,
    ClipboardPenLine,
    ClipboardCheck,
    ChartNoAxesColumn,
    HandCoins,
    Database,
    BellRingIcon,
    Users,
    UserCog,
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
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Penyusunan', href: '/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan' },
                        ],
                    },
                    { title: 'Matriks PK', href: '/super-admin/perencanaan/perjanjian-kinerja/matriks' },
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
                    { title: 'Kelola Periode',    href: '/super-admin/pengukuran' },
                    { title: 'Realisasi Kinerja', href: '/super-admin/pengukuran/realisasi' },
                ],
            },
        ],
    },
    {
        label: 'Keuangan',
        items: [
            {
                title: 'Permohonan Dana',
                icon: HandCoins,
                children: [
                    { title: 'Monitoring', href: '/super-admin/keuangan/permohonan-dana' },
                    { title: 'Master Anggaran DJA', href: '/super-admin/keuangan/master-anggaran' },
                ],
            },
        ],
    },
    {
        label: 'Master Data',
        items: [
            {
                title: 'Tim Kerja',
                href: '/super-admin/master/tim-kerja',
                icon: Users,
            },
            {
                title: 'Referensi Nama',
                href: '/super-admin/ref-nama',
                icon: UserCog,
            },
            {
                title: 'Data Master',
                href: '/super-admin/data-master',
                icon: Database,
            },
        ],
    },
    {
        label: 'Misc',
        items: [
            {
                title: 'Notifikasi',
                href: '/super-admin/notifikasi',
                icon: BellRingIcon,
            },
        ],
    },
];

export default superAdminNav;
