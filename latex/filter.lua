-- latex/filter.lua

-- This table will store our Table of Contents items.
local toc_items = {}

-- This table maps environment names to CSS classes.
local environments = {
  theorem     = 'theorem-box',
  lemma       = 'theorem-box',
  proposition = 'theorem-box',
  corollary   = 'theorem-box',
  definition  = 'definition-box',
  example     = 'example-box',
  proof       = 'proof-box'
}

-- This function runs on every Header element (\section, \subsection, etc.).
function Header(el)
  -- We only want top-level sections (h1, h2) for the sidebar.
  -- Adjust the level (e.g., el.level <= 3) if you want subsections too.
  if el.level <= 2 then
    table.insert(toc_items, {
      -- The 'title' field for our Astro component.
      title = pandoc.utils.stringify(el.content),
      -- The 'href' field, linking to the section's ID.
      href = '#' .. el.identifier
    })
  end
  return el
end

function Div(el)
  for name, class in pairs(environments) do
    if el.classes:includes(name) then
      table.insert(el.classes, class)
      return el
    end
  end
  return el
end

function Str(el)
  if el.text == '□' or el.text == '◻' then
    return pandoc.Span(el.text, pandoc.Attr('', { 'qed' }))
  end
end

function Emph(el)
  return pandoc.Span(el.content, pandoc.Attr('', { 'math-emphasis' }))
end

-- This function runs once at the very end of the Pandoc process.
function Pandoc(doc)
  -- Define the output path for the TOC file.
  local toc_filepath = 'src/pages/notes/abstract-algebra/toc.json'
  local file = io.open(toc_filepath, 'w')
  if file then
    -- Encode the `toc_items` table as a JSON string and write it.
    file:write(pandoc.json.encode(toc_items))
    file:close()
  end
  -- Return the document to Pandoc to finish processing.
  return doc
end