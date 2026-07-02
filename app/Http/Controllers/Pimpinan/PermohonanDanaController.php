<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItem;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pimpinan — Keuangan
 *
 * Kabag Umum: view-only (tidak ada approve/reject)
 * PPK:        pic_approved → ppk_approved
 */
class PermohonanDanaController extends Controller
{
    private function statusForRole(): string
    {
        $user = auth()->user();
        if ($user->isPimpinanKabagUmum()) {
            return 'katim_approved';
        }
        if ($user->isPimpinanPPK()) {
            return 'pic_approved';
        }
        abort(403, 'Pimpinan tidak terdaftar sebagai Kabag Umum atau PPK.');
    }

    private function nextStatus(): string
    {
        $user = auth()->user();
        if ($user->isPimpinanKabagUmum()) {
            return 'kabag_approved';
        }
        if ($user->isPimpinanPPK()) {
            return 'ppk_approved';
        }
        abort(403, 'Pimpinan tidak terdaftar sebagai Kabag Umum atau PPK.');
    }

    private function approvalField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_by'
            : 'ppk_approved_by';
    }

    private function approvalAtField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_at'
            : 'ppk_approved_at';
    }

    private function catatanField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'catatan_kabag'
            : 'catatan_ppk';
    }

    private function rejectedStep(): string
    {
        return auth()->user()->isPimpinanKabagUmum() ? 'kabag' : 'ppk';
    }

    private function approvalNameField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_by_name'
            : 'ppk_approved_by_name';
    }

    private function approvalNipField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_by_nip'
            : 'ppk_approved_by_nip';
    }

    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $status = $this->statusForRole();
        $isKabag = auth()->user()->isPimpinanKabagUmum();

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

        $perluDiproses = $isKabag
            ? collect()
            : (clone $baseQuery)
                ->where('status', $status)
                ->get()
                ->map($mapFn);

        $semuaAjuan = (clone $baseQuery)
            ->get()
            ->map($mapFn);

        $diajukanStatuses = ['submitted', 'katim_approved', 'pic_approved', 'ppk_approved'];
        $diajukan = (clone $baseQuery)
            ->whereIn('status', $diajukanStatuses)
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

        return Inertia::render('Pimpinan/PermohonanDana/Index', [
            'tahun' => $tahun,
            'menunggu' => $perluDiproses,
            'riwayat' => $semuaAjuan,
            'role' => auth()->user()->pimpinan_type,
        ]);
    }

    public function show(PermohonanDana $pd): Response
    {
        $pd->load([
            'dokumens', 'timKerja',
        ]);

        $items = PermohonanDanaItem::where('permohonan_dana_id', $pd->id)
            ->with(['djaRincianBiaya', 'nominatif'])
            ->get();

        $djaIds = $items->pluck('dja_rincian_biaya_id')->filter()->unique()->values();
        $terpakaiMap = PermohonanDanaItem::whereIn('dja_rincian_biaya_id', $djaIds)
            ->whereHas('permohonanDana', fn ($q) => $q
                ->whereNotIn('status', ['draft', 'rejected'])
                ->where('id', '!=', $pd->id))
            ->selectRaw('dja_rincian_biaya_id, SUM(jumlah_permintaan) as total')
            ->groupBy('dja_rincian_biaya_id')
            ->pluck('total', 'dja_rincian_biaya_id');

        return Inertia::render('Pimpinan/PermohonanDana/Detail', [
            'role' => auth()->user()->pimpinan_type,
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
                'katim_approved_by' => $pd->katim_approved_by,
                'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
                'katim_approved_by_name' => $pd->katim_approved_by_name,
                'kabag_approved_by_name' => $pd->kabag_approved_by_name,
                'ppk_approved_by_name' => $pd->ppk_approved_by_name,
                'pic_approved_by_name' => $pd->pic_approved_by_name,
                'dicairkan_by_name' => $pd->dicairkan_by_name,
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step' => $pd->rejected_at_step,
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
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
            ],
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->isPimpinanPPK(), 403, 'Hanya PPK yang berhak melakukan approval permohonan dana.');
        abort_if($pd->status !== 'pic_approved', 422, 'Status permohonan harus "Diverifikasi PIC" untuk disetujui PPK.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        \DB::transaction(function () use ($pd, $request, $user) {
            $fresh = PermohonanDana::lockForUpdate()->find($pd->id);
            abort_if($fresh->status !== 'pic_approved', 409, 'Status berubah, silakan refresh halaman.');

            $fresh->update([
                'status' => $this->nextStatus(),
                $this->approvalField() => $user->id,
                $this->approvalNameField() => $user->nama_lengkap,
                $this->approvalNipField() => $user->nip,
                $this->catatanField() => $request->catatan,
                $this->approvalAtField() => now(),
            ]);
        });

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} disetujui, diteruskan ke Bendahara.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->isPimpinanPPK(), 403, 'Hanya PPK yang berhak melakukan reject permohonan dana.');
        abort_if($pd->status !== 'pic_approved', 422, 'Status permohonan harus "Diverifikasi PIC" untuk ditolak.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        \DB::transaction(function () use ($pd, $request, $user) {
            $fresh = PermohonanDana::lockForUpdate()->find($pd->id);
            abort_if($fresh->status !== 'pic_approved', 409, 'Status berubah, silakan refresh halaman.');

            $fresh->update([
                'status' => 'rejected',
                'rejected_at_step' => $this->rejectedStep(),
                'catatan_penolakan' => $request->catatan,
                'rejected_at' => now(),
            ]);

            $fresh->rejections()->create([
                'rejected_by' => $user->id,
                'rejected_at_step' => $this->rejectedStep(),
                'catatan' => $request->catatan,
                'rejected_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
