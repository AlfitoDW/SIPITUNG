# Pertanyaan Validasi: Snapshot Pagu & SBM di SPJ

> Dokumen ini berisi daftar pertanyaan untuk dikonfirmasi kepada end user / pimpinan sebelum implementasi snapshot pagu dan SBM di modul keuangan.
> Tanggal: 2026-06-04
> Status: Draft — Menunggu jawaban dari user

---

## Cara Menggunakan Dokumen Ini

1. Copy-paste salah satu pertanyaan di bawah ke WA/email/meeting dengan user/pimpinan.
2. Jangan tanya semua sekaligus — 1-2 pertanyaan per sesi supaya tidak overwhelm.
3. Rekomendasi urutan: Tanyakan #2 dan #5 dulu (paling berdampak ke audit trail).
4. Setelah mendapat jawaban, update status di dokumen ini, lalu lanjut implementasi H1.

---

## Pertanyaan 1 — Tentang Print SPJ / Nominatif

### Pertanyaan
> "Di print permohonan dana (SPJ) yang sudah lama dicairkan, kalau misalnya ada revisi anggaran dan pagu turun, di kolom 'Sisa Anggaran' mau ditampilkan apa?
>
> **Opsi A:** Tampil angka minus (contoh: -Rp 2.000.000) → menunjukkan kondisi real 'pagu habis'.
> **Opsi B:** Tampil 'Rp 0' atau 'Pagu Habis' → tidak ada angka minus.
> **Opsi C:** Tidak usah tampil kolom 'Sisa Anggaran' di print SPJ lama, cukup tampilkan 'Pagu saat pengajuan' dan 'Jumlah SPJ ini'."

### Status
- [ ] Belum ditanya
- [ ] Sudah ditanya, menunggu jawaban
- [ ] Sudah ada jawaban

### Jawaban User

*(Isi saat user sudah menjawab)*

---

## Pertanyaan 2 — Tentang Pagu di Detail View

### Pertanyaan
> "Kalau ada SPJ yang sudah dicairkan tahun lalu, terus pagu anggarannya direvisi turun, di tampilan detail SPJ tersebut:
>
> **Pagu yang ditampilkan pakai yang mana?**
>
> - Pagu yang berlaku **saat SPJ diajukan** (misal: 10 juta), atau
> - Pagu yang berlaku **sekarang setelah revisi** (misal: 7 juta)?
>
> Ini penting untuk audit trail BPK — bukti bahwa SPJ diajukan dalam pagu yang valid waktu itu."

### Status
- [ ] Belum ditanya
- [ ] Sudah ditanya, menunggu jawaban
- [ ] Sudah ada jawaban

### Jawaban User

*(Isi saat user sudah menjawab)*

---

## Pertanyaan 3 — Tentang SBM (Standar Biaya Masukan)

### Pertanyaan
> "Kalau SBM (harga satuan) naik setelah SPJ dicairkan, di print SPJ lama:
>
> **SBM yang ditampilkan pakai yang mana?**
>
> - SBM yang berlaku **saat SPJ diajukan** (harga lama), atau
> - SBM yang berlaku **sekarang** (harga baru)?
>
> Contoh: SPJ Honor Januari pakai SBM 100rb/orang, terus Juli SBM naik jadi 120rb. Di print SPJ Januari, SBM-nya tetap 100rb atau ikut jadi 120rb?"

### Status
- [ ] Belum ditanya
- [ ] Sudah ditanya, menunggu jawaban
- [ ] Sudah ada jawaban

### Jawaban User

*(Isi saat user sudah menjawab)*

---

## Pertanyaan 4 — Tentang Status SPJ Lama Setelah Revisi

### Pertanyaan
> "Kalau pagu turun dan SPJ lama tiba-tiba jadi 'over budget' (karena realisasi sudah melebihi pagu baru), di sistem:
>
> **Apakah SPJ lama tetap dianggap valid?** (karena sudah dicairkan dan tidak bisa diubah)
>
> Atau **ada warning/keterangan** di tampilannya? Contoh: 'SPJ ini valid pada saat pengajuan, tetapi pagu telah direvisi turun'."

### Status
- [ ] Belum ditanya
- [ ] Sudah ditanya, menunggu jawaban
- [ ] Sudah ada jawaban

### Jawaban User

*(Isi saat user sudah menjawab)*

---

## Pertanyaan 5 — Tentang Nominatif Export (Sudah Fix di C3)

### Pertanyaan
> "Di export Excel Nominatif (daftar penerima honor/perjadin):
>
> **Tanda tangan PPK dan Bendahara mau pakai nama siapa?**
>
> - Nama **yang approve/cairkan SPJ waktu itu**, atau
> - Nama **PPK/Bendahara yang aktif sekarang**?
>
> Ini penting karena kalau ada pergantian personil, tanda tangan di dokumen lama bisa keluar nama orang yang berbeda."

### Status
- [x] **Sudah diimplementasi di C3** — Sistem sekarang selalu pakai nama approver yang sebenarnya (snapshot), bukan nama PPK/Bendahara aktif sekarang.

### Catatan
Ini sudah fix. Export sekarang tidak pernah pakai nama PPK/Bendahara aktif sebagai fallback.

---

## Rekomendasi Urutan Tanya ke User

| Urutan | Pertanyaan | Alasan |
|--------|-----------|--------|
| **1** | **Pertanyaan #2** — Pagu di detail view | Paling berdampak ke arsitektur snapshot. Kalau user jawab "pagu saat pengajuan", maka snapshot WAJIB dibuat. |
| **2** | **Pertanyaan #3** — SBM di print | Pattern-nya identik dengan pagu. Kalau #2 jawab snapshot, #3 juga snapshot. |
| **3** | **Pertanyaan #1** — Tampilan sisa anggaran (minus/positif) | Ini UX decision, tidak terlalu berdampak ke database. Bisa ditanya setelah #2 dan #3. |
| **4** | **Pertanyaan #4** — Status SPJ lama setelah revisi | Ini UX/labeling, bisa ditanya terakhir. |
| **5** | **Pertanyaan #5** — Nominatif export | ✅ **Sudah fix di C3**, tidak perlu tanya lagi. |

---

## Catatan Teknis untuk Developer

### Snapshot yang Sudah Ada (C3)
- `katim_approved_by_name`, `katim_approved_by_nip`
- `kabag_approved_by_name`, `kabag_approved_by_nip`
- `ppk_approved_by_name`, `ppk_approved_by_nip`
- `pic_approved_by_name`, `pic_approved_by_nip`
- `dicairkan_by_name`, `dicairkan_by_nip`

### Snapshot yang Belum Ada (H1 — Menunggu Validasi)
- `pagu_snapshot` di `permohonan_dana_item` (pagu saat Step 4)
- `sbm_snapshot` di `permohonan_dana_item` (SBM saat Step 4)

### Keputusan yang Harus Diambil Setelah User Menjawab
1. **Apakah perlu snapshot pagu/SBM?** (tergantung jawaban #2 dan #3)
2. **Kalau perlu, diisi kapan?** (saat Step 4 atau saat Submit)
3. **Tampilan `sisa_anggaran` di detail view/print** — angka, label, atau dihilangkan?

---

## Update Log

| Tanggal | Event | Oleh |
|---------|-------|------|
| 2026-06-04 | Dokumen dibuat | OpenCode Agent |
| | | |

---

*Setelah semua pertanyaan terjawab, hapus checklist status dan isi kolom "Jawaban User", lalu lanjut ke implementasi H1.*
