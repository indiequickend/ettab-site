# Phase: Next.js & Tailwind Mobile-First Refactor with Bottom Navigation

## Objective
Refactor the existing Next.js layout and components to use a strict mobile-first Tailwind approach. Replace the mobile view of the main navigation with a fixed, thumb-friendly bottom tab bar, while preserving the desktop layout at the `md` (768px) breakpoint.

## Core Rules for Claude Code
1. **Mobile-First Layout Baseline:** Remove all `max-w-*` limits or desktop styles from the base layout wrapper. Ensure the root elements use vertical stacking (`flex flex-col w-full min-h-screen`) by default.
2. **Implement Next.js Bottom Tab Navigation:**
   - Create or update the navigation layout to include a sticky bottom bar: `fixed bottom-0 left-0 right-0 z-50 h-16 bg-background border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]`.
   - Map 3 to 5 core application routes using Next.js `<Link>` components.
   - Use `lucide-react` icons (or existing project icons) stacked vertically above 10px text labels.
   - Match active states dynamically by reading the current route via Next.js `usePathname()`. Each tab container must maintain a minimum target size of `w-full h-full min-w-[48px] min-h-[48px] flex flex-col items-center justify-center`.
3. **Main Content Padding Adjustments:**
   - Apply a default bottom padding to the main content container (`pb-20 md:pb-0`) so the sticky mobile navigation bar never covers up content or buttons.
   - Ensure horizontal padding defaults to mobile-friendly boundaries (`px-4 md:px-8`).
4. **Desktop Transition Management:**
   - Use `hidden md:flex` or `hidden md:block` on your existing desktop header/sidebar to keep it hidden on mobile viewports.
   - Ensure the bottom tab navigation is strictly hidden on desktop views using the `md:hidden` utility class.

## Execution Steps
1. **Analyze Current Navigation:** Inspect `app/layout.tsx` (or your global layout file) and the primary navigation components to identify how viewports are currently handled.
2. **Inject BottomBar Component:** Create a client-side component (`use client`) for the bottom bar navigation using Next.js hooks for active route styling.
3. **Refactor Page Wrappers:** Search for desktop-first code paradigms and convert them into mobile-first mobile defaults scaled up via `md:` and `lg:` prefixes.
4. **Verify Mobile Functionality:** Verify layout scaling across viewports without breaking server-side rendering (SSR) hydration in Next.js.
