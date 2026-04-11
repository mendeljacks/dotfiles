-- Override <leader>w: save instead of LazyVim's window menu
return {
  {
    "LazyVim/LazyVim",
    keys = {
      -- Remove LazyVim's <leader>w window mappings
      { "<leader>w", mode = { "n", "v" }, ":w<cr>", desc = "Save file", remap = true },
    },
  },
  {
    "folke/which-key.nvim",
    opts = {
      spec = {
        { "<leader>w", group = "save", icon = "󰆓 " },
      { "<leader>L", ":so ~/.config/nvim/init.lua<cr>", desc = "Source init.lua", icon = "󰢪 " },
      },
    },
  },
}