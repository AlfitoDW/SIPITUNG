import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: string;
};

export type NavSubItem = {
    title: string;
    href?: string;
    children?: NavSubItem[];
    icon?: LucideIcon | null;
};

export type NavItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavSubItem[];
};

export type NavGroup = {
    label: string;
    items: NavItem[];
};
