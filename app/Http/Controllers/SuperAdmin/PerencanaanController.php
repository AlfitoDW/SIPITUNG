<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\MasterSasaran;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    // ─── PK Awal ────────────────────────────────────────────────────────────────

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'jenis' => 'awal',
            'timKerjas' => $timKerjas,
            'pks' => $this->buildPkStatusList($tahun->id, 'awal'),
            ...$this->buildFlatPkData($tahun->id, 'awal'),
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'jenis' => 'revisi',
            'timKerjas' => $timKerjas,
            'pks' => $this->buildPkStatusList($tahun->id, 'revisi'),
            ...$this->buildFlatPkData($tahun->id, 'revisi'),
        ]);
    }

    private function buildPkStatusList(int $tahunId, string $jenis): array
    {
        return PerjanjianKinerja::with('timKerja:id,nama,kode,nama_singkat')
            ->where('tahun_anggaran_id', $tahunId)
            ->where('jenis', $jenis)
            ->orderBy('id')
            ->get()
            ->map(fn ($pk) => [
                'id' => $pk->id,
                'status' => $pk->status,
                'rekomendasi_kabag' => $pk->rekomendasi_kabag,
                'tim_kerja' => $pk->timKerja ? [
                    'id' => $pk->timKerja->id,
                    'nama' => $pk->timKerja->nama,
                    'kode' => $pk->timKerja->kode,
                    'nama_singkat' => $pk->timKerja->nama_singkat,
                ] : null,
            ])
            ->values()
            ->all();
    }

    private function buildFlatPkData(int $tahunId, string $jenis): array
    {
        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'timKerja',
        ])
            ->where('tahun_anggaran_id', $tahunId)
            ->where('jenis', $jenis)
            ->orderBy('id')
            ->get();

        $sasaranMap = [];

        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    $sasaranMap[$sasaran->kode]['indikators'][] = [
                        'id' => $iku->id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'sasaran_id' => $sasaran->id,
                        'pic_tim_kerjas' => $iku->picTimKerjas->values(),
                    ];
                }
            }
        }

        ksort($sasaranMap);

        // Master sasaran sebagai sumber tunggal untuk dropdown Tambah IKU
        $masterSasarans = MasterSasaran::where('tahun_anggaran_id', $tahunId)
            ->orderBy('urutan')
            ->get(['id', 'kode', 'nama'])
            ->toArray();

        return [
            'sasarans' => array_values($sasaranMap),
            'masterSasarans' => $masterSasarans,
        ];
    }

    // ─── Matriks PK ─────────────────────────────────────────────────────────────

    public function matriksPK(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->orderBy('id')
            ->get();

        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/MatriksPK', [
            'tahun' => $tahun,
            'pks' => $pks,
            'timKerjas' => $timKerjas,
        ]);
    }

    // ─── Rencana Aksi ───────────────────────────────────────────────────────────

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::forSession();

        // Gunakan SEMUA PK Awal sebagai sumber IKU (robust jika data tersebar di beberapa PK)
        $allPkAwal = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Index RAI yang sudah terisi (dari semua RA, dikelompokkan per kode IKU)
        $raiByKode = RencanaAksiIndikator::with(['kegiatans', 'rencanaAksi.timKerja'])
            ->whereHas('rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->get()
            ->groupBy('kode');

        $sasaranMap = [];

        foreach ($allPkAwal as $pkAwal) {
            foreach ($pkAwal->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    // Pilih RAI dari primary PIC jika ada, fallback ke RAI apapun
                    $rais = $raiByKode->get($iku->kode, collect());
                    $rai = $rais->firstWhere('rencanaAksi.tim_kerja_id', $iku->pic_tim_kerja_id)
                             ?? $rais->first();

                    $sasaranMap[$sasaran->kode]['indikators'][] = [
                        'id' => $rai?->id,
                        'ra_id' => $rai?->rencana_aksi_id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'target_tw1' => $rai?->target_tw1,
                        'target_tw2' => $rai?->target_tw2,
                        'target_tw3' => $rai?->target_tw3,
                        'target_tw4' => $rai?->target_tw4,
                        'pic_tim_kerjas' => $iku->picTimKerjas->values(),
                        'tim_kerja' => $rai?->rencanaAksi?->timKerja
                            ? ['id' => $rai->rencanaAksi->timKerja->id, 'nama' => $rai->rencanaAksi->timKerja->nama, 'kode' => $rai->rencanaAksi->timKerja->kode]
                            : null,
                        'kegiatans' => $rai ? $rai->kegiatans->map(fn ($k) => [
                            'id' => $k->id,
                            'triwulan' => $k->triwulan,
                            'urutan' => $k->urutan,
                            'nama_kegiatan' => $k->nama_kegiatan,
                        ])->values()->all() : [],
                    ];
                }
            }
        }

        // Status daftar RA per tim (untuk panel Buka Kembali)
        $ras = RencanaAksi::with('timKerja:id,nama,kode,nama_singkat')
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderBy('id')
            ->get();

        $raStatusList = $ras->map(fn ($ra) => [
            'id' => $ra->id,
            'status' => $ra->status,
            'rekomendasi_kabag' => $ra->rekomendasi_kabag,
            'tim_kerja' => $ra->timKerja ? [
                'id' => $ra->timKerja->id,
                'nama' => $ra->timKerja->nama,
                'kode' => $ra->timKerja->kode,
                'nama_singkat' => $ra->timKerja->nama_singkat,
            ] : null,
        ])->values()->all();

        // Buang sasaran orphan (tanpa indikator)
        $sasaranMap = array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0);
        ksort($sasaranMap);

        return Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'sasarans' => array_values($sasaranMap),
            'ras' => $raStatusList,
            'batasRa' => $tahun->batas_pengisian_ra?->toIso8601String(),
            'serverNow' => now()->toIso8601String(),
        ]);
    }

    // ─── RA Batas Pengisian ──────────────────────────────────────────────────────

    public function raBatasUpdate(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'batas_pengisian_ra' => ['nullable', 'date'],
        ]);

        // Normalisasi datetime-local (YYYY-MM-DDTHH:MM) ke format Y-m-d H:i:s
        // lalu konversi dari WIB (Asia/Jakarta) ke UTC sebelum disimpan.
        // Ini penting karena input datetime-local selalu dalam waktu lokal browser (WIB).
        if (! empty($data['batas_pengisian_ra'])) {
            $raw = str_replace('T', ' ', (string) $data['batas_pengisian_ra']);
            if (! str_contains($raw, ':')) {
                $raw .= ' 00:00:00';
            } elseif (substr_count($raw, ':') === 1) {
                $raw .= ':00';
            }
            $data['batas_pengisian_ra'] = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $raw, 'Asia/Jakarta')
                ->setTimezone('UTC')
                ->format('Y-m-d H:i:s');
        }

        $tahun->update(['batas_pengisian_ra' => $data['batas_pengisian_ra'] ?: null]);

        return back()->with('success', $data['batas_pengisian_ra']
            ? 'Batas waktu pengisian RA berhasil disimpan.'
            : 'Batas waktu pengisian RA berhasil dihapus.');
    }

    // ─── Master Sasaran CRUD ─────────────────────────────────────────────────────

    public function masterSasaranStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'kode' => ['required', 'string', 'max:10'],
            'nama' => ['required', 'string', 'max:500'],
        ]);

        $urutan = MasterSasaran::where('tahun_anggaran_id', $tahun->id)->max('urutan') + 1;

        MasterSasaran::create([
            'tahun_anggaran_id' => $tahun->id,
            'kode' => $data['kode'],
            'nama' => $data['nama'],
            'urutan' => $urutan,
        ]);

        return back()->with('success', "Sasaran {$data['kode']} berhasil ditambahkan ke master.");
    }

    public function masterSasaranUpdate(Request $request, MasterSasaran $masterSasaran): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:10'],
            'nama' => ['required', 'string', 'max:500'],
        ]);

        $masterSasaran->update($data);

        return back()->with('success', 'Master sasaran berhasil diperbarui.');
    }

    public function masterSasaranDestroy(MasterSasaran $masterSasaran): RedirectResponse
    {
        $masterSasaran->delete();

        return back()->with('success', 'Master sasaran berhasil dihapus.');
    }

    // ─── Indikator CRUD ─────────────────────────────────────────────────────────

    public function indikatorStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'master_sasaran_id' => ['required', 'integer', 'exists:master_sasaran,id'],
            'jenis' => ['required', 'in:awal,revisi'],
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:500'],
            'satuan' => ['required', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
            'pic_tim_kerja_ids' => ['required', 'array', 'min:1'],
            'pic_tim_kerja_ids.*' => ['integer', 'exists:tim_kerja,id'],
        ]);

        $masterSasaran = MasterSasaran::findOrFail($data['master_sasaran_id']);
        $picIds = $data['pic_tim_kerja_ids'];
        $primaryPicId = $picIds[0];

        // Temukan atau buat PK milik primary PIC untuk tahun & jenis ini
        $pk = PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $primaryPicId, 'jenis' => $data['jenis']],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        // Temukan atau buat sasaran di PK tersebut berdasarkan master sasaran
        $sasaran = Sasaran::firstOrCreate(
            ['perjanjian_kinerja_id' => $pk->id, 'kode' => $masterSasaran->kode],
            ['nama' => $masterSasaran->nama, 'urutan' => $masterSasaran->urutan]
        );

        $urutan = $sasaran->indikators()->max('urutan') + 1;
        $indikator = IndikatorKinerja::create([
            'sasaran_id' => $sasaran->id,
            'kode' => $data['kode'],
            'nama' => $data['nama'],
            'satuan' => $data['satuan'],
            'target' => $data['target'],
            'target_tw1' => $data['target_tw1'] ?? null,
            'target_tw2' => $data['target_tw2'] ?? null,
            'target_tw3' => $data['target_tw3'] ?? null,
            'target_tw4' => $data['target_tw4'] ?? null,
            'urutan' => $urutan,
            'pic_tim_kerja_id' => $primaryPicId,
        ]);

        $indikator->picTimKerjas()->sync($picIds);

        return back()->with('success', 'Indikator berhasil ditambahkan.');
    }

    public function indikatorUpdate(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:500'],
            'satuan' => ['required', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
            'pic_tim_kerja_ids' => ['nullable', 'array'],
            'pic_tim_kerja_ids.*' => ['integer', 'exists:tim_kerja,id'],
        ]);

        $picIds = $data['pic_tim_kerja_ids'] ?? [];
        $oldKode = $indikator->kode;
        $newKode = $data['kode'];
        $tahunId = $indikator->sasaran->perjanjianKinerja->tahun_anggaran_id;

        $indikator->update([
            'kode' => $newKode,
            'nama' => $data['nama'],
            'satuan' => $data['satuan'],
            'target' => $data['target'],
            'target_tw1' => $data['target_tw1'] ?? null,
            'target_tw2' => $data['target_tw2'] ?? null,
            'target_tw3' => $data['target_tw3'] ?? null,
            'target_tw4' => $data['target_tw4'] ?? null,
            'pic_tim_kerja_id' => $picIds[0] ?? null,
        ]);

        $indikator->picTimKerjas()->sync($picIds);

        // Sinkronisasi kode RAI jika kode IKU berubah, agar data di Rencana Aksi tetap konsisten.
        if ($oldKode !== $newKode) {
            RencanaAksiIndikator::whereHas(
                'rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahunId)
            )->where('kode', $oldKode)->update(['kode' => $newKode]);
        }

        return back()->with('success', 'Indikator berhasil diperbarui.');
    }

    public function indikatorDestroy(IndikatorKinerja $indikator): RedirectResponse
    {
        $kode    = $indikator->kode;
        $tahunId = $indikator->sasaran->perjanjianKinerja->tahun_anggaran_id;

        // Hapus RAI dengan kode yang sama agar data Rencana Aksi tidak menyimpan IKU orphan.
        RencanaAksiIndikator::whereHas(
            'rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahunId)
        )->where('kode', $kode)->delete();

        $indikator->delete();

        return back()->with('success', 'Indikator berhasil dihapus.');
    }

    public function indikatorUpdatePic(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $data = $request->validate([
            'pic_tim_kerja_id' => ['nullable', 'integer', 'exists:tim_kerja,id'],
        ]);

        $indikator->update(['pic_tim_kerja_id' => $data['pic_tim_kerja_id']]);

        return back()->with('success', 'PIC Tim Kerja berhasil diperbarui.');
    }

    // ─── PK Reopen ──────────────────────────────────────────────────────────────

    public function pkReopen(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if(
            ! in_array($pk->status, ['submitted', 'kabag_approved']),
            422,
            'Hanya dokumen yang sedang diproses atau sudah disetujui yang dapat dibuka kembali.'
        );
        $pk->update(['status' => 'draft', 'rekomendasi_kabag' => null]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil dibuka kembali ke Draft.");
    }

    // ─── RA Reopen ──────────────────────────────────────────────────────────────

    public function raReopen(RencanaAksi $ra): RedirectResponse
    {
        abort_if(
            ! in_array($ra->status, ['submitted', 'kabag_approved']),
            422,
            'Hanya dokumen yang sedang diproses atau sudah disetujui yang dapat dibuka kembali.'
        );
        $ra->update(['status' => 'draft', 'rekomendasi_kabag' => null, 'rejected_by' => null]);

        $nama = $ra->timKerja?->nama_singkat ?? $ra->timKerja?->nama ?? 'Tim Kerja';

        return back()->with('success', "RA {$nama} berhasil dibuka kembali ke Draft.");
    }
}
