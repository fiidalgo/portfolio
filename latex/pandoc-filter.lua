-- pandoc-filter.lua
-- Lua filter to:
--   • pull the [title=…] option out of every tcolorbox and insert it as a bold header
--   • auto-number theorem environments created with \newtcbtheorem
--   • wrap □ / ◻ (QED symbols) in <span class="qed">…</span>
--   • handle various definition/note/property/methods environments

local utils          = pandoc.utils
local theoremCounter = 0

------------------------------------------------------------------------
-- helpers -------------------------------------------------------------
------------------------------------------------------------------------

---Return text wrapped in <div class="box-title"><h4>…</h4></div> to ensure new line
local function make_header(txt)
  return pandoc.Div(
           { pandoc.Header(4, { pandoc.Str(txt) }) },
           pandoc.Attr('', { 'box-title' })
         )
end

---Strip one layer of surrounding braces { … } if present
local function strip_braces(s)
  if s:match('^{.*}$') then
    return s:sub(2, -2)
  end
  return s
end

---Extract "title=…" from a comma-separated option string (latex-options attr)
local function title_from_option_string(optstr)
  for piece in optstr:gmatch('[^,]+') do
    local k, v = piece:match('^%s*([^=]+)%s*=%s*(.*)%s*$')
    if k and v and k == 'title' then
      return strip_braces(v)
    end
  end
end

---Attempt to recover title from the first RawBlock that still contains
---\begin{tcolorbox}[title=…] or similar
local function title_from_rawblock(raw)
  return raw:match('title%s*=%s*{([^}]+)}')
     or raw:match('title%s*=%s*([^,%]]+)')
end

---Generate appropriate CSS classes based on environment type
local function get_environment_classes(env_name)
  local classes = { 'tcolorbox', env_name }
  
  -- Add semantic classes for styling
  if env_name == 'definition' then
    table.insert(classes, 'definition-box')
  elseif env_name == 'note' then
    table.insert(classes, 'note-box')
  elseif env_name == 'property' then
    table.insert(classes, 'property-box')
  elseif env_name == 'methods' then
    table.insert(classes, 'methods-box')
  elseif env_name == 'example' then
    table.insert(classes, 'example-box')
  end
  
  return classes
end

------------------------------------------------------------------------
-- Block filter --------------------------------------------------------
------------------------------------------------------------------------

function Div(el)
  ----------------------------------------------------------------------
  -- 1 · tcolorbox environments (including definition, note, etc.) ----
  ----------------------------------------------------------------------
  if el.classes:includes('tcolorbox') then
    local title = nil
    local env_name = nil
    
    -- Determine environment type
    for _, cls in ipairs(el.classes) do
      if cls == 'definition' or cls == 'note' or cls == 'property' or 
         cls == 'methods' or cls == 'example' then
        env_name = cls
        break
      end
    end

    -- a) the normal attribute (rarely populated)
    if el.attributes.title and el.attributes.title ~= '' then
      title = el.attributes.title
    end

    -- b) Pandoc's "latex-options" catch-all string
    if not title and el.attributes["latex-options"] then
      title = title_from_option_string(el.attributes["latex-options"])
    end

    -- c) fall back to the first RawBlock, if present
    if not title
       and el.content[1]
       and el.content[1].t == 'RawBlock'
       and el.content[1].format == 'latex' then
      title = title_from_rawblock(el.content[1].text)
    end

    -- d) Use default title based on environment if no title found
    if not title and env_name then
      if env_name == 'definition' then
        title = 'Definition'
      elseif env_name == 'note' then
        title = 'Note'
      elseif env_name == 'property' then
        title = 'Property'
      elseif env_name == 'methods' then
        title = 'Methods'
      elseif env_name == 'example' then
        title = 'Example'
      end
    end

    -- insert the header if we found a title
    if title and title ~= '' then
      table.insert(el.content, 1, make_header(title))

      -- tidy up: remove attributes so they don't get re-emitted
      el.attributes.title           = nil
      el.attributes["latex-options"] = nil
    end

    -- Update classes for better CSS targeting
    if env_name then
      el.classes = get_environment_classes(env_name)
    end

    return el
  end

  ----------------------------------------------------------------------
  -- 2 · theorem environments (class 'theo') ---------------------------
  ----------------------------------------------------------------------
  if el.classes:includes('theo') then
    theoremCounter = theoremCounter + 1
    local blocks   = el.content

    if #blocks > 0 and blocks[1].t == 'Para' then
      local para = blocks[1].content    -- Inline list
      if #para >= 2 and para[1].t == 'Span' and para[2].t == 'Span' then
        local rawTitleSpan = para[1]    -- user-supplied title

        -- remove the two spans ("title" and the trailing space/separator)
        table.remove(para, 1)
        table.remove(para, 1)

        -- rebuild the first paragraph without those spans
        blocks[1] = pandoc.Para(para)

        -- construct numbered heading with colon format
        local userTitle = utils.stringify(rawTitleSpan)
        local fullTitle = string.format('Theorem %d: %s', theoremCounter, userTitle)
        table.insert(blocks, 1, make_header(fullTitle))
      end
    end

    -- rename class 'theo' → 'theorem' for cleaner HTML/CSS
    for i, cls in ipairs(el.classes) do
      if cls == 'theo' then
        table.remove(el.classes, i)
        break
      end
    end
    table.insert(el.classes, 'theorem')
    table.insert(el.classes, 'theorem-box')  -- Additional class for styling
    el.content = blocks
    return el
  end

  ----------------------------------------------------------------------
  -- 3 · proof environments --------------------------------------------
  ----------------------------------------------------------------------
  if el.classes:includes('proof') then
    -- Add styling class for proofs
    table.insert(el.classes, 'proof-box')
    return el
  end
end

------------------------------------------------------------------------
-- Inline filter -------------------------------------------------------
------------------------------------------------------------------------

function Str(el)
  -- Handle QED symbols
  if el.text == '□' or el.text == '◻' then
    return pandoc.Span(el.text, pandoc.Attr('', { 'qed' }))
  end
  
  -- Handle custom \qed command
  if el.text == '\\qed' then
    return pandoc.Span('□', pandoc.Attr('', { 'qed' }))
  end
end

------------------------------------------------------------------------
-- Additional filters for better structure -----------------------------
------------------------------------------------------------------------

-- Handle emphasis and strong formatting better
function Emph(el)
  -- Add class for mathematical emphasis
  return pandoc.Span(el.content, pandoc.Attr('', { 'math-emphasis' }))
end

-- Handle mathematical expressions
function Math(el)
  -- Add classes based on math type
  if el.mathtype == 'DisplayMath' then
    return pandoc.Span({ el }, pandoc.Attr('', { 'display-math' }))
  else
    return pandoc.Span({ el }, pandoc.Attr('', { 'inline-math' }))
  end
end

-- Process headers to add anchor links
function Header(el)
  -- Generate id from header text if not present
  if not el.identifier or el.identifier == '' then
    local id = utils.stringify(el.content):lower():gsub('%s+', '-'):gsub('[^%w%-]', '')
    el.identifier = id
  end
  
  -- Add class based on level
  table.insert(el.classes, 'header-level-' .. el.level)
  
  return el
end