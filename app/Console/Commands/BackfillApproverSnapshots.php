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
            ['idField' => 'created_by',         'nameField' => 'created_by_name',         'nipField' => 'created_by_nip',         'relation' => 'createdBy'],
            ['idField' => 'katim_approved_by',  'nameField' => 'katim_approved_by_name',  'nipField' => 'katim_approved_by_nip',  'relation' => 'katimApprovedBy'],
            ['idField' => 'kabag_approved_by', 'nameField' => 'kabag_approved_by_name', 'nipField' => 'kabag_approved_by_nip', 'relation' => 'kabagApprovedBy'],
            ['idField' => 'ppk_approved_by',   'nameField' => 'ppk_approved_by_name',   'nipField' => 'ppk_approved_by_nip',   'relation' => 'ppkApprovedBy'],
            ['idField' => 'pic_approved_by',   'nameField' => 'pic_approved_by_name',   'nipField' => 'pic_approved_by_nip',   'relation' => 'picApprovedBy'],
            ['idField' => 'dicairkan_by',      'nameField' => 'dicairkan_by_name',      'nipField' => 'dicairkan_by_nip',      'relation' => 'dicairkanBy'],
            // Sprint 1: Kapokja + PIC Keuangan
            ['idField' => 'kapokja_id',        'nameField' => 'kapokja_name',           'nipField' => 'kapokja_nip',           'relation' => 'kapokja'],
            ['idField' => 'pic_keuangan_id',   'nameField' => 'pic_keuangan_name',      'nipField' => 'pic_keuangan_nip',      'relation' => 'picKeuangan'],
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
                                $step['nipField'] => $user->nip,
                            ]);
                            $count++;
                        }
                    }
                });

            $this->info("Backfilled {$count} records for {$step['nameField']}");
            $total += $count;
        }

        // Sprint 2: Tim Kerja snapshot (custom — needs timKerja relation, not user)
        $timCount = 0;
        PermohonanDana::whereNotNull('tim_kerja_id')
            ->whereNull('tim_kerja_nama')
            ->with('timKerja.ketua')
            ->chunk(100, function ($records) use (&$timCount) {
                foreach ($records as $pd) {
                    $tim = $pd->timKerja;
                    if ($tim) {
                        $pd->update([
                            'tim_kerja_nama' => $tim->nama,
                            'tim_kerja_kode' => $tim->kode,
                            'tim_kerja_ketua_name' => $tim->ketua?->nama_lengkap,
                            'tim_kerja_ketua_nip' => $tim->ketua?->nip,
                        ]);
                        $timCount++;
                    }
                }
            });
        $this->info("Backfilled {$timCount} records for tim_kerja snapshots");
        $total += $timCount;

        // Sprint 3: DJA Hierarchy snapshot
        $djaCount = 0;
        PermohonanDana::whereNull('dja_program_nama')
            ->with(['djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan'])
            ->chunk(100, function ($records) use (&$djaCount) {
                foreach ($records as $pd) {
                    $pd->update([
                        'dja_program_nama' => $pd->djaProgram?->nama,
                        'dja_sasaran_nama' => $pd->djaSasaran?->nama,
                        'dja_kro_nama' => $pd->djaKro?->nama,
                        'dja_kro_kode' => $pd->djaKro?->kode,
                        'dja_ro_nama' => $pd->djaRo?->nama,
                        'dja_komponen_nama' => $pd->djaKomponen?->nama,
                        'dja_kegiatan_nama' => $pd->djaKegiatan?->nama,
                        'dja_kegiatan_kode' => $pd->djaKegiatan?->kode,
                    ]);
                    $djaCount++;
                }
            });
        $this->info("Backfilled {$djaCount} records for DJA hierarchy snapshots");
        $total += $djaCount;

        // Sprint 4: Bukti Bayar + Pembukaan Kunci snapshot
        $bbCount = 0;
        PermohonanDana::whereNotNull('bukti_bayar_uploaded_by')
            ->whereNull('bukti_bayar_uploaded_by_name')
            ->with('buktiBayarUploadedBy')
            ->chunk(100, function ($records) use (&$bbCount) {
                foreach ($records as $pd) {
                    $user = $pd->buktiBayarUploadedBy;
                    if ($user) {
                        $pd->update(['bukti_bayar_uploaded_by_name' => $user->nama_lengkap]);
                        $bbCount++;
                    }
                }
            });
        $this->info("Backfilled {$bbCount} records for bukti_bayar snapshots");
        $total += $bbCount;

        $bkCount = 0;
        PermohonanDana::whereNotNull('dibuka_kunci_by')
            ->whereNull('dibuka_kunci_by_name')
            ->with('dibukaKunciOleh')
            ->chunk(100, function ($records) use (&$bkCount) {
                foreach ($records as $pd) {
                    $user = $pd->dibukaKunciOleh;
                    if ($user) {
                        $pd->update(['dibuka_kunci_by_name' => $user->nama_lengkap]);
                        $bkCount++;
                    }
                }
            });
        $this->info("Backfilled {$bkCount} records for dibuka_kunci snapshots");
        $total += $bkCount;

        $this->info("Done. Total backfilled: {$total}");

        return self::SUCCESS;
    }
}
