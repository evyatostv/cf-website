# פריסת ClinicFlow לפרודקשן

## לפני הפריסה

1. להתחבר ל־Vercel בחשבון שמחובר לפרויקט `clinic-flow`.
2. להריץ מתוך תיקיית `cf-website` את הסקריפט המאוחד:

```bash
./scripts/deploy-production.sh
```

## אחרי הפריסה

לוודא שהמסלולים הבאים מחזירים HTTP 200:

- `/`
- `/clinic-software-for-private-doctors`
- `/contact?intent=demo`
- `/pricing`
- `/contact?intent=enterprise`

בדף הבית יש לוודא ששורת המחיר אינה מופיעה באזור הפתיחה. המחיר צריך להישאר בעמוד התמחור ובמסך הרכישה בלבד.

## בדיקת rollback

אם ה־build נכשל או שהטופס לא נטען, לעצור את הפרסום ולחזור לפריסה האחרונה התקינה דרך Vercel לפני שינוי נוסף.

