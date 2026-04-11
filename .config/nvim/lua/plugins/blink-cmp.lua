-- Make Enter behave like VSCode: only confirm a completion if you explicitly
-- selected an item (via arrow keys / C-n / C-p). Otherwise Enter just inserts
-- a newline as normal.
return {
  "saghen/blink.cmp",
  opts = {
    completion = {
      list = {
        selection = {
          -- Don't auto-select the first item when the menu opens.
          -- With the "enter" preset, <CR> = { "accept", "fallback" }:
          --   • nothing selected → accept is a no-op → fallback inserts newline ✓
          --   • you pressed ↓/C-n to pick an item → accept confirms it ✓
          preselect = false,
        },
      },
    },
  },
}
