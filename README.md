# Memory Journal - Technical Architecture

A comprehensive personal journal and habit tracking application with integrated mood, fitness, wellness, and financial tracking features. Built with vanilla JavaScript, HTML5, and localStorage for offline-first functionality.

---

## 📐 System Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: Browser localStorage (JSON-based)
- **Optional Backend**: Node.js/Express with authentication (BACKEND_OPTIONAL_express.js)
- **Authentication**: JWT-based (optional backend) or localStorage-based (frontend-only)

### Deployment Model
- **Primary**: Client-side single-page application (SPA)
- **Optional**: Express backend for multi-user authentication
- **Data Persistence**: localStorage (no server required for basic usage)

---

## 🏗️ Application Structure

### Directory Organization

```
memory-journal/
├── index.html              # Landing page & home dashboard
├── login.html              # Authentication: Login page
├── register.html           # Authentication: Registration page
├── new.html                # Core: Create/Edit journal entries
├── entries.html            # Core: View & browse all entries
├── view.html               # Core: Display single entry
├── edit-profile.html       # User profile & theme settings
│
├── *-tracker.html          # Habit Trackers (7 modules)
│   ├── mood-tracker.html       (Emotion logging with charts)
│   ├── water-tracker.html      (Hydration tracking)
│   ├── gym-tracker.html        (Workout logging)
│   ├── study-tracker.html      (Study hours)
│   ├── period-tracker.html     (Cycle tracking)
│   ├── expense-tracker.html    (Financial tracking)
│   └── gratitude-tracker.html  (Daily gratitude)
│
├── js/
│   ├── auth.js             # Authentication (login, register, validation)
│   ├── app.js              # Core app logic (entries, downloads, theme)
│   ├── create-entry.js     # Entry creation/editing with rich editor
│   ├── edit-profile.js     # Profile & theme management
│   ├── storage.js          # localStorage abstraction layer
│   ├── themes.js           # Theme switching system
│   ├── constants.js        # Centralized configuration & validation
│   ├── utils.js            # Utility functions (shared)
│   ├── layout.js           # Layout utilities
│   └── navbar.js           # Navigation & menu logic
│
├── css/
│   ├── style.css           # Global base styles
│   ├── design-system.css   # Design tokens & variables
│   ├── ui-polish.css       # Refined UI components
│   ├── app-shell.css       # Navigation & layout structure
│   ├── decorative-elements.css  # Visual enhancements
│   ├── auth-styles.css     # Login/Register page styles
│   ├── create-entry.css    # Editor styles
│   ├── profile.css         # Profile page styles
│   ├── editor.css          # Rich editor styles
│   └── *-tracker.css       # Individual tracker styles
│
├── assets/
│   ├── images/
│   │   └── welcome_background.png
│   └── themes/             # Theme presets (SVG wallpapers)
│
├── database/
│   └── users.json          # Optional backend user database
│
├── BACKEND_OPTIONAL_express.js  # Optional Node/Express auth server
└── package.json            # Dependencies & scripts
```

---

## 🔄 Data Flow Architecture

### 1. **Authentication Flow**

```
User Registration/Login
        ↓
auth.js (Frontend Validation)
        ↓
localStorage (memoryJournal_users, memoryJournal_currentUser)
        ↓
Current Session Established
        ↓
All Pages Check Authentication Status
```

**Key Files**: `js/auth.js`, `js/app.js`

**Storage Keys**:
- `memoryJournal_users` - All registered users
- `memoryJournal_currentUser` - Active session user

---

### 2. **Entry Creation & Management Flow**

```
new.html (Editor Page)
    ↓
create-entry.js (Handles editing logic)
    ↓
Rich Text Editor + Media Upload
    ↓
Draft Auto-save to localStorage
    ↓
User Submits Entry
    ↓
app.js (saveEntry())
    ↓
localStorage (journalEntries)
    ↓
Redirect to entries.html
```

**Stored Data Structure**:
```javascript
{
  id: "unique-id",
  date: "2026-04-28",
  title: "Entry Title",
  content: "Rich HTML content",
  mood: "😊",
  tags: ["tag1", "tag2"],
  privacy: "private|public",
  isFavorite: false,
  images: [{url, caption, width}],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 3. **Entry Browsing & Viewing Flow**

```
entries.html
    ↓
app.js (getEntries())
    ↓
Fetch all entries from localStorage
    ↓
Apply filters (mood, date, search)
    ↓
Render grid/list view
    ↓
User clicks entry
    ↓
view.html (View single entry)
    ↓
app.js (getEntryById())
    ↓
Display formatted entry with media
```

---

### 4. **Habit Tracker Data Flow**

Each tracker (*-tracker.html) operates independently:

```
*-tracker.html (UI)
    ↓
*-tracker.js (Class instance)
    ↓
localStorage (tracker-specific keys)
    ├── mood_entries
    ├── water_entries
    ├── gym_entries
    ├── study_entries
    ├── period_data
    ├── expenses
    └── gratitude_entries
    ↓
Stats Calculation (streaks, totals, averages)
    ↓
Chart/Graph Rendering (mood tracker uses Chart.js)
    ↓
Export/Import functionality
```

**Example - Mood Tracker**:
```
localStorage['mood_entries'] = [
  {id, date, mood, activities, notes, timestamp}
]
```

---

## 🔗 Component Connections & Integration

### Navigation Hub
**navbar.js** + **layout.js** provide:
- Cross-page navigation links
- Theme toggle (light/dark mode)
- Profile dropdown menu
- User logout functionality
- Mobile menu toggle

All pages include:
```html
<script src="navbar.js"></script>
<script src="js/auth.js"></script>
<script src="js/themes.js"></script>
```

### Authentication Guard
`js/auth.js` runs on every page and:
- Checks if user is logged in
- Redirects to login.html if not authenticated
- Initializes demo user on first load
- Stores current user session

### Theme System
`js/themes.js` handles:
- Light/dark mode toggle
- Persistent theme preference (localStorage)
- Button state updates
- DOM attribute changes (`data-theme`)

### Storage Abstraction Layer
`js/storage.js` provides:
- Centralized entry management
- Error handling
- Data validation
- Import/Export utilities

---

## 📊 Data Storage Architecture

### Primary Storage: localStorage

**Key Namespacing Scheme**:
```
Authentication:
- memoryJournal_users → User database
- memoryJournal_currentUser → Active session

Core Journal:
- journalEntries → All journal entries
- memory_journal_writer_draft_* → Entry drafts
- memory_journal_theme → Theme preference

Trackers:
- mood_entries → Mood journal data
- water_daily_entries → Water tracking
- gym_entries → Workout logs
- study_entries → Study sessions
- period_data → Cycle information
- expenses → Financial transactions
- gratitude_entries → Gratitude logs
```

### Data Validation
`js/constants.js` defines validation rules:
- Image types: JPEG, PNG, WebP (max 3MB)
- Entry structure requirements
- User credentials validation
- Email format validation

---

## 🔄 Process Workflows

### Workflow 1: First-Time User Journey
```
1. Visit index.html
2. auth.js checks for currentUser
3. Demo user initialized in localStorage
4. Auto-login with demo account
5. Browse home dashboard
6. Can create entries, use trackers
7. Logout redirects to login.html
8. Can register new account
9. Login with credentials
```

### Workflow 2: Creating & Editing Entry
```
1. Click "Create Journal" → new.html
2. Rich text editor loads (create-entry.js)
3. User types content, adds images
4. Auto-save to draft (localStorage)
5. Add mood, tags, privacy settings
6. Click Submit
7. app.js validates & saves entry
8. Redirect to entries.html
9. New entry appears at top (sorted by date)
```

### Workflow 3: Using Mood Tracker
```
1. Navigate to mood-tracker.html
2. mood-tracker.js class initializes
3. Load previous entries from localStorage
4. Display mood buttons + calendar view
5. User selects mood + activities
6. Click "Log Mood"
7. Entry saved to mood_entries
8. Stats recalculate (streak, average, etc.)
9. Charts update using Chart.js
10. Can export as JSON/CSV
```

### Workflow 4: Tracking Expenses
```
1. Navigate to expense-tracker.html
2. expense-tracker.js loads budget & entries
3. Display today's total, monthly total, budget ring
4. User enters amount + category + note
5. Click "Add Expense"
6. Transaction saved with timestamp
7. Monthly stats recalculate
8. 14-day history displays
9. Category breakdown updates
10. Can set monthly budget
```

### Workflow 5: Viewing Profile & Settings
```
1. Click Profile dropdown → Edit Profile
2. edit-profile.html loads
3. Show current user info
4. Display theme selector buttons
5. User changes profile fields
6. User selects theme (Light/Dark)
7. edit-profile.js updates localStorage
8. themes.js re-renders page
9. Preference persists across sessions
10. Show theme preview
```

---

## 🔌 Optional Backend Integration

The Express backend (`BACKEND_OPTIONAL_express.js`) provides:

### Backend Routes
```
POST /api/auth/register     → Create user account (bcryptjs hashed)
POST /api/auth/login        → Authenticate user (returns JWT)
GET  /api/auth/profile      → Get user profile (requires JWT)
POST /api/auth/logout       → Invalidate session
```

### JWT Flow (When Backend Enabled)
```
Client Side                 Server Side
   ↓                           ↓
User credentials ────────→ Validate username/password
                           Hash & compare with bcryptjs
                        ←──────── JWT token
Store JWT in memory ←─────────────
Every request includes JWT token ──────→ Verify with authenticateToken()
```

### To Enable Backend
1. Install Node.js dependencies: `npm install`
2. Run: `npm start` or `npm run dev`
3. Update `js/auth.js` to call backend API instead of localStorage
4. Change CORS origin in express.js if needed

---

## 📈 Application Features & Modules

### Core Features
1. **Journal Entries** - Rich text editor with images, moods, tags, privacy settings
2. **Entry Management** - View, search, filter, download, delete entries
3. **Theme System** - Light/dark mode with persistent preference
4. **User Profiles** - Edit name/email, manage preferences
5. **Authentication** - Register/login with password validation

### Habit Trackers (7 Independent Modules)
| Tracker | Key Data | Features |
|---------|----------|----------|
| **Mood** | Daily mood + activities | Charts, calendar, export |
| **Water** | Daily hydration (ml) | Streak, 14-day graph, goal setting |
| **Gym** | Workout duration (min) | Best day, 7-day total, streaks |
| **Study** | Study hours | Weekly totals, daily breakdown |
| **Period** | Cycle start/end dates | Predictions, cycle length, history |
| **Expense** | Transaction + category | Budget tracking, monthly stats, breakdown |
| **Gratitude** | Daily gratitude text | Streak, calendar view, filterable journal |

---

## 🔐 Security Considerations

### Frontend Authentication
- Passwords stored in localStorage (not encrypted) - **Demo only**
- Suitable for local-first app without backend
- Session data cleared on logout

### Optional Backend Security
- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT tokens for stateless authentication
- CORS enabled for specified origin
- Validate credentials server-side

### Data Privacy
- All data stored locally by default
- No external API calls (standalone app)
- User can export/import data
- Clear/delete data option available

---

## 🚀 Getting Started

### Prerequisites
- Modern browser with localStorage support
- No server required for frontend-only mode

### Installation & Running
```bash
# Frontend-only (no installation needed)
Open index.html in browser

# With optional Express backend
npm install
npm start
# Server runs on http://localhost:3000
```

### Usage
1. Register new account or login with demo
2. Start creating journal entries
3. Explore habit trackers
4. Customize profile & theme
5. Export data as JSON

---

## 📝 Development Notes

- **Modular Design**: Each tracker is self-contained
- **No Build Step**: Vanilla JS, no bundling required
- **Storage-First**: All data persists in localStorage
- **Progressive Enhancement**: Works without backend
- **Responsive Design**: Mobile, tablet, desktop compatible

---

## 📦 Optional Features

- **Backend Authentication**: Express server with JWT
- **Multi-User**: Database support in `database/users.json`
- **Theme Customization**: Extensible theme system
- **Export/Import**: Download data, restore backups

---

**Last Updated**: April 2026