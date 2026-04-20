import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

/**
 * Returns true while Inertia is navigating between pages.
 * Delayed by `threshold` ms to avoid a blink on fast responses.
 */
export function useNavigationLoading(threshold = 150) {
    const [isLoading, setIsLoading] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const removeStart = router.on('start', () => {
            timer.current = setTimeout(() => setIsLoading(true), threshold);
        });
        const removeFinish = router.on('finish', () => {
            if (timer.current) { clearTimeout(timer.current); timer.current = null; }
            setIsLoading(false);
        });
        return () => {
            removeStart();
            removeFinish();
            if (timer.current) clearTimeout(timer.current);
        };
    }, [threshold]);

    return isLoading;
}
