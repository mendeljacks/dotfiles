return {
  {
    "Isrothy/neominimap.nvim",
    lazy = false,
    init = function()
      vim.g.neominimap = {
        auto_enable = true,
        layout = "float",
        float = {
          minimap_width = 10,
          max_minimap_height = 15,
          window_border = "none",
        },
        exclude_filetypes = {
          "help",
          "alpha",
          "dashboard",
          "NvimTree",
          "neo-tree",
          "Trouble",
          "lazy",
          "mason",
        },
        exclude_buftypes = {
          "terminal",
          "nofile",
          "nowrite",
          "quickfix",
          "prompt",
        },
      }
    end,
    keys = {
      { "<leader>um", "<cmd>Neominimap Toggle<cr>", desc = "Toggle Minimap" },
      { "<leader>uM", "<cmd>Neominimap ToggleFocus<cr>", desc = "Toggle Minimap Focus" },
    },
  },
}