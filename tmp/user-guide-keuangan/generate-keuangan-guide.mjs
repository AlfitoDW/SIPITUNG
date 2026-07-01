import { chromium } from 'playwright';
import pptxgen from 'pptxgenjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const baseUrl = 'http://127.0.0.1:8000';
const outDir = 'tmp/user-guide-keuangan/screenshots-revisi';
const pptPath = 'User_Guide_Modul_Keuangan_SIPITUNG_Revisi_Per_Role.pptx';
const password = '@lldikti3!';

const shots = [
  { key: 'login', user: null, url: '/login' },
  { key: 'pumk-create', user: 'pumk.pk', url: '/pumk/permohonan-dana/buat' },
  { key: 'pumk-list', user: 'pumk.pk', url: '/pumk/permohonan-dana' },
  { key: 'pumk-wizard', user: 'pumk.pk', url: '/pumk/permohonan-dana/25/wizard' },
  { key: 'ketua-list', user: 'ketua.pk', url: '/ketua-tim/keuangan/permohonan-dana' },
  { key: 'ketua-detail', user: 'ketua.pk', url: '/ketua-tim/keuangan/permohonan-dana/26' },
  { key: 'kabag-list', user: 'kabagumum', url: '/pimpinan/keuangan/permohonan-dana' },
  { key: 'pic-list', user: 'pic.elih', url: '/pic-keuangan/permohonan-dana' },
  { key: 'pic-detail', user: 'pic.elih', url: '/pic-keuangan/permohonan-dana/26' },
  { key: 'pic-lpj', user: 'pic.elih', url: '/pic-keuangan/verifikasi-lpj' },
  { key: 'ppk-list', user: 'ppk', url: '/pimpinan/keuangan/permohonan-dana' },
  { key: 'ppk-detail', user: 'ppk', url: '/pimpinan/keuangan/permohonan-dana/26' },
  { key: 'bendahara-list', user: 'bendahara', url: '/bendahara/permohonan-dana' },
  { key: 'bendahara-detail', user: 'bendahara', url: '/bendahara/permohonan-dana/26' },
  { key: 'bendahara-lpj', user: 'bendahara', url: '/bendahara/verifikasi-lpj' },
  { key: 'superadmin-list', user: 'superadmin', url: '/super-admin/keuangan/permohonan-dana' },
  { key: 'superadmin-detail', user: 'superadmin', url: '/super-admin/keuangan/permohonan-dana/26' },
  { key: 'superadmin-master', user: 'superadmin', url: '/super-admin/keuangan/master-anggaran' },
];

const colors = {
  blue: '003580', navy: '0F172A', slate: '334155', muted: '64748B', line: 'CBD5E1', bg: 'F8FAFC',
  pumk: '2563EB', ketua: '16A34A', kabag: '7C3AED', pic: 'EA580C', ppk: 'DC2626', bendahara: '0891B2', admin: '475569',
};

async function login(page, username) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
    page.click('[data-test=login-button]'),
  ]);
  if (page.url().includes('/login')) {
    throw new Error(`Login gagal untuk ${username}; masih berada di ${page.url()}`);
  }
}

async function assertNotLogin(page, shot) {
  const url = new URL(page.url());
  if (url.pathname.includes('/login')) {
    throw new Error(`Screenshot ${shot.key} gagal: diarahkan ke login saat membuka ${shot.url}`);
  }
  const text = await page.locator('body').innerText();
  if (text.includes('Masuk ke Sistem') && text.includes('Username') && text.includes('Kata Sandi')) {
    throw new Error(`Screenshot ${shot.key} gagal: konten masih halaman login (${page.url()})`);
  }
}

async function takeScreenshots() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const contexts = new Map();

  for (const shot of shots) {
    let page;
    if (shot.user) {
      if (!contexts.has(shot.user)) {
        const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
        const loginPage = await context.newPage();
        await login(loginPage, shot.user);
        await loginPage.close();
        contexts.set(shot.user, context);
      }
      page = await contexts.get(shot.user).newPage();
    } else {
      const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
      page = await context.newPage();
    }

    await page.goto(`${baseUrl}${shot.url}`, { waitUntil: 'networkidle' });
    if (shot.user) await assertNotLogin(page, shot);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `${shot.key}.png`), fullPage: false });
    console.log(`${shot.key} -> ${page.url()}`);
    await page.close();
  }

  await browser.close();
}

async function validateScreenshots() {
  const hashes = new Map();
  for (const shot of shots) {
    const file = path.join(outDir, `${shot.key}.png`);
    const data = await fs.readFile(file);
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    if (!hashes.has(hash)) hashes.set(hash, []);
    hashes.get(hash).push(shot.key);
  }

  const duplicateGroups = [...hashes.values()].filter((keys) => keys.length > 1);
  if (hashes.size < Math.ceil(shots.length * 0.75)) {
    throw new Error(`Screenshot terlalu banyak yang identik: ${JSON.stringify(duplicateGroups)}`);
  }
}

function img(key) { return path.join(outDir, `${key}.png`); }

function addHeader(slide, title, subtitle, accent = colors.blue) {
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 0.82, fill: { color: accent }, line: { color: accent } });
  slide.addText(title, { x: 0.55, y: 0.2, w: 8.8, h: 0.28, fontFace: 'Arial', fontSize: 18, bold: true, color: 'FFFFFF', margin: 0 });
  if (subtitle) slide.addText(subtitle, { x: 0.57, y: 0.51, w: 10.8, h: 0.14, fontFace: 'Arial', fontSize: 7.8, color: 'E0F2FE', margin: 0 });
}

function addBullets(slide, bullets, x, y, w, h, fontSize = 10.3) {
  slide.addText(bullets.map((text) => ({ text, options: { bullet: { indent: 12 }, hanging: 4 } })), {
    x, y, w, h, fontFace: 'Arial', fontSize, color: colors.slate, fit: 'shrink', paraSpaceAfterPt: 6, breakLine: false, margin: 0.06,
  });
}

function addBox(slide, title, body, x, y, w, h, accent = colors.blue) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: colors.line, width: 1 } });
  slide.addShape('rect', { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(title, { x: x + 0.18, y: y + 0.12, w: w - 0.32, h: 0.18, fontSize: 10, bold: true, color: colors.navy, margin: 0 });
  slide.addText(body, { x: x + 0.18, y: y + 0.38, w: w - 0.32, h: h - 0.48, fontSize: 8.3, color: colors.slate, fit: 'shrink', margin: 0 });
}

function addScreenshot(slide, key, x, y, w, h) {
  slide.addShape('rect', { x: x - 0.04, y: y - 0.04, w: w + 0.08, h: h + 0.08, fill: { color: 'E2E8F0' }, line: { color: '94A3B8', width: 1 } });
  slide.addImage({ path: img(key), x, y, w, h, sizingContain: true });
}

function addStepSlide(pptx, { title, subtitle, accent, image, steps, before, after, check }) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addHeader(slide, title, subtitle, accent);
  addScreenshot(slide, image, 5.1, 1.08, 7.72, 5.8);
  slide.addText('Langkah Operasional', { x: 0.62, y: 1.05, w: 3.9, h: 0.22, fontSize: 14, bold: true, color: colors.navy, margin: 0 });
  addBullets(slide, steps, 0.65, 1.42, 3.95, 3.08, 10.2);
  addBox(slide, 'Sebelum Aksi', before, 0.65, 4.78, 1.9, 1.22, accent);
  addBox(slide, 'Sesudah Aksi', after, 2.75, 4.78, 1.9, 1.22, accent);
  if (check) addBox(slide, 'Yang Wajib Dicek', check, 0.65, 6.15, 4.0, 0.75, accent);
  return slide;
}

function addRoleIntro(pptx, role, accent, image, tugas, menu, output) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addHeader(slide, `Role ${role}`, 'Tugas, menu yang dipakai, dan hasil kerja role pada modul keuangan.', accent);
  addScreenshot(slide, image, 6.6, 1.15, 5.85, 5.5);
  addBox(slide, 'Tugas Utama', tugas, 0.65, 1.2, 5.25, 1.38, accent);
  addBox(slide, 'Menu yang Dibuka', menu, 0.65, 2.83, 5.25, 1.28, accent);
  addBox(slide, 'Output / Hasil Kerja', output, 0.65, 4.36, 5.25, 1.38, accent);
  slide.addText('Gunakan screenshot di kanan untuk mengenali posisi menu, tab status, tabel, dan tombol aksi pada aplikasi.', { x: 0.65, y: 6.18, w: 5.3, h: 0.35, fontSize: 10, color: colors.muted, margin: 0 });
}

function buildPpt() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'SIPITUNG';
  pptx.subject = 'User Guide Modul Keuangan Revisi Per Role';
  pptx.title = 'User Guide Modul Keuangan SIPITUNG - Revisi Per Role';
  pptx.company = 'LLDIKTI Wilayah III';
  pptx.lang = 'id-ID';
  pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial', lang: 'id-ID' };

  let slide = pptx.addSlide();
  slide.background = { color: 'EEF6FF' };
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: 'F8FAFC' }, line: { color: 'F8FAFC' } });
  slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: colors.blue }, line: { color: colors.blue } });
  slide.addText('User Guide Modul Keuangan SIPITUNG', { x: 0.75, y: 0.28, w: 8.2, h: 0.35, fontSize: 24, bold: true, color: 'FFFFFF', margin: 0 });
  slide.addText('Panduan operasional per role dengan screenshot aplikasi', { x: 0.78, y: 1.55, w: 5.4, h: 1.1, fontSize: 31, bold: true, color: colors.navy, fit: 'shrink', margin: 0 });
  slide.addText('PUMK, Ketua Tim Kerja, Kabag Umum, PIC Keuangan, PPK, Bendahara, dan Super Admin.', { x: 0.8, y: 3.05, w: 5.4, h: 0.55, fontSize: 13, color: colors.slate, margin: 0 });
  addScreenshot(slide, 'login', 6.85, 1.35, 5.75, 4.6);
  slide.addText(`Dibuat dari aplikasi lokal - ${new Date().toLocaleDateString('id-ID')}`, { x: 0.82, y: 6.65, w: 5.2, h: 0.16, fontSize: 8.5, color: colors.muted, margin: 0 });

  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addHeader(slide, 'Peta Alur Modul Keuangan', 'Siapa bekerja kapan, dan status apa yang berubah.', colors.blue);
  const flow = [
    ['1', 'PUMK', 'Buat draft + submit', 'Draft -> Diajukan', colors.pumk],
    ['2', 'Ketua Tim', 'Cek kegiatan dan RAB', 'Diajukan -> lanjut/revisi', colors.ketua],
    ['3', 'PIC Keuangan', 'Verifikasi dokumen, akun, nominatif', 'Lanjut PPK/revisi', colors.pic],
    ['4', 'PPK', 'Approval akhir sebelum cair', 'Siap dicairkan/revisi', colors.ppk],
    ['5', 'Bendahara', 'Cairkan + upload bukti bayar', 'Selesai', colors.bendahara],
    ['6', 'PUMK + Verifikator', 'Upload dan cek LPJ', 'Pertanggungjawaban lengkap', colors.admin],
  ];
  flow.forEach(([no, role, action, status, accent], i) => {
    const x = 0.55 + i * 2.08;
    slide.addShape('roundRect', { x, y: 1.45, w: 1.75, h: 3.25, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: accent, width: 1.5 } });
    slide.addShape('ellipse', { x: x + 0.62, y: 1.68, w: 0.48, h: 0.48, fill: { color: accent }, line: { color: accent } });
    slide.addText(no, { x: x + 0.78, y: 1.82, w: 0.2, h: 0.12, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', margin: 0 });
    slide.addText(role, { x: x + 0.12, y: 2.35, w: 1.5, h: 0.3, fontSize: 12, bold: true, color: colors.navy, align: 'center', margin: 0 });
    slide.addText(action, { x: x + 0.14, y: 2.95, w: 1.45, h: 0.72, fontSize: 8.7, color: colors.slate, align: 'center', fit: 'shrink', margin: 0 });
    slide.addText(status, { x: x + 0.12, y: 4.02, w: 1.5, h: 0.34, fontSize: 8.2, bold: true, color: accent, align: 'center', fit: 'shrink', margin: 0 });
    if (i < flow.length - 1) slide.addText('>', { x: x + 1.83, y: 2.88, w: 0.25, h: 0.2, fontSize: 18, bold: true, color: colors.muted, margin: 0 });
  });
  addBox(slide, 'Prinsip Membaca Tabel', 'Kolom Status Permohonan menunjukkan posisi proses saat ini. Kolom Perlu Approval dan Oleh menunjukkan role/nama yang harus memproses berikutnya. Tombol aksi/detail dipakai untuk membuka data lengkap sebelum mengambil keputusan.', 0.75, 5.35, 11.75, 0.92, colors.blue);

  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addHeader(slide, 'Kamus Status dan Keputusan', 'Gunakan ini untuk memahami perubahan status pada setiap role.', colors.blue);
  addBox(slide, 'Draft', 'Permohonan masih disusun PUMK. Data dapat diedit, dokumen dapat dilengkapi, dan belum masuk antrean approval.', 0.75, 1.25, 3.75, 1.0, colors.pumk);
  addBox(slide, 'Diajukan', 'Permohonan sudah dikirim dan sedang menunggu approval/verifikasi role berikutnya.', 4.85, 1.25, 3.75, 1.0, colors.ketua);
  addBox(slide, 'Revisi', 'Permohonan dikembalikan. PUMK harus membaca catatan, memperbaiki data, lalu submit ulang.', 8.95, 1.25, 3.55, 1.0, colors.ppk);
  addBox(slide, 'Selesai', 'Bendahara sudah mencairkan dana. Tahap berikutnya adalah bukti bayar dan pertanggungjawaban/LPJ.', 0.75, 2.65, 3.75, 1.0, colors.bendahara);
  addBox(slide, 'Approve / Setujui', 'Keputusan untuk meneruskan permohonan ke tahap berikutnya.', 4.85, 2.65, 3.75, 1.0, colors.ketua);
  addBox(slide, 'Reject / Tolak / Revisi', 'Keputusan untuk mengembalikan permohonan ke PUMK dengan catatan perbaikan.', 8.95, 2.65, 3.55, 1.0, colors.ppk);
  addScreenshot(slide, 'pumk-list', 0.95, 4.15, 11.45, 2.5);

  addRoleIntro(pptx, 'PUMK', colors.pumk, 'pumk-list',
    'Membuat permohonan dana, melengkapi data kegiatan dan anggaran, mengunggah dokumen pendukung, mengisi nominatif bila ada, submit permohonan, dan upload LPJ setelah dana cair.',
    'Permohonan Dana > Permohonan Baru untuk membuat draft. Permohonan Dana > Daftar Permohonan untuk melihat status, membuka detail, lanjut wizard, submit, atau upload LPJ.',
    'Draft tersimpan, permohonan terkirim ke approval, revisi diperbaiki, dan LPJ diunggah setelah pencairan.');
  addStepSlide(pptx, { title: 'PUMK - Membuat Draft Permohonan', subtitle: 'Mulai dari menu Permohonan Baru dan isi identitas utama kegiatan.', accent: colors.pumk, image: 'pumk-create', before: 'Belum ada nomor permohonan atau masih kosong.', after: 'Draft tersimpan dan bisa dilanjutkan lewat wizard.', check: 'Program, Sasaran, KRO, RO, Komponen, Kegiatan, judul pekerjaan, dan tahun anggaran.', steps: ['Login sebagai PUMK.', 'Buka Permohonan Dana > Permohonan Baru.', 'Pilih hierarki anggaran DJA dari Program sampai Kegiatan.', 'Isi judul pekerjaan dan data wajib lain.', 'Klik Simpan sebagai Draft.'] });
  addStepSlide(pptx, { title: 'PUMK - Melengkapi Wizard dan Dokumen', subtitle: 'Lengkapi tab kegiatan, waktu/PJ, dokumen, dan rincian biaya.', accent: colors.pumk, image: 'pumk-wizard', before: 'Permohonan masih Draft atau Revisi.', after: 'Data siap direview dan disubmit.', check: 'Dokumen pendukung, rincian biaya/RAB, nominatif, total anggaran, tanggal kegiatan, kapokja, dan PIC Keuangan.', steps: ['Buka draft dari Daftar Permohonan.', 'Masuk ke wizard permohonan.', 'Lengkapi setiap tab sampai tidak ada data wajib yang kosong.', 'Upload dokumen pendukung sesuai jenis dokumen.', 'Isi rincian biaya dan nominatif jika kegiatan membutuhkan daftar penerima/peserta.'] });
  addStepSlide(pptx, { title: 'PUMK - Submit, Revisi, dan LPJ', subtitle: 'Kirim permohonan dan tindak lanjuti status setelah diproses role lain.', accent: colors.pumk, image: 'pumk-list', before: 'Draft selesai dilengkapi atau status Revisi.', after: 'Status menjadi Diajukan, atau LPJ terkirim setelah dana cair.', check: 'Kolom Status Permohonan, Perlu Approval, Oleh, dan catatan penolakan bila ada.', steps: ['Buka Daftar Permohonan.', 'Cari permohonan yang akan dikirim.', 'Review data dan klik Submit.', 'Jika status Revisi, buka detail, baca catatan, perbaiki data, lalu submit ulang.', 'Jika sudah Selesai/dicairkan, upload LPJ dari halaman permohonan.'] });

  addRoleIntro(pptx, 'Ketua Tim Kerja', colors.ketua, 'ketua-list',
    'Approval tahap pertama untuk permohonan dari tim kerja. Ketua Tim memastikan kegiatan, kapokja, RAB, dan dokumen sudah layak diteruskan.',
    'Keuangan > Approval Permohonan. Gunakan daftar, tab status, pencarian, dan detail permohonan.',
    'Permohonan disetujui untuk lanjut ke PIC Keuangan, atau dikembalikan sebagai Revisi dengan catatan.');
  addStepSlide(pptx, { title: 'Ketua Tim - Memeriksa Daftar Approval', subtitle: 'Cari permohonan yang perlu keputusan Ketua Tim.', accent: colors.ketua, image: 'ketua-list', before: 'PUMK sudah submit permohonan.', after: 'Permohonan yang perlu dicek ditemukan dan siap dibuka detailnya.', check: 'Tim kerja, kapokja, tanggal pengajuan, total anggaran, status, Perlu Approval/Oleh.', steps: ['Login sebagai Ketua Tim.', 'Buka Keuangan > Approval Permohonan.', 'Gunakan tab Diajukan/Menunggu atau kolom search.', 'Pilih permohonan dari tim kerja yang sesuai.', 'Klik aksi/detail untuk membaca data lengkap.'] });
  addStepSlide(pptx, { title: 'Ketua Tim - Setujui atau Kembalikan Revisi', subtitle: 'Keputusan Ketua Tim menentukan apakah permohonan lanjut ke PIC Keuangan.', accent: colors.ketua, image: 'ketua-detail', before: 'Status menunggu approval Ketua Tim.', after: 'Jika setuju lanjut ke PIC Keuangan. Jika tolak kembali ke PUMK sebagai Revisi.', check: 'Kesesuaian kegiatan, RAB, dokumen pendukung, nominatif, total anggaran, dan catatan bila menolak.', steps: ['Buka detail permohonan.', 'Periksa Informasi Kegiatan, Waktu & PJ, Dokumen, dan Rincian Biaya.', 'Jika sesuai, klik Setujui/Approve.', 'Jika belum sesuai, klik Tolak/Revisi.', 'Isi catatan yang jelas agar PUMK tahu bagian yang harus diperbaiki.'] });

  addRoleIntro(pptx, 'Kabag Umum', colors.kabag, 'kabag-list',
    'Monitoring permohonan dana dari sisi pimpinan. Pada aplikasi saat ini halaman Kabag Umum untuk permohonan dana terlihat sebagai view-only.',
    'Keuangan > Approval Permohonan.',
    'Kabag dapat memantau status, pihak yang memegang proses, dan daftar permohonan. Jika bisnis proses mengharuskan Kabag approve, implementasi perlu dikonfirmasi ulang.');
  addStepSlide(pptx, { title: 'Kabag Umum - Monitoring Permohonan', subtitle: 'Pantau status proses dan pihak yang sedang memegang approval.', accent: colors.kabag, image: 'kabag-list', before: 'Permohonan berjalan di pipeline approval.', after: 'Kabag mengetahui posisi permohonan: draft, diajukan, revisi, atau selesai.', check: 'Status Permohonan, Perlu Approval, Oleh, tanggal pengajuan, dan judul kegiatan.', steps: ['Login sebagai Kabag Umum.', 'Buka Keuangan > Approval Permohonan.', 'Gunakan tab status untuk menyaring daftar.', 'Gunakan search untuk mencari nomor/judul permohonan.', 'Buka detail bila perlu menelusuri data permohonan.'] });

  addRoleIntro(pptx, 'PIC Keuangan', colors.pic, 'pic-list',
    'Memverifikasi kelengkapan administrasi dan kesesuaian keuangan setelah permohonan disetujui Ketua Tim.',
    'Keuangan > Verifikasi Permohonan untuk permohonan dana. Keuangan > Verifikasi LPJ untuk pertanggungjawaban.',
    'Permohonan diteruskan ke PPK jika valid, atau dikembalikan sebagai Revisi jika belum sesuai.');
  addStepSlide(pptx, { title: 'PIC Keuangan - Memilih Permohonan Verifikasi', subtitle: 'Cari permohonan yang masuk antrean PIC Keuangan.', accent: colors.pic, image: 'pic-list', before: 'Ketua Tim sudah menyetujui permohonan.', after: 'Permohonan siap diverifikasi detailnya.', check: 'Status, pihak Perlu Approval, dokumen, dan judul kegiatan.', steps: ['Login sebagai PIC Keuangan.', 'Buka Keuangan > Verifikasi Permohonan.', 'Cek tab Menunggu/Diajukan.', 'Pilih permohonan yang menjadi tanggung jawab PIC.', 'Klik detail untuk mulai verifikasi.'] });
  addStepSlide(pptx, { title: 'PIC Keuangan - Verifikasi Detail', subtitle: 'Cek administrasi, dokumen, akun anggaran, dan nominatif.', accent: colors.pic, image: 'pic-detail', before: 'Permohonan menunggu verifikasi PIC.', after: 'Jika valid lanjut ke PPK. Jika tidak valid kembali Revisi ke PUMK.', check: 'RAB/rincian biaya, pagu/akun, dokumen, nominatif, total pengajuan, dan konsistensi data.', steps: ['Buka detail permohonan.', 'Periksa semua tab data.', 'Gunakan tombol Nominatif bila tersedia.', 'Klik Verifikasi/Setujui jika semua sesuai.', 'Klik Tolak/Revisi dan isi catatan bila perlu perbaikan.'] });
  addStepSlide(pptx, { title: 'PIC Keuangan - Verifikasi LPJ', subtitle: 'Pantau dokumen pertanggungjawaban setelah PUMK upload LPJ.', accent: colors.pic, image: 'pic-lpj', before: 'Dana sudah cair dan PUMK mengunggah LPJ.', after: 'LPJ tercatat sudah dicek atau perlu tindak lanjut.', check: 'File LPJ, nomor permohonan, judul kegiatan, dan status pencairan/pertanggungjawaban.', steps: ['Buka Keuangan > Verifikasi LPJ.', 'Cari permohonan yang LPJ-nya perlu dicek.', 'Buka atau unduh dokumen LPJ.', 'Bandingkan dengan permohonan dan bukti bayar.', 'Catat tindak lanjut sesuai prosedur internal.'] });

  addRoleIntro(pptx, 'PPK', colors.ppk, 'ppk-list',
    'Approval akhir sebelum permohonan masuk ke Bendahara untuk dicairkan.',
    'Keuangan > Approval Permohonan pada akun PPK.',
    'Permohonan yang disetujui PPK masuk ke antrean Bendahara. Permohonan yang ditolak kembali ke PUMK sebagai Revisi.');
  addStepSlide(pptx, { title: 'PPK - Memproses Approval', subtitle: 'Fokus pada permohonan yang sudah diverifikasi PIC Keuangan.', accent: colors.ppk, image: 'ppk-list', before: 'PIC Keuangan sudah memverifikasi permohonan.', after: 'Permohonan dipilih untuk approval PPK.', check: 'Tab Menunggu, total anggaran, status, dan role berikutnya.', steps: ['Login sebagai PPK.', 'Buka Keuangan > Approval Permohonan.', 'Lihat indikator jumlah menunggu persetujuan.', 'Pilih permohonan dari tab Menunggu/Diajukan.', 'Buka detail untuk pemeriksaan final.'] });
  addStepSlide(pptx, { title: 'PPK - Setujui atau Tolak', subtitle: 'Keputusan PPK menentukan apakah dana boleh diproses Bendahara.', accent: colors.ppk, image: 'ppk-detail', before: 'Permohonan menunggu approval PPK.', after: 'Jika setuju lanjut ke Bendahara. Jika tolak kembali Revisi.', check: 'Riwayat approval Ketua Tim/PIC, total anggaran, dokumen pendukung, dan catatan verifikasi.', steps: ['Baca detail permohonan dan timeline approval.', 'Pastikan nilai dan dokumen sesuai.', 'Klik Approve/Setujui untuk meneruskan ke Bendahara.', 'Klik Tolak/Revisi jika masih ada masalah.', 'Isi catatan penolakan dengan instruksi perbaikan yang spesifik.'] });

  addRoleIntro(pptx, 'Bendahara', colors.bendahara, 'bendahara-list',
    'Memproses pencairan dana, mengunggah bukti bayar, dan memantau dokumen LPJ.',
    'Keuangan > Permohonan Dana untuk pencairan. Keuangan > Verifikasi LPJ untuk pertanggungjawaban.',
    'Permohonan berubah menjadi selesai/dicairkan, bukti bayar tersedia, dan LPJ dapat ditindaklanjuti.');
  addStepSlide(pptx, { title: 'Bendahara - Antrean Pencairan', subtitle: 'Daftar Perlu Diproses berisi permohonan yang sudah disetujui PPK.', accent: colors.bendahara, image: 'bendahara-list', before: 'PPK sudah menyetujui permohonan.', after: 'Permohonan siap dibuka detail pencairannya.', check: 'Nomor permohonan, judul kegiatan, status, Perlu Approval/Oleh, dan total anggaran.', steps: ['Login sebagai Bendahara.', 'Buka Keuangan > Permohonan Dana.', 'Gunakan tab Perlu Diproses.', 'Pilih permohonan yang siap dicairkan.', 'Klik detail/aksi untuk membuka halaman pencairan.'] });
  addStepSlide(pptx, { title: 'Bendahara - Cairkan dan Upload Bukti Bayar', subtitle: 'Finalisasi pencairan dari halaman detail Bendahara.', accent: colors.bendahara, image: 'bendahara-detail', before: 'Status siap dicairkan/menunggu Bendahara.', after: 'Status menjadi Selesai/dicairkan dan bukti bayar dapat diakses.', check: 'Approval lengkap, total pembayaran, dokumen, nominatif, bukti bayar, dan catatan pencairan.', steps: ['Buka detail pencairan dana.', 'Periksa Informasi Kegiatan, Dokumen, dan Rincian Biaya.', 'Klik Setujui/Proses Pencairan jika sudah benar.', 'Upload bukti bayar setelah transaksi dilakukan.', 'Gunakan Buka Kunci hanya jika ada kebutuhan koreksi administratif yang sah.'] });
  addStepSlide(pptx, { title: 'Bendahara - Verifikasi LPJ', subtitle: 'Pantau pertanggungjawaban setelah dana dicairkan.', accent: colors.bendahara, image: 'bendahara-lpj', before: 'PUMK mengunggah LPJ setelah pencairan.', after: 'LPJ tercatat dipantau/dicek oleh Bendahara.', check: 'File LPJ, bukti bayar, status permohonan, dan kesesuaian nilai.', steps: ['Buka Keuangan > Verifikasi LPJ.', 'Cari permohonan yang sudah mencair dan memiliki LPJ.', 'Buka/unduh file LPJ.', 'Bandingkan dengan bukti bayar dan rincian permohonan.', 'Lakukan tindak lanjut jika dokumen belum lengkap.'] });

  addRoleIntro(pptx, 'Super Admin', colors.admin, 'superadmin-list',
    'Monitoring seluruh permohonan lintas tim, melihat detail, membuka kunci bila diperlukan, dan mengelola master anggaran DJA.',
    'Keuangan > Permohonan Dana, Keuangan > Master Anggaran DJA, Referensi Nama, dan Data Master terkait.',
    'Data permohonan dapat diaudit lintas tim. Master anggaran dan referensi dapat dijaga agar pilihan PUMK tetap benar.');
  addStepSlide(pptx, { title: 'Super Admin - Monitoring Lintas Tim', subtitle: 'Melihat seluruh permohonan dana dari semua tim kerja.', accent: colors.admin, image: 'superadmin-list', before: 'Permohonan dibuat dan diproses oleh berbagai role.', after: 'Super Admin mengetahui posisi dan histori setiap permohonan.', check: 'Filter tim, tab status, nomor permohonan, status, approval, dan pihak pemroses.', steps: ['Login sebagai Super Admin.', 'Buka Keuangan > Permohonan Dana.', 'Gunakan filter tim dan tab status.', 'Gunakan search untuk nomor/judul tertentu.', 'Buka detail untuk audit data permohonan.'] });
  addStepSlide(pptx, { title: 'Super Admin - Detail dan Buka Kunci', subtitle: 'Gunakan detail untuk audit dan buka kunci hanya saat perlu koreksi.', accent: colors.admin, image: 'superadmin-detail', before: 'Ada kebutuhan audit/koreksi administratif.', after: 'Data dapat ditelusuri; kunci dapat dibuka dengan alasan bila berwenang.', check: 'Alasan buka kunci, status permohonan, dokumen, rincian biaya, dan riwayat approval.', steps: ['Buka detail permohonan.', 'Periksa tab informasi, dokumen, dan rincian biaya.', 'Gunakan Download Surat jika perlu arsip.', 'Klik Buka Kunci hanya untuk kasus koreksi yang valid.', 'Isi alasan pembukaan kunci agar tercatat audit trail.'] });
  addStepSlide(pptx, { title: 'Super Admin - Master Anggaran DJA', subtitle: 'Master ini menjadi sumber pilihan anggaran saat PUMK membuat permohonan.', accent: colors.admin, image: 'superadmin-master', before: 'Struktur anggaran perlu disiapkan/diperbarui.', after: 'Program sampai rincian biaya tersedia untuk dipilih di form PUMK.', check: 'Program, Sasaran, KRO, RO, Komponen, Kegiatan, Sub Kegiatan, Rincian Biaya, status aktif, dan pagu.', steps: ['Buka Keuangan > Master Anggaran DJA.', 'Tambah/edit struktur anggaran sesuai dokumen resmi.', 'Pastikan item yang dipakai PUMK berstatus aktif.', 'Gunakan import jika data tersedia dalam Excel.', 'Nonaktifkan data yang tidak boleh dipakai tanpa menghapus histori lama.'] });

  slide = pptx.addSlide();
  slide.background = { color: colors.bg };
  addHeader(slide, 'Checklist Singkat Penggunaan Harian', 'Ringkasan aksi per role agar operator tidak salah alur.', colors.blue);
  addBullets(slide, [
    'PUMK: buat draft, lengkapi wizard, upload dokumen/nominatif, submit, perbaiki revisi, upload LPJ setelah cair.',
    'Ketua Tim: cek permohonan tim, setujui jika sesuai, atau kembalikan revisi dengan catatan jelas.',
    'Kabag Umum: monitoring status permohonan dan pihak yang sedang memproses.',
    'PIC Keuangan: verifikasi administrasi/keuangan, cek nominatif, setujui ke PPK atau kembalikan revisi.',
    'PPK: approval final sebelum pencairan, setujui ke Bendahara atau kembalikan revisi.',
    'Bendahara: proses pencairan, upload bukti bayar, pantau/verifikasi LPJ.',
    'Super Admin: monitoring lintas tim, audit detail, buka kunci bila perlu, kelola master anggaran DJA.'
  ], 0.85, 1.25, 11.6, 4.35, 13);
  addBox(slide, 'Catatan Penting', 'Setiap aksi tolak/revisi harus disertai catatan yang bisa langsung ditindaklanjuti PUMK. Jangan hanya menulis "perbaiki" tanpa menyebut bagian data/dokumen yang bermasalah.', 1.0, 5.85, 11.2, 0.82, colors.ppk);

  pptx.writeFile({ fileName: pptPath });
}

await takeScreenshots();
await validateScreenshots();
buildPpt();
console.log(`Created ${pptPath}`);
