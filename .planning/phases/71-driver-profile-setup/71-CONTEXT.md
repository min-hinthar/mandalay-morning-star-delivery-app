# Phase 71: Driver Profile Setup - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Drivers can manage their profile information (name, phone, vehicle type, license plate) and upload a profile photo from within the app. Dashboard shows a completeness indicator for missing fields. This phase does NOT include earnings, availability/scheduling, or walkthrough features (those are Phases 72-74).

</domain>

<decisions>
## Implementation Decisions

### Profile Form Layout
- Vehicle types: 3 fixed options — Motorcycle, Car, Van
- License plate: No format validation — accept any text
- Name: Editable anytime (not locked after onboarding)
- Email: Displayed as read-only field (login identity)
- Driver status: Show active/deactivated as a read-only badge on profile page
- Save feedback: Toast notification ("Profile updated")
- Unsaved changes: Warn before navigating away with unsaved edits
- Form style: Glassmorphism card styling matching the rest of the app
- Member since: Show account creation date on profile page

### Photo Upload
- Preview before upload: Show selected photo in preview area before confirming
- Circular crop tool: Let driver crop to a circle for avatar use
- Camera and gallery: Support both camera capture and gallery selection
- Upload progress: Show progress bar/spinner during upload
- Client-side compression: Compress before upload to save bandwidth on Myanmar mobile networks
- File types accepted: JPEG, PNG, WebP, HEIC (modern phone formats)
- No-photo placeholder: Initials avatar (driver's initials in colored circle)
- Old photos: Delete from Supabase Storage when replaced (no version history)

### Completeness Indicator
- Type: Checklist with action labels ("Add your name", "Upload a photo", etc.)
- Items tracked: Name + Phone + Vehicle type + License plate + Photo (all 5)
- Placement: Top of driver dashboard
- Percentage: Show "3/5 complete" alongside checklist
- Deep linking: Clicking incomplete item navigates to profile page and highlights that field
- Done styling: Green checkmark AND strikethrough text for completed items
- Color progression: Card border/accent shifts from amber/yellow to green as items complete
- Card title: Plain descriptive ("Complete your profile")
- Completion celebration: Animated celebration (confetti/checkmark bounce) when 100%
- Duration: Celebration shows for 3 seconds, then card auto-hides
- Not dismissible: Checklist persists until all items are complete
- Not reappearing: Once hidden after completion, stays hidden

### Profile Display & Identity
- Avatar locations: Both header area AND bottom nav tab on driver pages
- Dashboard greeting: Static "Hello, [Name]!" (not time-of-day aware)
- Header avatar tap: Opens dropdown menu (Claude determines menu items)
- Admin driver list: Show small avatar next to each driver's name
- Admin avatar click: Navigate to driver detail/edit page
- Admin edit: Admin can modify driver profile fields from admin panel
- Customer delivery tracking: Show driver name, photo, phone number, vehicle type, and license plate
- Customer no-photo fallback: Generic driver icon (not initials — different from driver-facing)
- Driver phone to customers: Visible phone number for direct contact

### Claude's Discretion
- Form page structure (dedicated page vs inline, field grouping)
- Profile page navigation access (bottom nav tab vs settings/menu icon)
- Save pattern (explicit Save button vs auto-save)
- Validation error display pattern (inline vs toast)
- Required vs optional field designation
- Phone number format enforcement
- Burmese text input support
- Profile page header design (profile card + form vs form only)
- Reset to onboarding values option
- Crop modal implementation (modal vs inline, pinch-to-zoom)
- Photo remove option (remove + replace vs replace only)
- Storage bucket access level (public vs signed URLs)
- Upload timing (on crop confirm vs with form save)
- File size limit
- Checklist real-time update behavior
- Dropdown menu items
- Driver-to-driver profile visibility
- Data model (existing drivers table vs separate profile table)

</decisions>

<specifics>
## Specific Ideas

- Initials avatar as default (not generic icon) — but for customer-facing, use generic driver icon instead
- Circular crop tool specifically for avatar-style photos
- Checklist items use action-oriented labels: "Add your name", "Upload a photo", "Set vehicle type", "Add license plate", "Upload a photo"
- Color progression from amber to green on the checklist card border matches the app's visual language
- Animated celebration at 100% completion — fits the app's "delightfully alive with motion" core value
- Vehicle info shown to customers aids driver identification for delivery handoff
- Admin can edit driver profiles — useful for corrections without requiring driver action

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 71-driver-profile-setup*
*Context gathered: 2026-02-18*
