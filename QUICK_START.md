# 🚀 QUICK START - Authentication System

Get your Memory Journal authentication up and running in 60 seconds!

---

## ⚡ In 3 Steps

### Step 1: Open Login Page
**Use VS Code Live Server:**
1. Right-click `login.html`
2. Select "Open with Live Server"
3. Opens at `http://localhost:5500/`

### Step 2: Test Login
- **Username:** `Demo@123`
- **Password:** `password123`
- Click "Log In"

### Step 3: Create Account
1. Click "Create one here"
2. Fill registration form
3. Click "Create Account"

**Done!** ✨

---

## 📋 What You Have

| File | Purpose |
|------|---------|
| `register.html` | Sign up page |
| `login.html` | Login page |
| `css/auth-styles.css` | Styling |
| `js/auth.js` | All the logic |
| `AUTH_README.md` | Full documentation |

---

## 🔐 Registration Rules

Your username must have:
- ✅ 6–20 characters (no spaces)
- ✅ At least one UPPERCASE letter
- ✅ At least one number
- ✅ At least one special character (e.g., @, #, !, $)
- ✅ Part of your real name

**Example:** If your name is "John Doe", try: `JohnDoe@2024` ✓

---

## 🔑 Login Info

| Field | Description |
|-------|-------------|
| **Username** | What you chose during registration |
| **Password** | Your password (case-sensitive) |

*Password is case-sensitive, username is not.*

---

## 🧪 Test Features

- [ ] Register with a valid username
- [ ] See real-time validation as you type
- [ ] Try wrong password on login
- [ ] Click eye icon to show/hide password
- [ ] Test on phone/tablet (responsive)
- [ ] Try demo account

---

## 💾 Where Is My Data?

- Stored in **browser memory** (localStorage)
- Persists when you refresh the page
- Clears if you clear browser storage
- Independent in private/incognito mode

---

## 🔧 How to Customize

### Change Colors
Edit `css/auth-styles.css` (or use existing palette)

### Add Fields
1. Add HTML input in `register.html`
2. Add validation in `js/auth.js`
3. Save to database

### Change Error Messages
Edit `js/auth.js` validation functions

---

## 📞 Help

Found a problem? Check these:

1. **AUTH_README.md** - Full guide
2. **AUTH_SETUP_GUIDE.md** - Detailed docs
3. **USERNAME_VALIDATION_GUIDE.md** - Validation rules

---

## 🎯 Console Commands

Open DevTools (F12) and copy/paste:

```javascript
// See all users
debugViewUsers()

// See current user
debugViewCurrentUser()

// Check if logged in
isLoggedIn()

// Reset everything
debugResetStorage()
```

---

## 🚀 Next: Production Setup

When ready for production:

1. Copy `BACKEND_OPTIONAL_express.js`
2. Run: `npm install` (uses `package.json`)
3. Add `.env` file (see `.env.example`)
4. Run: `npm start`

This adds:
- Secure password hashing
- Database storage
- API authentication
- Error handling

See **AUTH_SETUP_GUIDE.md** for details.

---

## ✅ Checklist

- [ ] Can access register.html and login.html
- [ ] Demo account logs in successfully
- [ ] Can register new account
- [ ] Real-time validation shows in real-time
- [ ] Password visibility toggle works
- [ ] Error messages appear on wrong login
- [ ] Works on mobile (check responsiveness)

---

## 🎉 You're Ready!

Your authentication system is ready to use. Start testing and building! 🚀

**Questions?** Check the detailed guides in the documentation.

---

**Version:** 1.0  
**Updated:** April 11, 2026  
**Status:** ✅ Ready to Use
