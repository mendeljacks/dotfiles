-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Move lines up/down with Ctrl+j / Ctrl+k
vim.keymap.set("n", "<C-j>", ":m .+1<CR>==", { desc = "Move line down" })
vim.keymap.set("n", "<C-k>", ":m .-2<CR>==", { desc = "Move line up" })
vim.keymap.set("v", "<C-j>", ":m '>+1<CR>gv=gv", { desc = "Move selection down" })
vim.keymap.set("v", "<C-k>", ":m '<-2<CR>gv=gv", { desc = "Move selection up" })

-- Override <leader>w to save instead of window menu
vim.keymap.set({ "n", "v" }, "<leader>w", ":w<cr>", { desc = "Save file", remap = true })

-- Override <leader>L to source init.lua instead of changelog
vim.keymap.set("n", "<leader>L", ":so ~/.config/nvim/init.lua<cr>", { desc = "Source init.lua", remap = true })

-- Launcher: Neo-tree + 1 buffer + 2 terminals (cd'd to frontend/backend)
vim.keymap.set("n", "<leader>wW", function()
  -- Open Neo-tree on the left
  vim.cmd("Neotree position=left")
  
  -- Focus the right (buffer) area
  vim.cmd("wincmd l")
  
  -- Create bottom split for frontend terminal
  vim.cmd("below split")
  vim.cmd("resize 12")
  vim.cmd("term bash -c 'cd ./frontend && exec bash'")
  vim.cmd("setlocal nobuflisted")
  vim.t.term_frontend_buf = vim.fn.bufnr()
  vim.t.term_frontend_win = vim.fn.win_getid()
  vim.cmd("startinsert")
  
  -- Split vertically for backend terminal
  vim.cmd("below vnew")
  vim.cmd("term bash -c 'cd ./backend && exec bash'")
  vim.cmd("setlocal nobuflisted")
  vim.t.term_backend_buf = vim.fn.bufnr()
  vim.t.term_backend_win = vim.fn.win_getid()
  vim.cmd("startinsert")
  
  -- Go back to main buffer window
  vim.cmd("wincmd h")
end, { desc = "Open workspace: Neo-tree + buffer + 2 terminals" })

-- Toggle terminals visibility (keeps processes alive)
vim.keymap.set("n", "<leader>wt", function()
  local frontend_win = vim.t.term_frontend_win
  local backend_win = vim.t.term_backend_win
  
  if frontend_win and backend_win and 
     vim.api.nvim_win_is_valid(frontend_win) and 
     vim.api.nvim_win_is_valid(backend_win) then
    -- Hide: close terminal windows
    vim.api.nvim_win_hide(frontend_win)
    vim.api.nvim_win_hide(backend_win)
    vim.t.term_frontend_win = nil
    vim.t.term_backend_win = nil
  else
    -- Show: recreate windows for existing buffers
    local frontend_buf = vim.t.term_frontend_buf
    local backend_buf = vim.t.term_backend_buf
    
    if not frontend_buf or not vim.api.nvim_buf_is_valid(frontend_buf) then return end
    if not backend_buf or not vim.api.nvim_buf_is_valid(backend_buf) then return end
    
    -- Create windows and switch to buffers
    vim.cmd("below split")
    vim.cmd("b " .. frontend_buf)
    vim.api.nvim_win_set_height(0, 12)
    local win1 = vim.api.nvim_get_current_win()
    vim.t.term_frontend_win = win1
    
    vim.cmd("below vnew")
    vim.cmd("b " .. backend_buf)
    local win2 = vim.api.nvim_get_current_win()
    vim.t.term_backend_win = win2
    
    -- Delete leftover empty buffers (created by split/vnew)
    for _, buf in ipairs(vim.api.nvim_list_bufs()) do
      if vim.bo[buf].buflisted and vim.api.nvim_buf_get_name(buf) == "" then
        -- Check if any window is showing this buffer
        local has_window = false
        for _, w in ipairs(vim.api.nvim_list_wins()) do
          if vim.api.nvim_win_get_buf(w) == buf then
            has_window = true
            break
          end
        end
        if not has_window then
          vim.cmd("bd! " .. buf)
        end
      end
    end
  end
end, { desc = "Toggle terminals visibility" })

-- Ctrl+n exits terminal mode (instead of Ctrl-\ Ctrl-n)
vim.api.nvim_create_autocmd("TermOpen", {
  pattern = "*",
  callback = function()
    vim.keymap.set("t", "<C-n>", "<C-\\><C-n>", { buffer = true })
  end,
})

-- Quick terminal commands
vim.keymap.set("n", "<leader>fd", function()
  vim.cmd("vsplit")
  vim.cmd("terminal npm run dev")
  vim.cmd("startinsert")
end, { desc = "Run npm run dev in terminal" })

-- Ctrl+p = fuzzy file search (same as <leader>ff)
vim.keymap.set("n", "<C-p>", function()
  require("fzf-lua").files()
end, { desc = "Fuzzy find files" })
