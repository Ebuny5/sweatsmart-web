

## Fix: Make Home the Default Page

The welcome page at `/home` exists and works, but multiple files still redirect to `/dashboard`. Here are all the changes needed:

### 1. Fix NewIndex.tsx redirect (ROOT CAUSE)
**File:** `src/pages/NewIndex.tsx` (line 102)
- Change `navigate('/dashboard')` to `navigate('/home')`
- This is the main landing page redirect for authenticated users

### 2. Add Home to Sidebar
**File:** `src/components/layout/Sidebar.tsx`
- Import `Home` icon from lucide-react
- Add `/home` as the first menu item labeled "Home"
- Rename `/dashboard` from "Dashboard" to "Analytics"

### 3. Update Mobile Bottom Nav
**File:** `src/components/layout/MobileBottomNav.tsx`
- Change the first primary item from `/dashboard` to `/home`
- Keep label as "Home"

### 4. Fix remaining `/dashboard` references
- **`src/pages/Auth.tsx`** (lines 71, 90): Change two `navigate('/dashboard')` calls to `navigate('/home')`
- **`src/pages/NotFound.tsx`** (line 21): Change `navigate("/dashboard")` to `navigate("/home")` (the previous fix on line 27 was for a different code path)
- **`src/components/layout/Header.tsx`** (line 60): Change logo click from `/dashboard` to `/home`
- **`src/pages/LogEpisode.tsx`** (lines 186, 359): Change "Go to Dashboard" buttons to navigate to `/home`

### Summary
7 files need updates, mostly single-line changes replacing `/dashboard` with `/home`. The dashboard analytics page remains accessible at `/dashboard` via the sidebar's "Analytics" link.

