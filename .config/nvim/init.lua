-- Set git dir and worktree location if we are in home directory so vim fugitive works
if vim.fn.getcwd() == vim.fn.expand("~") then
  vim.env.GIT_DIR = vim.fn.expand("~/.dotfiles")
  vim.env.GIT_WORK_TREE = vim.fn.expand("~")
end

-- bootstrap lazy.nvim, LazyVim and your plugins
require("config.lazy")

vim.env.PATH = vim.env.PATH .. ":/home/pc/.local/bin"
