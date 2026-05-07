<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganController extends Controller
{
    public function permohonanDana(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $permohonan = PermohonanDana::with([
                'timKerja',
                'items',
                'createdBy',
                'katimApprovedBy',
                'kabagApprovedBy',
                'ppkApprovedBy',
                'picApprovedBy',
                'dicairkanBy',
            ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                'created_by_name' => $pd->createdBy?->nama_lengkap,
                'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap,
                'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap,
                'ppk_approved_by_name' => $pd->ppkApprovedBy?->nama_lengkap,
                'pic_approved_by_name' => $pd->picApprovedBy?->nama_lengkap,
                'dicairkan_by_name' => $pd->dicairkanBy?->nama_lengkap,
            ]));

        return Inertia::render('SuperAdmin/Keuangan/PermohonanDana/Index', [
            'tahun'       => $tahun,
            'permohonan'  => $permohonan,
            'timKerjaList' => TimKerja::active()->orderBy('nama')->get(['id', 'nama']),
        ]);
    }

    public function showPermohonanDana(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens', 'createdBy', 'timKerja',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('SuperAdmin/Keuangan/PermohonanDana/Detail', [
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
                'tim_kerja'              => $pd->timKerja ? ['id' => $pd->timKerja->id, 'nama' => $pd->timKerja->nama, 'kode' => $pd->timKerja->kode] : null,
                'kapokja'                => $pd->kapokja ? ['id' => $pd->kapokja->id, 'nama_lengkap' => $pd->kapokja->nama_lengkap] : null,
                'pic_keuangan'           => $pd->picKeuangan ? ['id' => $pd->picKeuangan->id, 'nama_lengkap' => $pd->picKeuangan->nama_lengkap] : null,
                // Approval timestamps
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
                // DJA
                'dja_program'  => $pd->djaProgram ? ['nama' => $pd->djaProgram->nama] : null,
                'dja_sasaran'  => $pd->djaSasaran ? ['nama' => $pd->djaSasaran->nama] : null,
                'dja_kro'      => $pd->djaKro ? ['kode' => $pd->djaKro->kode, 'nama' => $pd->djaKro->nama] : null,
                'dja_ro'       => $pd->djaRo ? ['nama' => $pd->djaRo->nama] : null,
                'dja_komponen' => $pd->djaKomponen ? ['nama' => $pd->djaKomponen->nama] : null,
                'dja_kegiatan' => $pd->djaKegiatan ? ['kode' => $pd->djaKegiatan->kode, 'nama' => $pd->djaKegiatan->nama] : null,
                'items'        => $pd->items->map(fn ($i) => [
                    'id' => $i->id, 'kode_akun' => $i->kode_akun, 'uraian' => $i->uraian,
                    'volume' => $i->volume, 'satuan' => $i->satuan, 'harga_satuan' => $i->harga_satuan, 'total' => $i->total,
                ])->values(),
                'dokumens'     => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id, 'nama_jenis' => $d->nama_jenis, 'nama_file' => $d->nama_file, 'path_file' => $d->path_file,
                ])->values(),
            ],
        ]);
    }

    public function printPermohonanDana(PermohonanDana $pd): Response
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
}
