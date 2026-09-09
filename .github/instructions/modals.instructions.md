---
applyTo: 'apps/client/src/components/Modal.tsx'
---

Use the shared `<Modal />` shell for all dialogs. It renders a native `<dialog>` with the app surface, rounded corners,
padding, and backdrop styling from `apps/client/src/components/Modal.module.css`.

Modal content should be a single wrapper element inside the shell, usually a `<div>` with a `.container` class from the
modal's own module CSS. Keep the content self-contained: title/header, body, and actions should live inside the modal
component, not in the shell. Modal can be closed only by pressing the Esc key or direct calling `closeModal()`.

Place reusable modals in `apps/client/src/components/modals/`. Place page-specific modals in
`apps/client/src/pages/{Page}/components/modals/`.

Styling guidance:

- Define modal layout in a colocated `*.module.css` file.
- Keep width and spacing in the modal's own container styles; the shared shell only handles the dialog frame.
- Use flex/grid for internal layout and keep action rows aligned with existing modal patterns.
- Do not use inline styles or global class names.
