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
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'awal')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pk'    => $pk,
        ]);
    }

    public function pkAwalInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $timKerjaId, 'jenis' => 'awal'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.awal.persiapan');
    }

    public function pkAwalSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $pk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
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
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'revisi')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pk'    => $pk,
        ]);
    }

    public function pkRevisiInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $timKerjaId, 'jenis' => 'revisi'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan');
    }

    public function pkRevisiSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $pk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->where('jenis', 'revisi')
            ->firstOrFail();

        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $pk->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan')
            ->with('success', 'Perjanjian Kinerja Revisi berhasil disubmit.');
    }

    // ─── Sasaran ────────────────────────────────────────────────────────────────

    public function sasaranStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'perjanjian_kinerja_id' => ['required', 'integer'],
            'kode'                  => ['required', 'string', 'max:20'],
            'nama'                  => ['required', 'string', 'max:500'],
        ]);

        $pk = PerjanjianKinerja::where('id', $data['perjanjian_kinerja_id'])
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->firstOrFail();

        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $urutan = $pk->sasarans()->max('urutan') + 1;

        Sasaran::create([
            'perjanjian_kinerja_id' => $pk->id,
            'kode'                  => $data['kode'],
            'nama'                  => $data['nama'],
            'urutan'                => $urutan,
        ]);

        return back()->with('success', 'Sasaran berhasil ditambahkan.');
    }

    public function sasaranUpdate(Request $request, Sasaran $sasaran): RedirectResponse
    {
        $pk = $sasaran->perjanjianKinerja;
        abort_if($pk->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate([
            'kode' => ['required', 'string', 'max:20'],
            'nama' => ['required', 'string', 'max:500'],
        ]);

        $sasaran->update($data);

        return back()->with('success', 'Sasaran berhasil diperbarui.');
    }

    public function sasaranDestroy(Request $request, Sasaran $sasaran): RedirectResponse
    {
        $pk = $sasaran->perjanjianKinerja;
        abort_if($pk->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $sasaran->delete();

        return back()->with('success', 'Sasaran berhasil dihapus.');
    }

    // ─── Indikator Kinerja ──────────────────────────────────────────────────────

    public function indikatorStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sasaran_id' => ['required', 'integer'],
            'kode'       => ['required', 'string', 'max:30'],
            'nama'       => ['required', 'string', 'max:500'],
            'satuan'     => ['required', 'string', 'max:50'],
            'target'     => ['required', 'string', 'max:50'],
        ]);

        $sasaran = Sasaran::with('perjanjianKinerja')->findOrFail($data['sasaran_id']);
        $pk = $sasaran->perjanjianKinerja;

        abort_if($pk->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $urutan = $sasaran->indikators()->max('urutan') + 1;

        IndikatorKinerja::create([
            'sasaran_id' => $sasaran->id,
            'kode'       => $data['kode'],
            'nama'       => $data['nama'],
            'satuan'     => $data['satuan'],
            'target'     => $data['target'],
            'urutan'     => $urutan,
        ]);

        return back()->with('success', 'Indikator berhasil ditambahkan.');
    }

    public function indikatorUpdate(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $pk = $indikator->sasaran->perjanjianKinerja;
        abort_if($pk->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate([
            'kode'   => ['required', 'string', 'max:30'],
            'nama'   => ['required', 'string', 'max:500'],
            'satuan' => ['required', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:50'],
        ]);

        $indikator->update($data);

        return back()->with('success', 'Indikator berhasil diperbarui.');
    }

    public function indikatorDestroy(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $pk = $indikator->sasaran->perjanjianKinerja;
        abort_if($pk->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $indikator->delete();

        return back()->with('success', 'Indikator berhasil dihapus.');
    }

    // ─── PK Progress ────────────────────────────────────────────────────────────

    public function pkAwalProgress(Request $request): Response
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
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
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
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
        $tahun      = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        // Sasaran diambil dari PK Awal milik tim kerja ini
        $pk = PerjanjianKinerja::with('sasarans')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'awal')
            ->first();

        $ra = RencanaAksi::with(['indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->first();

        // Group indikator RA per sasaran agar frontend bisa render per-sasaran
        $indikatorsBySasaran = $ra
            ? $ra->indikators->groupBy('sasaran_id')
            : collect();

        $sasarans = $pk
            ? $pk->sasarans->map(fn($s) => [
                'id'         => $s->id,
                'kode'       => $s->kode,
                'nama'       => $s->nama,
                'indikators' => $indikatorsBySasaran->get($s->id, collect())->values()->toArray(),
            ])->values()->toArray()
            : [];

        return Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun'    => $tahun,
            'ra'       => $ra ? [
                'id'                => $ra->id,
                'status'            => $ra->status,
                'rekomendasi_kabag' => $ra->rekomendasi_kabag,
                'rekomendasi_ppk'   => $ra->rekomendasi_ppk,
                'rejected_by'       => $ra->rejected_by,
                'sasarans'          => $sasarans,
            ] : null,
            'sasarans' => $sasarans,
        ]);
    }

    public function raInit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $timKerjaId = $request->user()->tim_kerja_id;

        RencanaAksi::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $timKerjaId],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan');
    }

    public function raIndikatorStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sasaran_id'  => ['required', 'integer'],
            'kode'        => ['required', 'string', 'max:30'],
            'nama'        => ['required', 'string', 'max:500'],
            'satuan'      => ['required', 'string', 'max:50'],
            'target'      => ['required', 'string', 'max:50'],
            'target_tw1'  => ['nullable', 'string', 'max:50'],
            'target_tw2'  => ['nullable', 'string', 'max:50'],
            'target_tw3'  => ['nullable', 'string', 'max:50'],
            'target_tw4'  => ['nullable', 'string', 'max:50'],
        ]);

        // Validasi sasaran milik tim kerja ini
        $sasaran = Sasaran::with('perjanjianKinerja')->findOrFail($data['sasaran_id']);
        abort_if($sasaran->perjanjianKinerja->tim_kerja_id !== $request->user()->tim_kerja_id, 403);

        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $ra    = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->firstOrFail();

        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $urutan = $ra->indikators()->max('urutan') + 1;

        RencanaAksiIndikator::create([
            'rencana_aksi_id' => $ra->id,
            'sasaran_id'      => $data['sasaran_id'],
            'kode'            => $data['kode'],
            'nama'            => $data['nama'],
            'satuan'          => $data['satuan'],
            'target'          => $data['target'],
            'target_tw1'      => $data['target_tw1'],
            'target_tw2'      => $data['target_tw2'],
            'target_tw3'      => $data['target_tw3'],
            'target_tw4'      => $data['target_tw4'],
            'urutan'          => $urutan,
        ]);

        return back()->with('success', 'Indikator berhasil ditambahkan.');
    }

    public function raIndikatorUpdate(Request $request, RencanaAksiIndikator $indikator): RedirectResponse
    {
        $ra = $indikator->rencanaAksi;
        abort_if($ra->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate([
            'kode'       => ['required', 'string', 'max:30'],
            'nama'       => ['required', 'string', 'max:500'],
            'satuan'     => ['required', 'string', 'max:50'],
            'target'     => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
        ]);

        $indikator->update($data);

        return back()->with('success', 'Indikator berhasil diperbarui.');
    }

    public function raIndikatorDestroy(Request $request, RencanaAksiIndikator $indikator): RedirectResponse
    {
        $ra = $indikator->rencanaAksi;
        abort_if($ra->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $indikator->delete();

        return back()->with('success', 'Indikator berhasil dihapus.');
    }

    public function raSubmit(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
        $ra = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $request->user()->tim_kerja_id)
            ->firstOrFail();

        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $ra->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan')
            ->with('success', 'Rencana Aksi berhasil disubmit.');
    }

    public function rencanaAksiProgress(Request $request): Response
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();
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
}
