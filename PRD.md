# Driver Diagram Workspace - Product Requirements Document (PRD)

## 1. Overview

### 1.1 Project Name
Driver Diagram Workspace (Diverdiagram)

### 1.2 Project Type
Web application - Visual planning and documentation tool

### 1.3 Core Functionality
A Thai-first collaborative workspace for creating, editing, saving, and sharing driver diagrams with integrated KPI tracking. Users can build hierarchical driver diagrams (Purpose → Primary Drivers → Secondary Drivers → Change Ideas) with outcome KPIs at every level, export to multiple formats, and share via private links or community gallery.

### 1.4 Target Users
- Healthcare professionals (Thai hospitals/clinics)
- Quality improvement teams
- Project managers and planners
- Business analysts

---

## 2. Technical Stack

### 2.1 Frontend
- **Framework**: React 19.2.6
- **Build Tool**: Vite 8.0.13
- **Styling**: Tailwind CSS 4.3.0
- **Diagram Rendering**: Mermaid 11.15.0
- **Icons**: Lucide React
- **Document Export**: docx library

### 2.2 Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link / Email OTP)
- **Hosting**: Vercel

### 2.3 Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.57.4",
  "@tailwindcss/vite": "^4.3.0",
  "@vitejs/plugin-react": "^6.0.2",
  "docx": "^9.6.1",
  "lucide-react": "^1.16.0",
  "mermaid": "^11.15.0",
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "tailwindcss": "^4.3.0"
}
```

### 2.4 Project Structure
```
Diverdiagram/
├── src/
│   ├── driver_diagram_mvp.jsx       # Main application component
│   └── main.jsx                      # React entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── supabase/
│   └── functions/                     # Edge functions (if any)
├── tests/                            # Playwright tests
│   └── app.smoke.spec.js
└── README.md
```

---

## 3. Features

### 3.1 Core Features

#### 3.1.1 Driver Diagram Editor
- **Purpose/Goal Section**: Title and KPI input for the main goal
- **Primary Drivers**: Up to 10 top-level drivers with title and KPI
- **Secondary Drivers**: Nested under each primary driver with title and KPI
- **Change Ideas**: Nested under each secondary driver with title and KPI
- **Auto-save**: Automatic saving after changes with debounce

#### 3.1.2 Visualization
- **Mermaid Diagram**: Real-time diagram rendering from form data
- **Two-way sync**: Changes in form update diagram, changes in code update form
- **Preview Modal**: Full-screen diagram preview

#### 3.1.3 Export Options
- **PNG Export**: Export diagram as PNG image
- **SVG Export**: Export diagram as SVG
- **DOCX Export**: Export as Word document with formatted content

#### 3.1.4 Multi-language Support
- **Languages**: Thai (default), English
- **Language Toggle**: Switch language via header button
- **RTL Support**: Prepared for future RTL languages

### 3.2 User Management

#### 3.2.1 Authentication
- **Magic Link**: Email-based authentication without password
- **Email OTP**: One-time password authentication
- **Session Management**: Persistent sessions via Supabase

#### 3.2.2 User Diagrams
- **Save Diagrams**: Save diagrams to personal library
- **Load Diagrams**: Load saved diagrams from library
- **Delete Diagrams**: Remove diagrams from library
- **Diagram Metadata**: Title, created_at, updated_at, last_opened_at, is_favorite, archived_at

### 3.3 Sharing

#### 3.3.1 Private Sharing
- **Generate Share Link**: Create shareable link for diagrams
- **Share Expiration**: Configurable expiration (1 hour to 30 days)
- **Revoke Access**: Revoke share link at any time

#### 3.3.2 Community Gallery
- **Public Gallery**: Browse shared diagrams from community
- **Share to Gallery**: Share personal diagrams to public gallery
- **Filter & Search**: Find diagrams by keywords

### 3.4 User Interface

#### 3.4.1 Header Actions
- **New Diagram**: Create new blank diagram
- **Save**: Save current diagram
- **Preview**: Open diagram preview modal
- **Export**: Export diagram (PNG/SVG/DOCX)
- **Share**: Share diagram options
- **Gallery**: Browse community gallery
- **Language Toggle**: Switch between Thai/English

#### 3.4.2 Responsive Design
- **Desktop**: Full layout with sidebar and main content
- **Mobile**: Stacked layout with collapsible sections
- **Breakpoints**: Tailwind standard breakpoints (sm, md, lg, xl)

---

## 4. Data Model

### 4.1 Diagram Schema
```typescript
interface DriverDiagram {
  id: string;
  title: string;
  purpose_title: string;
  diagram_data: {
    purpose: { title: string; kpi: string };
    primaryDrivers: Array<{
      id: string;
      title: string;
      kpi: string;
      secondaryDrivers: Array<{
        id: string;
        title: string;
        kpi: string;
        changeIdeas: Array<{
          id: string;
          title: string;
          kpi: string;
        }>;
      }>;
    }>;
  };
  mermaid_code: string;
  thumbnail_svg: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  is_favorite: boolean;
  archived_at: string | null;
  share_id: string | null;
  shared_at: string | null;
  share_expires_at: string | null;
  share_revoked_at: string | null;
}
```

### 4.2 Supabase Tables
- **diagrams**: User-created driver diagrams
- **profiles**: User profile information

---

## 5. API Endpoints

### 5.1 Diagram Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /diagrams | List user's diagrams |
| POST | /diagrams | Create new diagram |
| GET | /diagrams/:id | Get specific diagram |
| PATCH | /diagrams/:id | Update diagram |
| DELETE | /diagrams/:id | Delete diagram |

### 5.2 Sharing Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /diagrams/:id/share | Generate share link |
| DELETE | /diagrams/:id/revoke | Revoke share link |
| GET | /gallery | Browse public diagrams |
| POST | /diagrams/:id/publish | Publish to gallery |

---

## 6. UI/UX Design

### 6.1 Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | #2563EB | Main actions, links |
| Secondary Blue | #3B82F6 | Secondary elements |
| Pink | #EC4899 | Top-level goal, new diagram button |
| Amber | #F59E0B | Primary drivers |
| Orange | #EA580C | Secondary drivers |
| Neutral Gray | #64748B | Text, borders |
| Success Green | #10B981 | Success states |
| Error Red | #EF4444 | Error states |

### 6.2 Typography
- **Font Family**: System fonts (Inter fallback)
- **Headings**: Bold, varying sizes by hierarchy
- **Body**: Regular weight, 14-16px
- **Labels**: Semibold, 12-14px

### 6.3 Layout
- **Header**: Fixed top, contains actions and navigation
- **Main Content**: Scrollable area with form and diagram
- **Sidebar**: Saved diagrams list (desktop only)
- **Mobile Menu**: Collapsible overflow menu

### 6.4 Component States
- **Default**: Normal appearance
- **Hover**: Subtle background change
- **Active/Focus**: Border highlight, shadow
- **Disabled**: Reduced opacity, no interaction
- **Loading**: Spinner or skeleton

---

## 7. User Flows

### 7.1 Create New Diagram
1. Click "New Diagram" button
2. Enter purpose/goal title
3. Add primary drivers (click "+ Primary")
4. Add secondary drivers under each primary
5. Add change ideas under each secondary
6. Add KPIs at each level
7. Diagram auto-updates in real-time

### 7.2 Save Diagram
1. Edit diagram content
2. Wait for auto-save (2 second debounce)
3. Or click "Save" button for immediate save
4. Success notification appears

### 7.3 Share Diagram
1. Click "Share" button
2. Choose share type (private link or public gallery)
3. For private: set expiration, copy link
4. For public: confirm, diagram appears in gallery

### 7.4 Export Diagram
1. Click "Export" button
2. Choose format (PNG, SVG, or DOCX)
3. File downloads automatically

---

## 8. Testing Strategy

### 8.1 Smoke Tests
- Driver Diagram smoke flows: opens the page, creates elements, edits form, syncs Mermaid, opens preview modal
- Language switcher: toggles between Thai and English

### 8.2 Browser Support
- Chromium (Playwright default)
- Mobile viewport simulation

### 8.3 Test Coverage
- Form interactions
- Mermaid diagram sync
- Language toggle
- Mobile responsiveness

---

## 9. Deployment

### 9.1 Hosting
- **Platform**: Vercel
- **Framework**: Vite + React

### 9.2 Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 9.3 Build Output
- Static files deployed to CDN
- Edge functions for API (if needed)

---

## 10. Future Considerations

### 10.1 Potential Features
- Real-time collaboration (multiple users editing simultaneously)
- Version history and rollback
- Diagram templates
- PDF export
- Integration with other tools (Jira, Notion)

### 10.2 Technical Improvements
- Offline support (PWA)
- Performance optimization for large diagrams
- Enhanced accessibility (ARIA labels, keyboard navigation)

---

## 11. Glossary

| Term | Definition |
|------|------------|
| Driver Diagram | A visual planning tool showing cause-effect relationships |
| Primary Driver | Main factors contributing to the goal |
| Secondary Driver | Sub-factors under primary drivers |
| Change Idea | Specific actions to address secondary drivers |
| KPI | Key Performance Indicator - measurable outcome |
| Mermaid | Diagram rendering library |
| Magic Link | Password-less authentication via email link |

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-05-22 | Droid | Initial PRD creation |

---

*Document created: 2025-05-22*
*Project: Driver Diagram Workspace (Diverdiagram)*
