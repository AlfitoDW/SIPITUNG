import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
    if (status === 'active') {
        return (
            <Badge variant="default" className="bg-green-500 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
        </Badge>
    );
}
