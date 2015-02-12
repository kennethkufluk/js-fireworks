cufon.js

- we need all of cufon (to read the font, generate the vml)
- getcoords: new method that gets the vertices of the glyphs
- drawglyph: show the glyph on the screen afterwards
- I wonder if we should break the glyph by closed path

1) draw a glyph on the canvas
2) draw the vertices on the canvas
3) rewrite the launcher to use 3d destinations
  ( this is just a bit of trig, not too hard )
4) switch to webgl
5) 3d explosions
6) sparkly afterglow
7) update the dialog, restore the sliders, etc.
8) add japanese, chinese, emoticons


bugs:
- resizer
- animationframe
- short url stuff