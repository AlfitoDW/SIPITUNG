# Bahan Bimbingan Rancangan AI Validasi Permohonan Dana

## 1. Judul Penelitian

**Rancang Bangun Sistem Informasi Pertanggungjawaban Kegiatan dengan Rekomendasi Validasi Permohonan Dana Berbasis Artificial Intelligence pada LLDIKTI Wilayah III**

## 2. Konteks Sistem Existing

Sistem SIPITUNG sudah memiliki modul permohonan dana, approval, pencairan, dan upload LPJ sederhana.

Alur existing yang sudah dicek dari sistem:

```text
PUMK submit
-> KA.TIM/Kapokja approve
-> PIC Keuangan verifikasi
-> PPK approve
-> Bendahara cairkan
-> PUMK upload LPJ
```

Catatan existing:

- LPJ saat ini masih berupa upload file pada permohonan dana.
- Belum ada status verifikasi LPJ yang kuat.
- PIC Keuangan dan Bendahara sudah memiliki halaman monitoring/verifikasi LPJ, tetapi aksi verifikasi LPJ masih perlu diperjelas dalam rancangan target.
- Modul perencanaan tidak dikaitkan langsung dengan permohonan dana dalam alur existing.

## 3. Arah Pengembangan

Penelitian diarahkan untuk mengembangkan sistem informasi pertanggungjawaban kegiatan yang mengelola siklus permohonan dana sampai LPJ, dengan fitur rekomendasi AI untuk validasi permohonan dana sebelum approval/pencairan.

Posisi utama rancangan:

- Modul utama: sistem informasi pertanggungjawaban kegiatan.
- Fitur pendukung: rekomendasi validasi permohonan dana berbasis AI.
- Keputusan akhir: tetap dilakukan oleh reviewer manusia.
- Istilah SPK dihindari dulu agar tidak menggeser judul yang sudah di-ACC.

## 4. Ruang Lingkup Sementara

- AI digunakan untuk rekomendasi validasi permohonan dana.
- AI tidak mengambil keputusan approval otomatis.
- AI dijalankan otomatis saat PUMK submit permohonan dana.
- Reviewer wajib melihat hasil AI sebelum approval.
- Reviewer tetap bisa override hasil AI dengan alasan.
- LPJ dibuat setelah kegiatan selesai.
- LPJ berupa satu file PDF sebagai bukti upload.
- LPJ diverifikasi manual oleh PIC Keuangan.
- AI tidak membaca/OCR file LPJ.
- AI tidak dikaitkan dengan modul perencanaan karena proses existing tidak berkorelasi langsung.

## 5. Alur Target Pengembangan

```text
PUMK submit permohonan dana
-> sistem menjalankan validasi AI
-> KA.TIM melihat rekomendasi AI
-> KA.TIM approve/reject
-> PIC Keuangan verifikasi
-> PPK approve
-> Bendahara cairkan
-> kegiatan dilaksanakan
-> PUMK upload PDF LPJ
-> PIC Keuangan verifikasi LPJ
-> LPJ selesai/rejected
```

Perilaku AI dalam alur target:

- Submit PUMK tetap lanjut ke status `submitted`.
- Approval KA.TIM menunggu hasil validasi AI selesai.
- Jika AI gagal secara teknis, reviewer boleh override dengan alasan wajib.
- Jika AI memberi rekomendasi risiko sedang/tinggi, reviewer tetap boleh approve dengan alasan wajib.

## 6. Rancangan Output AI

Output AI terdiri dari:

- Skor risiko 0-100.
- Status rekomendasi.
- Daftar temuan.
- Alasan rekomendasi.

Status rekomendasi:

- `direkomendasikan`
- `perlu_review`
- `tidak_direkomendasikan`

Threshold awal:

| Skor Risiko | Status |
|---|---|
| 0-39 | `direkomendasikan` |
| 40-69 | `perlu_review` |
| 70-100 | `tidak_direkomendasikan` |

## 7. Kategori Validasi AI

Kategori validasi:

1. Ketersediaan pagu.
2. Kelengkapan dokumen.
3. Kewajaran nominal/volume.
4. Konsistensi data kegiatan.
5. Risiko duplikasi permohonan.

Bobot awal:

| Kategori | Bobot |
|---|---:|
| Pagu | 35% |
| Dokumen | 25% |
| Kewajaran nominal/volume | 20% |
| Konsistensi kegiatan | 10% |
| Duplikasi | 10% |

Catatan:

- Bobot ini masih perlu dirundingkan dengan dosen pembimbing dan/atau pihak kantor.
- Kategori pagu dan dokumen bersifat lebih deterministik.
- Kategori kewajaran, konsistensi, dan duplikasi dapat dibantu AI untuk interpretasi risiko.

## 8. Pendekatan AI

Pendekatan sementara:

```text
Hybrid rule-based scoring + LLM/API
```

Rule-based digunakan untuk:

- Mengecek pagu.
- Mengecek dokumen wajib.
- Mengecek volume/nominatif.
- Menghitung sinyal risiko awal.

LLM/API digunakan untuk:

- Menyusun alasan rekomendasi.
- Merangkum temuan.
- Membantu reviewer memahami risiko.

Catatan:

- Istilah SPK dihindari dulu agar tidak menggeser judul utama.
- Fitur ini disebut sebagai fitur rekomendasi AI sebagai alat bantu reviewer.
- Jika penggunaan API eksternal tidak disetujui, fallback perlu dibahas dengan dosen pembimbing dan pihak kantor.

## 9. Privasi dan Data AI

Data yang dikirim ke AI dibatasi pada metadata:

- Ringkasan permohonan.
- Item biaya.
- Total permintaan.
- Sisa pagu.
- Jenis dokumen yang diunggah.
- Sinyal risiko rule-based.

Data yang tidak dikirim:

- File PDF asli.
- NIK.
- NPWP.
- Nomor rekening.
- Data pribadi nominatif sensitif.
- Isi dokumen LPJ.

Catatan:

- Penggunaan AI/API eksternal perlu dikonsultasikan dengan dosen pembimbing dan pihak kantor.
- Jika data instansi tidak boleh keluar, opsi model AI lokal atau scoring lokal perlu dipertimbangkan.

## 10. Rancangan Penyimpanan Data

Hasil AI direkomendasikan disimpan pada tabel baru:

```text
permohonan_dana_ai_validations
```

Konsep data:

- `id`
- `permohonan_dana_id`
- `validation_version`
- `is_active`
- `status_proses`
- `risk_score`
- `recommendation_status`
- `findings_json`
- `reason`
- `input_snapshot_json`
- `model_provider`
- `model_name`
- `error_message`
- `processed_at`
- `created_at`
- `updated_at`

Jika permohonan direvisi dan submit ulang, sistem menyimpan hasil AI baru tanpa menghapus riwayat lama. Versi terbaru ditandai sebagai aktif.

Untuk LPJ, direkomendasikan tabel baru:

```text
permohonan_dana_lpj
```

Konsep data:

- `id`
- `permohonan_dana_id`
- `file_path`
- `file_name`
- `status`
- `submitted_by`
- `submitted_at`
- `verified_by`
- `verified_at`
- `rejected_by`
- `rejected_at`
- `catatan_verifikasi`
- `catatan_penolakan`
- `created_at`
- `updated_at`

Status LPJ:

- `submitted`
- `verified`
- `rejected`

Jika belum ada record LPJ, artinya belum upload LPJ.

## 11. Metode Pengembangan

Metode yang direkomendasikan:

```text
Prototype
```

Alasan:

- Sistem dikembangkan dari aplikasi existing.
- Kebutuhan AI dan LPJ masih perlu validasi dosen pembimbing/kantor.
- Cocok untuk iterasi rancangan UI, workflow, dan rekomendasi AI.
- Cocok untuk bimbingan bertahap.

Tahapan:

1. Pengumpulan kebutuhan.
2. Perancangan cepat.
3. Pembuatan prototype.
4. Evaluasi prototype.
5. Perbaikan prototype.
6. Implementasi akhir.

## 12. Metode Pengujian

Metode pengujian sementara:

- Black Box Testing.
- User Acceptance Testing.
- Skenario evaluasi AI.

Black Box Testing digunakan untuk menguji fungsi sistem berdasarkan input-output.

Contoh skenario Black Box:

- PUMK submit permohonan dana dengan data lengkap, status berubah menjadi `submitted`.
- KA.TIM tidak bisa approve sebelum hasil AI tersedia.
- Reviewer wajib mengisi alasan jika override rekomendasi risiko sedang/tinggi.
- PUMK hanya bisa upload LPJ setelah permohonan dana dicairkan.
- PIC Keuangan bisa memverifikasi atau menolak LPJ.

User Acceptance Testing digunakan untuk menguji penerimaan pengguna terhadap alur sistem.

Skenario Evaluasi AI digunakan untuk menguji rekomendasi AI pada beberapa kasus:

- Permohonan valid.
- Dokumen kurang.
- Pagu tidak cukup.
- Nominal/volume tidak wajar.
- Potensi duplikasi.
- Nominatif tidak konsisten.

Catatan:

- Metode testing masih perlu dikonsultasikan dengan dosen pembimbing.
- Jika dosen pembimbing meminta evaluasi AI yang lebih formal, dapat dipertimbangkan validasi ahli atau perbandingan hasil AI dengan penilaian manual pihak keuangan.

## 13. Pertanyaan Untuk Dosen Pembimbing

1. Apakah ruang lingkup judul sudah tepat jika sistem mengelola pertanggungjawaban kegiatan dari permohonan dana sampai LPJ, sedangkan AI hanya membantu validasi permohonan dana?
2. Apakah modul perencanaan boleh tidak dimasukkan ke scope karena proses existing tidak berkorelasi langsung?
3. Apakah pendekatan hybrid rule-based scoring + LLM/API dapat diterima sebagai implementasi AI?
4. Apakah penggunaan API eksternal diperbolehkan jika data yang dikirim hanya metadata terbatas?
5. Jika API eksternal tidak diperbolehkan, apakah fallback scoring lokal/template explanation masih dapat diterima?
6. Apakah model AI lokal perlu dipertimbangkan?
7. Apakah AI cukup membaca metadata dokumen tanpa OCR/PDF parsing?
8. Apakah keputusan akhir tetap boleh dilakukan reviewer walaupun AI memberi rekomendasi risiko tinggi?
9. Apakah kategori validasi AI sudah sesuai?
10. Apakah bobot scoring awal perlu ditentukan oleh dosen pembimbing, pihak kantor, atau validasi ahli?
11. Apakah metode Prototype paling cocok untuk penelitian ini?
12. Apakah Black Box Testing, UAT, dan skenario evaluasi AI sudah cukup?

## 14. Pertanyaan Untuk Pihak Kantor

1. Apakah alur existing permohonan dana sudah benar: PUMK -> KA.TIM -> PIC Keuangan -> PPK -> Bendahara?
2. Apakah LPJ kegiatan memang cukup berupa satu PDF lengkap?
3. Siapa yang paling tepat memverifikasi LPJ: PIC Keuangan atau Bendahara?
4. Dokumen apa saja yang wajib tersedia saat submit permohonan dana?
5. Dokumen apa saja yang cukup diserahkan saat LPJ?
6. Apakah hasil AI boleh ditampilkan kepada PUMK, atau hanya reviewer?
7. Apakah penggunaan AI eksternal diperbolehkan jika data dibatasi?
8. Data apa saja yang dianggap sensitif dan tidak boleh dikirim ke AI?
9. Apakah reviewer boleh override rekomendasi AI dengan alasan?
10. Apakah bobot risiko pagu/dokumen/kewajaran/duplikasi perlu mengikuti kebijakan kantor?

## 15. Hal Yang Masih Perlu Diputuskan

- Provider AI eksternal yang digunakan.
- Apakah API eksternal boleh dipakai.
- Fallback jika API eksternal tidak disetujui.
- Apakah model AI lokal diperlukan.
- Bobot final scoring.
- Matriks dokumen wajib.
- Format UAT dan jumlah responden.
- Detail use case diagram.
- Detail activity diagram.
- Detail sequence diagram.
- Detail ERD.
- Rancangan menu dan tampilan hasil AI.

## 16. Catatan Untuk Pembahasan Diagram Berikutnya

Diagram yang perlu dibuat setelah dokumen ini:

1. Use Case Diagram.
2. Activity Diagram permohonan dana dengan validasi AI.
3. Activity Diagram LPJ.
4. ERD.
5. Sequence Diagram submit dan validasi AI.

Aktor utama:

- PUMK.
- KA.TIM/Kapokja.
- PIC Keuangan.
- PPK.
- Bendahara.
- Super Admin.

Entitas utama:

- `permohonan_dana`.
- `permohonan_dana_item`.
- `permohonan_dana_dokumen`.
- `permohonan_dana_ai_validations`.
- `permohonan_dana_lpj`.
