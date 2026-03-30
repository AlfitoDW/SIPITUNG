import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
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
import type { NavGroup, NavItem, SharedData } from '@/types';
import type { UserRole } from '@/types/auth';
import AppLogo from './app-logo';
import { ShieldCheck } from 'lucide-react';

import superAdminNav from '@/config/navigation/super-admin';
import ketuaTimNav   from '@/config/navigation/ketua-tim';
import pimpinanNav   from '@/config/navigation/pimpinan';
import bendaharaNav  from '@/config/navigation/bendahara';

const navByRole: Record<UserRole, NavGroup[]> = {
    super_admin:     superAdminNav,
    ketua_tim_kerja: ketuaTimNav,
    pimpinan:        pimpinanNav,
    bendahara:       bendaharaNav,
};

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();

    const isCollapsed  = state === 'collapsed';

    // Inject approval nav item for ketua koordinator
    let navGroups = navByRole[auth.user.role] ?? [];
    if (auth.user.role === 'ketua_tim_kerja' && auth.user.is_koordinator) {
        navGroups = navGroups.map(group =>
            group.label === 'Keuangan'
                ? { ...group, items: [...group.items, { title: 'Approval Permohonan', href: '/ketua-tim/permohonan-dana/approval', icon: ShieldCheck }] }
                : group
        );
    }

    const dashboardHref = navGroups[0]?.items[0]?.href ?? '/dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="flex items-center justify-center p-2">
                <Link href={dashboardHref} prefetch>
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
