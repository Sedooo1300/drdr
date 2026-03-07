# 🏥 إدارة عيادة المغازى

نظام إدارة متكامل لعيادة الجلدية والليزر - يعمل أوفلاين كتطبيق PWA

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

---

## ✨ الميزات

### 📱 تطبيق PWA متكامل
- يعمل أوفلاين بالكامل
- قابل للتثبيت على الموبايل والكمبيوتر
- مزامنة تلقائية عند عودة الاتصال

### 🏢 6 أقسام رئيسية

| القسم | الوصف | الحماية |
|-------|-------|---------|
| 🏠 **قسم المركز** | لوحة تحكم شاملة مع إحصائيات | ❌ |
| 👨‍⚕️ **قسم المساعد** | تسجيل المرضى والحجوزات والجلسات | ❌ |
| 🩺 **قسم الأطباء** | إدارة الأطباء والصور والروشتات | ✅ |
| ⚡ **قسم الليزر** | علاجات إزالة الشعر بالليزر | ❌ |
| 🔍 **قسم البحث** | بحث شامل في جميع البيانات | ❌ |
| ⚙️ **الإعدادات** | التقارير والثيمات والنسخ الاحتياطي | ✅ |

### 🎨 التخصيص
- 12 ثيم ألوان مختلفة
- الوضع الليلي (Dark Mode)
- واجهة عربية RTL

### 💾 قاعدة البيانات
- IndexedDB للتخزين المحلي
- نسخ احتياطي تلقائي كل 24 ساعة
- تصدير/استيراد البيانات بصيغة JSON

### 🔔 التنبيهات
- تنبيهات واتساب للمواعيد
- تذكير بالزيارات القادمة

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- Bun أو npm

### التثبيت المحلي

```bash
# استنساخ المشروع
git clone https://github.com/USERNAME/almaghazy-clinic.git

# الدخول للمجلد
cd almaghazy-clinic

# تثبيت المتطلبات
bun install

# تشغيل التطبيق
bun run dev
```

افتح المتصفح على: `http://localhost:3000`

---

## 📦 النشر على Vercel

### الطريقة 1: من خلال GitHub

1. ارفع المشروع إلى GitHub
2. سجل دخول على [vercel.com](https://vercel.com)
3. اضغط على "New Project"
4. اختر المستودع من GitHub
5. اضغط "Deploy"

### الطريقة 2: من خلال CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel --prod
```

---

## 🔐 كلمات السر

| القسم | كلمة السر |
|-------|-----------|
| قسم الأطباء | `2137` |
| قسم الإعدادات | `2137` |

---

## 📁 هيكل المشروع

```
almaghazy-clinic/
├── public/
│   ├── icons/          # أيقونات PWA
│   ├── manifest.json   # ملف PWA
│   ├── sw.js           # Service Worker
│   └── offline.html    # صفحة أوفلاين
├── src/
│   ├── app/
│   │   ├── page.tsx    # الصفحة الرئيسية
│   │   ├── layout.tsx  # التخطيط
│   │   └── globals.css # الأنماط
│   ├── components/
│   │   ├── layout/     # مكونات التخطيط
│   │   ├── sections/   # أقسام التطبيق
│   │   └── ui/         # مكونات UI
│   ├── lib/
│   │   ├── db.ts       # قاعدة البيانات
│   │   ├── store.ts    # إدارة الحالة
│   │   └── themes.ts   # الثيمات
│   └── hooks/          # Custom Hooks
├── vercel.json         # إعدادات Vercel
└── package.json
```

---

## 🛠️ التقنيات المستخدمة

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **Database:** IndexedDB (محلي)
- **Icons:** Lucide React
- **PWA:** Service Worker

---

## 📱 تثبيت التطبيق على الموبايل

### Android (Chrome)
1. افتح التطبيق في Chrome
2. اضغط على قائمة النقاط الثلاث ⋮
3. اختر "إضافة إلى الشاشة الرئيسية"
4. اضغط "تثبيت"

### iOS (Safari)
1. افتح التطبيق في Safari
2. اضغط على زر المشاركة ⬆️
3. اختر "إضافة إلى الشاشة الرئيسية"
4. اضغط "إضافة"

---

## 📞 الدعم

للمساعدة أو الاستفسارات، تواصل معنا عبر:
- 📧 البريد الإلكتروني
- 📱 الواتساب

---

## 📄 الترخيص

هذا المشروع خاص لعيادة المغازى - جميع الحقوق محفوظة © 2024
force rebuild Sat Mar  7 03:16:03 UTC 2026
