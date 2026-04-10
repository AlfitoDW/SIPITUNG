<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringController extends Controller
{
    public function index(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();

        // ── Semua Tim Kerja ───────────────────────────────────────────────────────
        $allTim = TimKerja::orderBy('kode')->get()->map(fn($t) => [
            'id'           => $t->id,
            'kode'         => $t->kode,
            'nama'         => $t->nama,
            'nama_singkat' => $t->nama_singkat,
        ]);

        // ── Rencana Aksi: ringkasan per tim (status + indikator count aggregate) ──
        $rasRaw = $tahun ? RencanaAksi::with(['timKerja:id,nama,kode,nama_singkat', 'peerTimKerja:id,nama,kode,nama_singkat', 'indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->get() : collect();

        // Priority: kabag_approved > submitted > rejected > draft
        $statusPriority = ['kabag_approved' => 3, 'submitted' => 2, 'draft' => 1, 'rejected' => 0];

        // ── Pra-bangun lookup untuk efisiensi dan menghindari closure-capture issue ──

        // rasByOwnerWithInds[tim_id] = array of RA yang PUNYA indikator, terurut status terbaik
        $rasByOwnerWithInds = [];
        foreach ($rasRaw as $_r) {
            if ($_r->indikators->isNotEmpty()) {
                $rasByOwnerWithInds[$_r->tim_kerja_id][] = $_r;
            }
        }
        foreach ($rasByOwnerWithInds as &$_grp) {
            usort($_grp, fn($a, $b) => ($statusPriority[$b->status] ?? 0) <=> ($statusPriority[$a->status] ?? 0));
        }
        unset($_grp, $_r);

        // rasByPair["tim_id|peer_id"] = RA dengan status terbaik untuk pasangan (tim, peer)
        $rasByPair = [];
        foreach ($rasRaw as $_r) {
            $_pk = $_r->tim_kerja_id . '|' . ($_r->peer_tim_kerja_id ?? 'null');
            if (
                !isset($rasByPair[$_pk]) ||
                ($statusPriority[$_r->status] ?? 0) > ($statusPriority[$rasByPair[$_pk]->status] ?? 0)
            ) {
                $rasByPair[$_pk] = $_r;
            }
        }
        unset($_r, $_pk);

        // ── Tahap 1: Kumpulkan semua entry per (tim, peer), pakai ras_by_peer untuk dedup ──
        // Jika satu pasangan (tim, peer) punya > 1 RA (misalnya ditolak lalu submit ulang
        // membentuk record baru), kita hanya simpan RA dengan status TERBAIK.
        $raByTim = [];
        foreach ($rasRaw as $ra) {
            $tid     = $ra->tim_kerja_id;
            $peerKey = $ra->peer_tim_kerja_id !== null ? (string) $ra->peer_tim_kerja_id : 'solo';

            if (!isset($raByTim[$tid])) {
                $raByTim[$tid] = [
                    'tim_kerja_id'   => $tid,
                    'tim_kerja_kode' => $ra->timKerja?->kode,
                    'tim_kerja_nama' => $ra->timKerja?->nama_singkat ?? $ra->timKerja?->nama,
                    'peers'          => [],
                    'ras_by_peer'    => [],
                ];
            }

            // ── Resolve indikators via 3-step lookup ──────────────────────────────
            $indikators = $ra->indikators;

            if ($indikators->isEmpty() && $ra->peer_tim_kerja_id !== null) {
                $peerId    = $ra->peer_tim_kerja_id;
                $ownId     = $ra->tim_kerja_id;
                $foundRa   = null;

                // Langkah 1: Peer's RA spesifik untuk relasi dua arah ini
                foreach ($rasByOwnerWithInds[$peerId] ?? [] as $_peerRa) {
                    if ($_peerRa->peer_tim_kerja_id == $ownId) {
                        $foundRa = $_peerRa;
                        break;
                    }
                }

                // Langkah 2: Sembarang RA dari peer yang punya indikator
                // (misal: KK co-PIC → borrow dari Penjamu's mandiri RA)
                if (!$foundRa && !empty($rasByOwnerWithInds[$peerId])) {
                    $foundRa = $rasByOwnerWithInds[$peerId][0]; // sudah terurut status terbaik
                }

                // Langkah 3: Milik tim sendiri RA lain
                // (misal: Penjamu's peer=KK → borrow dari Penjamu's mandiri RA)
                if (!$foundRa) {
                    foreach ($rasByOwnerWithInds[$ownId] ?? [] as $_ownRa) {
                        if ($_ownRa->id !== $ra->id) {
                            $foundRa = $_ownRa;
                            break;
                        }
                    }
                }

                $indikators = $foundRa ? $foundRa->indikators : collect();
            }

            // ── Effective status: max(status sendiri, status RA peer yg berkorespondensi) ──
            $effectiveStatus = $ra->status;
            if ($ra->peer_tim_kerja_id !== null) {
                $pairK    = $ra->peer_tim_kerja_id . '|' . $ra->tim_kerja_id;
                $peerCorrRa = $rasByPair[$pairK] ?? null;
                if ($peerCorrRa && ($statusPriority[$peerCorrRa->status] ?? 0) > ($statusPriority[$effectiveStatus] ?? 0)) {
                    $effectiveStatus = $peerCorrRa->status;
                }
            }

            // ── Build entry ────────────────────────────────────────────────────────
            $entry = [
                'ra_id'      => $ra->id,
                'peer_kode'  => $ra->peerTimKerja?->kode,
                'peer_nama'  => $ra->peerTimKerja?->nama_singkat ?? $ra->peerTimKerja?->nama ?? 'Mandiri',
                'status'     => $effectiveStatus,
                'is_co_pic'  => false,
                'indikators' => $indikators->map(fn($ind) => [
                    'id'         => $ind->id,
                    'kode'       => $ind->kode,
                    'nama'       => $ind->nama,
                    'satuan'     => $ind->satuan,
                    'target'     => $ind->target,
                    'target_tw1' => $ind->target_tw1,
                    'target_tw2' => $ind->target_tw2,
                    'target_tw3' => $ind->target_tw3,
                    'target_tw4' => $ind->target_tw4,
                ])->values()->toArray(),
            ];

            // ── Deduplication: per peer simpan effectiveStatus TERBAIK ────────────
            $existing = $raByTim[$tid]['ras_by_peer'][$peerKey] ?? null;
            if (
                $existing === null ||
                ($statusPriority[$effectiveStatus] ?? 0) > ($statusPriority[$existing['status']] ?? 0)
            ) {
                $raByTim[$tid]['ras_by_peer'][$peerKey] = $entry;
            }

            // Kumpulkan daftar peer untuk kolom Kolaborator
            if ($ra->peerTimKerja) {
                $peerCode = $ra->peerTimKerja->kode ?? $ra->peerTimKerja->nama_singkat;
                if (!in_array($peerCode, $raByTim[$tid]['peers'])) {
                    $raByTim[$tid]['peers'][] = $peerCode;
                }
            }
        }

        // ── Tahap 2: Finalisasi — hitung aggregate SETELAH dedup ─────────────────
        foreach ($raByTim as &$timData) {
            $ras         = array_values($timData['ras_by_peer']);
            $indCount    = 0;
            $filledCount = 0;
            $bestStatus  = null;

            foreach ($ras as $raEntry) {
                $indCount += count($raEntry['indikators']);
                foreach ($raEntry['indikators'] as $i) {
                    if ($i['target_tw1'] || $i['target_tw2'] || $i['target_tw3'] || $i['target_tw4']) {
                        $filledCount++;
                    }
                }
                $new = $raEntry['status'];
                if ($bestStatus === null || ($statusPriority[$new] ?? 0) > ($statusPriority[$bestStatus] ?? 0)) {
                    $bestStatus = $new;
                }
            }

            $timData['ras']          = $ras;
            $timData['best_status']  = $bestStatus;
            $timData['ind_count']    = $indCount;
            $timData['filled_count'] = $filledCount;
            unset($timData['ras_by_peer']);
        }
        unset($timData);

        $rasAll = array_values($raByTim);


        // ── Pengukuran Kinerja semua tim ─────────────────────────────────────────
        $periodes = $tahun ? PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(triwulan,'TW1','TW2','TW3','TW4')")
            ->get() : collect();

        $laporanPerPeriode = [];
        // Lookup tim by id — dipakai untuk resolve nama tim saat laporan peer digunakan.
        $allTimById = $allTim->keyBy('id');
        foreach ($periodes as $periode) {
            // Status laporan per tim: ambil laporan terbaik per tim_kerja_id.
            // Explicit dedup dengan PHP loop agar tidak ada ambiguitas Collection::unique().
            $laporansRaw = LaporanPengukuran::with(['timKerja:id,nama,kode,nama_singkat'])
                ->where('periode_pengukuran_id', $periode->id)
                ->get();

            $lapSpx = ['kabag_approved' => 3, 'submitted' => 2, 'draft' => 1, 'rejected' => 0];

            // bestLaporanByTim: [tim_id => ['target_id' => int, 'laporan' => model]]
            // Disimpan dalam bentuk ini agar nama tim yang ditampilkan tetap benar
            // (misalnya laporan KK dipakai untuk status Penjamu -> nama harus Penjamu).
            $bestLaporanByTim = [];

            // Helper: update bestLaporanByTim[$targetTid] jika laporan lebih baik.
            $maybeUpdate = function (int $targetTid, $_l) use (&$bestLaporanByTim, $lapSpx) {
                if (
                    !array_key_exists($targetTid, $bestLaporanByTim) ||
                    ($lapSpx[$_l->status] ?? -1) > ($lapSpx[$bestLaporanByTim[$targetTid]['laporan']->status] ?? -1)
                ) {
                    $bestLaporanByTim[$targetTid] = ['target_id' => $targetTid, 'laporan' => $_l];
                }
            };

            foreach ($laporansRaw as $_l) {
                // Update status untuk tim yang submit (owner).
                $maybeUpdate($_l->tim_kerja_id, $_l);

                // Jika ini laporan kolaborasi, status-nya juga berlaku untuk tim peer.
                // Contoh: KK submit & kabag_approved -> Penjamu juga tampil "Disetujui".
                if ($_l->peer_tim_kerja_id !== null) {
                    $maybeUpdate($_l->peer_tim_kerja_id, $_l);
                }
            }

            $laporans = collect(array_values($bestLaporanByTim))->map(function ($entry) use ($allTimById) {
                $l      = $entry['laporan'];
                $timId  = $entry['target_id'];
                $timArr = $allTimById->get($timId); // array ['id','kode','nama','nama_singkat']
                return [
                    'tim_kerja_id'   => $timId,
                    'tim_kerja_kode' => $timArr['kode']          ?? $l->timKerja?->kode,
                    'tim_kerja_nama' => $timArr['nama_singkat']  ?? $timArr['nama'] ?? $l->timKerja?->nama_singkat ?? $l->timKerja?->nama,
                    'status'         => $l->status,
                    'submitted_at'   => $l->submitted_at?->format('d M Y'),
                    'approved_at'    => $l->approved_at?->format('d M Y'),
                ];
            });








            // Realisasi full table: per IKU, semua tim yang jadi PIC
            $realisasis = RealisasiKinerja::with([
                'indikatorKinerja.sasaran',
                'indikatorKinerja.picTimKerjas:id,kode,nama_singkat',
                'inputByTimKerja:id,kode,nama_singkat',
            ])->where('periode_pengukuran_id', $periode->id)->get();

            // Group by sasaran
            $sasaranMap = [];
            foreach ($realisasis as $r) {
                $iku    = $r->indikatorKinerja;
                $sasaran = $iku?->sasaran;
                if (!$iku || !$sasaran) continue;

                $sKey = $sasaran->kode;
                if (!isset($sasaranMap[$sKey])) {
                    $sasaranMap[$sKey] = [
                        'sasaran_kode' => $sasaran->kode,
                        'sasaran_nama' => $sasaran->nama,
                        'indikators'   => [],
                    ];
                }

                $sasaranMap[$sKey]['indikators'][] = [
                    'iku_kode'        => $iku->kode,
                    'iku_nama'        => $iku->nama,
                    'iku_satuan'      => $iku->satuan,
                    'iku_target'      => $iku->{'target_' . strtolower($periode->triwulan)},
                    'realisasi'       => $r->realisasi,
                    'progress'        => $r->progress_kegiatan,
                    'kendala'         => $r->kendala,
                    'input_by_kode'   => $r->inputByTimKerja?->kode,
                    'input_by_nama'   => $r->inputByTimKerja?->nama_singkat,
                    'pics'            => $iku->picTimKerjas->map(fn($t) => $t->kode)->values()->toArray(),
                ];
            }
            ksort($sasaranMap);

            // IKU realisasi progress
            $totalIku  = RealisasiKinerja::where('periode_pengukuran_id', $periode->id)->count();
            $filledIku = RealisasiKinerja::where('periode_pengukuran_id', $periode->id)->whereNotNull('realisasi')->count();

            $laporanPerPeriode[] = [
                'periode_id'   => $periode->id,
                'triwulan'     => $periode->triwulan,
                'laporans'     => $laporans,
                'sasarans'     => array_values($sasaranMap),
                'iku_total'    => $totalIku,
                'iku_filled'   => $filledIku,
            ];
        }

        return Inertia::render('KetuaTim/Monitoring', [
            'tahun'             => $tahun,
            'allTim'            => $allTim,
            'rasAll'            => $rasAll,
            'laporanPerPeriode' => $laporanPerPeriode,
        ]);
    }
}
