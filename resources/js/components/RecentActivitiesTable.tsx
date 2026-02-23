import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const activities = [
    {
        user: 'John Doe',
        action: 'Uploaded a new document',
        timestamp: '2024-07-29 10:30 AM',
    },
    {
        user: 'Jane Smith',
        action: 'Edited a document',
        timestamp: '2024-07-29 10:35 AM',
    },
    {
        user: 'Peter Jones',
        action: 'Deleted a category',
        timestamp: '2024-07-29 10:40 AM',
    },
    {
        user: 'Admin',
        action: 'Created a new user',
        timestamp: '2024-07-29 10:45 AM',
    },
];

export function RecentActivitiesTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Dokumen Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.map((activity) => (
                            <TableRow key={activity.timestamp}>
                                <TableCell>{activity.user}</TableCell>
                                <TableCell>{activity.action}</TableCell>
                                <TableCell>{activity.timestamp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
