<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Exports\PermohonanDanaExport;
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
                // Bukti bayar
                'bukti_bayar_path' => $pd->bukti_bayar_path,
                'bukti_bayar_uploaded_at' => $pd->bukti_bayar_uploaded_at?->toIso8601String(),
                'bukti_bayar_uploaded_by_name' => $pd->bukti_bayar_uploaded_by_name,
                // LPJ
                'lpj_file_path' => $pd->lpj_file_path,
                'lpj_file_name' => $pd->lpj_file_name,
                'lpj_uploaded_at' => $pd->lpj_uploaded_at?->toIso8601String(),
                'lpj_uploaded_by_name' => $pd->lpj_uploaded_by_name,
                // DJA
                ...$pd->djaDisplayPayload(),
                'items' => $items->map(fn ($i) => [
                    'id' => $i->id, 'kode_akun' => $i->kode_akun, 'uraian' => $i->uraian,
                    'volume' => $i->volume, 'satuan' => $i->satuan, 'harga_satuan' => $i->harga_satuan, 'total' => $i->total,
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
                    'id' => $d->id, 'nama_jenis' => $d->nama_jenis, 'nama_file' => $d->nama_file, 'path_file' => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function printPermohonanDana(PermohonanDana $pd): \Illuminate\Http\Response
    {
        return (new PermohonanDanaExport($pd))->download();
    }

    public function bukaKunci(Request $request, PermohonanDana $pd, PermohonanDanaService $service): RedirectResponse
    {
        $request->validate(['alasan' => 'nullable|string|max:1000']);

        $oldStatus = $pd->status;
        $service->bukaKunci($pd, $request->user(), $request->alasan);

        $message = $oldStatus === 'dicairkan'
            ? "Permohonan {$pd->nomor_permohonan} berhasil dibuka kunci. Status dikembalikan ke Menunggu Pencairan (PPK Approved)."
            : "Permohonan {$pd->nomor_permohonan} berhasil dibuka kunci. Status dikembalikan ke Revisi.";

        return back()->with('success', $message);
    }

    public function pertanggungjawaban(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $base = $tahun ? PermohonanDana::with('timKerja')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'dicairkan')
            ->orderByDesc('dicairkan_at') : null;

        $permohonan = $base ? $base->get()->map(function ($pd) {
            return [
                'id' => $pd->id,
                'nomor_permohonan' => $pd->nomor_permohonan,
                'keperluan' => $pd->keperluan,
                'total_anggaran' => $pd->total_anggaran,
                'dicairkan_at' => $pd->dicairkan_at?->toDateString(),
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'tim_kerja_nama' => $pd->tim_kerja_nama,
                'lpj_uploaded_at' => $pd->lpj_uploaded_at?->toIso8601String(),
                'lpj_uploaded_by_name' => $pd->lpj_uploaded_by_name,
                'lpj_file_name' => $pd->lpj_file_name,
            ];
        }) : collect();

        return Inertia::render('SuperAdmin/Pertanggungjawaban', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }
}
