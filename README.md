# משפט ביום.

אתר Next.js עברי להגרלת משפט אישי אחד בכל יום, עם קהילה קטנה סביב כל משפט, פרופילים, הגשות, ניהול ושיתוף חברתי.

## הפעלה מקומית

1. העתיקו את `.env.example` אל `.env.local` והשלימו את פרטי פרויקט Supabase.
2. פתחו פרויקט Supabase חדש והריצו את כל הקובץ `supabase/schema.sql` ב־SQL Editor.
3. ב־Supabase Auth הגדירו את `http://localhost:3000/auth/callback` כ־Redirect URL, והפעילו Email + Google. בפרודקשן הוסיפו גם `https://YOUR_DOMAIN/auth/callback`.
4. התחברו פעם אחת, העתיקו את ה־UUID שלכם מתוך Authentication > Users, והריצו את פקודת ה־`update ... is_admin = true` המופיעה בסוף `supabase/schema.sql`.
5. הריצו `npm run dev` ופתחו את `http://localhost:3000`.

## פריסה

העלו את הפרויקט ל־Vercel והגדירו את כל המשתנים שב־`.env.example`. עדכנו את `NEXT_PUBLIC_SITE_URL` לכתובת האתר הסופית ואת כתובות ההחזרה ב־Supabase וב־Google OAuth.

## הערות מוצר

- ההגרלה וההגשה נאכפות בפונקציות PostgreSQL אטומיות לפי `Asia/Jerusalem`.
- משפטים מאושרים בלבד משתתפים בהגרלה ובדף שיתוף ציבורי.
- כרטיס השיתוף משתמש בשיתוף הטבעי במובייל; בדסקטופ יש הורדה, WhatsApp, Facebook והעתקת קישור.
- תמונות פרופיל נשמרות ב־Supabase Storage ב־bucket הציבורי `avatars`, שנוצר בסכמה.
