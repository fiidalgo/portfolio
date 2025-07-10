-- Pandoc Lua filter to better format theorem environments
local utils = pandoc.utils

function Div(el)
  if el.classes:includes('theo') then
    local blocks = el.content
    if #blocks > 0 and blocks[1].t == 'Para' then
      local para = blocks[1]
      local c = para.c
      if #c >= 2 and c[1].t == 'Span' and c[2].t == 'Span' then
        local title = utils.stringify(c[1])
        for _=1,2 do table.remove(c,1) end
        blocks[1] = pandoc.Para(c)
        local headerPara = pandoc.Para({pandoc.Strong(title)})
        local wrapper = pandoc.Div({headerPara}, pandoc.Attr('', {'theo-title'}, {}))
        table.insert(blocks, 1, wrapper)
      end
    end
    el.content = blocks
    return el
  end
end
