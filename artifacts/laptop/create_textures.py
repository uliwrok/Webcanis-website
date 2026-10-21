from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

out = Path(__file__).parent
rows = [
    [('Esc',1), *[(f'F{i}',1) for i in range(1,13)], ('Del',1)],
    [('`',1), *[(s,1) for s in '1234567890-='], ('Backspace',2)],
    [('Tab',1.5), *[(s,1) for s in 'QWERTYUIOP[]'], ('\\',1.5)],
    [('Caps',1.8), *[(s,1) for s in "ASDFGHJKL;'"], ('Enter',2.2)],
    [('Shift',2.3), *[(s,1) for s in 'ZXCVBNM,./'], ('Shift',2.7)],
    [('Ctrl',1.3), ('Fn',1), ('Alt',1.2), ('',6), ('Alt',1.2), ('Ctrl',1.3), ('<',1), ('^',1), ('>',1)],
]
atlas = Image.new('RGB', (1024,512), (29,32,37))
d = ImageDraw.Draw(atlas)
for row_index,row in enumerate(rows):
    for col,(label,width) in enumerate(row):
        index=sum(len(r) for r in rows[:row_index])+col
        cx=(index%16)*64+32
        cy=(index//16)*64+32
        size=15 if len(label)>3 else 22
        font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',size)
        d.text((cx,cy),label,font=font,anchor='mm',fill=(199,206,214))
atlas.save(out/'keyboard-atlas.png', optimize=True)
screen=Image.new('RGB',(1024,576))
pix=screen.load()
for y in range(576):
    for x in range(1024):
        glow=max(0,1-((x-240)**2/900**2+(y-460)**2/650**2))**2
        pix[x,y]=(int(7+11*glow),int(11+18*glow),int(17+25*glow))
screen.save(out/'screen-placeholder.png',optimize=True)
(out/'keyboard-layout.json').write_text(json.dumps(rows),encoding='utf-8')
