import { Toaster } from 'sonner';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { cn } from '@/lib/utils';
import type { AppLayoutProps } from '@/types';

function FlashToast() {
    useFlashToast();
    return null;
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const isLoading = useNavigationLoading();

    return (
        <AppShell variant="sidebar">
            <FlashToast />
            <Toaster position="top-right" richColors closeButton />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className={cn('transition-opacity duration-200', isLoading && 'pointer-events-none opacity-50')}>
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
