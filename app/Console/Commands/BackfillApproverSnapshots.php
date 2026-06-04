<?php

namespace App\Console\Commands;

use App\Models\PermohonanDana;
use Illuminate\Console\Command;

/**
 * One-time backfill: isi kolom snapshot nama & NIP approver dari relasi users.
 * Jalankan setelah migration add_approver_snapshots_and_restrict_fks.
 */
class BackfillApproverSnapshots extends Command
{
    protected $signature = 'backfill:approver-snapshots';
    protected $description = 'Backfill approver name & NIP snapshots from users table';

    public function handle(): int
    {
        $total = 0;
        $steps = [
            ['idField' => 'katim_approved_by', 'nameField' => 'katim_approved_by_name', 'nipField' => 'katim_approved_by_nip', 'relation' => 'katimApprovedBy'],
            ['idField' => 'kabag_approved_by', 'nameField' => 'kabag_approved_by_name', 'nipField' => 'kabag_approved_by_nip', 'relation' => 'kabagApprovedBy'],
            ['idField' => 'ppk_approved_by',   'nameField' => 'ppk_approved_by_name',   'nipField' => 'ppk_approved_by_nip',   'relation' => 'ppkApprovedBy'],
            ['idField' => 'pic_approved_by',   'nameField' => 'pic_approved_by_name',   'nipField' => 'pic_approved_by_nip',   'relation' => 'picApprovedBy'],
            ['idField' => 'dicairkan_by',      'nameField' => 'dicairkan_by_name',      'nipField' => 'dicairkan_by_nip',      'relation' => 'dicairkanBy'],
        ];

        foreach ($steps as $step) {
            $count = 0;
            PermohonanDana::whereNotNull($step['idField'])
                ->whereNull($step['nameField'])
                ->with($step['relation'])
                ->chunk(100, function ($records) use ($step, &$count) {
                    foreach ($records as $pd) {
                        $user = $pd->{$step['relation']};
                        if ($user) {
                            $pd->update([
                                $step['nameField'] => $user->nama_lengkap,
                                $step['nipField']  => $user->nip,
                            ]);
                            $count++;
                        }
                    }
                });

            $this->info("Backfilled {$count} records for {$step['nameField']}");
            $total += $count;
        }

        $this->info("Done. Total backfilled: {$total}");
        return self::SUCCESS;
    }
}
