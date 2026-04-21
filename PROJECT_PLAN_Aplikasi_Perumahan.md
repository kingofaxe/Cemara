# 🏘️ PROJECT PLAN — Aplikasi Perumahan v2

> **Untuk:** Junior Developer / AI Assistant  
> **Stack:** Web + Mobile (PWA/React Native) | Backend Docker | REST API  
> **Total Fitur:** 91 fitur dari file `aplikasi_perumahan_v2.xlsx`

---

## 📐 ARSITEKTUR SISTEM (Wajib Dibaca Dulu)

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Web (React/Next.js)  +  Mobile (React Native)  │
└──────────────────────┬──────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────▼──────────────────────────┐
│              BACKEND (Docker Container)          │
│  Node.js / Laravel / FastAPI — pilih satu        │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Auth/RBAC  │  │ Business │  │ Notification│  │
│  │ Service    │  │ Logic    │  │ Service(WA) │  │
│  └────────────┘  └──────────┘  └─────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              DATABASE (Docker)                   │
│  PostgreSQL + Redis (cache/session)              │
└─────────────────────────────────────────────────┘
```

### Docker Services (docker-compose.yml):
- `app` — Backend API server
- `db` — PostgreSQL
- `redis` — Cache & session
- `nginx` — Reverse proxy
- `worker` — Background jobs (notifikasi, PDF generate)

---

## 👥 ROLES & PERMISSION SYSTEM

> **Penting:** Setiap menu bisa ditampilkan/disembunyikan dari panel Admin.  
> Permission disimpan di database, bukan hardcode.

| Role | Kode |
|------|------|
| Admin | `admin` |
| Ketua RT | `ketua_rt` |
| Bendahara | `bendahara` |
| Sekretaris | `sekretaris` |
| Petugas Keamanan | `petugas_keamanan` |
| Petugas Iuran | `petugas_iuran` |
| Penghuni Pemilik | `penghuni_pemilik` |
| Penghuni Sewa | `penghuni_sewa` |
| Penghuni Kos | `penghuni_kos` |

### Tabel Database untuk Permission:
```sql
-- Menu yang bisa diatur tampil/sembunyi per role
CREATE TABLE menu_permissions (
  id           SERIAL PRIMARY KEY,
  menu_key     VARCHAR(100) NOT NULL,  -- e.g. 'keuangan.tagihan'
  role         VARCHAR(50) NOT NULL,
  is_visible   BOOLEAN DEFAULT true,
  access_level VARCHAR(20) DEFAULT 'full' -- 'full', 'read', 'limited'
);
```

---

## 🗂️ FASE PENGEMBANGAN

---

## FASE 1 — FONDASI (Wajib Ada, Kerjakan Pertama)

### EPIC 1: Setup Proyek & Infrastruktur

#### ISSUE-001: Setup Docker & Environment
**Estimasi:** 1-2 hari  
**Deskerjakan oleh:** 1 developer

**Task:**
- [ ] Buat `docker-compose.yml` dengan service: `app`, `db`, `redis`, `nginx`, `worker`
- [ ] Buat `Dockerfile` untuk backend
- [ ] Setup environment variables (`.env.example`)
- [ ] Setup database PostgreSQL dengan schema awal
- [ ] Pastikan `docker-compose up` berjalan tanpa error

**Acceptance Criteria:**
- `docker-compose up -d` sukses
- API health check endpoint `/api/health` return 200
- Database terkoneksi

---

#### ISSUE-002: Sistem Autentikasi (Login/Logout)
**Estimasi:** 2-3 hari  
**Depends on:** ISSUE-001

**Task:**
- [ ] Endpoint `POST /api/auth/login` (username + password)
- [ ] Endpoint `POST /api/auth/logout`
- [ ] Endpoint `GET /api/auth/me` — info user yang sedang login
- [ ] JWT token dengan refresh token
- [ ] Rate limiting login (max 5x salah → lock 15 menit)
- [ ] UI: Halaman login (web + mobile)
- [ ] **Logika Identifier:** Username untuk penghuni adalah Nomor Unit (misal: `A-01`) atau Unit-Kamar (misal: `A-01-K02`), untuk staf menggunakan nama/email.

**Tabel Database:**
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(100) UNIQUE NOT NULL, -- No Unit / No Kamar / Staf ID
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(200) UNIQUE, -- Opsional untuk penghuni
  phone      VARCHAR(20),
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50) NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria:**
- Login berhasil → dapat JWT token
- Token expired → redirect ke login
- User nonaktif tidak bisa login

---

#### ISSUE-003: Sistem RBAC — Menu Bisa Dikonfigurasi Admin
**Estimasi:** 3-4 hari  
**Depends on:** ISSUE-002  
**PRIORITAS TINGGI — Ini fondasi seluruh sistem permission**

**Task:**
- [ ] Buat tabel `menu_permissions` (lihat schema di atas)
- [ ] Seed data awal permission berdasarkan file Excel (kolom ✓/X/~)
- [ ] Middleware: cek permission setiap request API
- [ ] Endpoint `GET /api/admin/menus` — daftar semua menu + status per role
- [ ] Endpoint `PUT /api/admin/menus/:menuKey/role/:role` — ubah permission
- [ ] Frontend: Panel admin untuk atur visibilitas menu per role (toggle on/off)
- [ ] Frontend: Render sidebar/nav berdasarkan permission user yang login

**Logika permission dari Excel:**
- `✓` = `is_visible: true, access_level: 'full'`
- `X` = `is_visible: false`
- `~` = `is_visible: true, access_level: 'limited'`

**Acceptance Criteria:**
- Admin bisa toggle menu on/off per role dari UI
- Perubahan langsung efek tanpa restart server
- User hanya melihat menu yang diizinkan

---

### EPIC 2: Master Data & Setup

#### ISSUE-004: Manajemen Data RT, RW, Cluster, Blok
**Estimasi:** 2 hari  
**Role yang bisa akses:** Admin only  
**Fitur dari Excel:** No. 1, 2, 3

**Task:**
- [ ] CRUD endpoint: RT & RW (`/api/master/rt-rw`)
- [ ] CRUD endpoint: Cluster/Blok perumahan (`/api/master/cluster`)
- [ ] CRUD endpoint: Tipe unit (rumah, kos, sewa) (`/api/master/unit-type`)
- [ ] UI: Form tambah/edit/hapus dengan konfirmasi delete

**Tabel Database:**
```sql
CREATE TABLE rt_rw (id, nama_rt, nama_rw, wilayah, created_at);
CREATE TABLE clusters (id, nama, kode, rt_rw_id, created_at);
CREATE TABLE unit_types (id, nama, kode, created_at); -- rumah/kos/sewa
```

---

#### ISSUE-005: Manajemen Akun Pengguna
**Estimasi:** 2-3 hari  
**Role yang bisa akses:** Admin  
**Fitur dari Excel:** No. 4, 5

**Task:**
- [ ] Endpoint: Buat akun user baru (`POST /api/admin/users`)
- [ ] Endpoint: Assign role ke user (`PUT /api/admin/users/:id/role`)
- [ ] Endpoint: Non-aktifkan/blokir akun (`PUT /api/admin/users/:id/status`)
- [ ] UI: Tabel daftar user + filter per role + tombol aksi

---

### EPIC 3: Data Penghuni & Unit

#### ISSUE-006: Manajemen Unit Rumah
**Estimasi:** 2 hari  
**Fitur dari Excel:** No. 14, 15, 17

**Task:**
- [ ] CRUD unit rumah (`/api/units`)
- [ ] Status unit: `dihuni`, `kosong`, `masalah`
- [ ] Endpoint: Riwayat penghuni per unit (`GET /api/units/:id/history`)
- [ ] UI: Peta/daftar unit dengan status berwarna (hijau/merah/kuning)

**Tabel Database:**
```sql
CREATE TABLE units (
  id          UUID PRIMARY KEY,
  nomor_unit  VARCHAR(20) NOT NULL,
  cluster_id  UUID REFERENCES clusters(id),
  unit_type_id UUID REFERENCES unit_types(id),
  status      VARCHAR(20) DEFAULT 'kosong', -- dihuni/kosong/masalah
  lantai      INT,
  luas        DECIMAL
);
```

---

#### ISSUE-007: Input & Manajemen Data Penghuni
**Estimasi:** 3 hari  
**Role yang bisa akses:** Admin, Ketua RT, Sekretaris  
**Fitur dari Excel:** No. 9, 10, 11, 12, 13, 16, 18

**Task:**
- [ ] Endpoint: Input penghuni baru + assign ke unit (`POST /api/residents`)
- [ ] **Otomatisasi:** Generate akun `users` saat input penghuni (Username = Nomor Unit)
- [ ] Endpoint: Edit data penghuni (`PUT /api/residents/:id`)
- [ ] Endpoint: Upload KTP & KK (file upload, simpan di `/uploads`) (`POST /api/residents/:id/documents`)
- [ ] Endpoint: Tambah anggota keluarga (`POST /api/residents/:id/family`)
- [ ] Endpoint: Daftarkan kendaraan (`POST /api/residents/:id/vehicles`)
- [ ] Endpoint: Proses pindah keluar (`PUT /api/residents/:id/move-out`)
- [ ] Generate kartu identitas warga digital dengan QR Code (`GET /api/residents/:id/qr-card`)
- [ ] UI: Form input penghuni dengan upload foto dokumen

**Tabel Database:**
```sql
CREATE TABLE residents (
  id           UUID PRIMARY KEY,
  user_id      UUID REFERENCES users(id),
  unit_id      UUID REFERENCES units(id),
  nama_lengkap VARCHAR(200),
  nik          VARCHAR(20) UNIQUE,
  no_kk        VARCHAR(20),
  status       VARCHAR(20), -- pemilik/sewa/kos
  tanggal_masuk DATE,
  tanggal_keluar DATE,
  is_active    BOOLEAN DEFAULT true
);

CREATE TABLE resident_documents (
  id          UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  tipe        VARCHAR(50), -- KTP/KK/lainnya
  file_path   VARCHAR(500),
  uploaded_at TIMESTAMP
);

CREATE TABLE vehicles (
  id          UUID PRIMARY KEY,
  resident_id UUID REFERENCES residents(id),
  tipe        VARCHAR(20), -- mobil/motor
  plat_nomor  VARCHAR(20),
  warna       VARCHAR(50),
  merek       VARCHAR(100)
);
```

---

## FASE 2 — FITUR UTAMA

### EPIC 4: Keuangan & Tagihan

#### ISSUE-008: Setting Tarif & Generate Tagihan
**Estimasi:** 3 hari  
**Role yang bisa akses:** Admin, Bendahara  
**Fitur dari Excel:** No. 19, 20, 21

**Task:**
- [ ] CRUD tarif iuran per tipe unit (`/api/billing/rates`)
- [ ] Endpoint: Generate tagihan bulanan massal (`POST /api/billing/generate-monthly`)
- [ ] Endpoint: Buat tagihan khusus/insidentil (`POST /api/billing/special`)
- [ ] UI: Form setting tarif + tombol "Generate Tagihan Bulan Ini"

**Tabel Database:**
```sql
CREATE TABLE billing_rates (
  id           UUID PRIMARY KEY,
  unit_type_id UUID REFERENCES unit_types(id),
  nama         VARCHAR(200),
  nominal      DECIMAL(15,2),
  periode      VARCHAR(20) DEFAULT 'bulanan'
);

CREATE TABLE invoices (
  id           UUID PRIMARY KEY,
  resident_id  UUID REFERENCES residents(id),
  unit_id      UUID REFERENCES units(id),
  tipe         VARCHAR(50), -- bulanan/khusus/sewa_kos/listrik_kos
  nominal      DECIMAL(15,2),
  bulan        DATE,
  status       VARCHAR(20) DEFAULT 'belum_lunas', -- lunas/belum_lunas/menunggak
  due_date     DATE,
  created_at   TIMESTAMP
);
```

---

#### ISSUE-009: Pembayaran & Konfirmasi
**Estimasi:** 4 hari  
**Fitur dari Excel:** No. 24, 25, 26, 27, 28, 29, 30

**Task:**
- [ ] Endpoint: Pembayaran via QRIS/VA (integrasi payment gateway — Midtrans/Xendit) (`POST /api/payments/online`)
- [ ] Endpoint: Konfirmasi pembayaran manual tunai (`POST /api/payments/manual-confirm`)
- [ ] Endpoint: Catat pembayaran door-to-door oleh petugas iuran (`POST /api/payments/field-collect`)
- [ ] Endpoint: Daftar tagihan belum lunas (`GET /api/billing/unpaid`)
- [ ] Generate kwitansi PDF otomatis (`GET /api/payments/:id/receipt`)
- [ ] Endpoint: Riwayat pembayaran penghuni (`GET /api/residents/:id/payment-history`)
- [ ] Endpoint: Daftar tunggakan & penalti (`GET /api/billing/overdue`)
- [ ] UI: Halaman tagihan penghuni + tombol bayar + upload bukti

**Tabel Database:**
```sql
CREATE TABLE payments (
  id           UUID PRIMARY KEY,
  invoice_id   UUID REFERENCES invoices(id),
  metode       VARCHAR(50), -- qris/va/transfer/tunai
  nominal      DECIMAL(15,2),
  bukti_path   VARCHAR(500),
  verified_by  UUID REFERENCES users(id),
  verified_at  TIMESTAMP,
  created_at   TIMESTAMP
);
```

---

#### ISSUE-010: Laporan Keuangan
**Estimasi:** 3 hari  
**Role yang bisa akses:** Admin, Bendahara, (sebagian) Ketua RT  
**Fitur dari Excel:** No. 32, 33, 35, 36, 37, 38

**Task:**
- [ ] Endpoint: Catat pengeluaran operasional (`POST /api/expenses`)
- [ ] Endpoint: Kelola kas RT (`GET/POST /api/treasury`)
- [ ] Endpoint: Laporan keuangan bulanan (`GET /api/reports/finance/monthly`)
- [ ] Endpoint: Laporan keuangan tahunan (`GET /api/reports/finance/yearly`)
- [ ] Export laporan ke PDF & Excel (`GET /api/reports/finance/export?format=pdf|xlsx`)
- [ ] Audit log semua transaksi (`GET /api/audit/transactions`)
- [ ] Kirim reminder otomatis tagihan (background job) — WA/email

---

### EPIC 5: Surat Pengantar RT

#### ISSUE-011: Manajemen Jenis Surat (Admin)
**Estimasi:** 1 hari  
**Fitur dari Excel:** No. 39

**Task:**
- [ ] CRUD jenis surat (`/api/letters/types`)
- [ ] Seed data 17 jenis surat default (KTP, KK, Lahir, dll — sesuai Excel)
- [ ] UI: Panel admin kelola daftar jenis surat

**Jenis surat default (seed):**
```
KTP Baru/Perpanjang, Kartu Keluarga, Kelahiran Baru/Lama,
Kematian/Ket. Waris, Pindah Keluar/Masuk, Ijin Keramaian,
Kel. Ekonomi Lemah, Ijin Usaha/IMB, Domisili/Tempat Tinggal,
Nikah/Talak/Rujuk/Cerai, Belum Menikah, Pensiun/Taspen/Asabri,
Belum Punya Rumah, Kelakuan Baik/SKCK, Wesel Paket Berharga,
KIDS/KIPEM/KARNOP, Akta Tanah/SPPT/PBB
```

---

#### ISSUE-012: Alur Pengajuan Surat oleh Warga
**Estimasi:** 4 hari  
**Role yang bisa akses:** Penghuni Pemilik, Penghuni Sewa, Penghuni Kos  
**Fitur dari Excel:** No. 40–54

**Task (ikuti alur 10 langkah dari sheet "Alur Surat Pengantar"):**

- [ ] **Step 1:** Endpoint: Pilih jenis surat → validasi KTP sudah terverifikasi
- [ ] **Step 2:** Form data diri otomatis dari profil (prefill)
- [ ] **Step 3:** Checklist keperluan surat (18 opsi)
- [ ] **Step 4:** Upload dokumen pendukung (KTP wajib, KK wajib, lainnya opsional) — max 5MB
- [ ] **Step 5:** Submit pengajuan → notifikasi WA ke RT & Sekretaris
- [ ] **Step 6:** Endpoint review pengajuan untuk RT/Sekretaris
- [ ] **Step 7a:** Approve → generate PDF otomatis dengan nomor surat `001/RT01/IV/2026`
- [ ] **Step 7b:** Tolak → wajib isi alasan penolakan
- [ ] **Step 8:** E-signature RT dilekatkan otomatis ke PDF
- [ ] **Step 9:** Warga download PDF surat
- [ ] **Step 10:** QR Code verifikasi keaslian surat (bisa scan siapapun)
- [ ] Arsip & riwayat semua surat (`GET /api/letters/archive`)
- [ ] Template surat bisa dikustomisasi admin
- [ ] SLA proses surat (alert jika lebih dari N hari belum diproses)

**Tabel Database:**
```sql
CREATE TABLE letter_requests (
  id              UUID PRIMARY KEY,
  resident_id     UUID REFERENCES residents(id),
  letter_type_id  UUID REFERENCES letter_types(id),
  keperluan       JSONB, -- array checklist yang dipilih
  data_diri       JSONB, -- snapshot data diri saat pengajuan
  status          VARCHAR(30) DEFAULT 'pending', -- pending/approved/rejected
  alasan_tolak    TEXT,
  nomor_surat     VARCHAR(100) UNIQUE,
  pdf_path        VARCHAR(500),
  qr_token        VARCHAR(255) UNIQUE,
  submitted_at    TIMESTAMP,
  processed_at    TIMESTAMP,
  processed_by    UUID REFERENCES users(id)
);
```

---

### EPIC 6: Pengaduan Warga

#### ISSUE-013: Sistem Tiket Pengaduan
**Estimasi:** 3 hari  
**Fitur dari Excel:** No. 55–62

**Task:**
- [ ] Endpoint: Buat pengaduan baru + upload foto/video (`POST /api/complaints`)
- [ ] CRUD kategori pengaduan (`/api/complaints/categories`)
- [ ] Endpoint: Assign pengaduan ke petugas (`PUT /api/complaints/:id/assign`)
- [ ] Endpoint: Update status tiket (`PUT /api/complaints/:id/status`)
- [ ] Endpoint: Upload foto bukti penyelesaian (`POST /api/complaints/:id/evidence`)
- [ ] Endpoint: Rating & komentar penyelesaian oleh warga (`POST /api/complaints/:id/rating`)
- [ ] Endpoint: Monitor semua tiket aktif (`GET /api/complaints?status=active`)
- [ ] Endpoint: Riwayat pengaduan per unit (`GET /api/units/:id/complaints`)
- [ ] UI: Board tiket (Kanban: Baru → Proses → Selesai)

**Tabel Database:**
```sql
CREATE TABLE complaints (
  id           UUID PRIMARY KEY,
  resident_id  UUID REFERENCES residents(id),
  unit_id      UUID REFERENCES units(id),
  kategori_id  UUID REFERENCES complaint_categories(id),
  deskripsi    TEXT,
  foto_paths   JSONB,
  status       VARCHAR(30) DEFAULT 'baru', -- baru/proses/selesai
  assigned_to  UUID REFERENCES users(id),
  rating       INT, -- 1-5
  komentar     TEXT,
  created_at   TIMESTAMP,
  resolved_at  TIMESTAMP
);
```

---

## FASE 3 — FITUR LANJUTAN

### EPIC 7: Keamanan & Akses Gerbang

#### ISSUE-014: Sistem QR Code & Akses Gerbang
**Estimasi:** 3 hari  
**Role yang bisa akses:** Petugas Keamanan, Penghuni (semua)  
**Fitur dari Excel:** No. 63–70

**Task:**
- [ ] Generate QR Code unik per penghuni (`GET /api/residents/:id/qr`)
- [ ] Endpoint: Scan & verifikasi QR gerbang (`POST /api/security/verify-qr`)
- [ ] Endpoint: Registrasi tamu + generate QR tamu sementara (1x pakai / batas waktu)
- [ ] Endpoint: Catat kendaraan masuk manual (input plat nomor)
- [ ] Log keluar masuk kendaraan (`GET /api/security/vehicle-log`)
- [ ] Endpoint: Laporan keamanan harian/mingguan (`GET /api/security/reports`)
- [ ] Endpoint: Panic button → notifikasi ke security + RT (`POST /api/security/panic`)
- [ ] UI Mobile: Kamera scan QR Code (gunakan library `react-native-camera` atau `html5-qrcode`)

**Catatan:**
- QR Code penghuni: berisi token unik, verify ke server
- QR tamu: expired otomatis setelah dipakai atau batas waktu habis
- Layar scan: Hijau = valid, Merah = tidak dikenal

---

### EPIC 8: Petugas Iuran (Mobile-First)

#### ISSUE-015: Fitur Khusus Petugas Iuran
**Estimasi:** 2 hari  
**Role:** Petugas Iuran  
**Referensi:** Sheet "Petugas Iuran & Security" di Excel

**Task:**
- [ ] Tampilan mobile: Daftar tagihan belum lunas yang bisa ditagih hari ini
- [ ] Filter per blok/RT untuk rute keliling
- [ ] Verifikasi status hunian unit sebelum menagih
- [ ] Update status unit saat di lapangan (kosong/pindah)
- [ ] Catat pembayaran tunai: input nominal → konfirmasi → kwitansi langsung ke WA warga
- [ ] Upload foto bukti bayar
- [ ] Rekap hasil penagihan harian → laporan otomatis ke bendahara
- [ ] Tandai unit "tidak bisa ditemui" untuk follow up RT

---

### EPIC 9: Petugas Keamanan (Mobile-First)

#### ISSUE-016: Fitur Khusus Petugas Keamanan
**Estimasi:** 2 hari  
**Role:** Petugas Keamanan  
**Referensi:** Sheet "Petugas Iuran & Security" di Excel

**Task:**
- [ ] Scan QR penghuni → validasi otomatis → log tercatat
- [ ] Scan QR tamu → tampil nama, tujuan, jam berlaku
- [ ] Catat kendaraan manual (input plat) jika tidak ada QR
- [ ] Lihat daftar penghuni aktif (foto + nama + unit)
- [ ] Checklist patroli harian per shift
- [ ] Input laporan kejadian + foto → notif ke RT
- [ ] Terima notifikasi panic button dari warga

---

### EPIC 10: Maintenance & Fasilitas

#### ISSUE-017: Jadwal & Inventaris
**Estimasi:** 3 hari  
**Fitur dari Excel:** No. 71–77

**Task:**
- [ ] CRUD jadwal perawatan rutin (servis genset, pompa, dll)
- [ ] Checklist harian petugas (kebersihan, taman, kolam)
- [ ] CRUD inventaris aset & peralatan
- [ ] Riwayat perbaikan per aset
- [ ] Booking fasilitas umum (GOR, kolam) + kalender ketersediaan
- [ ] Laporan kondisi aset

---

### EPIC 11: Komunikasi & Informasi

#### ISSUE-018: Pengumuman & Komunikasi
**Estimasi:** 2 hari  
**Fitur dari Excel:** No. 78–82

**Task:**
- [ ] Endpoint: Buat & kirim pengumuman (broadcast ke semua / RT tertentu)
- [ ] Push notifikasi ke mobile
- [ ] Direktori kontak penting (nomor darurat, petugas)
- [ ] Buat & simpan notulen rapat
- [ ] Broadcast WA ke warga (integrasi WhatsApp API / WABLAS / Fonnte)

---

### EPIC 12: Modul Kos-Kosan

#### ISSUE-019: Fitur Khusus Kos
**Estimasi:** 4 hari  
**Role:** Admin  
**Fitur dari Excel:** No. 83–91

**Task:**
- [ ] Buat unit kos (1 rumah = N kamar) (`POST /api/kos/units`)
- [ ] **Otomatisasi:** Generate akun `users` per penghuni kamar (Username = Nomor Unit - No Kamar, misal: `B05-K01`)
- [ ] Input detail tiap kamar (ukuran, harga, fasilitas, foto)
- [ ] Status kamar: tersedia/dihuni/maintenance
- [ ] Dashboard monitoring kos: ringkasan semua kamar untuk Admin
- [ ] Tagihan sewa + listrik kamar bulanan
- [ ] Deposit & pengembalian deposit
- [ ] Laporan penghasilan kos per bulan
- [ ] Notifikasi kontrak hampir habis (background job)
- [ ] Aturan kos digital (jam tamu, dll)
- [ ] Laporan penghuni kos ke RT

---

## 📣 SISTEM NOTIFIKASI

#### ISSUE-020: Integrasi Notifikasi
**Estimasi:** 3 hari

**Task:**
- [ ] **Push Notification:** Firebase Cloud Messaging (FCM) untuk web & mobile
- [ ] **WhatsApp:** Integrasi Fonnte / WABLAS / Twilio WhatsApp
- [ ] **Email:** SMTP (Nodemailer / SendGrid)
- [ ] Background worker untuk: reminder tagihan, kontrak mau habis, SLA surat
- [ ] Template notifikasi yang bisa dikustomisasi admin

---

## 🔧 FITUR TEKNIS SISTEM

#### ISSUE-021: Log, Backup, & Sistem Admin
**Estimasi:** 2 hari  
**Fitur dari Excel:** No. 7, 8, 38

**Task:**
- [ ] Log aktivitas semua pengguna (siapa, kapan, aksi apa) — audit trail
- [ ] Audit log transaksi keuangan
- [ ] Endpoint: Backup database (`POST /api/admin/backup`) → download file `.sql`
- [ ] Endpoint: Restore database (`POST /api/admin/restore`)
- [ ] Cron job backup otomatis harian

---

## 📱 CATATAN KHUSUS MOBILE

#### ISSUE-022: Mobile App (PWA atau React Native)
**Estimasi:** Ongoing setiap fase

**Prioritas fitur di mobile:**
1. Login & profil
2. Lihat & bayar tagihan
3. Scan QR (petugas keamanan & iuran)
4. Pengajuan surat
5. Buat pengaduan + foto
6. Panic button
7. Terima notifikasi

**Pilihan pendekatan:**
- **PWA (Progressive Web App):** Satu codebase web, bisa install di HP. Lebih cepat develop.
- **React Native:** Native app terpisah untuk iOS & Android. UX lebih baik.

**Rekomendasi awal:** Mulai dengan PWA, upgrade ke React Native di fase lanjut.

---

## 📊 RINGKASAN ISSUES

| No | Epic | Issue | Estimasi | Fase |
|----|------|-------|----------|------|
| 001 | Setup | Docker & Environment | 1-2 hari | 1 |
| 002 | Auth | Login/Logout/JWT | 2-3 hari | 1 |
| 003 | Auth | RBAC & Menu Permission | 3-4 hari | 1 |
| 004 | Master Data | RT, RW, Cluster, Tipe Unit | 2 hari | 1 |
| 005 | Master Data | Manajemen Akun User | 2-3 hari | 1 |
| 006 | Penghuni | Manajemen Unit Rumah | 2 hari | 1 |
| 007 | Penghuni | Data Penghuni & Dokumen | 3 hari | 1 |
| 008 | Keuangan | Tarif & Generate Tagihan | 3 hari | 2 |
| 009 | Keuangan | Pembayaran & Konfirmasi | 4 hari | 2 |
| 010 | Keuangan | Laporan Keuangan | 3 hari | 2 |
| 011 | Surat | Kelola Jenis Surat | 1 hari | 2 |
| 012 | Surat | Alur Pengajuan Surat | 4 hari | 2 |
| 013 | Pengaduan | Sistem Tiket | 3 hari | 2 |
| 014 | Keamanan | QR Code & Akses Gerbang | 3 hari | 3 |
| 015 | Petugas | Fitur Petugas Iuran | 2 hari | 3 |
| 016 | Petugas | Fitur Petugas Keamanan | 2 hari | 3 |
| 017 | Fasilitas | Jadwal & Inventaris | 3 hari | 3 |
| 018 | Komunikasi | Pengumuman & WA | 2 hari | 3 |
| 019 | Kos | Modul Kos-Kosan | 4 hari | 3 |
| 020 | Sistem | Notifikasi (FCM + WA) | 3 hari | 2-3 |
| 021 | Sistem | Log, Backup, Admin | 2 hari | 2 |
| 022 | Mobile | PWA / React Native | Ongoing | Semua |

**Total estimasi minimum:** ±55–60 hari developer (bisa paralel dengan 2-3 orang)

---

## 🛑 ATURAN UNTUK DEVELOPER

1. **Setiap endpoint API harus ada middleware cek permission** — jangan skip
2. **Semua file upload** simpan di `/storage/uploads/` dan catat path di DB
3. **Semua aksi sensitif** (approve surat, konfirmasi bayar) harus dicatat di audit log
4. **Soft delete** untuk semua data penting — jangan `DELETE` permanent
5. **QR Code** harus server-side verification, bukan client-side
6. **PDF generate** harus background job — jangan blokir request
7. **Gunakan UUID** untuk semua primary key, bukan integer auto-increment
8. **Setiap response API** ikuti format:
```json
{
  "success": true,
  "data": {},
  "message": "Berhasil",
  "errors": null
}
```

---

*Generated from: `aplikasi_perumahan_v2.xlsx` | April 2026*
