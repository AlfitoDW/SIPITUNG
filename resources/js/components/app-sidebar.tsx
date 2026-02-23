import { Link } from '@inertiajs/react';
import {
    UserCog, BellDot, ClipboardPenLine, FolderCog, ClipboardCheck,
    Scale, HandCoins, ChartColumnIncreasing, Database, DatabaseBackup,
    PlaneLanding,
    ChartNoAxesColumn,
    LayoutDashboard,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';
import AppLogo from './app-logo';
import { title } from 'process';

const navGroups: NavGroup[] = [
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
                            { title: 'Persiapan', href: '/perencanaan/perjanjian-kinerja/awal/persiapan' },
                            { title: 'Progress',   href: '/perencanaan/perjanjian-kinerja/awal/progress'   },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Persiapan', href: '/perencanaan/perjanjian-kinerja/revisi/persiapan' },
                            { title: 'Progress',   href: '/perencanaan/perjanjian-kinerja/revisi/progress'   },
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
                            { title: 'Persiapan', href: '/perencanaan/rencana-aksi/awal/persiapan' },
                            { title: 'Progress',   href: '/perencanaan/rencana-aksi/awal/progress'   },
                        ],
                    },
                    {
                        title: 'Revisi',
                        children: [
                            { title: 'Persiapan', href: '/perencanaan/rencana-aksi/revisi/persiapan' },
                            { title: 'Progress',   href: '/perencanaan/rencana-aksi/revisi/progress'   },
                        ],
                    },
                ],      
            }
        ],
    },
    {
        label: 'Pengukuran',
        items: [
            {
                title: 'Pengukuran Kinerja',
                icon: ChartNoAxesColumn,
                children: [
                    {title : 'Penyusunan', href: '#'},
                    {title : 'Progress', href: '#'},
                ]
            }
        ]
    },
    {
        label : 'Keuangan',
        items : [
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
                    }
                ],
            },
        ]
    },
    {
        label : 'Misc',
         items: [
            {
                title: 'Data Master',
                href: '/data-master',
                icon: Database,
            },
        ],
    }
    
    
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="flex items-center justify-center p-2">
                <Link href={dashboard()} prefetch>
                    <AppLogo isCollapsed={isCollapsed} />
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
