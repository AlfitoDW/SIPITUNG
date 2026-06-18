<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Services\PermohonanDanaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganController extends Controller
{
    public function permohonanDana(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $baseQuery = PermohonanDana::with(['items'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at');

        $mapFn = function ($pd) {
            return array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                // snapshot only — no fallback live
                'created_by_name' => $pd->created_by_name,
                'katim_approved_by_name' => $pd->katim_approved_by_name,
                'kabag_approved_by_name' => $pd->kabag_approved_by_name,
                'ppk_approved_by_name' => $pd->ppk_approved_by_name,
                'pic_approved_by_name' => $pd->pic_approved_by_name,
                'dicairkan_by_name' => $pd->dicairkan_by_name,
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
                    'pic_approved' => \App\Models\User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                    'ppk_approved' => \App\Models\User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                    default => null,
                },
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
            ]);
        };

        $semuaAjuan = (clone $baseQuery)
            ->get()
            ->map($mapFn);

        $draft = (clone $baseQuery)
            ->where('status', 'draft')
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

        return Inertia::render('SuperAdmin/Keuangan/PermohonanDana/Index', [
            'tahun' => $tahun,
            'permohonan' => $semuaAjuan,
            'timKerjaList' => TimKerja::active()->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function showPermohonanDana(PermohonanDana $pd): Response
    {
        $pd->load([
            'dokumens', 'timKerja',
        ]);

        $items = \App\Models\PermohonanDanaItem::where('permohonan_dana_id', $pd->id)
            ->with('djaRincianBiaya')
            ->get();

        $djaIds = $items->pluck('dja_rincian_biaya_id')->filter()->unique()->values();
        $terpakaiMap = \App\Models\PermohonanDanaItem::whereIn('dja_rincian_biaya_id', $djaIds)
            ->whereHas('permohonanDana', fn ($q) => $q
                ->whereNotIn('status', ['draft', 'rejected'])
                ->where('id', '!=', $pd->id))
            ->selectRaw('dja_rincian_biaya_id, SUM(jumlah_permintaan) as total')
            ->groupBy('dja_rincian_biaya_id')
            ->pluck('total', 'dja_rincian_biaya_id');

        return Inertia::render('SuperAdmin/Keuangan/PermohonanDana/Detail', [
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
                'tim_kerja' => $pd->timKerja ? ['id' => $pd->timKerja->id, 'nama' => $pd->timKerja->nama, 'kode' => $pd->timKerja->kode] : null,
                'kapokja' => ['id' => $pd->kapokja_id, 'nama_lengkap' => $pd->kapokja_name],
                'pic_keuangan' => ['id' => $pd->pic_keuangan_id, 'nama_lengkap' => $pd->pic_keuangan_name],
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
                'dibuka_kunci_by' => $pd->dibuka_kunci_by,
                'dibuka_kunci_at' => $pd->dibuka_kunci_at?->toIso8601String(),
                'dibuka_kunci_by_name' => $pd->dibuka_kunci_by_name,
                'alasan_pembukaan_kunci' => $pd->alasan_pembukaan_kunci,
                // DJA
                ...$pd->djaDisplayPayload(),
                'items' => $items->map(fn ($i) => [
                    'id' => $i->id, 'kode_akun' => $i->kode_akun, 'uraian' => $i->uraian,
                    'volume' => $i->volume, 'satuan' => $i->satuan, 'harga_satuan' => $i->harga_satuan, 'total' => $i->total,
                    'pagu_total' => $i->djaRincianBiaya?->pagu_total ?? 0,
                    'sbm' => $i->djaRincianBiaya?->harga_satuan ?? $i->harga_satuan,
                    'terpakai' => $terpakaiMap[$i->dja_rincian_biaya_id] ?? 0,
                    'sisa_anggaran' => max(0, ($i->djaRincianBiaya?->pagu_total ?? 0) - ($terpakaiMap[$i->dja_rincian_biaya_id] ?? 0)),
                ])->values(),
                'dokumens' => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id, 'nama_jenis' => $d->nama_jenis, 'nama_file' => $d->nama_file, 'path_file' => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function printPermohonanDana(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'items', 'dokumens',
        ]);

        return Inertia::render('Pumk/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
    }

    public function bukaKunci(Request $request, PermohonanDana $pd, PermohonanDanaService $service): RedirectResponse
    {
        $request->validate(['alasan' => 'nullable|string|max:1000']);

        $service->bukaKunci($pd, $request->user(), $request->alasan);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} berhasil dibuka kunci. Status dikembalikan ke Revisi.");
    }
}
