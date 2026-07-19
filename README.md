<div align="center">

<br/>

<img src="artifacts/thanarah-portal/public/logo-full.png" alt="Thanarah Logo" width="280"/>

<br/><br/>

# THANARAH PRESENTATION PORTAL
### بوابة ثناره التقديمية

<p align="center">
  <strong>منظومة العرض الآمنة والمتكاملة للقطاع الطبي</strong><br/>
  <em>A Secure, Private Investor & Partner Presentation Portal for Thanarah Medical-Tech</em>
</p>

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

<br/>

<img src="https://img.shields.io/badge/Arabic-RTL%20First-0F3D33?style=flat-square&labelColor=1E6B4D" />
<img src="https://img.shields.io/badge/Languages-AR%20%7C%20EN%20%7C%20TR%20%7C%20UR-6FAE8A?style=flat-square&labelColor=0F3D33" />
<img src="https://img.shields.io/badge/PWA-Installable-A9CBB5?style=flat-square&labelColor=1E6B4D" />
<img src="https://img.shields.io/badge/Access-Invitation%20Only-F7F5F1?style=flat-square&labelColor=0F3D33&color=0F3D33" />

<br/><br/>

---

</div>

## مقدمة | Overview

**ثناره** منظومة رقمية شاملة للقطاع الطبي — تجمع العيادة الذكية، منشئ المواقع، واتساب AI، التطبيقات، نظام CRM، ERP، والأمن في حل واحد متكامل.

هذه البوابة هي نظام عرض خاص وآمن يتيح لفريق ثناره تقديم الرؤية والمنظومة للمستثمرين والشركاء المختارين — بدعوة شخصية فقط، بدون أي فهرسة من محركات البحث.

> **Thanarah** is a comprehensive smart platform for the medical sector. This portal is the exclusive, invitation-only window through which investors, partners, and select stakeholders experience Thanarah's full vision — watermarked, session-tracked, and access-controlled.

---

## المميزات الرئيسية | Key Features

### الأمان والتحكم | Security & Access Control

| الميزة | التفاصيل |
|--------|----------|
| **نظام الدعوات** | دعوات محدودة المدة مع تتبع الاستخدام وعدد الأجهزة والجلسات |
| **8 أدوار مستخدمين** | Owner → Super Admin → Admin → Presenter → Investor → Partner → Team Member → Viewer |
| **JWT + httpOnly Cookies** | مصادقة آمنة بدون تخزين token في localStorage |
| **علامة مائية ديناميكية** | اسم المستخدم + البريد + رمز الجلسة + التاريخ على كل صفحة عرض |
| **تتبع الجلسات** | IP، الجهاز، المدة، الأقسام المزارة — كل شيء مسجّل |
| **سجل التدقيق** | كل حدث، كل دخول، كل تغيير — موثّق بالكامل |
| **حماية من الفحص** | منع الكليك اليمين + CSP + `frame-ancestors: none` |
| **إخفاء من الفهرسة** | `robots.txt` + meta noindex — غير مرئي لمحركات البحث |

### تجربة المستخدم | User Experience

| الميزة | التفاصيل |
|--------|----------|
| **عربي أولاً** | RTL كامل للعربية والأردية، LTR للإنجليزية والتركية |
| **4 لغات** | العربية · English · Türkçe · اردو |
| **PWA قابل للتثبيت** | يعمل كتطبيق على الجوال وسطح المكتب |
| **22 قسماً تقديمياً** | تحكم كامل في المحتوى من لوحة الأدمن |
| **مؤقت الجلسة** | عداد تنازلي يطفئ الجلسة تلقائياً |
| **لوحة تحكم شاملة** | إدارة المستخدمين، الدعوات، الجلسات، الأحداث الأمنية |

---

## البنية التقنية | Architecture

```
thanarah-presentation/
│
├── artifacts/
│   ├── thanarah-portal/          # React 19 + Vite 7 (Frontend)
│   │   ├── src/
│   │   │   ├── pages/            # Login, Dashboard, Presentation, Admin, ...
│   │   │   ├── components/       # Watermark, SessionTimer, Guards, Shells
│   │   │   ├── context/          # AuthContext, LanguageContext
│   │   │   ├── i18n/             # AR / EN / TR / UR translations
│   │   │   └── lib/              # API client, utilities
│   │   └── public/               # Logo assets, manifest.json, robots.txt
│   │
│   └── api-server/               # Express 5 (Backend API)
│       └── src/
│           ├── models/           # Mongoose schemas (User, Invitation, Session, ...)
│           ├── routes/           # auth, invitations, users, sessions, admin, visits
│           ├── lib/              # DB connection, JWT auth, email sender
│           └── scripts/          # Seed script for presentation sections
│
└── lib/
    ├── api-spec/                 # OpenAPI 3.1 specification (40KB+)
    ├── api-client-react/         # Orval-generated React Query hooks
    └── api-zod/                  # Orval-generated Zod validation schemas
```

---

## صفحات التطبيق | Application Pages

### صفحات عامة (بدون تسجيل دخول)
| المسار | الوصف |
|--------|-------|
| `/login` | تسجيل الدخول بالبريد وكلمة المرور |
| `/setup` | إعداد حساب المالك الأول (مرة واحدة فقط) |
| `/invite/:token` | قبول الدعوة وإنشاء الحساب |
| `/visit-request` | نموذج طلب الزيارة (للجمهور العام) |

### صفحات المستخدم المصادق
| المسار | الوصف |
|--------|-------|
| `/dashboard` | لوحة المستخدم الشخصية والجلسة الحالية |
| `/presentation` | صفحة بداية العرض مع لوجو متحرك |
| `/presentation/:section` | عارض الأقسام (22 قسماً) مع علامة مائية |

### لوحة الأدمن
| المسار | الوصف |
|--------|-------|
| `/admin` | ملخص إحصائي شامل |
| `/admin/users` | إدارة المستخدمين والأدوار |
| `/admin/invitations` | إنشاء وإدارة الدعوات |
| `/admin/sessions` | مراقبة الجلسات النشطة |
| `/admin/security-events` | أحداث الأمان والمخاطر |
| `/admin/audit-logs` | سجل التدقيق الكامل |
| `/admin/content` | تحرير محتوى أقسام العرض |
| `/admin/visits` | طلبات الزيارة (موافقة/رفض) |
| `/admin/system-health` | صحة النظام (API، DB، البريد) |

---

## التقنيات المستخدمة | Tech Stack

### Frontend
- **React 19** + **TypeScript 5** + **Vite 7**
- **TanStack Query v5** — إدارة حالة الخادم
- **Wouter** — التوجيه
- **Framer Motion** — الحركات والانتقالات
- **Tailwind CSS v4** + **shadcn/ui** — التصميم
- **Orval** — توليد hooks تلقائياً من OpenAPI spec
- **i18next-style context** — دعم 4 لغات مع RTL/LTR

### Backend
- **Express 5** + **TypeScript 5**
- **Mongoose 9** + **MongoDB Atlas** — قاعدة البيانات
- **JSON Web Tokens** + **bcryptjs** — المصادقة
- **Nodemailer** + **SMTP2GO** — البريد الإلكتروني
- **Pino** — تسجيل الأحداث
- **esbuild** — البناء السريع
- **OpenAPI 3.1** → **Zod** validation + **React Query** hooks (codegen)

---

## بدء التشغيل | Getting Started

### المتطلبات
- Node.js 22+
- pnpm 10+
- MongoDB Atlas cluster
- حساب SMTP2GO

### 1. تثبيت المتطلبات
```bash
pnpm install
```

### 2. المتغيرات البيئية المطلوبة
```env
# قاعدة البيانات (سري)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# الرموز الأمنية (سري)
JWT_SECRET=your-long-random-secret-min-32-chars
SESSION_SECRET=your-session-secret
OWNER_SETUP_KEY=your-one-time-setup-key

# البريد الإلكتروني (SMTP2GO)
SMTP2GO_USERNAME=your-smtp2go-username
SMTP2GO_PASSWORD=your-smtp2go-password
SMTP2GO_HOST=mail.smtp2go.com
SMTP2GO_PORT=587
SMTP_FROM_EMAIL=noreply@thanarah.com
SMTP_FROM_NAME=نظام ثناره الطبي

# بريد المالكين (لإشعارات طلبات الزيارة)
THANARAH_OWNER_EMAIL_1=owner1@thanarah.com
THANARAH_OWNER_EMAIL_2=owner2@thanarah.com
```

### 3. تشغيل بيئة التطوير
```bash
# تشغيل الواجهة الأمامية
pnpm --filter @workspace/thanarah-portal run dev

# تشغيل الخادم الخلفي
pnpm --filter @workspace/api-server run dev
```

### 4. إنشاء حساب المالك (مرة واحدة)
```
افتح: http://localhost:[PORT]/setup
أدخل: مفتاح الإعداد + الاسم + البريد + كلمة مرور قوية
```

### 5. تهيئة بيانات العرض
```bash
pnpm --filter @workspace/api-server run seed
```

---

## نموذج العمل | Business Model — Thanarah Platform

| الباقة | الجمهور | الأقسام المتاحة |
|--------|---------|----------------|
| **مستثمر** | Investor | كل الأقسام + البيانات المالية |
| **شريك** | Partner | الأقسام التقنية والتشغيلية |
| **عرض** | Presenter | أقسام مختارة بدون مالية |
| **عضو فريق** | Team Member | حسب الصلاحيات |

---

## الأمان | Security Notes

- البوابة **غير مفهرسة** من Google ومحركات البحث
- لا يمكن الوصول إليها إلا بـ **رابط دعوة شخصي**
- كل جلسة تحمل **علامة مائية فريدة** تربطها بصاحبها
- جميع tokens مخزنة في **httpOnly cookies** فقط
- كل إجراء مسجّل في **سجل التدقيق** الدائم
- **تحديد معدل الطلبات** على جميع نقاط تسجيل الدخول

---

## الفريق | Team

**ثناره** — تقنية تخدم الإنسان

> *"نحن لا نبني برمجيات فقط — نبني منظومة تجعل الرعاية الصحية أكثر ذكاءً وإنسانية."*

---

<div align="center">

<br/>

**© 2026 Thanarah Team. All rights reserved.**

*هذا المستودع خاص وسري — لا يُشارك دون إذن.*

<br/>

[![Made with ❤️ by Thanarah](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F%20by-Thanarah-1E6B4D?style=for-the-badge)](https://thanarah.com)

</div>
