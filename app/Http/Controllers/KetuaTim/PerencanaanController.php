<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    // ─── PK Awal ────────────────────────────────────────────────────────────────

    public function pkAwal(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        // PK milik tim ini (hanya untuk status, submit, approval)
        $ownPk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'awal')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun'    => $tahun,
            'pk'       => $ownPk ? [
                'id'                => $ownPk->id,
                'status'            => $ownPk->status,
                'rekomendasi_kabag' => $ownPk->rekomendasi_kabag,
                'rekomendasi_ppk'   => $ownPk->rekomendasi_ppk,
                'rejected_by'       => $ownPk->rejected_by,
            ] : null,
            'sasarans' => $this->buildSasaransForPic($tahun->id, $timKerjaId, 'awal'),
        ]);
    }

    public function pkAwalInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $request->user()->tim_kerja_id, 'jenis' => 'awal'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.awal.persiapan');
    }

    public function pkAwalSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();
        $pk    = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->where('jenis', 'awal')
            ->firstOrFail();

        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');
        $pk->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.pk.awal.persiapan')
            ->with('success', 'Perjanjian Kinerja Awal berhasil disubmit.');
    }

    // ─── PK Revisi ──────────────────────────────────────────────────────────────

    public function pkRevisi(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $ownPk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'revisi')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun'    => $tahun,
            'pk'       => $ownPk ? [
                'id'                => $ownPk->id,
                'status'            => $ownPk->status,
                'rekomendasi_kabag' => $ownPk->rekomendasi_kabag,
                'rekomendasi_ppk'   => $ownPk->rekomendasi_ppk,
                'rejected_by'       => $ownPk->rejected_by,
            ] : null,
            'sasarans' => $this->buildSasaransForPic($tahun->id, $timKerjaId, 'revisi'),
        ]);
    }

    public function pkRevisiInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $request->user()->tim_kerja_id, 'jenis' => 'revisi'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan');
    }

    public function pkRevisiSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();
        $pk    = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->where('jenis', 'revisi')
            ->firstOrFail();

        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');
        $pk->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan')
            ->with('success', 'Perjanjian Kinerja Revisi berhasil disubmit.');
    }

    // ─── Update Target IKU (PK) — primary PIC atau co-PIC boleh ────────────────

    public function indikatorTargetUpdate(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $pk         = $indikator->sasaran->perjanjianKinerja;
        $timKerjaId = $request->user()->tim_kerja_id;

        $isOwner = $pk->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->picTimKerjas()
            ->where('tim_kerja.id', $timKerjaId)
            ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate(['target' => ['required', 'string', 'max:50']]);
        $indikator->update(['target' => $data['target']]);

        return back()->with('success', 'Target berhasil diperbarui.');
    }

    // ─── PK Progress ────────────────────────────────────────────────────────────

    public function pkAwalProgress(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'awal')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Progress', [
            'tahun' => $tahun,
            'pk'    => $pk,
        ]);
    }

    public function pkRevisiProgress(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'revisi')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Progress', [
            'tahun' => $tahun,
            'pk'    => $pk,
        ]);
    }

    // ─── Rencana Aksi ───────────────────────────────────────────────────────────

    public function rencanaAksi(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        // RA milik tim ini (untuk status, submit, approval)
        $ownRa = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->first();

        // Sasaran IDs dari PK Awal di mana tim ini adalah PIC (primary atau co-PIC)
        $sasaranIds = Sasaran::whereHas('perjanjianKinerja', fn ($q) =>
            $q->where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')
        )->whereHas('indikators.picTimKerjas', fn ($q) =>
            $q->where('tim_kerja.id', $timKerjaId)
        )->pluck('id');

        // RA indikator dari SEMUA RA (bisa milik tim lain) untuk sasaran tersebut
        $raInds = RencanaAksiIndikator::with('sasaran')
            ->whereIn('sasaran_id', $sasaranIds)
            ->orderBy('kode')
            ->get();

        $sasaranMap = [];
        foreach ($raInds as $ind) {
            $s = $ind->sasaran;
            if (! $s) continue;
            if (! isset($sasaranMap[$s->kode])) {
                $sasaranMap[$s->kode] = [
                    'id'         => $s->id,
                    'kode'       => $s->kode,
                    'nama'       => $s->nama,
                    'indikators' => [],
                ];
            }
            $sasaranMap[$s->kode]['indikators'][] = [
                'id'         => $ind->id,
                'kode'       => $ind->kode,
                'nama'       => $ind->nama,
                'satuan'     => $ind->satuan,
                'target'     => $ind->target,
                'target_tw1' => $ind->target_tw1,
                'target_tw2' => $ind->target_tw2,
                'target_tw3' => $ind->target_tw3,
                'target_tw4' => $ind->target_tw4,
            ];
        }
        ksort($sasaranMap);

        return Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun'    => $tahun,
            'ra'       => $ownRa ? [
                'id'                => $ownRa->id,
                'status'            => $ownRa->status,
                'rekomendasi_kabag' => $ownRa->rekomendasi_kabag,
                'rekomendasi_ppk'   => $ownRa->rekomendasi_ppk,
                'rejected_by'       => $ownRa->rejected_by,
            ] : null,
            'sasarans' => array_values($sasaranMap),
        ]);
    }

    public function raInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        RencanaAksi::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $request->user()->tim_kerja_id],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan');
    }

    // ─── Update Target RA Indikator — primary PIC atau co-PIC boleh ─────────────

    public function raIndikatorUpdate(Request $request, RencanaAksiIndikator $indikator): RedirectResponse
    {
        $ra         = $indikator->rencanaAksi;
        $timKerjaId = $request->user()->tim_kerja_id;

        $isOwner = $ra->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->sasaran
            && $indikator->sasaran->indikators()
                ->whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
                ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate([
            'target'     => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
        ]);

        $indikator->update($data);

        return back()->with('success', 'Target berhasil diperbarui.');
    }

    public function raSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();
        $ra    = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->firstOrFail();

        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');
        $ra->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan')
            ->with('success', 'Rencana Aksi berhasil disubmit.');
    }

    public function rencanaAksiProgress(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $ra = RencanaAksi::with(['indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Progress', [
            'tahun' => $tahun,
            'ra'    => $ra,
        ]);
    }

    // ─── Helper ─────────────────────────────────────────────────────────────────

    /**
     * Load semua IKU (dari semua PK jenis $jenis) di mana tim ini adalah PIC.
     * Menggabungkan sasaran dari berbagai PK ke satu flat list per kode sasaran.
     */
    private function buildSasaransForPic(int $tahunId, int $timKerjaId, string $jenis): array
    {
        $pks = PerjanjianKinerja::with([
            'sasarans'              => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators'   => fn ($q) => $q->whereHas(
                'picTimKerjas', fn ($q2) => $q2->where('tim_kerja.id', $timKerjaId)
            )->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
        ])->where('tahun_anggaran_id', $tahunId)->where('jenis', $jenis)->get();

        $sasaranMap = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $s) {
                foreach ($s->indikators as $iku) {
                    if (! isset($sasaranMap[$s->kode])) {
                        $sasaranMap[$s->kode] = [
                            'id'         => $s->id,
                            'kode'       => $s->kode,
                            'nama'       => $s->nama,
                            'indikators' => [],
                        ];
                    }
                    $sasaranMap[$s->kode]['indikators'][] = [
                        'id'            => $iku->id,
                        'kode'          => $iku->kode,
                        'nama'          => $iku->nama,
                        'satuan'        => $iku->satuan,
                        'target'        => $iku->target,
                        'pic_tim_kerjas'=> $iku->picTimKerjas->map(fn ($t) => [
                            'id'          => $t->id,
                            'nama'        => $t->nama,
                            'kode'        => $t->kode,
                            'nama_singkat'=> $t->nama_singkat,
                        ]),
                    ];
                }
            }
        }
        ksort($sasaranMap);
        return array_values($sasaranMap);
    }
}
