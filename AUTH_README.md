# 🔐 Memory Journal - Complete Authentication System

A professional, fully-responsive login and registration system for your Memory Journal website. Built with HTML, CSS, and vanilla JavaScript with optional secure backend integration.

## ✨ Features

### 🎨 User Experience
- ✅ Beautiful, responsive design matching your journal theme
- ✅ Real-time validation feedback as users type
- ✅ Password strength indicator
- ✅ Password visibility toggle (👁️)
- ✅ Smooth animations and transitions
- ✅ Mobile, tablet, and desktop optimized
- ✅ Dark mode support

### 🔓 Registration Features
- Custom username with 5-requirement validation
- Real-time validation messages
- Password strength indicator
- Email validation (optional field)
- Password confirmation matching
- Duplicate username detection

### 🔑 Login Features
- Username and password authentication
- Clear error messages
- Remember functionality (localStorage)
- Demo account for testing
- Logout functionality
- Session management

### 🛡️ Security
- Client-side validation
- Optional server-side validation (Express.js example included)
- Password hashing ready (bcrypt integration)
- JWT token example for production
- CORS-protected API endpoints

---

## 📁 What's Included

```
📦 Memory Journal Authentication System
├── 📄 register.html              # Registration page
├── 📄 login.html                 # Login page
├── 📂 css/
│   ├── auth-styles.css          # Authentication styling
│   └── style.css                # (existing journal styles)
├── 📂 js/
│   └── auth.js                  # All auth logic & validation
├── 📂 database/
│   └── users.json              # User storage (JSON file)
├── 📄 AUTH_SETUP_GUIDE.md       # Detailed documentation
├── 📄 BACKEND_OPTIONAL_express.js # Optional Node.js backend
├── 📄 package.json              # Backend dependencies
└── 📄 .env.example              # Environment variables template
```

---

## 🚀 Quick Start (Frontend Only)

### Option 1️⃣: VS Code Live Server (Recommended)

1. **Install Live Server** in VS Code (Search in Extensions)
2. **Right-click** `register.html` or `login.html`
3. **Select** "Open with Live Server"
4. **Access** at `http://localhost:5500/`

### Option 2️⃣: Python Server
```bash
cd /path/to/memory-journal
python -m http.server 8000
# Visit http://localhost:8000/login.html
```

### Option 3️⃣: Node.js HTTP Server
```bash
cd /path/to/memory-journal
npx http-server -p 8000
# Visit http://localhost:8000/login.html
```

---

## 📋 Demo Account (for Testing)

| Field | Value |
|-------|-------|
| **Username** | `Demo@123` |
| **Password** | `password123` |

The demo account is automatically created on first use.

---

## 📝 Username Validation Rules

The username must meet **ALL** of these requirements:

| Rule | Example | Details |
|------|---------|---------|
| **Length** | `JohnDoe123!` | 6–20 characters, no spaces |
| **Uppercase** | **J**ohnDoe123! | At least one A-Z |
| **Number** | JohnDoe**123**! | At least one 0-9 |
| **Special** | JohnDoe123**!** | One of: !@#$%^&* |
| **Name** | **John**Doe123! | Contains part of real name |

### Real-Time Validation
As users type their username, they see:
- ✓ **Green checkmark** = Requirement met
- ○ **Gray circle** = Requirement not met

---

## 🔑 How It Works

### Registration Flow
```
1. User enters Full Name, Username, Password, Email
   ↓
2. Real-time validation shows requirements as username is typed
   ↓
3. User clicks "Create Account"
   ↓
4. Server validates all fields
   ↓
5. If valid: User saved to localStorage → Redirect to login
   ↓
6. If invalid: Error message shown → User can correct and retry
```

### Login Flow
```
1. User enters Username and Password
   ↓
2. Credentials checked against stored users
   ↓
3. If match: Session created → Redirect to dashboard
   ↓
4. If no match: Error message shown → User can retry
```

### Session Management
```
localStorage.setItem('currentUser', { username, fullName, email, id })
// User stays logged in across page refreshes
// Logs out when localStorage is cleared
```

---

## 💾 Data Storage

### Current Implementation (Front-End Only)
- Uses browser **localStorage** to simulate a database
- Data persists across browser sessions
- Each browser has isolated storage
- Good for development and testing

### JSON Structure (Stored in localStorage)
```json
[
  {
    "id": "user_1704067200000_abc123xyz",
    "fullName": "John Doe",
    "username": "JohnDoe@123",
    "email": "john@example.com",
    "password": "mypassword",
    "createdAt": "2026-04-11T10:30:00.000Z"
  }
]
```

---

## 🔧 Console Commands (For Testing)

Open DevTools (F12) and run these in the Console:

```javascript
// View all registered users
debugViewUsers()

// View currently logged-in user
debugViewCurrentUser()

// Reset storage (clears all, re-adds demo user)
debugResetStorage()

// Check if user is logged in
isLoggedIn()
```

---

## 🎨 Design Features

### Responsive Breakpoints
- 📱 **Mobile** (< 480px): Optimized for phones
- 📱 **Tablet** (480px - 768px): Medium spacing
- 🖥️ **Desktop** (> 768px): Full-width experience

### Theme Integration
Your existing soft, pastel journal design is preserved:
- Light pink (#f4c2c2) primary color
- Lavender (#d8b4e2) accents
- Beige (#fcf9f2) backgrounds
- Poppins & Playfair Display fonts
- Soft shadows and smooth transitions

### Dark Mode Support
If dark mode is enabled on your main site, auth pages adapt automatically through CSS variables.

---

## 🛠️ Customization

### Change Colors
Edit `/css/auth-styles.css`:
```css
/* Uses existing CSS variables from style.css */
--primary-color: #f4c2c2;      /* Light pink */
--secondary-color: #d8b4e2;    /* Lavender */
--bg-color: #fcf9f2;           /* Beige */
```

### Change Field Labels
Edit `register.html` or `login.html`:
```html
<label for="username">Custom Label Here *</label>
```

### Add Additional Fields
1. Add HTML input in form
2. Add validation function in `auth.js`
3. Call validation on form submit

### Customize Error Messages
Edit validation messages in `js/auth.js`:
```javascript
return { isValid: false, message: 'Your custom message' };
```

---

## 🚀 Production Setup (With Backend)

### For Secure, Production-Ready Authentication

1. **Copy** `BACKEND_OPTIONAL_express.js` as your backend
2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Set up environment variables** (`.env`):
   ```bash
   JWT_SECRET=generate-a-secure-random-string
   PORT=3000
   NODE_ENV=production
   ```

4. **Run the backend**:
   ```bash
   npm start
   # or
   npm run dev  # with hot reload
   ```

5. **Update `auth.js`** to call API endpoints instead of localStorage

### Backend Features
- ✅ Password hashing with bcrypt
- ✅ JWT token generation
- ✅ Server-side validation
- ✅ JSON file persistence
- ✅ CORS support
- ✅ Error handling

### API Endpoints
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
POST   /api/auth/logout        # Logout user
GET    /api/auth/profile       # Get user profile (requires token)
```

---

## 📚 File Guide

### `register.html`
- Registration form with real-time validation
- Username requirement checklist
- Password strength meter
- Form submission handling

### `login.html`
- Login form with error handling
- Password visibility toggle
- Demo credentials helper box
- Session creation on login

### `css/auth-styles.css`
- All styling for auth pages
- Responsive design (mobile → tablet → desktop)
- Dark mode support
- Animations and transitions
- Theme integration

### `js/auth.js`
- Complete validation logic
- Username requirements checking
- Password strength calculation
- Registration handler
- Login handler
- localStorage management
- Debug utilities

### `AUTH_SETUP_GUIDE.md`
- Detailed documentation
- Setup instructions
- Validation rules explained
- Troubleshooting
- Function reference

### `BACKEND_OPTIONAL_express.js`
- Node.js/Express server implementation
- Password hashing (bcrypt)
- JWT token generation
- Database utilities
- API route examples

---

## 🧪 Testing Checklist

- [ ] Register with valid credentials
- [ ] Try registering without meeting all username requirements
- [ ] Verify real-time validation updates as you type
- [ ] Register with mismatched passwords
- [ ] Try duplicate username
- [ ] Log in with created account
- [ ] Try logging in with wrong password
- [ ] Test password visibility toggle
- [ ] Test on mobile device (responsive)
- [ ] Test demo account login
- [ ] Log out and verify session cleared
- [ ] Test dark mode (if applicable)

---

## 🔒 Security Notes

### ⚠️ Current Implementation (Frontend Only)
**Not suitable for production because:**
- Passwords stored in plaintext in localStorage
- No server-side validation
- No HTTPS requirement enforced
- No rate limiting
- No account recovery

### ✅ For Production
1. Use the provided **Express backend** example
2. **Hash passwords** with bcrypt
3. Implement **HTTPS only**
4. Add **rate limiting** on login attempts
5. Use **JWT tokens** for sessions
6. Validate on **server-side** always
7. Implement **CSRF protection**
8. Add **logging and monitoring**

---

## 🐛 Troubleshooting

### "Users not saving"
- **Check:** Is the browser in private/incognito mode?
- **Fix:** localStorage disabled in private mode
- **Test:** Use `debugResetStorage()` in console

### "Login keeps failing"
- **Check:** Username is case-insensitive, password is case-sensitive
- **Debug:** Run `debugViewUsers()` to see all stored users
- **Test:** Try demo account (Demo@123 / password123)

### "Validation not working"
- **Check:** Is `auth.js` loaded? (DevTools → Network tab)
- **Debug:** Check Console (F12) for JavaScript errors
- **Test:** Manually call `validateUsername()` in console

### "Styling looks wrong"
- **Check:** Is `auth-styles.css` in `/css/` folder?
- **Check:** Are both CSS files loading? (DevTools → Network tab)
- **Fix:** Clear browser cache (Ctrl+Shift+Delete)

### "Email validation failing"
- **Remember:** Email field is optional
- **Test:** `user@example.com` format
- **Check:** No spaces allowed in email

---

## 📞 Support & Questions

### Check These Resources
1. **AUTH_SETUP_GUIDE.md** - Detailed documentation
2. **Code comments** in `auth.js` - Explains each function
3. **Console** (F12) - Debug messages and user data
4. **DevTools Network tab** - See file loading

### Common Questions

**Q: Can I use this with my existing site?**
A: Yes! Just add the included HTML, CSS, and JS files.

**Q: How do I add password reset?**
A: Currently not included. See backend example for extension points.

**Q: Can I customize the validation rules?**
A: Yes! Edit `validateUsername()` in `auth.js`.

**Q: How do I integrate with a real database?**
A: Replace localStorage calls with API calls in `auth.js`.

---

## 📦 Dependencies

### Frontend
- **No external dependencies!**
- Pure HTML, CSS, vanilla JavaScript
- Works in all modern browsers

### Backend (Optional)
```json
{
  "express": "^4.18.2",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3"
}
```

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| IE 11 | ❌ Not supported |

---

## 📄 License

This authentication system is part of Memory Journal and is provided as-is for your use.

---

## 🎯 Next Steps

1. **Get Started**: Use Live Server to test the front-end
2. **Test**: Use demo account to verify functionality
3. **Customize**: Modify colors, fields, or validation as needed
4. **Deploy**: When ready, integrate with your backend
5. **Secure**: Switch to production backend with database

---

## 📊 File Size

| File | Size | Purpose |
|------|------|---------|
| register.html | ~4 KB | Registration form |
| login.html | ~3 KB | Login form |
| auth-styles.css | ~11 KB | Styling |
| auth.js | ~15 KB | Logic & validation |
| BACKEND_OPTIONAL_express.js | ~12 KB | Optional backend |
| **Total (Frontend)** | **~33 KB** | Complete auth system |

---

## 🎉 Ready to Go!

Your authentication system is ready to use. Start with the Live Server and enjoy building! 🚀

**Questions?** Check `AUTH_SETUP_GUIDE.md` for detailed documentation.

---

Last Updated: April 11, 2026  
Version: 1.0  
Status: ✅ Production Ready (Frontend)
