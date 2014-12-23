/*
 * fireworks.js - Kenneth Kufluk (http://kenneth.kufluk.com/)
 * http://js-fireworks.appspot.com/
 * MIT (X11) Licensed
 
 Copyright (c) 2010 Kenneth Kufluk

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 
 *
 */
$(document).ready(function(){

    // when firework text is changed, update the tinyurl
    $('#firetext').blur(function(){
        FireworkDisplay.getTinyUrl();
    });

    // focus on the input box
    try {
        $('#firetext').get(0).focus();
    } catch (ignore) {
    }

    // reload the page when it's resized
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
$(document).ready(function(){
    $("#slider_firework_speed").slider({
        slide: function(event, ui) {
            FireworkDisplay.FIREWORK_SPEED = ui.value;
        },
        value: FireworkDisplay.FIREWORK_SPEED,
        max: 5,
        step: 0.1,
        orientation: 'vertical'
    });
    $("#slider_fragment_spread").slider({
        slide: function(event, ui) {
            FireworkDisplay.FRAGMENT_SPREAD = ui.value;
        },
        value: FireworkDisplay.FRAGMENT_SPREAD,
        max: 20,
        orientation: 'vertical'
    });
    $("#slider_gravity").slider({
        slide: function(event, ui) {
            FireworkDisplay.GRAVITY = ui.value;
        },
        value: FireworkDisplay.GRAVITY,
        step: 0.1,
        min: -10,
        max: 20,
        orientation: 'vertical'
    });
});


FireworkDisplay = {
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
    canvas : 0,
    canvaswidth : 0,
    canvasheight : 0,
    ctx : 0,
    blockPointer : 0,
    fireworks : [],
    allBlocks : new Array(),
    gameloop : 0,
    updateDisplay : function() {
        this.ctx.clearRect(0, 0, this.canvaswidth, this.canvasheight);
        var firecount = 0;
        for (var i=0;i<this.fireworks.length;i++) {
            if (this.fireworks[i]==null) continue; 
            if (this.fireworks[i].status!=this.FIREWORK_EXPLODED) {
                firecount++;
            }
            this.displayFirework(this.fireworks[i]);
        }
        if (firecount == 0) {
            $('#form').fadeIn('slow');
        }
        $('#fireCount').html(firecount);
    },
    addFireworks : function() {
        if (this.blockPointer>=this.allBlocks.length) {
            return;
        }
        var fw = this.fireworks[this.fireworks.length] = new Firework(this.fireworks.length);
        var targetx = this.allBlocks[this.blockPointer][0];
        targetx = (((targetx)) / 300) * this.DISPERSION_HEIGHT;
        var targety = this.allBlocks[this.blockPointer][1];
        targety = (((10-targety) / 100) * this.DISPERSION_WIDTH) + 3.5;
        this.launchFirework(fw, targetx, targety);
        this.blockPointer++;
        setTimeout("FireworkDisplay.addFireworks()", 1000/this.DEPLOYMENT_RATE);
    },
    getTinyUrl : function () {
        // Source: http://css-tricks.com/snippets/javascript/get-url-and-url-parts-in-javascript/
        var tinypath = window.location.protocol.replace(/\:/g, "") + "://" + (window.location.host + "/" + window.location.pathname).replace('//', '/')+"?msg="+escape($('#firetext').val());
        
        // Define API URL: //updated with: http://yabtb.blogspot.be/2012/01/urltinyfy-jsonp-api-for-tinyurlcom.html
        API = 'http://urltinyfy.appspot.com/isgd?url=';
        // Append new SCRIPT element to BODY with SRC of API:
        document.getElementsByTagName('body')[0].appendChild((function(){
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = API + encodeURIComponent(tinypath) + '&callback=FireworkDisplay.updateTinyUrl';
            return s;
        })());
    },
    updateTinyUrl : function (o) {
        $('#url').val(o.tinyurl);
    },
    launchText :  function() {
        this.getTinyUrl();

        this.fireworks = [];
        this.blockPointer = 0;
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

        $(this.canvas).bind('click', function() { 
            $('#form').fadeIn('slow');
        });
        
        var text = $('#firetext').val();
        if (pageTracker) pageTracker._trackPageview("/launched/"+escape(text));

        var totalHeightOffset = 0;
        var totalWidthOffset = [];
		var totalWords = 0;
		totalWidthOffset[totalWords] = 0;
		// cycle through text
		for (var i=0;i<text.length;i++) {
			if (text.charAt(i)==' ') {
				// character is a space
				totalHeightOffset += this.TEXT_LINE_HEIGHT;
				totalWords++;
				totalWidthOffset[totalWords] = 0;
			} else {
				// character is not a space
				var maxWidthOffset = 0;
				// cycle through font array
				for (var j=0;j<FONT_FIREWORK[text.charAt(i)].length;j++) {
					// assign each dot to chararr
					var chararr = FONT_FIREWORK[text.charAt(i)][j];
					// calculate max width offset based on default or newly added dot
					maxWidthOffset = Math.max(maxWidthOffset, chararr[0]);
				}
				// register widthOffset for each word + character spacing
				totalWidthOffset[totalWords] += maxWidthOffset + 40;
			}
		}


		this.allBlocks = [];
		var windowHeight = $(window).height();
		var offsetTop = totalHeightOffset;
		offsetTop += (windowHeight-totalHeightOffset)/6;
		var offsetLeft = 0;
		var heightOffsetCount = 0;
		// cycle through text
		for (var i=0;i<text.length;i++) {
			if (text.charAt(i)==' ') {
				// character is a space
				// for each word start new line
				heightOffsetCount++;
				// calculate offset from top
				offsetTop = offsetTop - this.TEXT_LINE_HEIGHT;
				// start on left again for each word
				offsetLeft = 0;
			} else {
				// character is not a space
				var maxWidthOffset = 0;
				// cycle through font array
				for (var j=0;j<FONT_FIREWORK[text.charAt(i)].length;j++) {
					// assign each dot to chararr
					var chararr = FONT_FIREWORK[text.charAt(i)][j];
					// add current font dot to array, register x and y values to be used in fireworksDisplay() 
					this.allBlocks[this.allBlocks.length] = [(chararr[0]+offsetLeft)-(totalWidthOffset[heightOffsetCount]/2), chararr[1]-offsetTop];
					maxWidthOffset = Math.max(maxWidthOffset, chararr[0]);
				}
				// add letters from left to right + character spacing
				offsetLeft += maxWidthOffset+40;
			}
		}

        this.gameloop = setInterval("FireworkDisplay.updateDisplay()", 1000/this.FRAME_RATE);
        
        this.addFireworks();
        
        $('#form').fadeOut('slow');
    },
    launchFirework : function(fw, dispersion, speed) {
        fw.dx = dispersion;
        fw.dy = speed;
        fw.status = this.FIREWORK_LAUNCHED;
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
            var spark = this.fireworks[this.fireworks.length] = new Firework(this.fireworks.length);
            spark.x = fw.x;
            spark.y = fw.y;
            spark.r = fw.r;
            spark.g = fw.g;
            spark.b = fw.b;
            spark.status = this.FIREWORK_FRAGMENT;
            this.disperseFirework(spark, Math.random()*this.FRAGMENT_SPREAD);
        }
    },
    destroyFirework : function(fw) {
        this.fireworks[fw.index] = null;
    },
    displayFirework : function(fw, speed) {
        if (fw.y<0) this.destroyFirework(fw);
        if (fw.status==this.FIREWORK_EXPLODED) {
            this.ctx.beginPath();
            this.ctx.fillStyle = "rgb(200, 200, 200)";
            var radius         = 3;                    // Arc radius
            var startAngle     = 0;                     // Starting point on circle
            var endAngle       = Math.PI*2; // End point on circle
            var anticlockwise  = true; // clockwise or anticlockwise
            this.ctx.arc(fw.x, this.canvas.height-fw.y, radius, startAngle, endAngle, anticlockwise);
            this.ctx.fill();
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
        if (fw.dy<-1 && fw.status==this.FIREWORK_LAUNCHED) {
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

Firework = function(index) {
    this.index = index;
    this.dx = 0;
    this.dy = 0;
    this.x = FireworkDisplay.canvaswidth/2;
    this.y = 0;
    this.status = FireworkDisplay.FIREWORK_READY;
    this.brightness = 255;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.start = {x:0, y:0};
    this.previous = 0;
}


// Home-made point-based font.
var FONT_FIREWORK = {"!":[[5,-40],[5,-30],[5,-20],[5,0]],"\"":[[20,-40],[20,-30],[5,-40],[5,-30]],"#":[[35,-40],[45,-30],[35,-30],[15,-40],[25,-30],[35,-20],[45,-10],[15,-30],[35,-10],[5,-30],[15,-20],[25,-10],[35,0],[15,-10],[5,-10],[15,0]],"%":[[45,-40],[35,-30],[15,-40],[45,-10],[5,-40],[15,-30],[25,-20],[35,-10],[45,0],[5,-30],[35,0],[15,-10],[5,0]],"&":[[35,-40],[25,-40],[35,-30],[15,-40],[35,-20],[15,-30],[25,-20],[15,-20],[25,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0],[25,10],[5,0]],"'":[[5,-40],[5,-30]],"(":[[15,-40],[5,-30],[5,-20],[5,-10],[15,0]],")":[[5,-40],[15,-30],[15,-20],[15,-10],[5,0]],"*":[[25,-40],[5,-40],[15,-30],[25,-20],[5,-20]],"+":[[20,-40],[35,-20],[20,-30],[25,-20],[15,-20],[20,-10],[5,-20],[20,0]],",":[[5,0],[5,10]],"-":[[35,-20],[25,-20],[15,-20],[5,-20]],"-":[[35,-20],[25,-20],[15,-20],[5,-20]],".":[[5,0]],"/":[[45,-40],[35,-30],[25,-20],[15,-10],[5,0]],":":[[5,-30],[5,-10]],";":[[5,-30],[5,-10],[5,0]],"<":[[15,-25],[5,-15],[15,-5]],"=":[[35,-30],[25,-30],[15,-30],[35,-10],[5,-30],[25,-10],[15,-10],[5,-10]],">":[[5,-25],[15,-15],[5,-5]],"?":[[35,-40],[25,-40],[35,-30],[15,-40],[35,-20],[5,-40],[25,-20],[15,-20],[15,0]],"@":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[35,0],[15,-15],[5,-20],[25,0],[15,-5],[5,-10],[15,5],[5,0]],"A":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"B":[[25,-40],[15,-40],[25,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"C":[[35,-40],[25,-40],[15,-40],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"D":[[35,-30],[25,-40],[15,-40],[35,-20],[5,-40],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"E":[[35,-40],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"F":[[35,-40],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"G":[[35,-40],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"H":[[35,-40],[35,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"I":[[25,-40],[15,-40],[5,-40],[15,-30],[15,-20],[15,-10],[25,0],[15,0],[5,0]],"J":[[35,-40],[25,-40],[35,-30],[35,-20],[35,-10],[25,0],[5,-10],[15,0]],"K":[[35,-40],[25,-30],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"L":[[5,-40],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"M":[[35,-40],[35,-30],[25,-30],[35,-20],[5,-40],[15,-30],[35,-10],[20,-20],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"N":[[35,-40],[35,-30],[35,-20],[5,-40],[15,-30],[25,-20],[35,-10],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"O":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"P":[[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"Q":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[5,-30],[25,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"R":[[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"S":[[35,-35],[25,-40],[15,-40],[35,-15],[25,-20],[5,-35],[35,-5],[15,-20],[5,-25],[25,0],[15,0],[5,-5]],"T":[[35,-40],[25,-40],[15,-40],[20,-30],[5,-40],[20,-20],[20,-10],[20,0]],"U":[[35,-40],[35,-30],[35,-20],[5,-40],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"V":[[35,-40],[35,-30],[35,-20],[5,-40],[5,-30],[25,-10],[5,-20],[15,-10],[20,0]],"W":[[35,-40],[35,-30],[20,-40],[35,-20],[20,-30],[5,-40],[35,-10],[20,-20],[5,-30],[35,0],[20,-10],[5,-20],[25,0],[5,-10],[15,0]],"X":[[35,-40],[25,-30],[5,-40],[15,-30],[20,-20],[25,-10],[35,0],[15,-10],[5,0]],"Y":[[35,-40],[35,-30],[5,-40],[25,-20],[5,-30],[15,-20],[20,-10],[20,0]],"Z":[[35,-40],[25,-40],[15,-40],[25,-30],[5,-40],[20,-20],[35,0],[15,-10],[25,0],[15,0],[5,0]],"_":[[45,0],[35,0],[25,0],[15,0],[5,0]],"a":[[25,-30],[35,-20],[15,-30],[35,-10],[25,-15],[5,-30],[35,0],[15,-15],[25,0],[5,-10],[15,0]],"b":[[25,-30],[35,-20],[5,-40],[15,-30],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"c":[[35,-30],[25,-30],[15,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"d":[[35,-40],[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"e":[[25,-30],[35,-20],[15,-30],[25,-15],[35,0],[15,-15],[5,-20],[25,0],[5,-10],[15,0]],"f":[[25,-40],[15,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"g":[[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[25,-10],[35,0],[5,-20],[15,-10],[25,10],[15,10],[5,10]],"h":[[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"i":[[5,-40],[5,-20],[5,-10],[5,0]],"j":[[15,-40],[15,-20],[15,-10],[15,0],[5,10]],"k":[[35,-30],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"l":[[5,-40],[5,-30],[5,-20],[5,-10],[15,0]],"m":[[35,-30],[45,-20],[25,-30],[45,-10],[15,-30],[25,-20],[45,0],[5,-30],[25,-10],[5,-20],[25,0],[5,-10],[5,0]],"n":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"o":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-20],[25,0],[5,-10],[15,0]],"p":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0],[5,10]],"q":[[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[35,0],[5,-20],[25,0],[35,10],[5,-10],[15,0]],"r":[[35,-30],[25,-30],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"s":[[35,-30],[25,-30],[15,-30],[35,-10],[25,-15],[15,-15],[5,-20],[25,0],[15,0],[5,0]],"t":[[25,-30],[5,-40],[15,-30],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"u":[[35,-30],[35,-20],[35,-10],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"v":[[35,-30],[35,-20],[5,-30],[25,-10],[5,-20],[15,-10],[20,0]],"w":[[35,-30],[35,-20],[20,-30],[35,-10],[20,-20],[5,-30],[35,0],[20,-10],[5,-20],[25,0],[5,-10],[15,0]],"x":[[35,-30],[25,-20],[5,-30],[15,-20],[25,-10],[35,0],[15,-10],[5,0]],"y":[[35,-30],[35,-20],[35,-10],[5,-30],[25,-10],[35,0],[5,-20],[15,-10],[25,10],[15,10]],"z":[[35,-30],[25,-30],[15,-30],[25,-20],[5,-30],[35,0],[15,-10],[25,0],[15,0],[5,0]],"0":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[15,-25],[25,-15],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"1":[[15,-40],[15,-30],[5,-30],[15,-20],[15,-10],[15,0]],"2":[[35,-35],[25,-40],[35,-25],[15,-40],[25,-20],[5,-35],[15,-20],[35,0],[25,0],[5,-10],[15,0],[5,0]],"3":[[25,-40],[35,-30],[15,-40],[5,-40],[25,-20],[35,-10],[15,-20],[25,0],[15,0],[5,0]],"4":[[35,-40],[35,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20]],"5":[[35,-40],[25,-40],[15,-40],[35,-15],[5,-40],[25,-20],[35,-5],[5,-30],[15,-20],[5,-20],[25,0],[15,0],[5,0]],"6":[[35,-40],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[5,-20],[25,0],[5,-10],[15,0]],"7":[[35,-40],[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[25,-10],[25,0]],"8":[[35,-35],[25,-40],[35,-25],[15,-40],[35,-15],[25,-20],[5,-35],[35,-5],[15,-20],[5,-25],[25,0],[5,-15],[15,0],[5,-5]],"9":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[5,-20],[25,0],[15,0],[5,0]]};