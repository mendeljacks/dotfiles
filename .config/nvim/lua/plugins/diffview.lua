-- Diffview: git diff viewer with side-by-side panels
return {
  "sindrets/diffview.nvim",
  cmd = { "DiffviewOpen", "DiffviewFileHistory", "DiffviewClose" },
  keys = {
    {
      "<leader>gd",
      function()
        require("diffview").open()
      end,
      desc = "Diffview: Open",
    },
    {
      "<leader>gdb",
      function()
        local branch = vim.fn.input("Compare with branch: ")
        if branch and branch ~= "" then
          require("diffview").open(branch)
        end
      end,
      desc = "Diffview: Compare branch",
    },
    {
      "<leader>gdc",
      function()
        require("diffview").close()
      end,
      desc = "Diffview: Close",
    },
    {
      "<leader>gdh",
      function()
        require("diffview").toggle("file_history")
      end,
      desc = "Diffview: File history",
    },
  },
  config = function()
    -- Enable scroll sync in diff panels via scrollbind
    vim.api.nvim_create_autocmd("User", {
      pattern = "DiffviewViewOpened",
      callback = function()
        vim.defer_fn(function()
          for _, win in ipairs(vim.api.nvim_list_wins()) do
            vim.wo[win].scrollbind = true
          end
        end, 100)
      end,
    })
  end,
}
