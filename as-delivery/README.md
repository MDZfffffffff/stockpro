# AS Delivery — ระบบยืนยันการส่งของ
**AS Welding Supply Co., Ltd.**

## วิธีติดตั้งบน Windows

### 1. ติดตั้ง Node.js
ดาวน์โหลด Node.js LTS จาก https://nodejs.org แล้วติดตั้งตามปกติ

### 2. Clone / วางโฟลเดอร์โปรเจกต์
วางโฟลเดอร์ `as-delivery` ที่ไหนก็ได้บนเครื่อง เช่น `C:\as-delivery`

### 3. ติดตั้ง Dependencies
เปิด Command Prompt หรือ PowerShell แล้วรัน:
```
cd C:\as-delivery
npm install
```

### 4. เริ่มใช้งาน
```
npm start
```
แอปจะรันที่ http://localhost:3100

### บัญชีเริ่มต้น
| Username | Password | บทบาท |
|----------|----------|--------|
| admin | admin1234 | Admin |
| driver01 | driver1234 | Driver |

> **ควรเปลี่ยนรหัสผ่านหลังจาก Login ครั้งแรก**

---

## ใช้งานผ่านมือถือ (Driver)
1. เชื่อม PC และมือถือเข้า WiFi เดียวกัน
2. ดู IP ของ PC (`ipconfig` ใน CMD)
3. เปิด Chrome บนมือถือ → `http://[IP]:3100`
4. เพิ่มลงหน้าจอหลัก (Add to Home Screen) เพื่อใช้แบบ PWA

## ใช้งานผ่าน Cloudflare Tunnel (ภายนอกออฟฟิศ)
ติดตั้ง cloudflared แล้วรัน:
```
cloudflared tunnel --url http://localhost:3100
```
จะได้ URL ที่เข้าถึงได้จากภายนอก

---

## โครงสร้างโปรเจกต์
```
as-delivery/
├── server/
│   ├── index.js          # Express entry point (port 3100)
│   ├── database.js       # SQLite + seed data
│   ├── middleware/auth.js # JWT
│   ├── routes/
│   │   ├── auth.js
│   │   ├── deliveries.js
│   │   ├── photos.js
│   │   ├── sync.js
│   │   └── users.js
│   └── uploads/          # รูปภาพ (ไม่อยู่ใน git)
├── client/
│   ├── index.html        # SPA
│   ├── manifest.json     # PWA
│   ├── sw.js             # Service Worker
│   ├── css/style.css
│   └── js/
│       ├── app.js        # Router + Auth
│       ├── api.js        # Fetch + Offline queue
│       ├── db.js         # IndexedDB
│       ├── driver/       # Driver views
│       └── admin/        # Admin views
├── data/                 # SQLite DB (สร้างอัตโนมัติ)
└── package.json
```

## Environment Variables (ตั้งค่าก่อน production)
```
JWT_SECRET=your-secret-key-here
PORT=3100
```
