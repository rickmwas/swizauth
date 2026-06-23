# UI Rules and Guidelines: TSAUTH

This document defines user experience standards, form validation rules, table behaviors, and screen transitions based on **Shadcn UI** specifications.

---

## 1. Authentication Flows

### Layout & Entry
- **Screen Layout:** Centered single-column container or Split-screen layout. For split-screen, the left panel features premium gradients and product value propositions, while the right panel handles the clean auth form.
- **Micro-Animations:** Use subtle slide-up and fade-in states for form panels when mounting.
- **Brand Consistency:** Display the TSAUTH logo explicitly at the top of each authentication card.

### Input Elements & Feedback
- **Field Autofocus:** The first input field (e.g., Email or Username) must autofocus on load.
- **Password Visibility Toggle:** All password input fields must feature an eye icon to show/hide the password.
- **Locked Accounts:** If `error.code === "ACCOUNT_LOCKED"`, display an explicitly styled alert banner with contact links, instead of a simple inline error.
- **MFA Verification Steps:** Use individual 6-digit input box elements (using `OTPInput` component) with automatic jump to the next input cell.

---

## 2. Form Behaviors

### Form Submission lifecycle
- **Disable State:** On submit, disable the submit button and all form input elements.
- **Loading Indicators:** Show a spinner inside the submit button and change the text (e.g., `Registering...` instead of `Register`).
- **Inline Validation:** Validate fields using `zod` on blurring the input fields, showing real-time feedback before submission.
- **Error Messages:** Explicitly tie error states to input border highlights (e.g. red outlines) and render a descriptive error message beneath the field.

---

## 3. Data Tables (Dashboard lists)
Used for listing Users, Members, Applications, and Audit Logs.

### Searching & Filtering
- **Frictionless Search:** Provide an instant text search input at the top-left of the table header. Search must execute on-the-fly with a 300ms debounce.
- **No Results State:** If search matches nothing, display a custom SVG empty state panel with a "Clear search parameters" action button.

### Pagination & Scrolling
- **Control Layout:** Render a pagination control block at the bottom right indicating:
  - Current active page number.
  - Total count of entries matching filters.
  - Dropdown to configure page limit (10, 20, 50 rows).
- **Infinite loading alternative:** Only use pagination buttons. Do not implement infinite scroll on data tables.

### User Interface Feedback
- **Loading State:** Show a skeleton loader block mimicking the rows while fetching, instead of a blank screen.
- **Action Triggers:** Wrap row specific actions (e.g., Edit, Delete, Revoke) in a `DropdownMenu` component positioned in the last column.
- **Confirmations:** Destructive actions (such as deleting a user or revoking an API key) must trigger a `Dialog` confirmation modal requesting double confirmation before execution.
