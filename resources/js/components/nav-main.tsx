import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem, NavSubItem } from '@/types';

function hasActiveDescendant(item: NavItem | NavSubItem, currentUrl: string): boolean {
    if ('href' in item && item.href && item.href !== '#' && item.href === currentUrl) {
        return true;
    }
    if (item.children) {
        return item.children.some((child) => hasActiveDescendant(child, currentUrl));
    }
    return false;
}


function NavSubTree({ items }: { items: NavSubItem[] }) {
    return (
        <>
            {items.map((item) =>
                item.children ? (
                    <NestedCollapsible key={item.title} item={item} />
                ) : (
                    <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                            <Link href={item.href ?? '#'} prefetch>
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                ),
            )}
        </>
    );
}

function NestedCollapsible({ item }: { item: NavSubItem }) {
    const { currentUrl } = useCurrentUrl();
    const [open, setOpen] = useState(() => hasActiveDescendant(item, currentUrl));

    return (
        <SidebarMenuSubItem>
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger asChild>
                    <SidebarMenuSubButton className="w-full justify-between">
                        <span>{item.title}</span>
                        <ChevronRight
                            className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200"
                            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        />
                    </SidebarMenuSubButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        <NavSubTree items={item.children!} />
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuSubItem>
    );
}

function NavItems({ items }: { items: NavItem[] }) {
    const { isCurrentUrl, currentUrl } = useCurrentUrl();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        items.forEach((item) => {
            if (item.children && hasActiveDescendant(item, currentUrl)) {
                initial[item.title] = true;
            }
        });
        return initial;
    });

    const toggleItem = (title: string) => {
        setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <>
            {items.map((item) =>
                item.children ? (
                    <SidebarMenuItem key={item.title}>
                        <Collapsible
                            open={openItems[item.title] ?? false}
                            onOpenChange={() => toggleItem(item.title)}
                        >
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={{ children: item.title }}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    <ChevronRight
                                        className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200"
                                        style={{
                                            transform: openItems[item.title]
                                                ? 'rotate(90deg)'
                                                : 'rotate(0deg)',
                                        }}
                                    />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <NavSubTree items={item.children} />
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </Collapsible>
                    </SidebarMenuItem>
                ) : (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={item.href ? isCurrentUrl(item.href) : false}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href ?? '#'} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ),
            )}
        </>
    );
}

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.label} className="px-2 py-0">
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        <NavItems items={group.items} />
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
