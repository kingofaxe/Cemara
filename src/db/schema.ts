import { pgTable, text, varchar, timestamp, boolean, uuid, decimal, integer, jsonb, date } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rtRw = pgTable("rt_rw", {
  id: uuid("id").primaryKey().defaultRandom(),
  namaRt: varchar("nama_rt", { length: 50 }).notNull(),
  namaRw: varchar("nama_rw", { length: 50 }).notNull(),
  wilayah: text("wilayah"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clusters = pgTable("clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: varchar("nama", { length: 100 }).notNull(),
  kode: varchar("kode", { length: 20 }).notNull(),
  rtRwId: uuid("rt_rw_id").references(() => rtRw.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const unitTypes = pgTable("unit_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  nama: varchar("nama", { length: 100 }).notNull(),
  kode: varchar("kode", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorUnit: varchar("nomor_unit", { length: 20 }).notNull(),
  clusterId: uuid("cluster_id").references(() => clusters.id),
  unitTypeId: uuid("unit_type_id").references(() => unitTypes.id),
  status: varchar("status", { length: 20 }).default("kosong"), // dihuni/kosong/masalah
  lantai: integer("lantai"),
  luas: decimal("luas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const residents = pgTable("residents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  unitId: uuid("unit_id").references(() => units.id),
  namaLengkap: varchar("nama_lengkap", { length: 200 }).notNull(),
  nik: varchar("nik", { length: 20 }).unique(),
  noKk: varchar("no_kk", { length: 20 }),
  status: varchar("status", { length: 20 }), // pemilik/sewa/kos
  tanggalMasuk: date("tanggal_masuk"),
  tanggalKeluar: date("tanggal_keluar"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const residentDocuments = pgTable("resident_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  residentId: uuid("resident_id").references(() => residents.id),
  tipe: varchar("tipe", { length: 50 }), // KTP/KK/lainnya
  filePath: varchar("file_path", { length: 500 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  residentId: uuid("resident_id").references(() => residents.id),
  tipe: varchar("tipe", { length: 20 }), // mobil/motor
  platNomor: varchar("plat_nomor", { length: 20 }).notNull(),
  warna: varchar("warna", { length: 50 }),
  merek: varchar("merek", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const menuPermissions = pgTable("menu_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuKey: varchar("menu_key", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  isVisible: boolean("is_visible").default(true),
  accessLevel: varchar("access_level", { length: 20 }).default("full"), // 'full', 'read', 'limited'
});
