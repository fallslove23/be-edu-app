---
description: Comprehensive Design Review and Mobile Optimization Strategy
---

# Mobile Optimization & Design Standardization Strategy

## 1. Design System Audit
- **Dark Mode**: Ensure all components support dark mode using `dark:` variants.
  - *Target*: `TraineeSelector.tsx` (currently lacks dark mode).
  - *Target*: `ResourceSelector.tsx` (verify consistency).
- **Typography**: Verify usage of `Pretendard` font and consistent text sizes.
- **Spacing**: Standardize on `PageContainer` for page layouts and `p-4 sm:p-6` for internal component padding.
- **Rounded Corners**: Ensure `rounded-[2rem]` is used for main cards/modals to match the new aesthetic.

## 2. Mobile Optimization Strategy
### Layout & Grid
- Use `grid-cols-1` by default for mobile, scaling to `md:grid-cols-2` or `lg:grid-cols-3` for larger screens.
- Ensure modals have `w-full mx-4` and `max-h-[90vh]` with `overflow-y-auto`.
- **Action Item**: Check `EnhancedDashboard` grid responsiveness.

### Touch Targets
- Ensure all interactive elements (buttons, inputs, list items) have a minimum height of 44px.
- Add `touch-manipulation` to `PageContainer` to improve touch response.
- Use `active:scale-95` for tactile feedback on buttons.

### Input Handling
- **Font Size**: Ensure input font size is at least 16px on mobile to prevent iOS auto-zoom.
- **Keyboard**: Handle virtual keyboard overlap in modals (use `dvh` units where appropriate).

### Navigation
- Verify the mobile menu (if applicable) or sidebar responsiveness.
- Ensure "Back" buttons or close icons are easily accessible.

## 3. Implementation Plan
1.  **Refactor `TraineeSelector.tsx`**:
    - Add dark mode support.
    - Optimize list item layout for mobile.
2.  **Review `EnhancedDashboard.tsx`**:
    - Verify chart responsiveness on small screens.
    - Check "Active Courses" table horizontal scrolling.
3.  **Global CSS Check**:
    - Verify `index.css` for mobile-specific utility classes.

## 4. Verification
- Test on simulated mobile viewport (375px width).
- Verify dark mode toggle in all refactored components.
