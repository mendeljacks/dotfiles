-- vim-conflict-marker: Better conflict resolution with shortcuts
return {
  "rhysd/conflict-marker.vim",
  lazy = false,
  config = function()
    -- Custom keymaps - intuitive: o=ours, t=theirs, b=both
    vim.keymap.set("n", "<leader>x]", "<plug>(conflict-marker-next-hunk)", { desc = "Next conflict" })
    vim.keymap.set("n", "<leader>x[", "<plug>(conflict-marker-prev-hunk)", { desc = "Previous conflict" })
    vim.keymap.set("n", "<leader>xi", "<plug>(conflict-marker-ourselves)", { desc = "Take local" })
    vim.keymap.set("n", "<leader>xo", "<plug>(conflict-marker-themselves)", { desc = "Take remote" })
    vim.keymap.set("n", "<leader>xb", "<plug>(conflict-marker-both)", { desc = "Take both" })
    vim.keymap.set("n", "<leader>x3", "<cmd>Gvdiffsplit!<CR>", { desc = "3-way diff split" })

    -- Custom highlighting - purple background, preserve syntax highlighting
    -- Only set background, let fg/syntax highlighting remain intact
    local function set_bg_only(name, bg)
      vim.api.nvim_set_hl(0, name, { bg = bg, ctermbg = nil, link = "", default = false })
    end

    -- Conflict markers - purple background
    set_bg_only("ConflictMarkerOurs", "#3d2d5a")
    set_bg_only("ConflictMarkerTheirs", "#3d2d5a")
    set_bg_only("ConflictMarkerCommonAncestorsOurs", "#3d2d5a")
    set_bg_only("ConflictMarkerCommonAncestorsTheirs", "#3d2d5a")
    set_bg_only("ConflictMarkerCommonAncestorsBase", "#3d2d5a")
    set_bg_only("ConflictMarkerEnd", "#3d2d5a")
    set_bg_only("ConflictMarkerBegin", "#3d2d5a")
    set_bg_only("ConflictMarkerSeparator", "#3d2d5a")
    set_bg_only("ConflictMarkerNonConflict", "#3d2d5a")

    -- Diff view - proper colors (greens, reds, blues) instead of all-purple
    -- ConflictMarker* groups above stay purple for merge conflict resolution
    -- Clear links so we only set bg, preserve original syntax colors
    vim.cmd([[
      highlight! link DiffAdd NONE
      highlight! link DiffDelete NONE
      highlight! link DiffChange NONE
      highlight! link DiffText NONE
    ]])

    vim.api.nvim_set_hl(0, "DiffAdd", { bg = "#1e2e1e", default = false })
    vim.api.nvim_set_hl(0, "DiffDelete", { bg = "#2e1e1e", default = false })
    vim.api.nvim_set_hl(0, "DiffChange", { bg = "#1e2433", default = false })
    vim.api.nvim_set_hl(0, "DiffText", { bg = "#2e2030", default = false })
  end,
}
