export const sampleDate = "2026-11-25";

export const staff = [
  {
    id: "NV-001",
    name: "Trần Minh Anh",
    email: "minhanh@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "NV-002",
    name: "Lê Gia Hân",
    email: "giahan@example.com",
    role: "advisor",
    status: "active",
  },
  {
    id: "NV-003",
    name: "Phạm Quốc Bảo",
    email: "quocbao@example.com",
    role: "operator",
    status: "active",
  },
  {
    id: "NV-004",
    name: "Nguyễn Thu Hà",
    email: "thuha@example.com",
    role: "editor",
    status: "active",
  },
  {
    id: "NV-005",
    name: "Đỗ Quang Huy",
    email: "quanghuy@example.com",
    role: "advisor",
    status: "invited",
  },
];

export const guests = [
  ["Nguyễn Mai Linh", "mailinh"],
  ["Trần Đức Anh", "ducanh"],
  ["Lê Thảo Vy", "thaovy"],
  ["Phạm Hoàng Nam", "hoangnam"],
  ["Vũ Ngọc Hà", "ngocha"],
  ["Bùi Minh Khoa", "minhkhoa"],
  ["Đặng Khánh An", "khanhan"],
  ["Lý Hải Yến", "haiyen"],
];

export const tourSamples = [
  {
    slug: "kham-pha-ha-giang",
    place: "Hà Giang",
    days: 4,
    status: "published",
  },
  { slug: "nghi-duong-da-lat", place: "Đà Lạt", days: 3, status: "published" },
  { slug: "trai-nghiem-hoi-an", place: "Hội An", days: 3, status: "published" },
  {
    slug: "kham-pha-ninh-binh",
    place: "Ninh Bình",
    days: 2,
    status: "published",
  },
  { slug: "hanh-trinh-ha-long", place: "Hạ Long", days: 2, status: "review" },
  { slug: "nghi-duong-phu-quoc", place: "Phú Quốc", days: 4, status: "draft" },
] as const;

export const inquiries = [
  {
    id: "TV-108",
    guest: 0,
    tour: 0,
    status: "new",
    owner: "",
    date: "2026-11-25",
    followUp: "",
    topic: "family",
  },
  {
    id: "TV-107",
    guest: 1,
    tour: 2,
    status: "working",
    owner: "NV-002",
    date: "2026-11-25",
    followUp: "2026-11-25",
    topic: "private",
  },
  {
    id: "TV-106",
    guest: 2,
    tour: 1,
    status: "new",
    owner: "",
    date: "2026-11-24",
    followUp: "",
    topic: "price",
  },
  {
    id: "TV-105",
    guest: 3,
    tour: 3,
    status: "working",
    owner: "NV-003",
    date: "2026-11-24",
    followUp: "2026-11-26",
    topic: "schedule",
  },
  {
    id: "TV-104",
    guest: 4,
    tour: 0,
    status: "closed",
    owner: "NV-002",
    date: "2026-11-23",
    followUp: "",
    topic: "transport",
  },
  {
    id: "TV-103",
    guest: 5,
    tour: 3,
    status: "new",
    owner: "",
    date: "2026-11-23",
    followUp: "",
    topic: "family",
  },
  {
    id: "TV-102",
    guest: 6,
    tour: 2,
    status: "working",
    owner: "NV-002",
    date: "2026-11-22",
    followUp: "2026-11-25",
    topic: "schedule",
  },
  {
    id: "TV-101",
    guest: 7,
    tour: 1,
    status: "closed",
    owner: "NV-003",
    date: "2026-11-21",
    followUp: "",
    topic: "price",
  },
];

export const departures = [
  { id: "KH-201", tour: 0, date: "2026-11-28", capacity: 12, price: 4250000 },
  { id: "KH-202", tour: 2, date: "2026-11-30", capacity: 8, price: 3100000 },
  { id: "KH-203", tour: 1, date: "2026-12-02", capacity: 10, price: 3650000 },
  { id: "KH-204", tour: 3, date: "2026-12-05", capacity: 8, price: 2350000 },
  { id: "KH-205", tour: 0, date: "2026-12-12", capacity: 12, price: 4450000 },
];

export const bookings = [
  {
    id: "DT-306",
    guest: 4,
    departure: "KH-201",
    seats: 4,
    status: "confirmed",
  },
  {
    id: "DT-305",
    guest: 7,
    departure: "KH-203",
    seats: 2,
    status: "confirmed",
  },
  { id: "DT-304", guest: 3, departure: "KH-204", seats: 3, status: "pending" },
  {
    id: "DT-303",
    guest: 6,
    departure: "KH-202",
    seats: 8,
    status: "confirmed",
  },
  {
    id: "DT-302",
    guest: 1,
    departure: "KH-201",
    seats: 2,
    status: "confirmed",
  },
  {
    id: "DT-301",
    guest: 5,
    departure: "KH-205",
    seats: 2,
    status: "cancelled",
  },
];

export const transactions = [
  { id: "GD-406", booking: "DT-306", status: "paid", method: "transfer" },
  { id: "GD-405", booking: "DT-305", status: "paid", method: "card" },
  { id: "GD-404", booking: "DT-304", status: "pending", method: "transfer" },
  { id: "GD-403", booking: "DT-303", status: "paid", method: "transfer" },
  { id: "GD-402", booking: "DT-302", status: "paid", method: "card" },
  { id: "GD-401", booking: "DT-301", status: "refunded", method: "card" },
];

export const contentPages = [
  { id: "home", path: "/", owner: "NV-004", status: "published" },
  {
    id: "experiences",
    path: "/experiences",
    owner: "NV-004",
    status: "review",
  },
  { id: "contact", path: "/contacts", owner: "NV-001", status: "published" },
  {
    id: "terms",
    path: "/terms-and-conditions",
    owner: "NV-001",
    status: "draft",
  },
  {
    id: "privacy",
    path: "/privacy-policy",
    owner: "NV-001",
    status: "published",
  },
];

export const accessRoles = [
  { id: "admin", scope: "manageAll" },
  { id: "advisor", scope: "manageInquiries" },
  { id: "operator", scope: "manageDepartures" },
  { id: "editor", scope: "manageContent" },
];
