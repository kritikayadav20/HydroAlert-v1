# HydroAlert: Integrated Drought Warning & Smart Tanker Management System

HydroAlert is a predictive water governance platform designed to shift district-level water management from reactive crisis response to proactive, data-driven prevention. It predicts emerging drought stress using environmental metrics and enables authorities to optimize water tanker allocation dynamically.

## 🌟 Key Features

### 1. Predictive Water Stress Engine (WSI)
A custom algorithm calculates a real-time **Water Stress Index (0-100)** for every location node (village) based on:
- Rainfall Deficit
- Groundwater Depletion Velocity
- Population Demand Density
- Live Water Tank Capacity Gaps

### 2. Drought Command Center
A government-grade, dark-themed control room dashboard (`/admin`) featuring:
- **Geospatial Heatmap:** An interactive grid visualizing all location nodes. High-stress zones pulse with a warning aura.
- **AI Node Inspector:** Explainable AI that breaks down exactly why a specific WSI score was assigned to a village, proving resource allocation necessity to stakeholders.
- **Top-Level Analytics:** Real-time metrics for critical zones and active fleet status.

### 3. Smart Fleet Logistics Hub
A dedicated dispatch interface (`/admin/dispatch`) for managing the district's water tanker fleet:
- **Priority SOS Queue:** Automatically ranks villages crossing critical stress thresholds, placing the most endangered nodes at the top.
- **Live Fleet Matrix:** Tracks every tanker's capacity, driver contact info, and status (Available, En Route, Maintenance).
- **Auto-Route Optimization:** A single-click AI simulation that finds the most critical villages and automatically routes the nearest available tankers to them.

### 4. Dispatch Registry & Accountability
An immutable ledger (`/alerts`) logging every fleet dispatch event.
- Cross-references the exact WSI at the time of dispatch to ensure resources are allocated without bias.
- Tracks the full lifecycle of a dispatch (Pending to Delivered).

### 5. Premium UI/UX
- Built using an ultra-modern, dark-slate (`#0a1930`) glassmorphic aesthetic to mimic tactical control systems.
- Heavy use of crisp micro-animations, glowing neon accents, and zero-jargon terminology tailored for district commissioners.

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Recharts (for data visualization)
- **Backend/Database:** Supabase (PostgreSQL)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kritikayadav20/HydroAlert-v1.git
   cd hydro-alert
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Database:
   - Run the SQL script located at `database_schema.sql` in your Supabase SQL Editor. This will create the necessary tables (`villages`, `environmental_data`, `tankers`, `dispatch_logs`) and populate them with initial mock data.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure
- `app/admin/`: The Command Center (Heatmap)
- `app/admin/dispatch/`: The Fleet Logistics Hub
- `app/alerts/`: The Dispatch Registry / Accountability logs
- `app/api/`: Backend routes handling WSI predictions and tanker routing algorithms
- `lib/stressEngine.ts`: The core logic for calculating the Water Stress Index
