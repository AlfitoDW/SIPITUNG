import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LucideProps } from 'lucide-react';

interface StatisticCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<LucideProps>;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

export function StatisticCard({ title, value, icon, change, changeType }: StatisticCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon
                    iconNode={icon}
                    className="h-4 w-4 text-muted-foreground"
                />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p className={`text-xs ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                        {change} from last month
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
