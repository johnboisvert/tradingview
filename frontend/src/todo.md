# Admin Dashboard - Full localStorage Backend

## Tasks

1. **Create `lib/store.ts`** - localStorage persistence service with mock data defaults
2. **Update `lib/api.ts`** - Replace mock API calls with localStorage read/write
3. **Connect `/contact` page** - Save messages to localStorage, display in `/admin/messages`
4. **Update `/abonnements` page** - Read dynamic prices from localStorage
5. **Full ebook CRUD in `/admin/messages`** - Create, edit, delete ebooks with form
6. **Update `/telechargement` page** - Display ebooks from localStorage with plan filtering
7. **Update `/admin` dashboard** - Dynamic stats from real localStorage data

## Files to create/modify:
- `src/lib/store.ts` (NEW)
- `src/lib/api.ts` (MODIFY)
- `src/pages/Contact.tsx` (MODIFY)
- `src/pages/Abonnements.tsx` (MODIFY)
- `src/pages/Messages.tsx` (MODIFY - full ebook CRUD)
- `src/pages/Telechargement.tsx` (MODIFY)
- `src/pages/AdminDashboard.tsx` (MODIFY)