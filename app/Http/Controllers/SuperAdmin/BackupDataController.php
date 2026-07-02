<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class BackupDataController extends Controller
{
    public function index(): Response
    {
        $backupDir = storage_path('app/private/backups');

        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $backups = collect(Storage::disk('local')->files('backups'))
            ->filter(fn ($file) => str_ends_with($file, '.zip'))
            ->map(fn ($file) => [
                'filename' => basename($file),
                'size' => $this->formatBytes(Storage::disk('local')->size($file)),
                'size_raw' => Storage::disk('local')->size($file),
                'created_at' => Carbon::createFromTimestamp(
                    Storage::disk('local')->lastModified($file)
                )->format('Y-m-d H:i:s'),
            ])
            ->sortByDesc('created_at')
            ->values();

        $dbName = config('database.connections.mysql.database');
        $tables = DB::select('SHOW TABLES');
        $key = 'Tables_in_'.$dbName;

        $totalSize = 0;
        foreach ($tables as $table) {
            $tableName = $table->$key;
            $status = DB::select("SHOW TABLE STATUS LIKE '$tableName'")[0];
            $totalSize += $status->Data_length + $status->Index_length;
        }

        return Inertia::render('SuperAdmin/BackupData', [
            'backups' => $backups,
            'dbInfo' => [
                'tables' => count($tables),
                'connection' => config('database.default'),
                'database' => $dbName,
                'total_size' => $this->formatBytes($totalSize),
                'total_size_raw' => $totalSize,
            ],
        ]);
    }

    public function store(): RedirectResponse
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $sqlFilename = "sipitung_backup_{$timestamp}.sql";
        $zipFilename = "backup_{$timestamp}.zip";

        $backupDir = storage_path('app/private/backups');
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $sqlPath = $backupDir.'/'.$sqlFilename;
        $zipPath = $backupDir.'/'.$zipFilename;

        try {
            $this->generateSqlDump($sqlPath);
            $this->createZipArchive($sqlPath, $zipPath, $sqlFilename);

            // Remove SQL file after zipping
            if (file_exists($sqlPath)) {
                unlink($sqlPath);
            }

            return back()->with('success', 'Backup berhasil dibuat: '.$zipFilename);
        } catch (\Exception $e) {
            // Cleanup on failure
            if (file_exists($sqlPath)) {
                unlink($sqlPath);
            }
            if (file_exists($zipPath)) {
                unlink($zipPath);
            }

            return back()->with('error', 'Gagal membuat backup: '.$e->getMessage());
        }
    }

    private function generateSqlDump(string $path): void
    {
        $handle = fopen($path, 'w');

        if (! $handle) {
            throw new \Exception('Gagal membuat file backup');
        }

        // Header
        fwrite($handle, "-- SIPITUNG Database Backup\n");
        fwrite($handle, '-- Generated: '.now()->format('Y-m-d H:i:s')."\n");
        fwrite($handle, '-- Database: '.config('database.connections.mysql.database')."\n");
        fwrite($handle, "-- --------------------------------------------------------\n\n");

        // Set foreign key checks
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n\n");

        $dbName = config('database.connections.mysql.database');
        $tables = DB::select('SHOW TABLES');
        $key = 'Tables_in_'.$dbName;

        foreach ($tables as $table) {
            $tableName = $table->$key;

            // Table header
            fwrite($handle, "-- --------------------------------------------------------\n");
            fwrite($handle, "-- Table: {$tableName}\n");
            fwrite($handle, "-- --------------------------------------------------------\n\n");

            // DROP TABLE
            fwrite($handle, "DROP TABLE IF EXISTS `{$tableName}`;\n\n");

            // CREATE TABLE
            $create = DB::select("SHOW CREATE TABLE `{$tableName}`")[0];
            $createKey = 'Create Table';
            fwrite($handle, $create->$createKey.";\n\n");

            // INSERT DATA
            $this->writeTableData($handle, $tableName);

            fwrite($handle, "\n");
        }

        // Re-enable foreign key checks
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");

        fclose($handle);
    }

    private function writeTableData($handle, string $tableName): void
    {
        $count = DB::table($tableName)->count();

        if ($count === 0) {
            fwrite($handle, "-- Table {$tableName} is empty\n\n");

            return;
        }

        fwrite($handle, "-- Dumping data for table {$tableName}\n");

        $firstRow = true;
        $columnStr = null;

        DB::table($tableName)->orderByRaw('1')->chunk(1000, function ($rows) use ($handle, $tableName, &$firstRow, &$columnStr) {
            if ($rows->isEmpty()) {
                return;
            }

            if ($firstRow) {
                $columns = array_keys((array) $rows->first());
                $columnStr = implode('`, `', $columns);
                $firstRow = false;
            }

            fwrite($handle, "INSERT INTO `{$tableName}` (`{$columnStr}`) VALUES\n");

            $values = [];
            foreach ($rows as $row) {
                $rowArray = (array) $row;
                $escaped = array_map(function ($val) {
                    if ($val === null) {
                        return 'NULL';
                    }
                    if (is_numeric($val)) {
                        return $val;
                    }

                    return "'".addslashes($val)."'";
                }, $rowArray);
                $values[] = '('.implode(', ', $escaped).')';
            }

            fwrite($handle, implode(",\n", $values).";\n\n");
        });
    }

    private function createZipArchive(string $sqlPath, string $zipPath, string $sqlFilename): void
    {
        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Gagal membuat file ZIP');
        }

        $zip->addFile($sqlPath, $sqlFilename);
        $zip->close();
    }

    public function download(string $filename): StreamedResponse
    {
        $path = 'backups/'.$filename;

        abort_unless(Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->download($path, $filename, [
            'Content-Type' => 'application/zip',
        ]);
    }

    public function destroy(string $filename): RedirectResponse
    {
        $path = 'backups/'.$filename;

        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
        }

        return back()->with('success', 'Backup berhasil dihapus');
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= 1024 ** $pow;

        return round($bytes, $precision).' '.$units[$pow];
    }
}
