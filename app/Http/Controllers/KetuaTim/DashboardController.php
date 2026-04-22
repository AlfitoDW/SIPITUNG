<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\PermohonanDana;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $timKerjaId = $user->tim_kerja_id;
        $tahun = TahunAnggaran::forSession();

        // ── Perencanaan ───────────────────────────────────────────────────────────
        // PK adalah dokumen global milik TK-PK — ambil spesifik dari TK-PK
        $tkPkId = \App\Models\TimKerja::where('kode', 'TK-PK')->value('id');

        $pkAwal = ($tahun && $tkPkId) ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->where('tim_kerja_id', $tkPkId)
            ->select('id', 'status', 'tim_kerja_id')->first() : null;

        $pkRevisi = ($tahun && $tkPkId) ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->where('tim_kerja_id', $tkPkId)
            ->select('id', 'status', 'tim_kerja_id')->first() : null;

        // Ambil RA dengan status TERBAIK untuk tim ini — termasuk RA dari primary PIC
        // yang menjadikan tim ini sebagai co-PIC (peer_tim_kerja_id = timKerjaId),
        // agar co-PIC tidak stuck "draft" saat primary PIC sudah submit.
        $ra = $tahun ? RencanaAksi::withCount('indikators')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where(function ($q) use ($timKerjaId) {
                $q->where('tim_kerja_id', $timKerjaId)
                    ->orWhere('peer_tim_kerja_id', $timKerjaId);
            })
            ->select('id', 'status')
            ->orderByRaw("FIELD(status,'kabag_approved','submitted','rejected','draft')")
            ->first() : null;

        // ── Pengukuran Kinerja — tampilkan laporan terbaru tim (prioritas: ada laporan) ──
        $pengukuran = null;
        if ($tahun) {
            // Prioritas 1: cari laporan terbaik tim ini dari semua periode tahun ini.
            // Sertakan laporan kolaborasi (peer_tim_kerja_id = timKerjaId) agar co-PIC
            // tidak stuck "belum submit" saat primary PIC sudah submit laporan bersama.
            $myLaporan = LaporanPengukuran::where(function ($q) use ($timKerjaId) {
                $q->where('tim_kerja_id', $timKerjaId)
                    ->orWhere('peer_tim_kerja_id', $timKerjaId);
            })
                ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
                ->with('periode')
                ->orderByRaw("FIELD(status,'kabag_approved','submitted','rejected','draft')")
                ->first();

            if ($myLaporan) {
                $pengukuran = [
                    'status' => $myLaporan->status,
                    'triwulan' => $myLaporan->periode->triwulan,
                    'approved_at' => $myLaporan->approved_at?->format('d M Y'),
                ];
            } else {
                // Prioritas 2: periode aktif (untuk tampilkan "Belum disubmit" dengan info triwulan)
                $periodeAktif = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
                    ->where('is_active', true)
                    ->first()
                    ?? PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
                        ->orderByRaw("FIELD(triwulan,'TW4','TW3','TW2','TW1')")
                        ->first();

                if ($periodeAktif) {
                    $pengukuran = [
                        'status' => null,
                        'triwulan' => $periodeAktif->triwulan,
                        'approved_at' => null,
                    ];
                }
            }
        }

        // ── Keuangan — Permohonan Dana ─────────────────────────────────────────
        $pdCounts = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->selectRaw('status, count(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status') : collect();

        $nilaiDicairkan = $tahun ? (float) PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('status', 'dicairkan')
            ->sum('total_anggaran') : 0;

        // Hanya tampil untuk ketua koordinator: antrian approval
        $approvalPending = ($tahun && $user->isKetuaKoordinator())
            ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)
                ->where('status', 'bendahara_checked')->count()
            : 0;

        return Inertia::render('KetuaTim/Dashboard', [
            'user' => $user,
            'timKerja' => $user->timkerja,
            'tahun' => $tahun,
            'pkAwal' => $pkAwal,
            'pkRevisi' => $pkRevisi,
            'ra' => $ra,
            'pengukuran' => $pengukuran,
            'permohonan' => [
                'draft' => $pdCounts->get('draft', 0),
                'submitted' => $pdCounts->get('submitted', 0),
                'kabag_approved' => $pdCounts->get('kabag_approved', 0),
                'bendahara_checked' => $pdCounts->get('bendahara_checked', 0),
                'katimku_approved' => $pdCounts->get('katimku_approved', 0),
                'dicairkan' => $pdCounts->get('dicairkan', 0),
                'rejected' => $pdCounts->get('rejected', 0),
                'nilai_dicairkan' => $nilaiDicairkan,
            ],
            'approvalPending' => $approvalPending,
        ]);
    }
}
