<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\RencanaKegiatan;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    // ─── PK Awal ────────────────────────────────────────────────────────────────

    public function pkAwal(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;
        $isTkPk = $request->user()->timkerja?->kode === 'TK-PK';

        // PK dokumen milik TK-PK (untuk status & editing)
        $tkPk = TimKerja::where('kode', 'TK-PK')->first();
        $pk = $tkPk
            ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
                ->where('tim_kerja_id', $tkPk->id)
                ->where('jenis', 'awal')
                ->first()
            : null;

        // Sasaran: gabungkan SEMUA PK awal yang ada (robust jika data tersebar)
        $allPks = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();
        $sasarans = $this->buildMergedPkSasarans($allPks);

        $isOwner = $isTkPk && $pk !== null;
        $canInit = $isTkPk;

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pk' => $pk ? [
                'id' => $pk->id,
                'status' => $pk->status,
                'rekomendasi_kabag' => $pk->rekomendasi_kabag,
            ] : null,
            'sasarans' => $sasarans,
            'isOwner' => $isOwner,
            'canInit' => $canInit,
        ]);
    }

    public function pkAwalInit(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()->timkerja?->kode === 'TK-PK',
            403, 'Hanya Tim Perencanaan dan Keuangan yang dapat membuat Perjanjian Kinerja.'
        );

        $tahun = TahunAnggaran::forSession();

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $request->user()->tim_kerja_id, 'jenis' => 'awal'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.awal.persiapan');
    }

    public function pkAwalSubmit(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()->timkerja?->kode === 'TK-PK',
            403, 'Hanya Tim Perencanaan dan Keuangan yang dapat mengajukan Perjanjian Kinerja.'
        );

        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;
        $pk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
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
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;
        $isTkPk = $request->user()->timkerja?->kode === 'TK-PK';

        // PK dokumen milik TK-PK (untuk status & editing)
        $tkPk = TimKerja::where('kode', 'TK-PK')->first();
        $pk = $tkPk
            ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
                ->where('tim_kerja_id', $tkPk->id)
                ->where('jenis', 'revisi')
                ->first()
            : null;

        // Sasaran: gabungkan SEMUA PK revisi yang ada (robust jika data tersebar)
        $allPks = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->get();
        $sasarans = $this->buildMergedPkSasarans($allPks);

        $isOwner = $isTkPk && $pk !== null;
        $canInit = $isTkPk;

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pk' => $pk ? [
                'id' => $pk->id,
                'status' => $pk->status,
                'rekomendasi_kabag' => $pk->rekomendasi_kabag,
            ] : null,
            'sasarans' => $sasarans,
            'isOwner' => $isOwner,
            'canInit' => $canInit,
        ]);
    }

    public function pkRevisiInit(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()->timkerja?->kode === 'TK-PK',
            403, 'Hanya Tim Perencanaan dan Keuangan yang dapat membuat Perjanjian Kinerja.'
        );

        $tahun = TahunAnggaran::forSession();

        PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $request->user()->tim_kerja_id, 'jenis' => 'revisi'],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan');
    }

    public function pkRevisiSubmit(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()->timkerja?->kode === 'TK-PK',
            403, 'Hanya Tim Perencanaan dan Keuangan yang dapat mengajukan Perjanjian Kinerja.'
        );

        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;
        $pk = PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'revisi')
            ->firstOrFail();

        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $pk->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.perencanaan.pk.revisi.persiapan')
            ->with('success', 'Perjanjian Kinerja Revisi berhasil disubmit.');
    }

    // ─── Update Target IKU (PK) — hanya pemilik PK ──────────────────────────────

    public function indikatorTargetUpdate(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        abort_unless(
            $request->user()->timkerja?->kode === 'TK-PK',
            403, 'Hanya Tim Perencanaan dan Keuangan yang dapat mengubah target IKU.'
        );

        $pk = $indikator->sasaran->perjanjianKinerja;
        $timKerjaId = $request->user()->tim_kerja_id;

        abort_if($pk->tim_kerja_id !== $timKerjaId, 403);
        abort_if(! $pk->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $data = $request->validate(['target' => ['required', 'string', 'max:50']]);
        $indikator->update(['target' => $data['target']]);

        return back()->with('success', 'Target berhasil diperbarui.');
    }

    // ─── PK Progress ────────────────────────────────────────────────────────────

    public function pkAwalProgress(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'awal')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Progress', [
            'tahun' => $tahun,
            'pk' => $pk,
        ]);
    }

    public function pkRevisiProgress(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $pk = PerjanjianKinerja::with(['sasarans.indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('jenis', 'revisi')
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Progress', [
            'tahun' => $tahun,
            'pk' => $pk,
        ]);
    }

    // ─── Rencana Aksi ───────────────────────────────────────────────────────────

    public function rencanaAksi(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        // Bangun kelompok kolaborasi RA
        $collabGroups = $this->buildRaCollabGroups($tahun->id, $timKerjaId);

        // Kumpulkan semua sasaran/indikator yang ditampilkan per group
        $groupsData = [];
        foreach ($collabGroups as $group) {
            $raInds = RencanaAksiIndikator::with(['sasaran', 'kegiatans'])
                ->whereIn('id', $group['ra_ind_ids'])
                ->orderBy('kode')
                ->get();

            $sasaranMap = [];
            foreach ($raInds as $ind) {
                $s = $ind->sasaran;
                if (! $s) {
                    continue;
                }
                if (! isset($sasaranMap[$s->kode])) {
                    $sasaranMap[$s->kode] = [
                        'id' => $s->id, 'kode' => $s->kode, 'nama' => $s->nama,
                        'indikators' => [],
                    ];
                }
                $sasaranMap[$s->kode]['indikators'][] = [
                    'id' => $ind->id,
                    'kode' => $ind->kode,
                    'nama' => $ind->nama,
                    'satuan' => $ind->satuan,
                    'target' => $ind->target,
                    'target_tw1' => $ind->target_tw1,
                    'target_tw2' => $ind->target_tw2,
                    'target_tw3' => $ind->target_tw3,
                    'target_tw4' => $ind->target_tw4,
                    'kegiatans' => $ind->kegiatans->map(fn ($k) => [
                        'id' => $k->id,
                        'triwulan' => $k->triwulan,
                        'urutan' => $k->urutan,
                        'nama_kegiatan' => $k->nama_kegiatan,
                    ])->values()->all(),
                ];
            }
            ksort($sasaranMap);

            $groupsData[] = array_merge(
                $group,
                ['sasarans' => array_values($sasaranMap)]
            );
        }

        return Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'raGroups' => $groupsData,
            'batasRa' => $tahun->batas_pengisian_ra?->toIso8601String(),
            'serverNow' => now()->toIso8601String(),
        ]);
    }

    public function raInit(Request $request): RedirectResponse
    {
        // raInit sekarang tidak dibutuhkan — RA di-auto-create di buildRaCollabGroups
        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan');
    }

    // ─── Update Target RA Indikator — primary PIC atau co-PIC boleh ─────────────

    public function raIndikatorUpdate(Request $request, RencanaAksiIndikator $indikator): RedirectResponse
    {
        $ra = $indikator->rencanaAksi;
        $timKerjaId = $request->user()->tim_kerja_id;

        $isOwner = $ra->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->sasaran
            && $indikator->sasaran->indikators()
                ->whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
                ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $batasRa = $ra->tahunAnggaran?->batas_pengisian_ra;
        abort_if($batasRa && now()->isAfter($batasRa), 403, 'Batas waktu pengisian Rencana Aksi telah berakhir.');

        $data = $request->validate([
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
        $timKerjaId = $request->user()->tim_kerja_id;
        $peerTimKerjaId = $request->input('peer_tim_kerja_id');
        $peerTimKerjaId = $peerTimKerjaId !== null ? (int) $peerTimKerjaId : null;

        $ra = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('peer_tim_kerja_id', $peerTimKerjaId)
            ->firstOrFail();

        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $batasRaSubmit = $tahun->batas_pengisian_ra;
        abort_if($batasRaSubmit && now()->isAfter($batasRaSubmit), 403, 'Batas waktu pengisian Rencana Aksi telah berakhir.');

        // Blokir submit hanya jika RA ini benar-benar kosong (tidak punya indikator sendiri)
        // DAN peer-nya sudah submit. Jika RA memiliki indikator sendiri (primary PIC berbeda),
        // kedua tim boleh submit secara independen karena IKU-nya berbeda.
        if ($peerTimKerjaId !== null && $ra->indikators()->count() === 0) {
            $peerRa = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
                ->where('tim_kerja_id', $peerTimKerjaId)
                ->where('peer_tim_kerja_id', $timKerjaId)
                ->whereIn('status', ['submitted', 'kabag_approved'])
                ->first();

            if ($peerRa) {
                $peerName = $peerRa->timKerja?->nama_singkat ?? $peerRa->timKerja?->nama ?? 'Tim lain';
                abort(403, "{$peerName} telah mengajukan Rencana Aksi untuk IKU bersama ini. Rencana Aksi ini tidak memiliki IKU sendiri untuk diajukan.");
            }
        }

        $ra->update(['status' => 'submitted', 'rekomendasi_kabag' => null, 'rejected_by' => null]);

        $peerName = $peerTimKerjaId
            ? (TimKerja::find($peerTimKerjaId)?->nama_singkat ?? 'tim partner')
            : 'IKU mandiri';

        return redirect()->route('ketua-tim.perencanaan.ra.penyusunan')
            ->with('success', "Rencana Aksi kelompok {$peerName} berhasil disubmit.");
    }

    public function rencanaAksiProgress(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $ra = RencanaAksi::with(['indikators'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->first();

        return Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Progress', [
            'tahun' => $tahun,
            'ra' => $ra,
        ]);
    }

    // ─── Rencana Kegiatan CRUD ──────────────────────────────────────────────────

    public function kegiatanStore(Request $request, RencanaAksiIndikator $indikator): RedirectResponse
    {
        $ra = $indikator->rencanaAksi;
        $timKerjaId = $request->user()->tim_kerja_id;

        // Izinkan owner RA atau co-PIC yang menjadi PIC IKU ini di PK
        $isOwner = $ra->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->sasaran
            && $indikator->sasaran->indikators()
                ->whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
                ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $batasKgStore = $ra->tahunAnggaran?->batas_pengisian_ra;
        abort_if($batasKgStore && now()->isAfter($batasKgStore), 403, 'Batas waktu pengisian Rencana Aksi telah berakhir.');

        $data = $request->validate([
            'triwulan' => ['required', 'integer', 'min:1', 'max:4'],
            'nama_kegiatan' => ['required', 'string', 'max:500'],
        ]);

        $urutan = RencanaKegiatan::where('rencana_aksi_indikator_id', $indikator->id)
            ->where('triwulan', $data['triwulan'])
            ->max('urutan') + 1;

        RencanaKegiatan::create([
            'rencana_aksi_indikator_id' => $indikator->id,
            'triwulan' => $data['triwulan'],
            'urutan' => $urutan,
            'nama_kegiatan' => $data['nama_kegiatan'],
        ]);

        return back()->with('success', 'Kegiatan berhasil ditambahkan.');
    }

    public function kegiatanUpdate(Request $request, RencanaKegiatan $kegiatan): RedirectResponse
    {
        $indikator = $kegiatan->indikator;
        $ra = $indikator->rencanaAksi;
        $timKerjaId = $request->user()->tim_kerja_id;

        $isOwner = $ra->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->sasaran
            && $indikator->sasaran->indikators()
                ->whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
                ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $batasKgUpdate = $ra->tahunAnggaran?->batas_pengisian_ra;
        abort_if($batasKgUpdate && now()->isAfter($batasKgUpdate), 403, 'Batas waktu pengisian Rencana Aksi telah berakhir.');

        $data = $request->validate([
            'nama_kegiatan' => ['required', 'string', 'max:500'],
        ]);

        $kegiatan->update(['nama_kegiatan' => $data['nama_kegiatan']]);

        return back()->with('success', 'Kegiatan berhasil diperbarui.');
    }

    public function kegiatanDestroy(Request $request, RencanaKegiatan $kegiatan): RedirectResponse
    {
        $indikator = $kegiatan->indikator;
        $ra = $indikator->rencanaAksi;
        $timKerjaId = $request->user()->tim_kerja_id;

        $isOwner = $ra->tim_kerja_id === $timKerjaId;
        $isCoPic = ! $isOwner && $indikator->sasaran
            && $indikator->sasaran->indikators()
                ->whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
                ->exists();

        abort_if(! $isOwner && ! $isCoPic, 403);
        abort_if(! $ra->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $batasKgDestroy = $ra->tahunAnggaran?->batas_pengisian_ra;
        abort_if($batasKgDestroy && now()->isAfter($batasKgDestroy), 403, 'Batas waktu pengisian Rencana Aksi telah berakhir.');

        $kegiatan->delete();

        return back()->with('success', 'Kegiatan berhasil dihapus.');
    }

    // ─── Helper ─────────────────────────────────────────────────────────────────

    /**
     * Bangun kelompok kolaborasi RA per pasangan (tim_kerja, peer_tim_kerja).
     * Auto-create RA record per kelompok jika belum ada.
     * Return array kelompok dengan info status, sasaran/IKU, dan peer.
     */
    private function buildRaCollabGroups(int $tahunId, int $timKerjaId): array
    {
        // IKU semua kolaborasi tim ini dari PK Awal
        $allIkuRows = DB::table('indikator_kinerja_pic as p1')
            ->join('indikator_kinerja as iku', 'iku.id', '=', 'p1.indikator_kinerja_id')
            ->join('sasaran', 'sasaran.id', '=', 'iku.sasaran_id')
            ->join('perjanjian_kinerja', 'perjanjian_kinerja.id', '=', 'sasaran.perjanjian_kinerja_id')
            ->where('perjanjian_kinerja.tahun_anggaran_id', $tahunId)
            ->where('perjanjian_kinerja.jenis', 'awal')
            ->where('p1.tim_kerja_id', $timKerjaId)
            ->select('p1.indikator_kinerja_id')
            ->pluck('p1.indikator_kinerja_id')
            ->all();

        if (empty($allIkuRows)) {
            return [];
        }

        // Kelompokkan IKU berdasarkan peer
        $groupMap = []; // 'null' | 'peerID' => [iku_id, ...]
        foreach ($allIkuRows as $ikuId) {
            $otherPics = DB::table('indikator_kinerja_pic')
                ->where('indikator_kinerja_id', $ikuId)
                ->where('tim_kerja_id', '!=', $timKerjaId)
                ->pluck('tim_kerja_id')
                ->all();

            if (empty($otherPics)) {
                $groupMap['null'][] = $ikuId;
            } else {
                foreach ($otherPics as $peerId) {
                    $groupMap[(string) $peerId][] = $ikuId;
                }
            }
        }

        // Peer info
        $peerIds = collect(array_keys($groupMap))->filter(fn ($k) => $k !== 'null')->map(fn ($k) => (int) $k)->all();
        $peersById = TimKerja::whereIn('id', $peerIds)->get()->keyBy('id');

        // Load/create RA records untuk setiap kelompok
        $myRas = RencanaAksi::where('tahun_anggaran_id', $tahunId)
            ->where('tim_kerja_id', $timKerjaId)
            ->get()
            ->keyBy(fn ($ra) => $ra->peer_tim_kerja_id === null ? 'null' : (string) $ra->peer_tim_kerja_id);

        // Load RA peer untuk info collaborator
        $peerRas = RencanaAksi::with('timKerja:id,nama_singkat,nama')
            ->where('tahun_anggaran_id', $tahunId)
            ->whereIn('tim_kerja_id', $peerIds)
            ->get();

        $result = [];
        $created = auth()->user();

        foreach ($groupMap as $peerKey => $ikuIds) {
            $peerId = $peerKey === 'null' ? null : (int) $peerKey;
            $peerInfo = $peerId ? $peersById->get($peerId) : null;

            // Auto-create RA untuk kelompok ini jika belum ada
            $myRa = $myRas->get($peerKey);
            if (! $myRa) {
                $myRa = RencanaAksi::create([
                    'tahun_anggaran_id' => $tahunId,
                    'tim_kerja_id' => $timKerjaId,
                    'peer_tim_kerja_id' => $peerId,
                    'status' => 'draft',
                    'created_by' => $created?->id ?? 1,
                ]);
            }

            // Cek peer RA untuk pasangan ini
            $peerRa = $peerId
                ? $peerRas->first(fn ($ra) => $ra->tim_kerja_id === $peerId && $ra->peer_tim_kerja_id === $timKerjaId)
                : null;

            // Hitung sasaran yang relevan untuk kelompok ini:
            // - Sasaran di mana timKerjaId adalah PIC
            // - DAN jika ada peer: sasaran di mana peer juga PIC
            // - DAN jika solo (null peer): sasaran di mana TIDAK ada PIC lain
            if ($peerId !== null) {
                $relevantSasaranIds = Sasaran::whereHas(
                    'indikators.picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId)
                )->whereHas(
                    'indikators.picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $peerId)
                )->pluck('id')->all();
            } else {
                // Solo: sasaran yang merupakan PIC tim ini tapi IKU-nya tidak punya PIC lain
                $relevantSasaranIds = DB::table('sasaran')
                    ->whereIn('id', DB::table('indikator_kinerja')
                        ->join('indikator_kinerja_pic as p1', 'p1.indikator_kinerja_id', '=', 'indikator_kinerja.id')
                        ->where('p1.tim_kerja_id', $timKerjaId)
                        ->whereNotExists(function ($sub) use ($timKerjaId) {
                            $sub->select(DB::raw(1))
                                ->from('indikator_kinerja_pic as p2')
                                ->whereColumn('p2.indikator_kinerja_id', 'indikator_kinerja.id')
                                ->where('p2.tim_kerja_id', '!=', $timKerjaId);
                        })
                        ->pluck('indikator_kinerja.sasaran_id')
                    )
                    ->pluck('id')->all();
            }

            // Kode IKU spesifik untuk group ini — cegah overlap IKU dari sasaran yang sama
            $groupIkuKodes = IndikatorKinerja::whereIn('id', $ikuIds)->pluck('kode')->all();

            // Bersihkan RAI orphan: hapus RAI di semua RA group ini yang kode-nya
            // tidak ada lagi di PK Awal (terjadi saat super admin hapus/ganti IKU,
            // termasuk kasus data lama sebelum mekanisme sinkronisasi otomatis diterapkan).
            // Berlaku untuk semua status RA — entri orphan tidak valid di status apapun.
            if (! empty($groupIkuKodes)) {
                $raIdsToClean = collect([$myRa->id]);
                if ($peerId !== null) {
                    $peerRaId = RencanaAksi::where('tahun_anggaran_id', $tahunId)
                        ->where('tim_kerja_id', $peerId)
                        ->where('peer_tim_kerja_id', $timKerjaId)
                        ->value('id');
                    if ($peerRaId) {
                        $raIdsToClean->push($peerRaId);
                    }
                }
                RencanaAksiIndikator::whereIn('rencana_aksi_id', $raIdsToClean)
                    ->whereNotIn('kode', $groupIkuKodes)
                    ->delete();
            }

            // Auto-populasi RAI dari PK Awal jika belum ada untuk group ini
            $existingRaiCount = RencanaAksiIndikator::whereIn('sasaran_id', $relevantSasaranIds)
                ->whereIn('kode', $groupIkuKodes)
                ->count();
            if ($existingRaiCount === 0) {
                foreach ($ikuIds as $ikuId) {
                    $pkIku = IndikatorKinerja::find($ikuId);
                    if (! $pkIku || ! $pkIku->pic_tim_kerja_id) {
                        continue;
                    }

                    $primaryPicId = $pkIku->pic_tim_kerja_id;

                    if ($primaryPicId === $timKerjaId) {
                        // Tim ini adalah primary PIC → RAI masuk ke RA sendiri
                        $targetRa = $myRa;
                    } elseif ($primaryPicId === $peerId) {
                        // Peer adalah primary PIC → cari/buat RA peer terlebih dahulu
                        $targetRa = RencanaAksi::firstOrCreate(
                            [
                                'tahun_anggaran_id' => $tahunId,
                                'tim_kerja_id' => $peerId,
                                'peer_tim_kerja_id' => $timKerjaId,
                            ],
                            ['status' => 'draft', 'created_by' => auth()->id() ?? 1]
                        );
                    } else {
                        continue;
                    }

                    RencanaAksiIndikator::firstOrCreate(
                        ['rencana_aksi_id' => $targetRa->id, 'kode' => $pkIku->kode],
                        [
                            'sasaran_id' => $pkIku->sasaran_id,
                            'nama' => $pkIku->nama,
                            'satuan' => $pkIku->satuan,
                            'target' => $pkIku->target,
                            'target_tw1' => null,
                            'target_tw2' => null,
                            'target_tw3' => null,
                            'target_tw4' => null,
                            'urutan' => $pkIku->urutan,
                        ]
                    );
                }
            }

            // RA indikators untuk kelompok ini (filter ketat per kode IKU group ini)
            $raInds = RencanaAksiIndikator::whereIn('sasaran_id', $relevantSasaranIds)
                ->whereIn('kode', $groupIkuKodes)
                ->get();
            $raIndIds = $raInds->pluck('id')->all();
            $indCount = $raInds->count();
            $filledCount = $raInds->filter(
                fn ($i) => $i->target_tw1 || $i->target_tw2 || $i->target_tw3 || $i->target_tw4
            )->count();

            $result[] = [
                'peer_id' => $peerId,
                'peer_nama' => $peerInfo?->nama_singkat ?? $peerInfo?->nama ?? 'Mandiri',
                'ra' => [
                    'id' => $myRa->id,
                    'status' => $myRa->status,
                    'rekomendasi_kabag' => $myRa->rekomendasi_kabag,
                ],
                'ra_ind_ids' => $raIndIds,
                'ind_count' => $indCount,
                'filled_count' => $filledCount,
                'collaborator' => ($peerRa && in_array($peerRa->status, ['submitted', 'kabag_approved'])) ? [
                    'submitted_by' => $peerRa->timKerja?->nama_singkat ?? $peerRa->timKerja?->nama,
                    'status' => $peerRa->status,
                ] : null,
                'collab_rejected' => ($peerRa && $peerRa->status === 'rejected') ? [
                    'submitted_by' => $peerRa->timKerja?->nama_singkat ?? $peerRa->timKerja?->nama,
                    'rekomendasi_kabag' => $peerRa->rekomendasi_kabag,
                ] : null,
            ];
        }

        return $result;
    }

    /**
     * Hitung total indikator RA sendiri dan yang sudah terisi target TW (bukan co-PIC).
     *
     * @return array{int, int} [$totalOwn, $filledOwn]
     */
    private function countOwnRaInds(?RencanaAksi $ra): array
    {
        if (! $ra) {
            return [0, 0];
        }

        $inds = $ra->indikators;

        return [
            $inds->count(),
            $inds->filter(fn ($i) => $i->target_tw1 || $i->target_tw2 || $i->target_tw3 || $i->target_tw4)->count(),
        ];
    }

    /**
     * Gabungkan sasaran + IKU dari SEMUA PK dalam koleksi (flat merge by sasaran kode).
     * Digunakan agar semua ketua tim bisa view meski data tersebar di beberapa PK.
     *
     * @param  \Illuminate\Support\Collection<int, PerjanjianKinerja>  $pks
     */
    private function buildMergedPkSasarans($pks): array
    {
        $sasaranMap = [];

        foreach ($pks as $pk) {
            $pk->load([
                'sasarans' => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators.picTimKerjas',
            ]);

            foreach ($pk->sasarans as $s) {
                if (! isset($sasaranMap[$s->kode])) {
                    $sasaranMap[$s->kode] = [
                        'id' => $s->id,
                        'kode' => $s->kode,
                        'nama' => $s->nama,
                        'indikators' => [],
                    ];
                }
                foreach ($s->indikators as $iku) {
                    $sasaranMap[$s->kode]['indikators'][] = [
                        'id' => $iku->id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => [
                            'id' => $t->id,
                            'nama' => $t->nama,
                            'kode' => $t->kode,
                            'nama_singkat' => $t->nama_singkat,
                        ])->toArray(),
                    ];
                }
            }
        }

        ksort($sasaranMap);

        // Buang sasaran orphan (tanpa indikator) agar tidak tampil sebagai baris kosong
        return array_values(array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0));
    }

    /**
     * Load sasaran + IKU dari PK yang diberikan.
     */
    private function buildPkSasarans(PerjanjianKinerja $pk): array
    {
        $pk->load([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
        ]);

        $result = [];
        foreach ($pk->sasarans as $s) {
            $result[] = [
                'id' => $s->id,
                'kode' => $s->kode,
                'nama' => $s->nama,
                'indikators' => $s->indikators->map(fn ($iku) => [
                    'id' => $iku->id,
                    'kode' => $iku->kode,
                    'nama' => $iku->nama,
                    'satuan' => $iku->satuan,
                    'target' => $iku->target,
                    'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => [
                        'id' => $t->id,
                        'nama' => $t->nama,
                        'kode' => $t->kode,
                        'nama_singkat' => $t->nama_singkat,
                    ])->toArray(),
                ])->toArray(),
            ];
        }

        return $result;
    }
}
