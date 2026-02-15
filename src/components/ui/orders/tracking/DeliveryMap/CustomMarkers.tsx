/**
 * CustomMarkers - Branded marker content for AdvancedMarkerElement
 *
 * Creates raw DOM elements (not React) for Google Maps AdvancedMarkerElement content.
 * Brand colors: saffron (#D4A017) vehicle, jade (#2E8B57) destination, warm red (#C75050) restaurant.
 */

// ---- Restaurant Marker ----
export function createRestaurantMarkerContent(): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText =
    "width:40px;height:48px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));";
  container.innerHTML = `
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="#C75050"/>
      <circle cx="20" cy="18" r="12" fill="white" opacity="0.2"/>
      <g transform="translate(12,10)">
        <rect x="2" y="4" width="2" height="12" rx="1" fill="white"/>
        <rect x="6" y="0" width="2" height="16" rx="1" fill="white"/>
        <rect x="10" y="4" width="2" height="12" rx="1" fill="white"/>
        <rect x="1" y="14" width="12" height="2" rx="1" fill="white"/>
      </g>
    </svg>
  `;
  return container;
}

// ---- Vehicle Marker ----
export function createVehicleMarkerContent(
  heading: number | null,
  isStale: boolean
): HTMLElement {
  const rotation = heading ?? 0;
  const opacity = isStale ? "0.5" : "1";
  const container = document.createElement("div");
  container.style.cssText = `width:36px;height:36px;position:relative;cursor:pointer;opacity:${opacity};transition:opacity 0.3s ease;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));transform:rotate(${rotation}deg);`;
  container.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" fill="#D4A017"/>
      <circle cx="18" cy="18" r="14" fill="white" opacity="0.15"/>
      <g transform="translate(8,7)">
        <path d="M10 0L18 8L14 8L14 20L6 20L6 8L2 8Z" fill="white" stroke="#D4A017" stroke-width="0.5"/>
      </g>
    </svg>
  `;
  return container;
}

// ---- Destination Marker ----
export function createDestinationMarkerContent(): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText =
    "width:40px;height:48px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));";
  container.innerHTML = `
    <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="#2E8B57"/>
      <circle cx="20" cy="18" r="12" fill="white" opacity="0.2"/>
      <g transform="translate(11,9)">
        <path d="M9 0L18 7L18 18H0V7L9 0Z" fill="white"/>
        <rect x="7" y="11" width="4" height="7" fill="#2E8B57"/>
      </g>
    </svg>
  `;
  return container;
}

// ---- Stale Location Badge ----
export function createStaleBadgeContent(minutesAgo: number): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;top:-8px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.75);color:white;font-size:10px;padding:2px 6px;border-radius:4px;pointer-events:none;z-index:1;";
  container.textContent = `${minutesAgo}m ago`;
  return container;
}
