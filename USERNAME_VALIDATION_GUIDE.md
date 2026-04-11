# 🎨 Username Validation - Visual Guide

## 📋 Overview

The Memory Journal username system requires 5 specific criteria to ensure usernames are:
- **Secure** (mix of character types)
- **Personal** (connected to user's real name)
- **Valid** (proper length and format)

---

## ✅ 5 Complete Requirements

### 1️⃣ Length: 6–20 characters (No Spaces)

```
✅ VALID              ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JohnDoe@123         John           (too short)
Alice_Smith#9       Alice Smith    (has spaces)
Tiger2024!          VERYLONGUSERNAME (too long)
Bob@2024            (empty)
```

**Key Points:**
- Minimum: 6 characters
- Maximum: 20 characters
- No spaces allowed

---

### 2️⃣ Uppercase Letter (A–Z)

```
✅ VALID              ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JohnDoe@123         johndoe@123    (no uppercase)
Alice_Smith#9       alicesmith#9   (no uppercase)
Tiger2024!          tiger2024!     (no uppercase)
B0b@Smith           b0b@smith      (no uppercase)
```

**Key Points:**
- At least ONE uppercase letter (A–Z)
- Uppercase must appear somewhere in username
- Can be at start, middle, or end

---

### 3️⃣ Number (0–9)

```
✅ VALID              ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JohnDoe@123         JohnDoe@       (no number)
Alice_Smith#9       Alice_Smith#   (no number)
Tiger2024!          TigerAlice!    (no number)
Bob@2024            Bob@           (no number)
```

**Key Points:**
- At least ONE number (0–9)
- Can appear anywhere in username
- Multiple numbers allowed

---

### 4️⃣ Special Character (!@#$%^&*)

```
✅ VALID              ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JohnDoe@123         JohnDoe123     (no special char)
Alice_Smith#9       AliceSmith9    (no special char)
Tiger2024!          Tiger20241     (no special char)
Bob@2024            Bob2024        (no special char)
```

**Allowed Special Characters:**
```
! @ # $ % ^ & *
```

**Key Points:**
- At least ONE special character required
- Must be one of: ! @ # $ % ^ & *
- Can appear anywhere in username

---

### 5️⃣ Contains Part of Full Name

**Example: User's Full Name = "John Doe"**

```
✅ VALID              ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JohnDoe@123         ✓ Contains "john"
johndoe_2024#       ✓ Contains "john" & "doe"
Doe#Alpha2          ✓ Contains "doe"
Alice_Smith#9       ✗ No "John" or "Doe"
Tiger2024!          ✗ No "John" or "Doe"
```

**Key Points:**
- Username must include at least ONE word from full name
- Matching is **case-insensitive** (john = John = JOHN)
- Can be full word or part of word
- Works with names that have multiple parts

---

## 🔍 Real Examples

### Full Name: "Sarah Johnson"

| Username | Valid? | Reason |
|----------|--------|--------|
| `Sarah@123` | ✅ | Contains name part + special char + number |
| `Johnson_2024#` | ✅ | Contains name part + special char + number |
| `SarahJ@99` | ✅ | Contains name part + special char + number |
| `Sarah123!` | ✅ | Has all requirements |
| `Sar@2024` | ✅ | "Sar" matches "Sarah" + other requirements |
| `sara@2024` | ✅ | Case-insensitive matching works |
| `SarahJohnson!2` | ❌ | Valid requirements BUT has space or... (wait, no space) = ✅ Actually VALID |
| `alice@2024` | ❌ | No match with "Sarah" or "Johnson" |
| `Sarah2024` | ❌ | Missing special character! |
| `sarah@` | ❌ | Too short (5 chars), no uppercase required |

### Full Name: "Michael O'Brien"

| Username | Valid? | Reason |
|----------|--------|--------|
| `Michael@99` | ✅ | All requirements met |
| `OBrien#2024` | ✅ | Contains "Brien" or "O'Brien" |
| `Mike@2024` | ❌ | "Mike" ≠ "Michael" - NOT in full name |
| `Michael_99#` | ✅ | All requirements correct |

### Full Name: "李 明" (International Names)

| Username | Valid? | Reason |
|----------|--------|--------|
| `Ming@2024` | ✅ | Contains "Ming" + other requirements |
| `Li_Ming#99` | ✅ | Contains both name parts |

---

## 🎯 Quick Checklist

When creating a username with full name "**John Doe**":

```
□ Made it 6–20 characters? (No spaces)
  Example: JohnDoe@123 (11 chars) ✓

□ Added at least one UPPERCASE letter?
  Example: **J**ohnDoe@123 ✓

□ Added at least one number?
  Example: JohnDoe@**123** ✓

□ Added at least one special character (!@#$%^&*)?
  Example: JohnDoe**@**123 ✓

□ Included part of "John" or "Doe"?
  Example: **John**Doe@123 ✓

✅ ALL 5 ✓ → USERNAME IS VALID!
```

---

## 🚨 Common Mistakes

| Mistake | Example | Fix |
|---------|---------|-----|
| All lowercase | `johndoe@123` | Add uppercase: `JohnDoe@123` |
| No special char | `JohnDoe123` | Add special: `JohnDoe@123` |
| No number | `JohnDoe@` | Add number: `JohnDoe@123` |
| Missing name | `AliceSmith@99` | Add name part: For "John Doe" user |
| Too short | `John@1` | Extend it: `JohnDoe@123` |
| Has space | `John Doe@123` | Remove space: `JohnDoe@123` |
| No uppercase | `johndoe_@123` | Add capital: `JohnDoe_@123` |
| Wrong special char | `johndoe,123` | Use allowed: ! @ # $ % ^ & * |

---

## 💡 Pro Tips for Users

1. **Start with your name**: `JohnDoe` forms a good base
2. **Add birth year**: `JohnDoe2000` includes a number
3. **Add special character**: `JohnDoe2000@` or `JohnDoe@2000`
4. **Make sure it's 6–20 chars**: Your example is 13 ✓
5. **Check uppercase**: "J" in John ✓

**Result**: `JohnDoe@2000` ✅ All requirements met!

---

## 🔄 Real-Time Feedback

As the user types their username, they see:

```
Username: John
─────────────────────────────────
✅ Contains part of your full name
❌ 6–20 characters (current: 4)
❌ At least one UPPERCASE letter
❌ At least one number (0-9)
❌ At least one special character

Status: Not ready to submit

─────────────────────────────────

Username: JohnDoe@2024
─────────────────────────────────
✅ 6–20 characters (current: 12) ✓
✅ At least one UPPERCASE letter ✓
✅ At least one number (0-9) ✓
✅ At least one special character ✓
✅ Contains part of your full name ✓

Status: ✨ Ready to submit!
```

---

## 🎓 Learn by Example

### Example 1: Sarah Martinez
```
Full Name: Sarah Martinez

Good usernames:
✅ Sarah@2024     (name + special + number)
✅ Martinez#99    (name + special + number)
✅ SarahM@24      (name parts + others)
✅ mart1nez@2025  (name + number + special |mart is close|... 
                   actually "Martinez" contains this)

Invalid usernames:
❌ sarah2024      (missing special char)
❌ Sarah@         (missing number)
❌ Alice@2024     (doesn't contain "Sarah" or "Martinez")
❌ Sar            (too short)
```

### Example 2: David Chen
```
Full Name: David Chen

Good usernames:
✅ David@123
✅ Chen_2024#
✅ DavidChen@1
✅ chen@2024_D

Invalid usernames:
❌ david123       (no special char, no uppercase)
❌ David123       (no special character)
❌ Someone@2024   (doesn't contain "David" or "Chen")
```

---

## 📊 Requirement Matrix

| Requirement | Min | Max | Required | Example |
|---|---|---|---|---|
| Length | 6 | 20 | ✅ | 12 characters |
| Uppercase | 1 | ∞ | ✅ | At least 1 |
| Number | 1 | ∞ | ✅ | At least 1 |
| Special | 1 | ∞ | ✅ | At least 1 |
| Name Match | 1 | ∞ | ✅ | Contains part |
| **All Met?** | - | - | ✅ | Username Valid ✓ |

---

## 🎨 Real-Time Validation UI

Users see this as they type:

```
Legend:
✓ = Requirement MET (green, checked)
○ = Requirement NOT MET (gray, empty)

As typing "john":
○ 6–20 characters (no spaces)
○ At least one UPPERCASE letter
○ At least one number (0-9)
○ At least one special character (!@#$%^&*)
○ Contains part of your full name

As typing "John":
○ 6–20 characters (no spaces)
✓ At least one UPPERCASE letter
○ At least one number (0-9)
○ At least one special character (!@#$%^&*)
○ Contains part of your full name

As typing "JohnDoe@2024":
✓ 6–20 characters (no spaces)
✓ At least one UPPERCASE letter
✓ At least one number (0-9)
✓ At least one special character (!@#$%^&*)
✓ Contains part of your full name

✨ READY TO SUBMIT! ✨
```

---

## ✨ Summary

### The 5 Requirements
1. ✅ **6–20 characters** (no spaces)
2. ✅ **Uppercase letter** (A–Z)
3. ✅ **Number** (0–9)
4. ✅ **Special character** (!@#$%^&*)
5. ✅ **Part of real name** (case-insensitive)

### One Valid Example
```
Full Name: John Doe
Username: JohnDoe@2024

✓ Length: 12 characters ✓
✓ Uppercase: J ✓
✓ Number: 2024 ✓
✓ Special: @ ✓
✓ Name: John ✓

VALID! ✨
```

---

Last Updated: April 11, 2026  
For Memory Journal Authentication System
