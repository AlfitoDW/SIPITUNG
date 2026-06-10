# Fitur Export Nominatif

Dokumen ini menjadi pegangan saat mengubah fitur export nominatif. Tujuannya mencegah perubahan halu yang merusak template Excel, mapping kolom, page break, atau baris jumlah.

## Ringkasan

Export nominatif menghasilkan file Excel dari `PermohonanDana` yang sudah memiliki item honor/perjalanan dinas dan data nominatif.

File utama:

- `app/Exports/NominatifExport.php`
- `database/seeders/NominatifSeeder.php`
- `tests/Feature/Keuangan/NominatifSeederTest.php`
- `storage/app/templates/nominatif_template_clean.xlsx`

Export dipanggil dari:

- `app/Http/Controllers/Bendahara/PermohonanDanaController.php`
- Method: `nominatif(PermohonanDana $pd)`

Data utama:

- `permohonan_dana`
- `permohonan_dana_item`
- `permohonan_dana_item_nominatif`
- `ref_nama`

## Akun Yang Didukung

Honor:

- `521115` - Honor Operasional Satuan Kerja
- `521213` - Honor Output Kegiatan / Panitia
- `522151` - Honor Narasumber / Moderator / Jasa Profesi

Perjalanan dinas luar kota:

- `524111` - Perjalanan Dinas Biasa
- `524119` - Paket Meeting Luar Kota

Perjalanan dinas dalam kota:

- `524113` - Perjalanan Dinas Dalam Kota
- `524114` - Paket Meeting Dalam Kota

Setiap akun menggunakan sheet dengan nama sama seperti kode akun.

## Template Excel

Template yang dipakai export:

```text
storage/app/templates/nominatif_template_clean.xlsx
```

Jangan mengubah struktur kolom template tanpa mengubah `NominatifExport` dan test terkait.

Hal penting tentang template:

- Template memakai `pageBreakPreview`; jangan paksa `normal` view.
- Template punya merge cell dan page break bawaan.
- Template punya row `Jumlah` dengan style/formula/layout yang harus dipertahankan.
- Jangan hide kolom kanan secara paksa hanya untuk menghilangkan area biru. Area itu bagian dari tampilan page break/template.

## Mapping Format Sheet

### Format A: `521115`

Header ditulis di:

- `A3` nomor SK
- `A5` judul daftar pembayaran
- `A6` bulan
- `A7` kode dan nama akun

Data nominatif mulai row `12`.

Mapping data utama:

- `A` No
- `B` Nama
- `C` NIK
- `D` NPWP
- `E` Gol
- `F` Volume
- `G` Harga satuan
- `H` Jumlah bruto
- `I` Dasar pengenaan pajak
- `J` Tarif pajak
- `K` Jumlah pajak
- `L` Jumlah diterima
- `M` Atas nama rekening
- `N` Nomor rekening
- `O` Bank
- `P` Email

Row `Jumlah` wajib mengisi:

- `F`, `G`, `H`, `I`, `K`, `L`

### Format B: `521213`, `522151`

Header ditulis di sel kiri template, bukan `B...`:

- `A3` nomor SK
- `A5` judul daftar pembayaran
- `A6` kegiatan
- `A7` tahun anggaran
- `A8` tempat dan tanggal
- `A9` kode dan nama akun

Data nominatif mulai row `14`.

Mapping data utama:

- `A` No
- `B` Nama
- `C` Jabatan dalam tugas
- `D` NIK
- `E` NPWP
- `F` Gol
- `G` Volume
- `H` Harga satuan
- `I` Jumlah bruto
- `J` Dasar pengenaan pajak
- `K` Tarif pajak
- `L` Jumlah pajak
- `M` Jumlah diterima
- `N` Atas nama rekening
- `O` Nomor rekening
- `P` Bank
- `Q` Email

Row `Jumlah` wajib mengisi:

- `G`, `H`, `I`, `J`, `L`, `M`

### Format C Luar Kota: `524111`, `524119`

Header ditulis di:

- `B3` nomor ST
- `B5` judul daftar pembayaran
- `B6` kegiatan
- `B7` tahun anggaran
- `B8` tempat dan tanggal
- `B9` kode dan nama akun

Data nominatif mulai row `14`.

Mapping data utama:

- `B` No
- `C` Nama
- `D` Transport
- `E` Uang harian volume / jml hari
- `F` Uang harian satuan
- `G` Uang harian jumlah
- `H` Fullboard volume / jml hari
- `I` Fullboard satuan
- `J` Fullboard jumlah
- `K` Fullday volume / jml hari
- `L` Fullday satuan
- `M` Fullday jumlah
- `N` Taksi PP
- `O` Tiket pesawat
- `P` Akomodasi hotel
- `Q` Jumlah diterima
- `R` Atas nama rekening
- `S` Nomor rekening
- `T` Bank
- `U` Email

Row `Jumlah` wajib mengisi:

- `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`

### Format C Dalam Kota: `524113`, `524114`

Header ditulis di:

- `B3` nomor ST
- `B5` judul daftar pembayaran
- `B6` kegiatan
- `B7` tahun anggaran
- `B8` tempat dan tanggal
- `B9` kode dan nama akun

Data nominatif mulai row `14`.

Mapping data utama:

- `B` No
- `C` Nama
- `D` Transport
- `E` Uang harian volume / jml hari
- `F` Uang harian satuan
- `G` Uang harian jumlah
- `H` Fullboard volume / jml hari
- `I` Fullboard satuan
- `J` Fullboard jumlah
- `K` Fullday volume / jml hari
- `L` Fullday satuan
- `M` Fullday jumlah
- `N` Akomodasi hotel
- `O` Jumlah diterima
- `P` Atas nama rekening
- `Q` Nomor rekening
- `R` Bank
- `S` Email

Row `Jumlah` wajib mengisi:

- `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`

## Aturan Anti-Regresi

Jangan lakukan ini:

- Jangan paksa `$sheet->getSheetView()->setView('normal')`; page break template harus tetap hidup.
- Jangan hide kolom kanan secara manual untuk menghilangkan area biru.
- Jangan clear seluruh footer mulai row `Jumlah`; itu menghapus angka subtotal.
- Jangan menulis header format B ke `B3/B5/B6/B7/B8/B9`; template punya teks lama di `A...`, sehingga hasilnya double.
- Jangan memakai kolom tanda tangan sebagai kolom total jumlah diterima.
- Jangan menggeser mapping perjadin dari `B=No`, `C=Nama`, `D=Transport`.

Yang boleh dilakukan:

- Clear header secukupnya sebelum isi ulang supaya teks `xxxx`, tahun lama, tempat lama, dan tanggal lama hilang.
- Clear area tanda tangan/footer setelah row terbilang, bukan row jumlah.
- Set print area sesuai kolom terakhir sheet, tetapi jangan mengubah view page break.
- Jika template berubah, update mapping dan regression test dalam commit yang sama.

## Bug Yang Pernah Terjadi

Header double:

- Penyebab: export menulis header ke `B...`, sementara template lama masih punya teks di `A...`.
- Fix: format B harus menulis ke `A3/A5/A6/A7/A8/A9`; perjadin ke `B3/B5/B6/B7/B8/B9`.

Tahun/tempat/tanggal masih bawaan template:

- Penyebab: cell template lama tidak di-clear atau header ditulis ke sel yang salah.
- Fix: clear header range aman sebelum isi ulang.

Total masuk kolom rekening:

- Penyebab: kolom tanda tangan dan kolom total dicampur.
- Fix: total dan tanda tangan punya mapping kolom berbeda.

Page break hilang:

- Penyebab: kode memaksa view ke `normal`.
- Fix: biarkan view bawaan template, biasanya `pageBreakPreview`.

Row `Jumlah` kosong:

- Penyebab: footer di-clear terlalu agresif mulai row `Jumlah`.
- Fix: clear footer hanya mulai row setelah `Terbilang`.

Subtotal perjadin bergeser:

- Penyebab: row `Jumlah` ditulis mulai kolom `C`, padahal data perjadin mulai `D` untuk transport.
- Fix: subtotal perjadin harus mengikuti mapping template `D` sampai `Q`/`O`.

## Seeder Fixture

Seeder untuk data uji:

```bash
php artisan db:seed --class=NominatifSeeder
```

Nomor fixture:

```text
999/LL3/NOMINATIF-ALL/V/2026
```

Karakteristik fixture:

- Satu `PermohonanDana` berisi semua akun nominatif.
- Mengambil sampai 15 pegawai aktif dari `ref_nama`.
- Semua akun punya nominatif banyak untuk menguji insert row.
- Perjadin fixture mengisi transport, uang harian, fullboard, fullday, hotel, taksi, tiket sesuai tipe akun agar semua kolom jumlah terlihat.

File preview yang biasa dipakai saat debug:

```text
storage/app/Nominatif_999-LL3-NOMINATIF-ALL-V-2026_RAPIH.xlsx
```

## Test Wajib

Jalankan minimal:

```bash
php artisan test tests/Feature/Keuangan/NominatifSeederTest.php
```

Untuk area terkait snapshot approval/export:

```bash
php artisan test tests/Feature/Keuangan/NominatifSeederTest.php tests/Feature/Keuangan/ApproverSnapshotTest.php
```

Test harus memastikan:

- Fixture berisi 7 akun.
- Tiap akun punya banyak nominatif.
- Header tidak membawa teks bawaan template seperti `xxxx`, `2023`, atau `BEKASI`.
- Row `Jumlah` honor terisi.
- Row `Jumlah` perjadin luar kota terisi dari `D` sampai `Q` sesuai komponen yang relevan.
- Row `Jumlah` perjadin dalam kota terisi dari `D` sampai `O` sesuai komponen yang relevan.
- Total tidak masuk kolom rekening.
- Page break tetap aktif.

## Checklist Sebelum Deploy

1. Jalankan seeder fixture.

```bash
php artisan db:seed --class=NominatifSeeder
```

2. Jalankan test.

```bash
php artisan test tests/Feature/Keuangan/NominatifSeederTest.php tests/Feature/Keuangan/ApproverSnapshotTest.php
```

3. Export dari UI atau generate preview fixture.

4. Buka Excel dan cek manual:

- 7 sheet akun muncul.
- Page break masih terlihat.
- Header tidak double.
- Kegiatan, tahun, tempat, tanggal sesuai data permohonan.
- Row `Jumlah` lengkap.
- Total tidak masuk kolom rekening.
- Tanda tangan tidak double.

## Catatan Untuk AI/Developer Berikutnya

Jangan menebak posisi kolom dari screenshot saja. Inspect template aktual dengan PhpSpreadsheet sebelum mengubah mapping.

Jika ada bug Excel:

1. Reproduce dengan fixture `999/LL3/NOMINATIF-ALL/V/2026`.
2. Inspect cell template dan hasil export.
3. Ubah mapping paling kecil yang memperbaiki bug.
4. Tambah assertion di `NominatifSeederTest` agar bug tidak balik.
5. Generate ulang file preview dan cek visual.
