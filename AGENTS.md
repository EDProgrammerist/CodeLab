# CodeLab contributor guidance

## Frontend design and assets

- Follow [the design reference](docs/DESIGN.md) and [frontend architecture](frontend/PROJECT_STRUCTURE.md).
- Store landing-page images and other imported visual assets in the existing [frontend/src/assets/](frontend/src/assets/) directory. Import them using `@/assets/?`; do not create a second assets directory.
- Generate original editorial illustrations with the image model when new landing-page imagery is needed. Match each scene to its content and the established black-ink, white-paper, coral, blue, and amber palette.
- The current generated set is `landing-classroom.png`, `landing-student.png`, `landing-instructor.png`, and `landing-progress.png`. Generation details are in [the asset notes](frontend/src/assets/landing-illustrations.md).
- Keep real technology marks as licensed SVG assets; do not replace them with generated logos. Keep text and interactive interface previews in accessible HTML.
- Preserve responsive layouts, meaningful image alternatives, and readable contrast. Use empty alt text for decorative illustrations repeated by adjacent copy.
- Do not change sign-in/signup styling as part of landing-page work, or restructure directories without approval.

## Validation

Run `.\infra\app\frontend.ps1 check` for frontend changes and the relevant Playwright tests. Review illustration framing on desktop and mobile.
