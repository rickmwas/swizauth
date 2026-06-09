# UI Component Registry: SWIZAUTH

This registry tracks the reusable React/Next.js UI components built for the SwizAuth system to ensure absolute visual consistency across development sessions.

---

### Auth Card Component

Used for wrapping entry forms (Login, Registration, OTP inputs, password resets).

File: [app/auth/login/page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/auth/login/page.tsx)
Last updated: 2026-06-09

| Property         | Class                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Background       | `bg-card`                                                        |
| Border           | `border border-border`                                           |
| Border radius    | `rounded-xl` (12px)                                              |
| Text — primary   | `font-display font-semibold text-2xl tracking-tight` (Title)     |
| Text — secondary | `text-sm text-muted-foreground` (Subtext)                         |
| Spacing          | `p-8` container padding, `space-y-5` form fields spacing         |
| Hover state      | `hover:from-primary/90 hover:to-violet-700` (Primary button)     |
| Shadow           | `shadow-md shadow-black/5`                                       |
| Accent usage     | `bg-gradient-to-r from-primary to-violet-600` (CTA Button block) |

**Pattern notes:**
- Display brand logo explicitly at the top of the card for mobile screen consistency.
- Ensure the first input field has autofocussed cursor on mount.
- Password input components must always embed the eye toggler (`Eye`/`EyeOff` icon) to toggle text visibility.
- Submission buttons must show a `Loader2` rotating spinner and disable all inputs during loading lifecycle.

---

### Dashboard Layout & Sidebar

Standard structure wrapper for authenticated dashboard views.

File: [app/dashboard/layout.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/layout.tsx)
Last updated: 2026-06-09

| Property         | Class                                                        |
| ---------------- | ------------------------------------------------------------ |
| Background       | `bg-card` (Sidebar/Header), `bg-background` (Page Canvas)     |
| Border           | `border-r border-border` (Sidebar), `border-b` (Header)      |
| Border radius    | None (Layout containers)                                     |
| Text — primary   | `font-display font-bold text-lg tracking-tight` (Branding)   |
| Text — secondary | `text-xs font-semibold text-muted-foreground` (Nav items)    |
| Spacing          | `p-4 space-y-1.5` (Nav link column), `p-6` (Main canvas)     |
| Hover state      | `hover:text-foreground hover:bg-secondary` (Sidebar link)    |
| Shadow           | None                                                         |
| Accent usage     | `bg-secondary/80 border-border text-primary` (Org tag badge) |

**Pattern notes:**
- Topbar includes a dynamic organization tag context pill (`Building` icon) showing the active tenant organization.
- Layout must be forced to dynamic server execution (`export const dynamic = "force-dynamic"`) since it decodes session cookies.

---

### Metrics Card Component

Summarized dashboard values showing quick indicators.

File: [app/dashboard/page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/page.tsx)
Last updated: 2026-06-09

| Property         | Class                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Background       | `bg-card`                                                        |
| Border           | `border border-border`                                           |
| Border radius    | `rounded-xl` (12px)                                              |
| Text — primary   | `font-display font-bold text-lg text-foreground mt-0.5` (Value)  |
| Text — secondary | `text-xs font-semibold uppercase tracking-wider text-muted-lbl`  |
| Spacing          | `p-6` container padding, `h-40 flex flex-col justify-between`    |
| Hover state      | `hover:border-primary/50` (Card), `hover:bg-primary` (Icon block)|
| Shadow           | `shadow-sm shadow-black/5`                                       |
| Accent usage     | `text-primary` (Interactive transitions)                         |

**Pattern notes:**
- Place a container block in the top left for the category icon wrapper (`bg-secondary` default, transitions to brand color on hover).
- Metrics card should render a subtle hover animation with top right arrow pointer transitions.

---

### Standard Data Table Component

Paginated data lists matching filters (Members list, Audit Logs table).

File: [app/dashboard/members/page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/members/page.tsx)
Last updated: 2026-06-09

| Property         | Class                                                        |
| ---------------- | ------------------------------------------------------------ |
| Background       | `bg-card` (Table panel container), `bg-muted/40` (Header row)|
| Border           | `border border-border` (Outer), `border-b` (Rows)            |
| Border radius    | `rounded-xl` (Outer panel container)                         |
| Text — primary   | `font-semibold text-foreground text-xs` (Row names)          |
| Text — secondary | `text-xs text-muted-foreground` (Metadata values)            |
| Spacing          | `p-4` table header controls padding, `p-4` cell padding      |
| Hover state      | `hover:bg-muted/20` (Data Row block)                         |
| Shadow           | `shadow-sm`                                                  |
| Accent usage     | `bg-accent/60 border-accent text-accent-foreground` (Badges) |

**Pattern notes:**
- Search inputs must compile a 300ms debounce before executing request cycles to protect backends.
- Row lists must display skeleton loading rows mimicking cell shapes during async calls instead of loading icons.
- Final column contains table actions wrapped inside a `DropdownMenu` trigger (`MoreVertical` icon).
- Bottom footer contains pagination control indicators matching total records count and limit dropdown settings.

---

### Modal Dialog Component

Confirmation notifications and form overlays.

File: [app/dashboard/members/page.tsx](file:///c:/Users/rickm/OneDrive/Desktop/swizauth/dashboard/src/app/dashboard/members/page.tsx)
Last updated: 2026-06-09

| Property         | Class                                                        |
| ---------------- | ------------------------------------------------------------ |
| Background       | `bg-card`                                                    |
| Border           | `border border-border`                                       |
| Border radius    | `rounded-xl` (12px)                                          |
| Text — primary   | `font-display font-bold text-foreground text-md` (Title)      |
| Text — secondary | `text-xs text-muted-foreground leading-normal` (Body description)|
| Spacing          | `p-6` card padding, `gap-3 flex justify-end` (Action footer) |
| Hover state      | `hover:bg-destructive/90` (Red warning), `hover:bg-sec`      |
| Shadow           | `shadow-xl`                                                  |
| Accent usage     | `bg-destructive text-destructive-foreground` (Confirm block) |

**Pattern notes:**
- Modal overlay must use a blurred, transparent back-canvas filter: `bg-black/60 backdrop-blur-sm`.
- Always verify critical destructive actions (e.g. revoking membership, deleting keys) through a double-confirmation modal.
- Input configurations must support "Copy to clipboard" buttons if they represent generated keys visible only once.
