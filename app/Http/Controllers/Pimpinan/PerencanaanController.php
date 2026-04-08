<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\IndikatorKinerja;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    private function isPpk(): bool
    {
        return auth()->user()->pimpinan_type === 'ppk';
    }

    // views

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
            'role'  => $user->pimpinan_type,
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
            'role'  => $user->pimpinan_type,
        ]);
    }

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        // Build PIC lookup: [sasaran_id][kode] → picTimKerjas
        // Hanya dari PK Awal milik tahun ini
        $ikuPics = IndikatorKinerja::with('picTimKerjas')
            ->whereHas('sasaran.perjanjianKinerja', fn ($q) => $q
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
            )
            ->get()
            ->groupBy('sasaran_id')
            ->map(fn ($ikus) => $ikus->keyBy('kode'));

        $ras = RencanaAksi::with(['indikators.sasaran', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->get()
            ->map(function ($ra) use ($ikuPics) {
                $grouped = $ra->indikators->groupBy('sasaran_id');

                $sasarans = $grouped->map(function ($indikators) use ($ikuPics) {
                    $s         = $indikators->first()->sasaran;
                    $sasaranId = $indikators->first()->sasaran_id;
                    $ikusMap   = $ikuPics->get($sasaranId, collect());

                    return [
                        'kode'       => $s?->kode ?? '-',
                        'nama'       => $s?->nama ?? 'Tanpa Sasaran',
                        'indikators' => $indikators->map(function ($iku) use ($ikusMap) {
                            $pkIku = $ikusMap->get($iku->kode);
                            $arr   = $iku->toArray();
                            $arr['pic_tim_kerjas'] = $pkIku
                                ? $pkIku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode']))->values()->toArray()
                                : [];
                            return $arr;
                        })->values()->toArray(),
                    ];
                })->values();

                return [
                    'id'        => $ra->id,
                    'status'    => $ra->status,
                    'tim_kerja' => $ra->timKerja,
                    'sasarans'  => $sasarans,
                ];
            });

        return Inertia::render('Pimpinan/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'ras'   => $ras,
            'role'  => $user->pimpinan_type,
        ]);
    }

    //PK Actions
    public function pkApprove(Request $request, PerjanjianKinerja $pk): RedirectResponse
    {
        $request->validate(['rekomendasi'=> 'nullable|string|max:1000']);

        $user = auth() ->user();

        if($user->pimpinan_type === 'kabag_umum'){
            abort_if($pk->status !== 'submitted', 422, 'Status tidak valid.');
            $pk->update([
                'status'  => 'kabag_approved',
                'rekomendasi_kabag' => $request->rekomendasi,
            ]);
        } else {
            abort_if($pk->status !== 'kabag_approved', 422 , 'Status tidak Valid.');
            $pk->update([
                'status' => 'ppk_approved',
                'rekomendasi_ppk' => $request->rekomendasi,
            ]);
        }
        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil disetujui.");
    }
    
    public function pkReject(Request $request, PerjanjianKinerja $pk) : RedirectResponse
    {
        $request ->validate(['rekomendasi' => 'nullable|string|max:1000']);

        $user   = auth()->user();
        $expectedStatus = $user->pimpinan_type === 'kabag_umum' ? 'submitted' : 'kabag_approved';
        $rekomendasiKey = $user->pimpinan_type === 'kabag_umum' ? 'rekomendasi_kabag' : 'rekomendasi_ppk';

        abort_if($pk->status !== $expectedStatus, 422, 'Status tidak valid');

        $pk->update([
            'status'    => 'rejected',
            'rejected_by' => $user->pimpinan_type,
            $rekomendasiKey => $request->rekomendasi,
        ]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} ditolak." );

    }

    // RA Actions
     public function raApprove(Request $request, RencanaAksi $ra): RedirectResponse
      {
          $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

          $user = auth()->user();

          if ($user->pimpinan_type === 'kabag_umum') {
              abort_if($ra->status !== 'submitted', 422, 'Status tidak valid.');
              $ra->update([
                  'status'            => 'kabag_approved',
                  'rekomendasi_kabag' => $request->rekomendasi,
              ]);
          } else {
              abort_if($ra->status !== 'kabag_approved', 422, 'Status tidak valid.');
              $ra->update([
                  'status'          => 'ppk_approved',
                  'rekomendasi_ppk' => $request->rekomendasi,
              ]);
          }

          return back()->with('success', "RA {$ra->timKerja->nama_singkat} berhasil disetujui.");
      }

      public function raReject(Request $request, RencanaAksi $ra): RedirectResponse
      {
          $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

          $user           = auth()->user();
          $expectedStatus = $user->pimpinan_type === 'kabag_umum' ? 'submitted' : 'kabag_approved';
          $rekomendasiKey = $user->pimpinan_type === 'kabag_umum' ? 'rekomendasi_kabag' : 'rekomendasi_ppk';

          abort_if($ra->status !== $expectedStatus, 422, 'Status tidak valid.');

          $ra->update([
              'status'        => 'rejected',
              'rejected_by'   => $user->pimpinan_type,
              $rekomendasiKey => $request->rekomendasi,
          ]);

          return back()->with('success', "RA {$ra->timKerja->nama_singkat} ditolak.");
      }
}
