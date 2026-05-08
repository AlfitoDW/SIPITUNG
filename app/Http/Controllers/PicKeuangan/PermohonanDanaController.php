<?php

namespace App\Http\Controllers\PicKeuangan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PIC Keuangan — Approval Step 4
 *
 * ppk_approved → pic_approved  (atau rejected)
 */
class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $menunggu = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'ppk_approved')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        $riwayat = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('pic_approved_by', auth()->id())
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        return Inertia::render('PicKeuangan/PermohonanDana/Index', [
            'tahun'    => $tahun,
            'menunggu' => $menunggu,
            'riwayat'  => $riwayat,
        ]);
    }

    public function show(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens', 'createdBy',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('PicKeuangan/PermohonanDana/Detail', [
            'pd' => [
                'id'                     => $pd->id,
                'nomor_permohonan'       => $pd->nomor_permohonan,
                'keperluan'              => $pd->keperluan,
                'judul_pekerjaan'        => $pd->judul_pekerjaan,
                'tanggal_mulai'          => $pd->tanggal_mulai?->toDateString(),
                'tanggal_selesai'        => $pd->tanggal_selesai?->toDateString(),
                'jam_pelaksanaan'        => $pd->jam_pelaksanaan,
                'tempat'                 => $pd->tempat,
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'total_anggaran'         => $pd->total_anggaran,
                'status'                 => $pd->status,
                'status_label'           => $pd->status_label,
                'catatan_katim'          => $pd->catatan_katim,
                'catatan_kabag'          => $pd->catatan_kabag,
                'catatan_ppk'            => $pd->catatan_ppk,
                'catatan_pic'            => $pd->catatan_pic,
                'catatan_pencairan'      => $pd->catatan_pencairan,
                'catatan_penolakan'      => $pd->catatan_penolakan,
                'created_at'             => $pd->created_at?->toIso8601String(),
                'submitted_at'           => $pd->submitted_at?->toIso8601String(),
                'created_by_name'        => $pd->createdBy?->nama_lengkap,
                'kapokja_id'             => $pd->kapokja_id,
                'kapokja_name'           => $pd->kapokja?->nama_lengkap,
                'tim_kerja_kode'         => $pd->timKerja?->kode,
                'tim_kerja_nama'         => $pd->timKerja?->nama,
                'katim_approved_by'      => $pd->katim_approved_by,
                'katim_approved_at'      => $pd->katim_approved_at?->toIso8601String(),
                'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap,
                'kabag_approved_by'      => $pd->kabag_approved_by,
                'kabag_approved_at'      => $pd->kabag_approved_at?->toIso8601String(),
                'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap,
                'ppk_approved_by'        => $pd->ppk_approved_by,
                'ppk_approved_at'        => $pd->ppk_approved_at?->toIso8601String(),
                'ppk_approved_by_name'   => $pd->ppkApprovedBy?->nama_lengkap,
                'pic_approved_by'        => $pd->pic_approved_by,
                'pic_approved_at'        => $pd->pic_approved_at?->toIso8601String(),
                'pic_approved_by_name'   => $pd->picApprovedBy?->nama_lengkap,
                'dicairkan_by'           => $pd->dicairkan_by,
                'dicairkan_at'           => $pd->dicairkan_at?->toIso8601String(),
                'dicairkan_by_name'      => $pd->dicairkanBy?->nama_lengkap,
                'rejected_at'            => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step'       => $pd->rejected_at_step,
                'dja_program'            => $pd->djaProgram  ? ['nama' => $pd->djaProgram->nama]  : null,
                'dja_sasaran'            => $pd->djaSasaran  ? ['nama' => $pd->djaSasaran->nama]  : null,
                'dja_kro'                => $pd->djaKro      ? ['kode' => $pd->djaKro->kode, 'nama' => $pd->djaKro->nama] : null,
                'dja_ro'                 => $pd->djaRo       ? ['nama' => $pd->djaRo->nama]       : null,
                'dja_komponen'           => $pd->djaKomponen ? ['nama' => $pd->djaKomponen->nama] : null,
                'dja_kegiatan'           => $pd->djaKegiatan ? ['kode' => $pd->djaKegiatan->kode, 'nama' => $pd->djaKegiatan->nama] : null,
                'kapokja'                => $pd->kapokja     ? ['id' => $pd->kapokja->id, 'nama_lengkap' => $pd->kapokja->nama_lengkap] : null,
                'pic_keuangan'           => $pd->picKeuangan ? ['id' => $pd->picKeuangan->id, 'nama_lengkap' => $pd->picKeuangan->nama_lengkap] : null,
                'items'                  => $pd->items->map(fn ($i) => [
                    'id'           => $i->id,
                    'kode_akun'    => $i->kode_akun,
                    'uraian'       => $i->uraian,
                    'volume'       => $i->volume,
                    'satuan'       => $i->satuan,
                    'harga_satuan' => $i->harga_satuan,
                    'total'        => $i->total,
                ])->values(),
                'dokumens'               => $pd->dokumens->map(fn ($d) => [
                    'id'         => $d->id,
                    'nama_jenis' => $d->nama_jenis,
                    'nama_file'  => $d->nama_file,
                    'path_file'  => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function print(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Pumk/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status'          => 'pic_approved',
            'pic_approved_by' => $request->user()->id,
            'catatan_pic'     => $request->catatan,
            'pic_approved_at' => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} diverifikasi, diteruskan ke Bendahara untuk pencairan.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pd->update([
            'status'            => 'rejected',
            'pic_approved_by'   => $request->user()->id,
            'catatan_pic'       => $request->catatan,
            'pic_approved_at'   => now(),
            'rejected_at_step'  => 'pic',
            'catatan_penolakan' => $request->catatan,
            'rejected_at'       => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
