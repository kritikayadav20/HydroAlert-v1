# Integrated Drought Warning & Smart Tanker Management System
## High-Impact Feature Document (Prototype V1)

This document outlines the dense, high-impact features currently built into the prototype to solve the problem of shifting from reactive crisis management to preventive water governance.

---

### 1. The Core AI: Predictive Water Stress Engine (`/lib/stressEngine.ts`)
*   **Dynamic WSI Calculation:** The system doesn't rely on static data. It computes a real-time **Water Stress Index (WSI)** (0-100 scale) for every village in the grid.
*   **Multi-Factor Analysis:** The algorithm ingests:
    *   *Rainfall Deficit Weighting* (Lack of seasonal precipitation).
    *   *Groundwater Depletion Velocity* (Rate at which the water table drops).
    *   *Population Demand Factor* (Density and historical consumption).
    *   *Current Tank Capacity Gap* (Live telemetry of available stored water).
*   **"Explainable AI" Inspector:** The Admin Dashboard features a node inspector that visually breaks down exactly which factors are contributing to a village's WSI, proving the algorithm's decisions to stakeholders.

### 2. The Command Center: Live Interactive Grid (`/admin/dashboard`)
*   **Geospatial Status Map:** A custom-built, dark-themed interactive map grid (`VillageMap.tsx`) visualizing all location nodes (villages).
*   **Pulsing Heatmaps:** Villages with a critical WSI (>80) pulse with an animated neon-red warning aura, instantly drawing the commander's eye to high-risk zones.
*   **Hover Telemetry:** Hovering over any map node instantly reveals deep stats: WSI score, total population, and live community tank capacity percentages.
*   **Live Key Analytics:** Top-level metric cards display real-time numbers for "Critical Zones," "Active Tankers on Road," and the "Average Regional Stress Index."

### 3. Smart Logistics: Fleet Dispatch Hub (`/admin/dispatch`)
*   **Priority SOS Queue:** Automatically identifies, pulls, and ranks villages crossing the critical stress threshold (WSI > 50). The most endangered villages are placed directly at the top of the queue for immediate action.
*   **Live Fleet Matrix:** A real-time tracking interface showing every tanker in the district's fleet. It displays registration numbers, capacities, driver info (phone/name), and live status (`Available`, `En_Route`, `Maintenance`).
*   **Auto-Route Critical AI:** A single-click optimization button. When clicked, the backend analyzes the most critical SOS villages, finds the nearest `Available` tanker, and automatically generates dispatch logs and routes to service those villages first.

### 4. Operational Accountability: Dispatch Registry (`/alerts`)
*   **Immutable Action Ledger:** A table logging every tanker dispatch event across the district.
*   **Cross-Referenced Telemetry:** Logs don't just show destinations; they cross-reference the village's *exact WSI* at the time of dispatch, proving that resources are being allocated based on severity and not political bias.
*   **Status Lifecycle:** Tracks whether a tanker is `Pending` (on the way) or successfully `Delivered`.

### 5. "Government-Grade" UX/UI Design 
*   **Premium Aesthetic:** Built using a cutting-edge, dark-slate (`bg-slate-950`) color palette with vibrant neon accents (Cyan, Amber, Rose) to look like a modern tactical control room.
*   **Glassmorphism & Micro-animations:** Heavy use of frosted glass (`backdrop-blur-xl`), glowing orbs, smooth transitions, and counting numbers to make the application feel highly responsive, expensive, and award-worthy.
*   **Zero-Jargon Interface:** Designed for district commissioners, using clear terminology like "Location Node," "Water Stress Index," and "Fleet Dispatch Grid."
