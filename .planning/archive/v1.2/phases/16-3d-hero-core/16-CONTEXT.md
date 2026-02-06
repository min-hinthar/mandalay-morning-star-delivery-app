# Phase 16: 3D Hero Core - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive 3D food model in the homepage hero section. Users can see a 3D dish, rotate it by dragging, and zoom with pinch/scroll. Low-end devices get a 2D fallback. Advanced features (auto-rotate, physics, carousel, particles on interaction) belong to Phase 17.

</domain>

<decisions>
## Implementation Decisions

### 3D Model Presentation
- **Subject:** Rice bowl / curry — signature Morning Star dish
- **Style:** Photorealistic — looks like real food photography in 3D
- **Position:** Centered hero focus, model takes center stage
- **Size:** Large & dominant — takes up most of hero height
- **Background:** Abstract floating shapes around the model (geometric accents, glow effects)
- **Effects:** Steam rising from dish + ambient particles (floating spices/herbs)

### Interaction Feel
- **Drag rotation:** Smooth with inertia — has momentum, continues spinning after release
- **Rotation constraints:** Limited angles — can tilt slightly but snaps back to "right side up"
- **Zoom range:** Moderate — get closer but not extreme detail view
- **Feedback:** Subtle glow/highlight when touched or hovered

### Loading Experience
- **Loading state:** Branded spinner — Morning Star logo or bowl animation
- **Reveal animation:** Scale up with spring — starts small, grows to full size
- **Error handling:** Graceful fallback to static 2D image
- **Load priority:** Background load — page renders immediately, 3D loads progressively

### Mobile Fallback
- **Trigger:** Device capability detection (low GPU/WebGL score)
- **Fallback image:** Same dish as high-quality photo
- **2D animation:** Subtle float/parallax on scroll or mouse move

### Claude's Discretion
- Lighting setup (studio, warm ambient, or dramatic — whatever works best with photorealistic style)
- Whether to offer a settings toggle for users to prefer 2D on capable devices
- Exact GPU capability detection thresholds
- Specific spring physics parameters for zoom/rotation

</decisions>

<specifics>
## Specific Ideas

- Model should feel like a hero product showcase — premium food photography brought to 3D
- Steam and floating particles add "alive" feeling without being distracting
- Inertia on drag makes interaction feel natural and playful
- Scale-up reveal with spring creates a "pop" moment when 3D loads

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

(Auto-rotate, physics momentum, carousel between dishes, and particle effects on interaction are already scoped to Phase 17)

</deferred>

---

*Phase: 16-3d-hero-core*
*Context gathered: 2026-01-24*
