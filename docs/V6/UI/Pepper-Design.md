[1]: https://pepper.framer.website/ "Pepper - Pizza Framer Template"
[2]: https://pepper.framer.website/menu/full-menu "Full Menu - Pepper - Pizza Framer Template"
[3]: https://cultural-design-437414.framer.app/ "Pepper - Pizza Framer Template"

Below is a **Claude-ready UI spec** for recreating the Pepper template’s **Landing page** + **Menu (Full Menu) page** in code (Next.js + Tailwind + Framer Motion). It’s based on the live Pepper demo + the menu page content/structure. ([Pepper][1])

> Note: I can describe structure + behavior very precisely, but I **can’t extract Framer’s exact CSS values** (fonts/hex/radii) from the published build with full fidelity—so I’m giving you the closest “copy” spec + motion timings that match the feel, and you can tweak by screenshot-diff.

---

## Global design system (match the “Pepper” look)

**Overall vibe**

* Bright, playful, high-contrast: **white/off-white canvas**, chunky rounded display type for headings, clean sans for body.
* Primary accent is a **hot pinkish-red** (brand + CTAs).

**Layout grid**

* Desktop container: `max-w-[1120–1200px]`, centered.
* Standard section padding: `py-20` (desktop), `py-14` (tablet), `py-10` (mobile).
* Section header block is usually centered, with a headline + 1–2 lines of supporting copy. ([Pepper][1])

**Core UI primitives**

* **Pill button**: fully rounded, bold text, primary fill (red) on light background; secondary is white/black depending on card background. ([Pepper][1])
* **Cards**: large rounded corners (think 20–28px), soft shadow on hover, images with rounded corners, plenty of whitespace.
* **Chips/Tabs** (menu page): pill-style segmented control with active state. ([Pepper][2])

**Motion language**

* Everything feels “alive” but not chaotic:

  * Scroll-in: fade + slight rise.
  * Hover: subtle lift + shadow.
  * Hero decor: slow floating drift (loop).

---

## Landing page (Home) — exact section order + component breakdown

### 1) Top navigation (global header)

* Left: “Pepper” wordmark.
* Center: links **Home / Menu / Contact**
* Right: CTA button “Remix for FREE” (in your app this becomes your “Order” / “Subscribe”). ([Pepper][1])
* Likely sticky on scroll (implement sticky with blurred bg).

**Mobile**

* Collapse center links into hamburger / sheet menu (Framer templates often do). (If you want exact, do hamburger.)

---

### 2) Hero section

**Content**

* Large headline: **“Your Pizza Party Starts Here!”** (two-line, bold display type). ([Pepper][1])
* Subtext: “Gather your friends…” ([Pepper][1])
* Primary CTA button: “View Our Menu” ([Pepper][1])
* Big hero pizza image anchored near bottom center.

**Decor (important to match Pepper look)**

* Multiple floating ingredient illustrations around the headline:

  * basil, jalapeño, garlic, olives, mushrooms, cherry tomatoes. ([Pepper][1])
* These are **absolutely positioned** within the hero wrapper and animate gently (see motion spec below).

**Layout**

* Hero is centered, with lots of top whitespace.
* Pizza image is partially cropped by the bottom edge (gives “big food” impact).

---

### 3) “Fan Favorites” section

* Title: **Fan Favorites**
* Subtitle: “From classic combinations…” ([Pepper][1])

**Grid**

* Desktop: 3-column grid of pizza cards.
* Tablet: 2 columns.
* Mobile: 1 column.

**Card content**

* Image (pizza).
* Name (e.g., Pepperoni Popper / Garlic Supreme / Margarita Muse). ([Pepper][1])
* Description line (ingredients).
* Bottom row: “Order Now” button + price (“from $14.99” etc.). ([Pepper][1])

**CTA under grid**

* “View full Menu” link/button. ([Pepper][1])

---

### 4) “Hot Pizza, Hotter Deals” section

* Title: **Hot Pizza, Hotter Deals**
* Subtitle: “From family-sized deals…” ([Pepper][1])

**Deal cards**

* Large, colorful panels (notably **red** and **yellow**) with:

  * Deal title (Spicy Duo Deal / Cheese Lovers Pair / Meat Feast Combo etc.)
  * Bullet list of included items
  * “Order Now” pill button
  * Price and “Save $X” badge/text
  * Pizza imagery layered into the bottom/side of the card. ([Cultural Design][3])

**Layout**

* Desktop: 2-column grid of big deal cards.
* Mobile: stacked.

---

### 5) “Save Room for Dessert!” section

* Title: **Save Room for Dessert!**
* Subtitle: dessert teaser copy. ([Pepper][1])
* Dessert cards similar to Fan Favorites but simpler:

  * image, dessert name (Nutella Pizza, Classic Cannoli, Tiramisu etc.), short ingredient line, Order button, price. ([Pepper][1])

---

### 6) “Find Your Nearest Pizza Spot” section

* Title: **Find Your Nearest Pizza Spot**
* Subtitle: “Locate our stores…” ([Pepper][1])

**City cards**

* Repeating city tiles: New York, London, Amsterdam, Berlin, Bucharest…
* Each has an image, city name, and “View map” action. ([Pepper][1])
* Grid: 3–4 columns desktop, 2 tablet, 1 mobile.

**Info accordion beneath**

* Accordion items:

  * “Delivery Zones”
  * “Delivery Methods & Fees”
  * “Pickup Info” (typo appears as “Pickp Info” in extracted text—keep proper spelling in your clone). ([Pepper][1])

---

### 7) Testimonials slider section

* This is a key “premium” interaction.
* Contains multiple testimonials with:

  * Quote
  * Person name
  * Title/outlet (e.g., “Food Blogger, Berlin Bites”)
  * Avatar image
* Has **back/next arrow controls**. ([Pepper][1])

**Layout (likely)**

* Desktop split:

  * Left: headline/intro panel (sometimes with a photo background)
  * Right: carousel card area
* Mobile: stacked.

---

### 8) Newsletter CTA section

* Title: **Delicious Deals, Just for You**
* Subtitle: newsletter offer line
* Email input + “Submit” button. ([Pepper][1])

---

### 9) Footer

* Address + emails + hours
* Columns: MENU (Home / Our Menu / Contact Us), USEFUL (policies), SOCIAL links. ([Pepper][1])

---

## Menu page (Full Menu) — exact structure

Route in Pepper demo: **/menu/full-menu**. ([Pepper][2])

### 1) Top navigation (same as landing)

Home / Menu / Contact + CTA. ([Pepper][2])

### 2) Category tabs (segmented control)

Tabs shown (exact labels):

* **Full Menu**
* **Pizza**
* **Pasta**
* **Sides**
* **Deserts** (typo in template; decide if you want to keep it or correct to “Desserts”)
* **Drinks** ([Pepper][2])

Behavior:

* Clicking a tab filters the list to that category.
* On mobile, tabs should scroll horizontally.

### 3) Page header

* H1: **Our Menu**
* Long intro paragraph about ingredients / “moments worth remembering”. ([Pepper][2])

### 4) Menu item cards (CMS-style entries)

Each entry includes:

* Item image
* Item name (e.g., Sparkling Water, Classic Cola, Peach Iced Tea…)
* **Allergens**
* **Nutritional Info** list (Calories, Fat, Carbs, Protein)
* **Ingredients** line
* “Order Now” button + “from $X.XX” ([Pepper][2])

**Layout recommendation to match template**

* Desktop: 2-column grid of item cards
* Mobile: 1 column
* Cards are tall because they include nutrition + ingredients.

---

## Motion/animation spec (what to tell Claude to implement)

### Hero floating ingredients (signature look)

Implement 8–14 absolutely positioned ingredient SVG/PNGs.

* Each one:

  * `animate: { y: [0, -10, 0], rotate: [0, 2, 0] }`
  * `transition: { duration: 6–12, repeat: Infinity, ease: "easeInOut", delay: staggered }`
* Some ingredients also drift slightly in X: `[0, 6, 0]`.
* Add subtle shadow + slight blurless crisp look. ([Pepper][1])

### Scroll reveal (consistent across sections)

For section headers + grids:

* initial: `opacity: 0, y: 18`
* inView: `opacity: 1, y: 0`
* duration: `0.55–0.7`, ease: `easeOut`
* stagger children by `0.06–0.1`

### Card hover

* `whileHover: { y: -4, scale: 1.01 }`
* transition: `0.18–0.22`
* Shadow increases + image slightly zooms (`scale 1.03`) inside masked rounded container.

### Deal cards

* On hover: tiny scale, and the pizza image inside slides up 4–8px (feels “juicy”).

### Testimonials carousel

* Slide transition: `x` translate with spring (`stiffness ~ 260`, `damping ~ 28`)
* Arrow buttons animate on hover (scale 1.05) and on tap (scale 0.98). ([Pepper][1])

### Tabs on Menu page

* Active pill animates background “wipe” (Framer-ish):

  * Use a shared `layoutId` motion div behind active label.

---

## Paste-ready prompt for Claude (you can copy as-is)

```text
You are coding a pixel-close clone of the Framer “Pepper” pizza template landing page + /menu/full-menu page.

Tech: Next.js App Router, TypeScript, Tailwind, Framer Motion. No external UI kit. Build reusable components.

MATCH THIS EXACT PAGE STRUCTURE:

LANDING PAGE (/):
1) Sticky top nav: Pepper wordmark left; Home/Menu/Contact center; pill CTA button right. Mobile uses hamburger sheet.
2) Hero: centered H1 “Your Pizza Party Starts Here!” + short paragraph + primary pill button “View Our Menu”. Large pizza image anchored bottom center. Add ~10 floating ingredient images around headline (basil/jalapeno/garlic/olives/mushrooms/tomatoes) with slow looping drift animation.
3) Fan Favorites: section header + 3-up grid of pizza cards. Each card: image, name, ingredient description, “Order Now” button + “from $X.XX”.
4) Hot Pizza, Hotter Deals: 2-up grid of large colorful deal cards (red + yellow variants). Each: deal title, bullet list, order button, price + “Save $X”, pizza image layered inside card.
5) Save Room for Dessert: dessert cards similar to favorites.
6) Find Your Nearest Pizza Spot: grid of city cards (image, city name, “View map”). Under it: accordion with Delivery Zones / Delivery Methods & Fees / Pickup Info.
7) Testimonials: split layout with carousel + back/next arrow controls; each slide includes quote, avatar, name, role.
8) Newsletter CTA: email field + Submit, with image and headline “Delicious Deals, Just for You”.
9) Footer: address + emails + hours; link columns MENU/USEFUL/SOCIAL.

MENU PAGE (/menu/full-menu):
1) Same sticky nav.
2) Segmented pill tabs: Full Menu, Pizza, Pasta, Sides, Desserts (template typo “Deserts” optional), Drinks. Tabs filter items.
3) Page header: “Our Menu” + long intro paragraph.
4) 2-col grid of item cards. Each card: image, title, Allergens, Nutritional Info list, Ingredients, Order Now button + “from $X.XX”.

ANIMATION RULES:
- Scroll reveal on each section: opacity 0→1 + y 18→0, 0.6s easeOut, stagger children.
- Card hover: y -4, scale 1.01, shadow increase, image zoom 1.03.
- Hero ingredients: loop y drift ±10px and rotate ±2deg, varied durations 6–12s, easeInOut, repeat infinite.
- Tabs: animated active pill using Framer Motion layoutId.
- Testimonials carousel: spring slide with arrows.

Deliver:
- Components: Header, Hero, SectionHeader, ProductCard, DealCard, DessertCard, CityCard, Accordion, TestimonialCarousel, Newsletter, Footer, MenuTabs, MenuItemCard.
- Use real responsive breakpoints. Keep spacing generous and rounded corners large (20–28px).
- Use a playful rounded display font for headings and a clean sans for body (load via next/font).
```

---

[1]: https://pepper.framer.website/ "Pepper - Pizza Framer Template"
[2]: https://pepper.framer.website/menu/full-menu "Full Menu - Pepper - Pizza Framer Template"
[3]: https://cultural-design-437414.framer.app/ "Pepper - Pizza Framer Template"

{
  "$schema": "https://design-tokens.github.io/community-group/format/#schema",
  "meta": {
    "name": "Pepper (Framer template) — extracted tokens",
    "source": "https://cultural-design-437414.framer.app/",
    "notes": "Heuristic tokenization based on visual inspection of the Pepper template screenshots and typical Framer component defaults.",
    "generated_at_utc": "2026-01-19T10:04:08Z"
  },
  "color": {
    "bg": {
      "base": { "value": "#FFFFFF" },
      "surface": { "value": "#FFF9F5" },
      "surfaceMuted": { "value": "#F7F2EE" },
      "card": { "value": "#FFFFFF" },
      "stroke": { "value": "#E8E1DC" }
    },
    "text": {
      "primary": { "value": "#111111" },
      "secondary": { "value": "#3B3B3B" },
      "muted": { "value": "#6B6B6B" },
      "inverse": { "value": "#FFFFFF" }
    },
    "brand": {
      "red": { "value": "#E21B3C" },
      "redHover": { "value": "#C81633" },
      "yellow": { "value": "#F6C445" },
      "yellowHover": { "value": "#E6B238" },
      "green": { "value": "#2FB36E" },
      "greenHover": { "value": "#24965C" }
    },
    "status": {
      "success": { "value": "#2FB36E" },
      "warning": { "value": "#F6C445" },
      "danger": { "value": "#E21B3C" }
    },
    "overlay": { "scrim": { "value": "rgba(0,0,0,0.45)" } }
  },
  "font": {
    "family": {
      "sans": {
        "value": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\""
      },
      "display": { "value": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" }
    },
    "weight": {
      "regular": { "value": 400 },
      "medium": { "value": 500 },
      "semibold": { "value": 600 },
      "bold": { "value": 700 },
      "black": { "value": 800 }
    },
    "size": {
      "xs": { "value": "12px" },
      "sm": { "value": "14px" },
      "md": { "value": "16px" },
      "lg": { "value": "18px" },
      "xl": { "value": "20px" },
      "2xl": { "value": "24px" },
      "3xl": { "value": "30px" },
      "4xl": { "value": "36px" },
      "5xl": { "value": "44px" },
      "6xl": { "value": "56px" }
    },
    "lineHeight": {
      "tight": { "value": 1.1 },
      "snug": { "value": 1.25 },
      "normal": { "value": 1.5 },
      "relaxed": { "value": 1.65 }
    },
    "letterSpacing": {
      "tight": { "value": "-0.02em" },
      "normal": { "value": "0em" },
      "wide": { "value": "0.02em" }
    }
  },
  "space": {
    "0": { "value": "0px" },
    "1": { "value": "4px" },
    "2": { "value": "8px" },
    "3": { "value": "12px" },
    "4": { "value": "16px" },
    "5": { "value": "20px" },
    "6": { "value": "24px" },
    "7": { "value": "28px" },
    "8": { "value": "32px" },
    "10": { "value": "40px" },
    "12": { "value": "48px" },
    "14": { "value": "56px" },
    "16": { "value": "64px" }
  },
  "radius": {
    "xs": { "value": "8px" },
    "sm": { "value": "12px" },
    "md": { "value": "16px" },
    "lg": { "value": "20px" },
    "xl": { "value": "24px" },
    "2xl": { "value": "28px" },
    "pill": { "value": "9999px" }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px rgba(17,17,17,0.06)" },
    "md": { "value": "0 8px 20px rgba(17,17,17,0.10)" },
    "lg": { "value": "0 16px 40px rgba(17,17,17,0.14)" },
    "soft": { "value": "0 12px 28px rgba(17,17,17,0.08)" }
  },
  "borderWidth": { "hairline": { "value": "1px" }, "strong": { "value": "2px" } },
  "layout": {
    "container": { "maxWidth": { "value": "1200px" }, "gutter": { "value": "24px" } },
    "grid": {
      "columnsDesktop": { "value": 12 },
      "columnsMobile": { "value": 4 },
      "gapDesktop": { "value": "24px" },
      "gapMobile": { "value": "16px" }
    },
    "breakpoint": {
      "sm": { "value": "640px" },
      "md": { "value": "768px" },
      "lg": { "value": "1024px" },
      "xl": { "value": "1280px" }
    }
  },
  "motion": {
    "duration": {
      "instant": { "value": "0ms" },
      "fast": { "value": "150ms" },
      "base": { "value": "220ms" },
      "slow": { "value": "360ms" }
    },
    "easing": {
      "standard": { "value": "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      "enter": { "value": "cubic-bezier(0.0, 0.0, 0.2, 1)" },
      "exit": { "value": "cubic-bezier(0.4, 0.0, 1, 1)" }
    },
    "spring": {
      "gentle": { "value": { "type": "spring", "stiffness": 380, "damping": 34, "mass": 0.9 } },
      "snappy": { "value": { "type": "spring", "stiffness": 520, "damping": 38, "mass": 0.9 } }
    }
  },
  "component": {
    "button": {
      "height": { "value": "44px" },
      "paddingX": { "value": "{space.6.value}" },
      "radius": { "value": "{radius.pill.value}" },
      "fontSize": { "value": "{font.size.md.value}" },
      "fontWeight": { "value": "{font.weight.semibold.value}" },
      "shadow": { "value": "{shadow.sm.value}" },
      "primary": {
        "bg": { "value": "{color.brand.red.value}" },
        "bgHover": { "value": "{color.brand.redHover.value}" },
        "fg": { "value": "{color.text.inverse.value}" }
      },
      "secondary": {
        "bg": { "value": "{color.bg.card.value}" },
        "fg": { "value": "{color.text.primary.value}" },
        "border": { "value": "{color.bg.stroke.value}" }
      }
    },
    "card": {
      "radius": { "value": "{radius.xl.value}" },
      "padding": { "value": "{space.8.value}" },
      "border": { "value": "{color.bg.stroke.value}" },
      "shadow": { "value": "{shadow.soft.value}" }
    },
    "nav": {
      "height": { "value": "72px" },
      "radius": { "value": "{radius.pill.value}" },
      "bg": { "value": "rgba(255,255,255,0.80)" },
      "backdropBlur": { "value": "12px" },
      "border": { "value": "rgba(17,17,17,0.08)" }
    }
  }
}
