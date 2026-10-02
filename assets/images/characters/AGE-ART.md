# Age-aware character artwork

Created with the built-in image-generation tool on 2026-09-26. Original artwork is preserved.

## Saved assets

- `woman-ages.png`, edited from `woman.png`.
- `man-ages.png`, edited from `man.png`.
- `neutral-ages.png`, edited from `non-binary.png`; shared by the non-binary and undisclosed options. A separate neutral request failed authentication and was not used.

Each transparent 1536 × 1024 PNG has three full-body age variants. `src/components/age-character.tsx` crops the relevant column and crossfades between variants. Younger is under 35, middle-aged is 35–59, and older is 60+. These are illustrative visual bands, not a prediction or medical classification. Unknown age uses the younger illustration.

## Final prompt (same prompt for each input)

Use case: identity-preserve. Edit target: the supplied full-body character. Create ONE transparent PNG sprite sheet for an app showing this SAME person at THREE ages, arranged in exactly three equally sized columns left to right: age 20, age 48, age 75. Canvas landscape 1536x1024, each column 512x1024. Each full body from hair to shoes fits inside its column with identical standing pose, clothing, scale, face position, feet baseline and centered placement. Keep original identity, complexion, orange/teal clothes, body proportions and realistic colored-pencil rendering. ONLY age the face, neck, hands and hair: smooth youthful left, clearly mature with natural fine lines and a little grey middle, visibly older dignified face with wrinkles, mature jaw and silver hair right. No exaggerated frailty, do not change height or weight. Keep face completely unobscured. True transparent background, no shadows, no panel borders, no labels, no text, no fake checkerboard. This is a production sprite sheet, rigorously align all three bodies so app transitions do not jump.
