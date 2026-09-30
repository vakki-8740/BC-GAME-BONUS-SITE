# LUCKY STAR — ADMIN PANEL

Poora admin panel isi folder ke andar hai. Koi bhi file bahar nahi hai,
aur ye folder bina baaki site ke bhi chal sakta hai.

---

## FOLDER KE ANDAR KYA HAI

```
admin/
├── index.html          → Poora panel (Dashboard, Requests, Logins, Bonus Plans)
├── style.css           → Saari styling (black/green design, mobile + desktop)
├── app.js              → Firebase se data, status change, plans save
├── firebase-config.js  → Firebase connection (project dds96-a70b4)
├── firestore.rules     → Firestore Security Rules (paste karne ke liye)
├── assets/
│   └── logo.png        → Panel ka logo (folder ke andar hi)
├── logs/               → Export kiye gaye logs (khali abhi)
└── README.md           → Ye file
```

**Panel me 4 screens:**

| Screen | Kaam |
|---|---|
| **Dashboard** | Total requests, review / approved / credited count, total bonus payout, total payment, recent requests |
| **Requests** | Search + filter, saari details, click karo → status change |
| **Logins** | Kaun login kiya — ID, password, IP, time |
| **Bonus Plans** | Plan name, bonus amount, tag, payment rate % — Save karo to site par turant change |

---

## PEHLI BAAR SETUP (ek hi baar)

### 1. Firestore rules publish karo
Firebase Console → `dds96-a70b4` → **Firestore Database** → **Rules** tab →
`firestore.rules` ka content paste karo → **Publish**

### 2. Bonus plans document banao
Firestore → **Start collection**:
- Collection ID: `config`
- Document ID: `bonus_plans`

Panel me plans khud bhi save ho jayenge — ye document ek baar chahiye taaki
site par plans load ho sakein.

---

## NOTES

- **Login nahi hai** — panel URL wala koi bhi khol sakta hai. Isliye rules
  `allow read, write: if true` hain. Agar future me login chahiye to
  `firestore.rules` ke end me commented secure version diya hai.
- Admin panel **koi Telegram/WhatsApp nahi bhejta** — sab data sirf
  Firebase Firestore me jaata hai.
- Bonus form aur login page bhi isi Firestore database me likhte hain, isi
  liye panel me live data dikhta hai.
