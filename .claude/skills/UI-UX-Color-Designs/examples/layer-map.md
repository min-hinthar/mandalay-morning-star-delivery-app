# Layer Map (Bottom → Top)

| Layer | Token | Components | Portal | Pointer-events |
|------:|------:|-----------|--------|----------------|
| Base | --z-base | page content | no | auto |
| Sticky | --z-sticky | header, bottom nav | no | auto |
| Dropdown | --z-dropdown | menus | portal | auto |
| Popover | --z-popover | popovers | portal | auto |
| Tooltip | --z-tooltip | tooltips | portal | none (tooltip box), trigger is auto |
| Backdrop | --z-backdrop | modal backdrop | portal | auto |
| Modal/Sheet | --z-modal | dialogs/sheets/drawers | portal | auto |
| Toast | --z-toast | toasts | portal | auto |
| Decorative | --z-decor | canvas/particles | yes/no | none |
