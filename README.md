# 🏷️ Approval Goods Management System

A web-based application for managing and approving goods in/out requests.  
Built with **React + Vite**, **Firebase** (Auth + Firestore), **EmailJS**, and **Telegram Bot** for automated notifications.

---

## 🚀 Features

### 👨‍💼 Admin
- Full CRUD for goods (Create, Read, Update, Delete)
- Manage user accounts (add / edit / delete)
- Approve or reject goods requests
- Receive real-time Telegram & Email notifications

### 👤 User
- Add new goods requests (incoming or outgoing)
- View approval status
- Receive Telegram & Email notifications when request is submitted

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | ReactJS + Vite |
| **UI Library** | CoreUI |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Notifications** | EmailJS + Telegram Bot |

---

## ⚙️ Getting Started

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Joyboy04/Approval-Barang.git

cd approval-goods
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Setting Up Environment Variables

Aplikasi ini membutuhkan beberapa API Key untuk Firebase, EmailJS, dan Telegram.
Kamu perlu membuat file bernama `.env` di root project-mu (sejajar dengan `package.json`).

**Langkah-langkah setup .env:**

1. Di root folder project, buat file baru:
```
.env
```

2. Salin isi template di bawah ini ke file tersebut:
```env
# ========================================
# 🔥 Firebase Configuration
# ========================================
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# ========================================
# ✉️ EmailJS Configuration
# ========================================
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_NOTIFICATION_EMAIL=

# ========================================
# 🤖 Telegram Bot Configuration
# ========================================
VITE_TELEGRAM_BOT_TOKEN=
VITE_TELEGRAM_CHAT_ID=
```

3. Simpan file tersebut, lalu jalankan ulang server dev-nya:
```bash
npm run dev
```

**⚠️ Catatan penting:**

- Jangan commit file `.env` kamu ke GitHub publik.
- Untuk dibagikan ke tim lain, gunakan file `.env.example` (template ini bisa kamu salin dan ubah nilainya sesuai project-mu).
- Kalau deploy ke Vercel / Firebase Hosting, masukkan semua variable di menu Environment Variables pada dashboard deploy.

### 4️⃣ Run the App
```bash
npm run dev
```

Lalu buka di browser:
```
http://localhost:3000
```

### 5️⃣ App Flow

- **Login** → Firebase Auth → Role Detection (Admin/User)
- **Admin**: CRUD Goods + Manage Users
- **User**: Create Request + View Status
- **Notifications**: Trigger via EmailJS & Telegram Bot

