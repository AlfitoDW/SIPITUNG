<?php

namespace App\Http\Controllers\KetuaTim;

use App\Exports\PermohonanDanaExport;
use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * KA.TIM (Ketua Tim Kerja) — Approval Step 1
 *
 * KA.TIM PK (TK-PK) melihat semua permohonan lintas tim kerja.
 * KA.TIM non-PK hanya melihat permohonan dari tim kerjanya sendiri
 * atau permohonan di mana dia dipilih sebagai kapokja.
 * Semua KA.TIM hanya bisa menyetujui/menolak permohonan di mana dia
 * sebagai kapokja.
 */
class PermohonanDanaController extends Controller
{
    private function isTkPk(Request $request): bool
    {
        return $request->user()->load('timkerja')->timkerja?->kode === 'TK-PK';
    }

    public function index(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user = $request->user();
        $userId = $user->id;
        $isTkPk = $this->isTkPk($request);

        $baseQuery = PermohonanDana::with(['items', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->when(! $isTkPk, function ($q) use ($user) {
                $q->where(function ($sub) use ($user) {
                    $sub->where('tim_kerja_id', $user->tim_kerja_id)
                        ->orWhere('kapokja_id', $user->id);
                });
            })
            ->orderByDesc('created_at');

        $menunggu = (clone $baseQuery)
            ->where('status', 'submitted')
            ->where('kapokja_id', $userId)
            ->get();

        $permohonan = $baseQuery->get();

        $mapPd = fn ($pd) => [
            'id' => $pd->id,
            'nomor_permohonan' => $pd->nomor_permohonan,
            'keperluan' => $pd->keperluan,
            'judul_pekerjaan' => $pd->judul_pekerjaan,
            'tanggal_mulai' => $pd->tanggal_mulai?->toDateString(),
            'tanggal_selesai' => $pd->tanggal_selesai?->toDateString(),
            'tempat' => $pd->tempat,
            'total_anggaran' => $pd->total_anggaran,
            'status' => $pd->status,
            'status_label' => $pd->status_label,
            'catatan_katim' => $pd->catatan_katim,
            'catatan_kabag' => $pd->catatan_kabag,
            'catatan_ppk' => $pd->catatan_ppk,
            'catatan_pic' => $pd->catatan_pic,
            'catatan_pencairan' => $pd->catatan_pencairan,
            'catatan_penolakan' => $pd->catatan_penolakan,
            'created_at' => $pd->created_at?->toIso8601String(),
            'submitted_at' => $pd->submitted_at?->toIso8601String(),
            // snapshot only
            'created_by_name' => $pd->created_by_name,
            'kapokja_id' => $pd->kapokja_id,
            'kapokja_name' => $pd->kapokja_name,
            'tim_kerja_kode' => $pd->tim_kerja_kode,
            'tim_kerja_nama' => $pd->tim_kerja_nama,
            'katim_approved_by' => $pd->katim_approved_by,
            'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
            'katim_approved_by_name' => $pd->katim_approved_by_name,
            'kabag_approved_by_name' => $pd->kabag_approved_by_name,
            'ppk_approved_by_name' => $pd->ppk_approved_by_name,
            'pic_approved_by_name' => $pd->pic_approved_by_name,
            'dicairkan_by_name' => $pd->dicairkan_by_name,
            'rejected_at' => $pd->rejected_at?->toIso8601String(),
            'rejected_at_step' => $pd->rejected_at_step,
            'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
            'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
            'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
            'next_approver_role' => match ($pd->status) {
                'submitted' => 'KA.TIM',
                'katim_approved' => 'PIC Keuangan',
                'pic_approved' => 'PPK',
                'ppk_approved' => 'Bendahara',
                default => null,
            },
            'next_approver_name' => match ($pd->status) {
                'submitted' => $pd->kapokja_name,
                'katim_approved' => $pd->pic_keuangan_name,
                'pic_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                'ppk_approved' => User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                default => null,
            },
            'items' => $pd->items->map(fn ($item) => [
                'id' => $item->id,
                'kode_akun' => $item->kode_akun,
                'uraian' => $item->uraian,
                'volume' => $item->volume,
                'satuan' => $item->satuan,
                'harga_satuan' => $item->harga_satuan,
                'total' => $item->total,
            ])->values(),
        ];

        return Inertia::render('KetuaTim/PermohonanDana/Approval', [
            'tahun' => $tahun,
            'menunggu' => $menunggu->map($mapPd)->values(),
            'permohonan' => $permohonan->map($mapPd)->values(),
        ]);
    }

    public function show(Request $request, PermohonanDana $pd): Response
    {
        $user = $request->user();

        if (! $this->isTkPk($request)) {
            $canView = $pd->tim_kerja_id === $user->tim_kerja_id || $pd->kapokja_id === $user->id;
            abort_if(! $canView, 403, 'Anda tidak memiliki akses ke permohonan ini.');
        }

        $pd->load([
            'dokumens', 'timKerja',
        ]);

        $items = \App\Models\PermohonanDanaItem::where('permohonan_dana_id', $pd->id)
            ->with(['djaRincianBiaya', 'nominatif'])
            ->get();

        $djaIds = $items->pluck('dja_rincian_biaya_id')->filter()->unique()->values();
        $terpakaiMap = \App\Models\PermohonanDanaItem::whereIn('dja_rincian_biaya_id', $djaIds)
            ->whereHas('permohonanDana', fn ($q) => $q
                ->whereNotIn('status', ['draft', 'rejected'])
                ->where('id', '!=', $pd->id))
            ->selectRaw('dja_rincian_biaya_id, SUM(jumlah_permintaan) as total')
            ->groupBy('dja_rincian_biaya_id')
            ->pluck('total', 'dja_rincian_biaya_id');

        return Inertia::render('KetuaTim/PermohonanDana/Detail', [
            'pd' => [
                'id' => $pd->id,
                'nomor_permohonan' => $pd->nomor_permohonan,
                'keperluan' => $pd->keperluan,
                'judul_pekerjaan' => $pd->judul_pekerjaan,
                'tanggal_mulai' => $pd->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $pd->tanggal_selesai?->toDateString(),
                'jam_pelaksanaan' => $pd->jam_pelaksanaan,
                'tempat' => $pd->tempat,
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'total_anggaran' => $pd->total_anggaran,
                'status' => $pd->status,
                'status_label' => $pd->status_label,
                'catatan_katim' => $pd->catatan_katim,
                'catatan_kabag' => $pd->catatan_kabag,
                'catatan_ppk' => $pd->catatan_ppk,
                'catatan_pic' => $pd->catatan_pic,
                'catatan_pencairan' => $pd->catatan_pencairan,
                'catatan_penolakan' => $pd->catatan_penolakan,
                'created_at' => $pd->created_at?->toIso8601String(),
                'submitted_at' => $pd->submitted_at?->toIso8601String(),
                'created_by_name' => $pd->created_by_name,
                'kapokja_id' => $pd->kapokja_id,
                'kapokja_name' => $pd->kapokja_name,
                'tim_kerja_kode' => $pd->tim_kerja_kode,
                'tim_kerja_nama' => $pd->tim_kerja_nama,
                // Approval timestamps — snapshot only
                'katim_approved_by' => $pd->katim_approved_by,
                'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
                'katim_approved_by_name' => $pd->katim_approved_by_name,
                'kabag_approved_by' => $pd->kabag_approved_by,
                'kabag_approved_at' => $pd->kabag_approved_at?->toIso8601String(),
                'kabag_approved_by_name' => $pd->kabag_approved_by_name,
                'ppk_approved_by' => $pd->ppk_approved_by,
                'ppk_approved_at' => $pd->ppk_approved_at?->toIso8601String(),
                'ppk_approved_by_name' => $pd->ppk_approved_by_name,
                'pic_approved_by' => $pd->pic_approved_by,
                'pic_approved_at' => $pd->pic_approved_at?->toIso8601String(),
                'pic_approved_by_name' => $pd->pic_approved_by_name,
                'dicairkan_by' => $pd->dicairkan_by,
                'dicairkan_at' => $pd->dicairkan_at?->toIso8601String(),
                'dicairkan_by_name' => $pd->dicairkan_by_name,
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step' => $pd->rejected_at_step,
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
                'lpj_file_path' => $pd->lpj_file_path,
                'lpj_file_name' => $pd->lpj_file_name,
                'lpj_uploaded_at' => $pd->lpj_uploaded_at?->toIso8601String(),
                'lpj_uploaded_by_name' => $pd->lpj_uploaded_by_name,
                // DJA
                ...$pd->djaDisplayPayload(),
                'kapokja' => ['id' => $pd->kapokja_id, 'nama_lengkap' => $pd->kapokja_name],
                'pic_keuangan' => ['id' => $pd->pic_keuangan_id, 'nama_lengkap' => $pd->pic_keuangan_name],
                'items' => $items->map(fn ($i) => [
                    'id' => $i->id,
                    'kode_akun' => $i->kode_akun,
                    'uraian' => $i->uraian,
                    'volume' => $i->volume,
                    'satuan' => $i->satuan,
                    'harga_satuan' => $i->harga_satuan,
                    'total' => $i->total,
                    'pagu_total' => $i->djaRincianBiaya?->pagu_total ?? 0,
                    'sbm' => $i->djaRincianBiaya?->harga_satuan ?? $i->harga_satuan,
                    'terpakai' => $terpakaiMap[$i->dja_rincian_biaya_id] ?? 0,
                    'sisa_anggaran' => max(0, ($i->djaRincianBiaya?->pagu_total ?? 0) - ($terpakaiMap[$i->dja_rincian_biaya_id] ?? 0)),
                    'nominatif' => $i->nominatif->map(fn ($n) => [
                        'id' => $n->id,
                        'nama' => $n->nama,
                        'nip' => $n->nip,
                        'nik' => $n->nik,
                        'npwp' => $n->npwp,
                        'gol_ruang' => $n->gol_ruang,
                        'nama_rekening' => $n->nama_rekening,
                        'no_rekening' => $n->no_rekening,
                        'nama_bank' => $n->nama_bank,
                        'email' => $n->email,
                        'pph21_persen' => $n->pph21_persen,
                        'jabatan' => $n->jabatan,
                        'volume' => $n->volume,
                        'harga_satuan' => $n->harga_satuan,
                        'jumlah_bruto' => $n->jumlah_bruto,
                        'jumlah_pajak' => $n->jumlah_pajak,
                        'jumlah_diterima' => $n->jumlah_diterima,
                        'transport' => $n->transport,
                        'uang_harian_jumlah' => $n->uang_harian_jumlah,
                        'fullboard_jumlah' => $n->fullboard_jumlah,
                        'fullday_jumlah' => $n->fullday_jumlah,
                        'representasi' => $n->representasi,
                        'taksi_pp' => $n->taksi_pp,
                        'tiket_pesawat' => $n->tiket_pesawat,
                        'hotel' => $n->hotel,
                        'jumlah_perjadin' => $n->jumlah_perjadin,
                    ])->values(),
                ])->values(),
                'dokumens' => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id,
                    'nama_jenis' => $d->nama_jenis,
                    'nama_file' => $d->nama_file,
                    'path_file' => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function print(Request $request, PermohonanDana $pd): \Illuminate\Http\Response
    {
        $user = $request->user();

        if (! $this->isTkPk($request)) {
            $canView = $pd->tim_kerja_id === $user->tim_kerja_id || $pd->kapokja_id === $user->id;
            abort_if(! $canView, 403, 'Anda tidak memiliki akses ke permohonan ini.');
        }

        return (new PermohonanDanaExport($pd))->download();
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->kapokja_id !== $request->user()->id, 403, 'Hanya kapokja yang dapat menyetujui permohonan ini.');
        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid untuk disetujui.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        \DB::transaction(function () use ($pd, $request) {
            $user = $request->user();
            $pd->update([
                'status' => 'katim_approved',
                'katim_approved_by' => $user->id,
                'katim_approved_by_name' => $user->nama_lengkap,
                'katim_approved_by_nip' => $user->nip,
                'catatan_katim' => $request->catatan,
                'katim_approved_at' => now(),
            ]);
        });

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} disetujui, diteruskan ke PIC Keuangan.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->kapokja_id !== $request->user()->id, 403, 'Hanya kapokja yang dapat menolak permohonan ini.');
        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid untuk ditolak.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        \DB::transaction(function () use ($pd, $request) {
            $pd->update([
                'status' => 'rejected',
                'rejected_at_step' => 'katim',
                'catatan_penolakan' => $request->catatan,
                'rejected_at' => now(),
            ]);

            $pd->rejections()->create([
                'rejected_by' => $request->user()->id,
                'rejected_at_step' => 'katim',
                'catatan' => $request->catatan,
                'rejected_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak, PUMK perlu merevisi.");
    }
}
