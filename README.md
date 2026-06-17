# Rikaz — الواجهة (Frontend)

مشروع **الواجهة فقط** على `http://localhost:3000` — لا يتصل بقاعدة البيانات مباشرة.

كل عمليات البيانات تتم عبر **`api_project`** (محلياً على `3001` أو `rkiza-api.vercel.app` في الإنتاج).

## الأمان

- **JWT** محفوظ في **httpOnly cookie** فقط — لا يُخزَّن في `sessionStorage` ولا يُعرَّض لـ JavaScript
- طلبات المتصفح تمر عبر **BFF** على `/api/proxy/*` الذي يضيف التوكن من الكوكي server-side
- مسارات الـ proxy مقيّدة: `auth`, `client`, `admin`, `theme` فقط
- رؤوس أمان: CSP, HSTS, X-Frame-Options, وغيرها

## التشغيل

### الطريقة 1 — نافذتان

```powershell
# نافذة 1 — خادم البيانات (إجباري)
cd "d:\new project\api_project"
npm run dev

# نافذة 2 — الواجهة
cd "d:\new project\rikaz_project"
npm run dev
```

### الطريقة 2 — أمر واحد

```powershell
cd "d:\new project\rikaz_project"
npm run dev:all
```

## مهم جداً

1. **أوقف** أي `npm run dev` قديم قبل التشغيل (Ctrl+C في كل نافذة).
2. إذا ظهرت بيانات والـ API متوقف، فغالباً خادم **قديم** ما زال يعمل على المنفذ 3000.
3. امسح الكاش عند الشك: احذف مجلد `.next` ثم أعد `npm run dev`.

## الهيكل

```
localhost:3000  →  rikaz_project  (صفحات + /api/session + /api/proxy)
localhost:3001  →  api_project      (قاعدة البيانات + كل الـ API)
                  أو rkiza-api.vercel.app في الإنتاج
```

المتصفح يرسل الطلبات إلى `/api/proxy/...` والخادم يوجّهها إلى API الخارجي مع التوكن من الكوكي.

## الإعداد

```powershell
copy .env.example .env.local
```

| المتغير | الوصف |
|---------|--------|
| `NEXT_PUBLIC_API_URL` | عنوان API البيانات |
| `JWT_SECRET` | يجب أن يطابق `api_project` — **إجباري في الإنتاج** |

بيانات قاعدة البيانات في `api_project/.env` فقط.

## الإنتاج (Vercel)

عيّن `JWT_SECRET` و`NEXT_PUBLIC_API_URL` في إعدادات مشروع الواجهة على Vercel — لا تعتمد على القيم الافتراضية.
