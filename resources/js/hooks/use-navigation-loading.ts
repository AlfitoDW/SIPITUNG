import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/** Returns true while Inertia is navigating between pages. */
export function useNavigationLoading() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const removeStart  = router.on('start',  () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    return isLoading;
}
