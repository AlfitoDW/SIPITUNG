import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Warn the user before leaving the page when `isDirty` is true.
 * Handles both browser close/refresh and Inertia SPA navigation.
 */
export function useUnsavedChanges(isDirty: boolean) {
    useEffect(() => {
        if (!isDirty) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        const removeInertiaHandler = router.on('before', (event) => {
            if (!window.confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?')) {
                event.preventDefault();
            }
        });

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            removeInertiaHandler();
        };
    }, [isDirty]);
}
