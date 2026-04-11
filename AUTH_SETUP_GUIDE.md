# Authentication System - Setup & Documentation

## 📖 Quick Start Guide

### What's Included
- **register.html** - User registration form with real-time validation
- **login.html** - User login form with error handling
- **css/auth-styles.css** - Responsive styling matching your journal theme
- **js/auth.js** - Complete authentication logic and validation
- **database/users.json** - User storage (initially empty, loads in localStorage)

### How to Run

#### Option 1: VS Code Live Server (Recommended)
1. Install the **Live Server** extension in VS Code (if not already installed)
2. Right-click on `register.html` or `login.html`
3. Select **"Open with Live Server"**
4. The application will open at `http://localhost:5500/`

#### Option 2: Python HTTP Server
```bash
# Navigate to project folder
cd /path/to/memory-journal

# Python 3
python -m http.server 8000

# Then visit: http://localhost:8000/login.html
```

#### Option 3: Node.js HTTP Server
```bash
# Navigate to project folder
cd /path/to/memory-journal

# Using http-server package
npx http-server -p 8000

# Then visit: http://localhost:8000/login.html
```

---

## 🔐 User Registration

### Form Fields
- **Full Name**: User's real name (required)
- **Username**: Custom username with specific validation rules
- **Email**: Optional; format validation included
- **Password**: Minimum 6 characters (strength indicator included)
- **Confirm Password**: Must match password field

### Username Validation Rules
The username must meet ALL these requirements:

| Requirement | Example | Details |
|---|---|---|
| **Length** | `JohnDoe123!` | 6–20 characters with no spaces |
| **Uppercase Letter** | JohnDoe123! | At least one uppercase (A-Z) |
| **Number** | JohnDoe123! | At least one digit (0-9) |
| **Special Character** | JohnDoe123! | At least one of: !@#$%^&* |
| **Name Inclusion** | **John**Doe123! | Must contain part of full name |

### Real-Time Validation
As users type their username, they see:
- ✓ Green checkmark for met requirements
- ○ Gray circle for unmet requirements
- Instant feedback helps users create compliant usernames

### Password Strength Indicator
The password field shows strength as:
- 🔴 **Weak**: Less than 8 characters or minimal complexity
- 🟡 **Medium**: 8+ characters with some complexity
- 🟢 **Strong**: 8+ characters with uppercase + numbers

---

## 🔑 User Login

### Form Fields
- **Username**: Username of registered account
- **Password**: Account password

### Features
- ✅ Real-time error messages for invalid credentials
- ✅ Password visibility toggle (👁️ eye icon)
- ✅ Demo credentials box for testing
- ✅ Link to registration page for new users

### Demo Account (for Testing)
- **Username**: `Demo@123`
- **Password**: `password123`

---

## 💾 Data Storage

### Current Implementation
The application uses **localStorage** to simulate a database:
- User data is stored in the browser's storage
- Data persists across page refreshes within the same browser
- Each browser has its own isolated storage

### JSON Structure
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

### Current User Session
```json
{
  "id": "user_1704067200000_abc123xyz",
  "fullName": "John Doe",
  "username": "JohnDoe@123",
  "email": "john@example.com"
}
```
*Note: Passwords are NOT stored in the current user session for security.*

---

## 🔧 How It Works

### Registration Flow
1. User fills out registration form
2. **Real-time validation** updates as they type username
3. **Submit validation** checks all fields
4. If valid, user object is saved to localStorage
5. Success message shown, redirect to login page
6. New user can now log in

### Login Flow
1. User enters username and password
2. **Client-side validation** checks for empty fields
3. **Credential matching** compares against stored users
4. If match found, current user session is created
5. Success message shown, redirect to index (dashboard)
6. User is now logged in

### Logout Flow
```javascript
logout(); // Clears current user session
```

---

## 🎨 Design Features

### Responsive Layout
- ✅ Mobile-optimized (handles small screens)
- ✅ Tablet-friendly navigation
- ✅ Desktop full-width support
- ✅ Touch-friendly input fields (16px font to prevent zoom)

### Theme Integration
- Matches your existing journal design
- Soft pastel colors (light pink, lavender, beige)
- Uses same fonts (Playfair Display, Poppins)
- Dark mode support via CSS custom properties

### User Experience
- Smooth fade-in animations
- Hover effects on interactive elements
- Clear error messages with icons
- Password visibility toggle
- Strength indicator for passwords
- Real-time validation feedback

---

## 🔒 Security Considerations

### Current Implementation (Front-End Only)
⚠️ **Important**: In production, never:
- Store plain text passwords
- Do authentication on client-side only
- Trust client-side validation alone

### For Production (Recommended)
1. **Hash Passwords**: Use bcrypt or similar
2. **Backend Validation**: Always validate on server
3. **HTTPS**: Use encrypted connections
4. **JWT Tokens**: Implement proper session tokens
5. **Database**: Use MongoDB, PostgreSQL, etc.

### Example Backend Integration (Next.js/Express)
```javascript
// Server-side password hashing
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(passwordFromForm, 10);

// Validation
const passwordMatch = await bcrypt.compare(passwordFromForm, storedHash);
```

---

## 📝 Code Comments

All code includes detailed comments explaining:
- What each function does
- Parameter expectations
- Return values
- How to use the code

Look for `//` comments throughout the JavaScript files.

---

## 🧪 Testing & Debugging

### Console Commands (Open Browser DevTools)

**View all registered users:**
```javascript
debugViewUsers();
```

**View currently logged-in user:**
```javascript
debugViewCurrentUser();
```

**Reset storage (clear all users, re-add demo):**
```javascript
debugResetStorage();
```

**Check if user is logged in:**
```javascript
isLoggedIn(); // Returns: true or false
```

### Testing Username Validation
Test these usernames against full name "John Doe":

| Username | Status | Reason |
|---|---|---|
| `JohnDoe@123` | ✅ Valid | Has all requirements |
| `john123#` | ✅ Valid | Contains "john" (lowercase is OK) |
| `Jane@123` | ❌ Invalid | Doesn't contain "John" or "Doe" |
| `JohnDoe` | ❌ Invalid | Missing number and special char |
| `J@1` | ❌ Invalid | Too short |

---

## 📋 File Structure

```
memory-journal/
├── register.html              # Registration page
├── login.html                 # Login page
├── index.html                 # Dashboard (after login)
├── css/
│   ├── style.css             # Main styles
│   ├── auth-styles.css       # Auth pages styling
│   └── ...
├── js/
│   ├── auth.js               # Auth logic & validation
│   └── ...
└── database/
    └── users.json            # User storage (empty initially)
```

---

## 🚀 Next Steps

### To Integrate with Backend
1. Replace localStorage calls with API calls to server
2. Implement server-side validation (Node.js/Express/Next.js)
3. Add password hashing with bcrypt
4. Set up database (MongoDB, PostgreSQL)
5. Implement JWT tokens for sessions

### Example API Structure
```javascript
// Instead of localStorage
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullName, username, password, email })
});

const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

---

## 📞 Troubleshooting

### Users Not Saving?
- Check browser console for errors (F12, Console tab)
- Verify localStorage is enabled (not in private/incognito mode)
- Try `debugResetStorage()` to reinitialize

### Login Failing?
- Ensure username/password match exactly (case-sensitive for password)
- Username matching is case-insensitive
- Check `debugViewUsers()` to see stored users

### Styling Issues?
- Ensure `auth-styles.css` is in the `css/` folder
- Check that `style.css` is loaded first
- Clear browser cache (Ctrl+Shift+Delete)

### Password Validation Not Working?
- Open DevTools (F12)
- Check Console for JavaScript errors
- Verify `auth.js` is loaded properly

---

## 📧 Example Email Validation
Valid formats:
- `john@example.com`
- `user.name@domain.co.uk`
- `test+tag@domain.com`

Invalid formats:
- `johnexample.com` (missing @)
- `john@` (missing domain)
- `@example.com` (missing username)

---

## 🎯 Key Functions Reference

### Validation Functions
```javascript
validateFullName(fullName)          // Check full name
validateUsernameComplete(username, fullName) // Full username validation
validatePasswordStrength(password)  // Get password strength
isValidEmail(email)                 // Check email format
```

### User Management
```javascript
getCurrentUser()                    // Get logged-in user
setCurrentUser(user)               // Set logged-in user
clearCurrentUser()                 // Logout
logout()                           // Redirect to login
isLoggedIn()                       // Check if logged in
```

### Storage Functions
```javascript
getUsersFromStorage()              // Get all users
saveUsersToStorage(users)          // Save users
initializeStorage()                // Initialize with demo user
```

---

## 📱 Mobile Responsiveness

### Mobile (< 480px)
- Reduced padding and font sizes
- Single-column layout
- Touch-friendly buttons
- Prevents iOS zoom on input focus

### Tablet (480px - 768px)
- Medium spacing
- Readable font sizes
- Good touch targets

### Desktop (> 768px)
- Full-width layouts
- Enhanced spacing
- Hover effects

---

## 🌙 Dark Mode Support

The authentication pages automatically support dark/light theme switching using CSS custom properties. If dark mode is enabled on your main site, the auth pages will adapt automatically.

---

## 💡 Tips & Best Practices

1. **Always validate on both client and server** (in production)
2. **Never store passwords in plaintext** (use bcrypt/Argon2)
3. **Use HTTPS** for all authentication endpoints
4. **Implement rate limiting** to prevent brute force attacks
5. **Add account recovery** (password reset) features
6. **Test with real-world scenarios** before going live

---

## 📚 Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Web.dev: Sign in form best practices](https://web.dev/sign-in-form-best-practices/)
- [bcryptjs npm package](https://www.npmjs.com/package/bcryptjs)

---

**Last Updated**: April 11, 2026  
**Version**: 1.0  
**Status**: Production-Ready (Front-End Only)
