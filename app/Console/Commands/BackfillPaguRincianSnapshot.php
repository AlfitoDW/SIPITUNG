<?php

namespace App\Console\Commands;

use App\Models\PermohonanDanaItem;
use Illuminate\Console\Command;

class BackfillPaguRincianSnapshot extends Command
{
    protected $signature = 'app:backfill-pagu-rincian-snapshot';

    protected $description = 'Backfill pagu_rincian_snapshot untuk data permohonan_dana_item existing';

    public function handle(): void
    {
        $this->info('Memulai backfill pagu_rincian_snapshot...');

        $updated = PermohonanDanaItem::whereNull('pagu_rincian_snapshot')
            ->whereNotNull('dja_rincian_biaya_id')
            ->with('djaRincianBiaya')
            ->get()
            ->filter(fn ($item) => $item->djaRincianBiaya !== null)
            ->each(function ($item) {
                $item->updateQuietly([
                    'pagu_rincian_snapshot' => $item->djaRincianBiaya->pagu_total,
                ]);
            })
            ->count();

        $this->info("Selesai. {$updated} item berhasil di-backfill.");
    }
}
