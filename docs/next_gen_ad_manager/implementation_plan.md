# Next-Gen AdManager Implementation Plan

## Goal Description
Build the **B-Studio Interface** (Frontend).
Transform the current MVP pages into a cohesive, professional SaaS platform with distinct areas for "Traffic Management" (Paid) and "Social Studio" (Organic).

## User Review Required
> [!IMPORTANT]
> **Design**: I will use a dark-themed, premium aesthetic with "Glassmorphism" touches, as requested in your design guidelines.

## Proposed Changes

### Frontend Architecture

#### [NEW] [Dashboard Structure]
- **Entry Point (`app/page.tsx`)**: A high-level "Command Center" dashboard that shows a summary of both worlds (Orgânico vs Pago) and allows quick navigation.
- **Split Views**:
    1.  **Traffic Manager (Gestor de Tráfego)**:
        -   *Sub-functions*: Campilhas (Active), ROI Monitor, Creative Fatigue, Scaling Opportunities.
    2.  **Social Studio (Social Media)**:
        -   *Sub-functions*: Content Calendar, Inbox (Sales Desk), Viral Alerts, Creative Search.

#### [MODIFY] [frontend/app/page.tsx](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/frontend/app/page.tsx)
- Redesign to use a Grid Layout with 2 main columns:
    - **Left**: Social Media Performance (Organic Reach, Engagement, Latest Inbox Leads).
    - **Right**: Paid Traffic Performance (Spend, ROAS, Active Campaigns status).

#### [NEW] [frontend/components/Sidebar.tsx](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/frontend/components/Sidebar.tsx)
- Navigation bar with:
    - **Home** (Command Center)
    - **Traffic Manager** (Dropdown: Campaigns, Audiences, Finance)
    - **Social Studio** (Dropdown: Calendar, Inbox, Search)
    - **Settings**

## Verification Plan

### Manual Verification
- **Visual Check**:
    - Verify "Traffic" and "Social" sections are visually distinct.
    - Check responsiveness (Sidebar collapsing).
    - ensure navigation links work.
