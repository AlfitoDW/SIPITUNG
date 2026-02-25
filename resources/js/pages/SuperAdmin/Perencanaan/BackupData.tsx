import AppLayout from "@/layouts/app-layout";
import { App } from "@inertiajs/react";

export default function BackupData() {
    return (
        <AppLayout>
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-semibold mb-4">Backup Data</h1>
            <p className="mb-4">Halaman ini digunakan untuk melakukan backup data sistem.</p>
        </div>
        </AppLayout>
    );
}