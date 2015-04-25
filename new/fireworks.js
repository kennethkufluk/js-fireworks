/*
 * fireworks.js - Kenneth Kufluk (http://kenneth.kufluk.com/)
 * http://js-fireworks.appspot.com/
 * MIT (X11) Licensed
 * Copyright (c) 2015 Kenneth Kufluk
 */
$(document).ready(function(){

  // focus on the input box
  // try {
  //   $('#firetext').get(0).focus();
  // } catch (ignore) {
  // }

  // reload the page when it's resized - wonder if there's a new way to do this
  var resizeTimer = null;
  $(window).bind('resize', function() {
    if (document.all) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout("location.reload()", 100);
  });

  // finally, all is ready, so kick off the firework display
  var params = location.search;
  var message = "";
  if (params.match('msg=')) {
    // change the message if set in the page url
    message = unescape(params.split('?msg=')[1]);
    $('#firetext').val(message);
  }
  FireworkDisplay.launchText();

});


// configure the sliders
// $(document).ready(function(){
//   $("#slider_firework_speed").slider({
//     slide: function(event, ui) {
//       FireworkDisplay.FIREWORK_SPEED = ui.value;
//     },
//     value: FireworkDisplay.FIREWORK_SPEED,
//     max: 5,
//     step: 0.1,
//     orientation: 'vertical'
//   });
//   $("#slider_fragment_spread").slider({
//     slide: function(event, ui) {
//       FireworkDisplay.FRAGMENT_SPREAD = ui.value;
//     },
//     value: FireworkDisplay.FRAGMENT_SPREAD,
//     max: 20,
//     orientation: 'vertical'
//   });
//   $("#slider_gravity").slider({
//     slide: function(event, ui) {
//       FireworkDisplay.GRAVITY = ui.value;
//     },
//     value: FireworkDisplay.GRAVITY,
//     step: 0.1,
//     min: -10,
//     max: 20,
//     orientation: 'vertical'
//   });
// });

(function() {

  // converts Cufon's VML markup to canvas instructions
  function generateFromVML(path) {
    var atX = 0, atY = 0;
    var code = [], re = /([mrvxe])([^a-z]*)/g, match;
    generate: for (var i = 0; match = re.exec(path); ++i) {
      var c = match[2].split(',');
      switch (match[1]) {
        case 'v':
          code[i] = { m: 'bezierCurveTo', a: [ atX + ~~c[0], atY + ~~c[1], atX + ~~c[2], atY + ~~c[3], atX += ~~c[4], atY += ~~c[5] ] };
          break;
        case 'r':
          code[i] = { m: 'lineTo', a: [ atX += ~~c[0], atY += ~~c[1] ] };
          break;
        case 'm':
          code[i] = { m: 'moveTo', a: [ atX = ~~c[0], atY = ~~c[1] ] };
          break;
        case 'x':
          code[i] = { m: 'closePath' };
          break;
        case 'e':
          break generate;
      }
    }
    return code;
  }

  var GLYPHSCALE = 0.4;
  var CHAR_SPACING = 40;
  // gets the points on a glyph that require fireworks
  function getGlyphVertices(chr, font) {
    var glyph = font.glyphs[chr] || font.missingGlyph;
    var vertices = [];
    if (glyph && glyph.d) {
      glyph.code = generateFromVML('m' + glyph.d);
      // draw the dots
      for (var path = 0; path < glyph.code.length; path++) {
        var pathInfo = glyph.code[path];
        if (pathInfo.a && (pathInfo.m == 'moveTo' || pathInfo.m == 'lineTo')) {
          vertices.push([pathInfo.a[0] * GLYPHSCALE, pathInfo.a[1] * GLYPHSCALE]);
        }
        if (pathInfo.a && (pathInfo.m == 'bezierCurveTo')) {
          vertices.push([pathInfo.a[4] * GLYPHSCALE, pathInfo.a[5] * GLYPHSCALE]);
        }
      }
    }
    return vertices;
  }

  function renderGlyph(glyph, g, font) {
    if (glyph.d) {
      g.beginPath();
      glyph.code = generateFromVML('m' + glyph.d);
      // draw the glyph
      for (var path = 0; path < glyph.code.length; path++) {
        var pathInfo = glyph.code[path];
        g[pathInfo.m].apply(g, pathInfo.a);
      }
      g.fill();
    }
  }

  function renderText(text, g, font) {
    console.log('renderText')

    var chars = text.split('');
    var stretchFactor = 1;

    var jumps = font.spacing(chars, 0, 0);

    // var jumps = [100, 100, 3, 4, 5, 6, 7, 8, 9]; // word spacing KPK TO FIX
    // font, g, stretchFactor, chars, generateFromVML, jumps
    console.log('renderText', font, g, stretchFactor, chars, generateFromVML, jumps);

    var glyphs = font.glyphs, glyph, i = -1, j = -1, chr;
    g.scale(stretchFactor, 1);
    g.fillStyle = '#ffffff';
    g.translate(100, 300);
    while (chr = chars[++i]) {
      var glyph = glyphs[chr] || font.missingGlyph;
      renderGlyph(glyph, g, font);
      g.translate(jumps[++j], 0);
    }
    g.restore();
  }

  window.FireworkDisplay = {
    GRAVITY : 5,
    FRAME_RATE : 30,
    DEPLOYMENT_RATE : 10,
    FIREWORK_SPEED : 2,
    DISPERSION_WIDTH : 1,
    DISPERSION_HEIGHT : 2,
    FIREWORK_PAYLOAD : 30,
    FRAGMENT_SPREAD : 8,
    TEXT_LINE_HEIGHT : 70,
    FIREWORK_READY : 0,
    FIREWORK_LAUNCHED : 1,
    FIREWORK_EXPLODED : 2,
    FIREWORK_FRAGMENT : 3,
    FIREWORK_DONE : 4,
    canvas : 0,
    canvaswidth : 0,
    canvasheight : 0,
    ctx : 0,
    fireworks : [],
    gameloop : 0,
    font: Cufon.fonts.notosans.get('notosans', 'normal'),
    updateDisplay : function() {
      this.ctx.clearRect(0, 0, this.canvaswidth, this.canvasheight);
      var firecount = 0;
      for (var i=0;i<this.fireworks.length;i++) {
        if (this.fireworks[i] == null) continue;
        if (this.fireworks[i].status == this.FIREWORK_DONE) {
          this.fireworks[i] = null;
          continue;
        }
        if (this.fireworks[i].status != this.FIREWORK_EXPLODED) {
          firecount++;
        }
        this.displayFirework(this.fireworks[i]);
      }
      if (firecount == 0) {
        // $('#form').fadeIn('slow');
      }
      $('#fireCount').html(firecount);
    },

    fireworkGlyphs: [],

    // TODO: make an "Glyph" object that manages it's own deployment, so it knows when it's finished
    // should we continue with the messy result, or make it uniform?
    addFireworks : function(allGlyphs, glyphNum, pointNum) {
      glyphNum = glyphNum || 0;
      pointNum = pointNum || 0;
      if (pointNum >= allGlyphs[glyphNum].length) {
        glyphNum++;
        pointNum = 0;
      }
      if (glyphNum >= allGlyphs.length) {
        return;
      }
      var point = allGlyphs[glyphNum][pointNum];
      var targetx = point[0];
      // TODO: fix these scale factors everywhere
      targetx = (targetx / 300) * this.DISPERSION_HEIGHT;
      var targety = point[1];
      targety = (((10-targety) / 100) * this.DISPERSION_WIDTH) + 3.5;
      pointNum++;
      var fw = new Firework(this.FIREWORK_LAUNCHED);
      fw.setTarget(targetx, targety);
      this.fireworks.push(fw);
      setTimeout(this.addFireworks.bind(this, allGlyphs, glyphNum, pointNum), 1000/this.DEPLOYMENT_RATE);
    },
    launchText :  function() {

      this.fireworks = [];
      clearTimeout(this.gameloop);
      //CANVAS
      this.canvas = $("#cv").get(0);
      if (typeof G_vmlCanvasManager != "undefined") {
        this.canvas = G_vmlCanvasManager.initElement(this.canvas);
      }
      this.ctx = this.canvas.getContext("2d");
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.lineWidth = "2";
      this.ctx.strokeStyle = "rgb(255, 255, 255)";
      this.canvaswidth = $(window).width();
      this.canvasheight = $(window).height();

      // // New text stuff (woohoo)
      // var font = Cufon.fonts.notosans.get('notosans', 'normal');
      // renderText('Hello World!', this.ctx, this.font);

      // $(this.canvas).bind('click', function() {
      //   $('#form').fadeIn('slow');
      // });

      var text = $('#firetext').val();
      if (pageTracker) pageTracker._trackPageview("/launched/"+escape(text));

      // calculate widths, used for offsets, letter-spacing and centering
      var jumps = this.font.spacing(text.split(''), 0, 0);
      var totalHeightOffset = 0;
      var totalWidthOffset = new Array();
      var widthCounter = 0;
      totalWidthOffset[widthCounter] = 0;
      for (var i=0;i<text.length;i++) {
        if (text.charAt(i)==' ') {
          // break line on a space
          totalHeightOffset += this.TEXT_LINE_HEIGHT;
          widthCounter++;
          totalWidthOffset[widthCounter] = 0;
        } else {
          totalWidthOffset[widthCounter] += (jumps[i] * GLYPHSCALE) + CHAR_SPACING;
        }
      }

      // build a blocks array of all the characters
      var allGlyphs = [];
      var windowHeight = $(window).height();
      var offsetTop = totalHeightOffset;
      offsetTop += (windowHeight-totalHeightOffset)/6;
      var offsetLeft = 0;
      var heightOffsetCount = 0;
      for (var i=0;i<text.length;i++) {
        if (text.charAt(i)==' ') {
          heightOffsetCount++;
          offsetTop = offsetTop - this.TEXT_LINE_HEIGHT;
          offsetLeft = 0;
        } else {
          var fwG = new FireworkGlyph(text.charAt(i), offsetLeft, heightOffsetCount, offsetTop, totalWidthOffset, this.font, this.ctx);
          this.fireworkGlyphs.push(fwG);
          offsetLeft += fwG.getMaxWidth() + CHAR_SPACING;  //plus character spacing
        }
      }

      this.gameloop = setInterval(this.updateDisplay.bind(this), 1000/this.FRAME_RATE);

      // this.addFireworks(allGlyphs);

      $('#form').fadeOut('slow');
    },
    disperseFirework : function(fw, speed) {
      fw.dx = speed * (0.5-Math.random());
      fw.dy = speed * (0.5-Math.random()) + 1;
    },
    explodeFirework : function(fw, speed) {
      fw.status = this.FIREWORK_EXPLODED;
      fw.r = (Math.random() /2) + 0.5;
      fw.g = (Math.random() /2) + 0.5;
      fw.b = (Math.random() /2) + 0.5;
      fw.brightness = 200;
      this.ctx.strokeStyle = "rgb(200, 200, 200)";
      // add the fragments
      var frags = Math.random() * this.FIREWORK_PAYLOAD;
      for (var i=0;i<frags;i++) {
        var spark = new Firework(this.FIREWORK_FRAGMENT, fw.x, fw.y);
        spark.setColor(fw.r, fw.g, fw.b);
        this.fireworks.push(spark);
        this.disperseFirework(spark, Math.random()*this.FRAGMENT_SPREAD);
      }
    },
    destroyFirework : function(fw) {
      this.status = this.FIREWORK_DONE;
    },
    drawExplodedFirework: function(x, y) {
      this.ctx.beginPath();
      this.ctx.fillStyle = "rgb(200, 200, 200)";
      var radius     = 3;          // Arc radius
      var startAngle   = 0;           // Starting point on circle
      var endAngle     = Math.PI*2; // End point on circle
      var anticlockwise  = true; // clockwise or anticlockwise
      this.ctx.arc(x, this.canvas.height-y, radius, startAngle, endAngle, anticlockwise);
      this.ctx.fill();
    },
    displayFirework : function(fw, speed) {
      if (fw.y<0) this.destroyFirework(fw);
      if (fw.status == this.FIREWORK_EXPLODED) {
        this.drawExplodedFirework(fw.x, fw.y);
        return;
      }
      fw.colour = "rgb(80, 80, 80)";
      this.ctx.strokeStyle = fw.colour;
      var forces = {x:0,y:-0.05};
      if (fw.status==this.FIREWORK_FRAGMENT) {
        forces.y = this.GRAVITY/-100;
        fw.colour = "rgb("+Math.round(fw.r*fw.brightness)+", "+Math.round(fw.g*fw.brightness)+", "+Math.round(fw.b*fw.brightness)+")";
        this.ctx.strokeStyle = fw.colour;
        fw.brightness-=5;
        if (fw.brightness<0) this.destroyFirework(fw);
      }
      if (fw.dy<-1 && fw.status == this.FIREWORK_LAUNCHED) {
        this.explodeFirework(fw);
      }
      fw.start = {x:fw.x, y:fw.y};
      //apply accelerations
      fw.dx += forces.x*this.FIREWORK_SPEED;
      fw.dy += forces.y*this.FIREWORK_SPEED;
      //apply velocities
      fw.x += fw.dx*this.FIREWORK_SPEED;
      fw.y += fw.dy*this.FIREWORK_SPEED;
      //show
      if (fw.previous) {
        this.ctx.beginPath();
        this.ctx.moveTo(fw.previous.x, this.canvas.height-fw.previous.y);
        this.ctx.lineTo(fw.x, this.canvas.height-fw.y);
        this.ctx.stroke();
        this.ctx.closePath();
      }
      fw.previous = {x:fw.start.x, y:fw.start.y};
    }
  }

  var FireworkGlyph = function(chr, offsetLeft, heightOffsetCount, offsetTop, totalWidthOffset, font, g) {
    // launch the rockets
    // when they're complete, draw the glyph (based on the resulting positions..?)
    this.chr = chr;
    this.g = g;
    this.vertices = getGlyphVertices(chr, font);

    var glyphCoords = [];
    var maxWidthOffset = 0;
    // allGlyphs.push(glyphCoords);
    for (var j=0;j<this.vertices.length;j++) {
      var chararr = this.vertices[j];
      glyphCoords.push([(chararr[0]+offsetLeft)-(totalWidthOffset[heightOffsetCount]/2), chararr[1]-offsetTop]);
      maxWidthOffset = Math.max(maxWidthOffset, chararr[0]);
    }
    this.glyphCoords = glyphCoords;
    this.maxWidthOffset = maxWidthOffset;
    this.launch();
  };

  FireworkGlyph.prototype.getMaxWidth = function() {
    return this.maxWidthOffset;
  };

  FireworkGlyph.prototype.launch = function() {
    this.glyphCoords.forEach(function(point) {
      var targetx = point[0];
      // TODO: fix these scale factors everywhere
      targetx = (targetx / 300) * FireworkDisplay.DISPERSION_HEIGHT;
      var targety = point[1];
      targety = (((10-targety) / 100) * FireworkDisplay.DISPERSION_WIDTH) + 3.5;
      var fw = new Firework(FireworkDisplay.FIREWORK_LAUNCHED);
      fw.setTarget(targetx, targety);
      FireworkDisplay.fireworks.push(fw);

      /* todo
      We need a callback or promise for the explosion so we can draw the full glyph
      */

    });
    this.showGlyph();
  };

  FireworkGlyph.prototype.showGlyph = function() {
    var font = FireworkDisplay.font;
    var g = FireworkDisplay.ctx;
    // bleah
    // we need to show the vertices in the exploding positions, so pull out the calculations
    // var glyph = font.glyphs[this.chr] || font.missingGlyph;
    // if (glyph && glyph.d) {
    //   glyph.code = generateFromVML('m' + glyph.d);
    // }
    renderGlyph(this.chr, g, font);
  };

  var Firework = function(status, x, y) {
    this.dx = 0;
    this.dy = 0;
    this.x = x || FireworkDisplay.canvaswidth / 2;
    this.y = y || 0;
    this.status = status;
    this.brightness = 255;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.start = {x:0, y:0};
    this.previous = 0;
  };
  Firework.prototype.setTarget = function(dx, dy) {
    this.dx = dx;
    this.dy = dy;
  };
  Firework.prototype.setColor = function(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  };

}());
