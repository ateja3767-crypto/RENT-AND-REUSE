# RentReuse — Campus Peer-to-Peer Rental & Sharing Platform

RentReuse is a circular-economy campus platform engineered specifically for college students to rent or borrow items they need for a short time and share items they no longer use (seniors lending to juniors, peers lending to peers).

---

## 🌟 Highlights & Key Innovations

1. **Full Rental Lifecycle Flow**:
   - **Request** (Date range picker, duration calculation, deposit calculation, optional message)
   - **Accept / Decline** by item owner
   - **Picked Up Handover**: Safety checklist + handover condition notes
   - **Return Handover & Deposit Inspection**: Deposit refund / withhold handling, damage report with notes/photos
   - **Overlapping Booking Prevention**: Prevents double-booking reserved dates

2. **Campus Contact & Trust System**:
   - Institutional email verification requirement (`.edu`, `campus.edu`)
   - Profile trust score (0–100) dynamically calculated from on-time returns, completed transactions, and rating averages
   - Two-way ratings and reviews after completed transactions
   - Verified student badges, Fast Responder, and Super Lender distinctions
   - Incident & item reporting modal with administrator moderation queue

3. **Student Innovation Features**:
   - **Semester-End "Donate / Pass It On" Mode**: Flag items as free for junior cohorts with a "Seniors' Sale" badge
   - **Campus Pickup Spots**: Safe, recommended rendezvous locations (Central Library Foyer, Main Canteen, North Hostel Gate, SAC, Engineering Quad)
   - **"Wanted" Board**: Post urgent requirements (e.g., TI-84 for tomorrow's midterm) and receive offers from campus peers
   - **Deposit Tracking**: Real-time deposit status (`held`, `refunded`, `withheld`) with item inspection log
   - **Automatic Return Reminders**: In-app notifications alerting borrowers 1 day before due, on due day, and when overdue
   - **Wishlist & Availability Alerts**: Save items and get notified when rented items return to circulation
   - **Campus Impact Dashboard**: Real-time aggregation of items reused, student dollars saved, and estimated e-waste/landfill avoided

---

## 🚀 Quick Start & Development

### 1. Installation & Local Development
```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev
```

Visit the app at `http://localhost:3000`.

### 2. Environment Variables (`.env`)
```bash
# Optional: Set up if connecting directly to Supabase cloud instance
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

*Note: RentReuse includes a built-in reactive storage engine with pre-seeded demo students, 16+ catalog items across 8 categories, active rentals, messages, and reviews. All modifications are persisted in browser storage and can be reset anytime via the top navigation.*

---

## 🗄️ Database Schema & Seed Data

The project contains complete production-ready SQL files in the project root:
- `schema.sql`: Contains 9 normalized tables (`users`, `items`, `bookings`, `messages`, `reviews`, `reports`, `wishlist`, `wanted_posts`, `notifications`) complete with indexes, constraints, and Row Level Security (RLS) policies.
- `seed.sql`: Realistic seed script inserting 5 student/admin profiles, 16 items across all categories, bookings, messages, reviews, and wanted posts.

To execute on a Postgres or Supabase instance:
```bash
psql -h <HOST> -U <USER> -d <DATABASE> -f schema.sql
psql -h <HOST> -U <USER> -d <DATABASE> -f seed.sql
```

---

## 🎓 Demo Walkthrough

1. **Instant Student Persona Switcher**:
   - In the top navigation, click the **"Switch Student"** selector to immediately test from the viewpoint of:
     - **Aarav (Senior, Mech Eng)**: Has active listings like the Rotring Drafting Kit and pending incoming requests.
     - **Maya (Junior, CS)**: Owns the TI-84 calculator and Arduino Mega kit.
     - **Liam (Sophomore, Bio)**: Currently borrowing the Sony WH-1000XM4 headphones with an active return reminder.
     - **Sofia (Freshman, Arch)**: Has requested Aarav's drafting kit and posted on the Wanted board.
     - **Admin Office**: Accesses the Moderation console (`/admin`).

2. **Browse & Filter Items**:
   - Filter by categories: *Engineering Tools*, *Books*, *Electronics*, *Lab Equipment*, *Furniture*, *Clothing*, *Sports*, *Other*.
   - Toggle **"Free / Seniors' Pass-it-On"** to see items given away to juniors.
   - Search by item title or campus location.

3. **Rental Booking & Calendar**:
   - Click any available item (e.g. *Rotring Precision Drafting Kit*).
   - Select start and end dates. Total rental fee and refundable deposit are calculated in real time.
   - Submit request. Switch to Aarav to accept the request, mark as picked up, and inspect return.

4. **Return Reminders & Deposit Inspection**:
   - When viewing an active borrow, the borrower sees time remaining.
   - Upon return, the owner inspects the item, can upload condition photos/notes, and refunds the deposit in full or partially.

5. **Wanted Board**:
   - Browse student item requests. Click "I Have This Item" to offer your gear directly to a peer.

6. **Impact Dashboard**:
   - Click "Impact" to view campus-wide circular metrics: items kept in use, student savings, and carbon emissions avoided.
