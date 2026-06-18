<?php

namespace App\Http\Controllers\Bendahara;

use App\Exports\NominatifExport;
use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use App\Services\PermohonanDanaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Bendahara — Step 4 (Pencairan)
 *
 * ppk_approved → upload bukti bayar → dicairkan
 */
class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $baseQuery = PermohonanDana::with(['items'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at');

        $mapFn = function ($pd) {
            return array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                // snapshot only
                'kapokja_name' => $pd->kapokja_name,
                'pic_keuangan_name' => $pd->pic_keuangan_name,
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
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
            ]);
        };

        $perluDiproses = (clone $baseQuery)
            ->where('status', 'ppk_approved')
            ->get()
            ->map($mapFn);

        $semuaAjuan = (clone $baseQuery)
            ->get()
            ->map($mapFn);

        $diajukan = (clone $baseQuery)
            ->whereIn('status', ['submitted', 'katim_approved', 'pic_approved', 'ppk_approved'])
            ->get()
            ->map($mapFn);

        $revisi = (clone $baseQuery)
            ->where('status', 'rejected')
            ->get()
            ->map($mapFn);

        $selesai = (clone $baseQuery)
            ->where('status', 'dicairkan')
            ->get()
            ->map($mapFn);

        return Inertia::render('Bendahara/PermohonanDana/Index', [
            'tahun' => $tahun,
            'perluDiproses' => $perluDiproses,
            'semuaAjuan' => $semuaAjuan,
            'diajukan' => $diajukan,
            'revisi' => $revisi,
            'selesai' => $selesai,
        ]);
    }

    public function show(PermohonanDana $pd): Response
    {
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

        return Inertia::render('Bendahara/PermohonanDana/Detail', [
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
                'kabag_approved_by_name' => $pd->kabag_approved_by_name,
                'ppk_approved_by_name' => $pd->ppk_approved_by_name,
                'pic_approved_by_name' => $pd->pic_approved_by_name,
                'dicairkan_by_name' => $pd->dicairkan_by_name,
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step' => $pd->rejected_at_step,
                'dibuka_kunci_by' => $pd->dibuka_kunci_by,
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
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
                        'id' => $n->id, 'nama' => $n->nama, 'nip' => $n->nip, 'nik' => $n->nik, 'npwp' => $n->npwp,
                        'gol_ruang' => $n->gol_ruang, 'nama_rekening' => $n->nama_rekening, 'no_rekening' => $n->no_rekening,
                        'nama_bank' => $n->nama_bank, 'email' => $n->email, 'pph21_persen' => $n->pph21_persen,
                        'jabatan' => $n->jabatan, 'volume' => $n->volume, 'harga_satuan' => $n->harga_satuan,
                        'jumlah_bruto' => $n->jumlah_bruto, 'jumlah_pajak' => $n->jumlah_pajak,
                        'jumlah_diterima' => $n->jumlah_diterima, 'transport' => $n->transport,
                        'uang_harian_jumlah' => $n->uang_harian_jumlah, 'fullboard_jumlah' => $n->fullboard_jumlah,
                        'fullday_jumlah' => $n->fullday_jumlah, 'representasi' => $n->representasi,
                        'taksi_pp' => $n->taksi_pp, 'tiket_pesawat' => $n->tiket_pesawat, 'hotel' => $n->hotel,
                        'jumlah_perjadin' => $n->jumlah_perjadin,
                    ])->values(),
                ])->values(),
                'dokumens' => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id,
                    'nama_jenis' => $d->nama_jenis,
                    'nama_file' => $d->nama_file,
                    'path_file' => $d->path_file,
                ])->values(),
                // Bukti bayar
                'bukti_bayar_path' => $pd->bukti_bayar_path,
                'bukti_bayar_uploaded_at' => $pd->bukti_bayar_uploaded_at?->toIso8601String(),
                'bukti_bayar_uploaded_by_name' => $pd->bukti_bayar_uploaded_by_name,
            ],
        ]);
    }

    public function print(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'items', 'dokumens',
        ]);

        return Inertia::render('Bendahara/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
    }

    public function setujui(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Hanya permohonan berstatus Disetujui PPK yang dapat dicairkan.');

        $request->validate([
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        \DB::transaction(function () use ($pd, $request) {
            $user = $request->user();
            $pd->update([
                'status' => 'dicairkan',
                'dicairkan_by' => $user->id,
                'dicairkan_by_name' => $user->nama_lengkap,
                'dicairkan_by_nip' => $user->nip,
                'catatan_pencairan' => $request->catatan,
                'dicairkan_at' => now(),
            ]);
        });

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} berhasil disetujui. Silakan upload bukti bayar jika diperlukan.");
    }

    public function uploadBuktiBayar(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'dicairkan', 422, 'Hanya permohonan berstatus Dicairkan yang dapat diupload bukti bayarnya.');

        $request->validate([
            'bukti_bayar' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('bukti_bayar');
        $path = $file->store('bukti-bayar/'.date('Y/m'), 'local');

        \DB::transaction(function () use ($pd, $path, $file, $request) {
            $user = $request->user();
            $pd->update([
                'bukti_bayar_path' => $path,
                'bukti_bayar_nama_file' => $file->getClientOriginalName(),
                'bukti_bayar_uploaded_at' => now(),
                'bukti_bayar_uploaded_by' => $user->id,
                'bukti_bayar_uploaded_by_name' => $user->nama_lengkap,
            ]);
        });

        return back()->with('success', "Bukti bayar untuk permohonan {$pd->nomor_permohonan} berhasil diupload.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Hanya permohonan berstatus Disetujui PPK yang dapat ditolak.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        \DB::transaction(function () use ($pd, $request) {
            $pd->update([
                'status' => 'rejected',
                'rejected_at_step' => 'bendahara',
                'catatan_penolakan' => $request->catatan,
                'rejected_at' => now(),
            ]);

            $pd->rejections()->create([
                'rejected_by' => $request->user()->id,
                'rejected_at_step' => 'bendahara',
                'catatan' => $request->catatan,
                'rejected_at' => now(),
            ]);
        });

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak, dikembalikan ke PUMK.");
    }

    public function hapusBuktiBayar(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'dicairkan', 422, 'Hanya permohonan berstatus Selesai yang dapat dihapus bukti bayarnya.');
        abort_if(! $pd->bukti_bayar_path, 422, 'Tidak ada bukti bayar untuk dihapus.');

        // Hapus file dari storage
        if (Storage::disk('local')->exists($pd->bukti_bayar_path)) {
            Storage::disk('local')->delete($pd->bukti_bayar_path);
        }

        // Revert ke status sebelum dicairkan
        \DB::transaction(function () use ($pd) {
            $pd->update([
                'status' => 'ppk_approved',
                'bukti_bayar_path' => null,
                'bukti_bayar_nama_file' => null,
                'bukti_bayar_uploaded_at' => null,
                'bukti_bayar_uploaded_by' => null,
                'dicairkan_by' => null,
                'dicairkan_at' => null,
                'catatan_pencairan' => null,
            ]);
        });

        return back()->with('success', "Bukti bayar permohonan {$pd->nomor_permohonan} dihapus. Status dikembalikan ke Menunggu Pencairan.");
    }

    public function bukaKunci(Request $request, PermohonanDana $pd, PermohonanDanaService $service): RedirectResponse
    {
        $request->validate(['alasan' => 'nullable|string|max:1000']);

        $service->bukaKunci($pd, $request->user(), $request->alasan);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} berhasil dibuka kunci. Status dikembalikan ke Revisi.");
    }

    // ─── Download Daftar Nominatif ────────────────────────────────────────────────

    public function nominatif(PermohonanDana $pd)
    {
        abort_if(! in_array($pd->status, ['pic_approved', 'ppk_approved', 'dicairkan']), 403, 'Nominatif hanya tersedia setelah diverifikasi PIC.');

        return (new NominatifExport($pd))->download();
    }
}
