<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    private function statusForRole(): string
    {
        return auth()->user()->pimpinan_type === 'kabag_umum'
        ? 'submitted'
        : 'kabag_approved';
    }

    // views

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $status = $this->statusForRole();

        $pks = PerjanjianKinerja::with(['sasarans.indikators', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->where('status', $status)
            ->get();

            return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
                'tahun' => $tahun,
                'pks'   => $pks,
                "role"  => auth()->user()->pimpinan_type,
            ]);
    }


    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $status = $this->statusForRole();

        
          $pks = PerjanjianKinerja::with(['sasarans.indikators', 'timKerja'])
              ->where('tahun_anggaran_id', $tahun->id)
              ->where('jenis', 'revisi')
              ->where('status', $status)
              ->get();

          return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
              'tahun' => $tahun,
              'pks'   => $pks,
              'role'  => auth()->user()->pimpinan_type,
          ]);
      }

    public function rencanaAksi(): Response
    {
        $tahun  = TahunAnggaran::forSession();
        $status = $this->statusForRole();

        $ras = RencanaAksi::with(['indikators.sasaran', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', $status)
            ->get()
            ->map(function ($ra) {
                $grouped = $ra->indikators->groupBy('sasaran_id');

                $sasarans = $grouped->map(function ($indikators) {
                    $s = $indikators->first()->sasaran;
                    return [
                        'kode'       => $s?->kode ?? '-',
                        'nama'       => $s?->nama ?? 'Tanpa Sasaran',
                        'indikators' => $indikators->toArray(),
                    ];
                })->values();

                return [
                    'id'       => $ra->id,
                    'status'   => $ra->status,
                    'tim_kerja' => $ra->timKerja,
                    'sasarans' => $sasarans,
                ];
            });

        return Inertia::render('Pimpinan/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'ras'   => $ras,
            'role'  => auth()->user()->pimpinan_type,
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
