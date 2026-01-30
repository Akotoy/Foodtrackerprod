
# Frontend Changelog

## [Unreleased] - Onboarding Updates

### Changed
- **Onboarding Page (`src/pages/Onboarding.tsx`):**
    - **Step 3 (Measurements):**
        - Changed from optional to **mandatory**. Users cannot proceed without filling all fields.
        - Added new fields for limbs: Left Arm, Right Arm, Left Leg, Right Leg.
        - Organized limb inputs into a 2-column grid for better UX.
    - **Step 4 (Goals):**
        - Added a new input field for **"Desired Weight (kg)"** (`targetWeight`).
        - The input field uses `inputMode="decimal"` to show the correct keyboard on mobile.
        - The input is placed *before* the goal selection buttons to establish context.
    - **Validation:**
        - Updated `isStepValid` to strictly check all new measurement fields and the target weight.
        - The "Next/Finish" button is disabled until validation passes.
    - **API Integration:**
        - Updated the `finish` function payload to include:
            - `target_weight`
            - `l_arm`, `r_arm`
            - `l_leg`, `r_leg`
            - `chest_cm`, `waist_cm`, `hips_cm` (mapped from `og`, `ot`, `ob`).

### Added
- **UI/UX:**
    - Improved keyboard handling for numeric inputs using `inputMode`.
    - Visual grouping for left/right measurements.
