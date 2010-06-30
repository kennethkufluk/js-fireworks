/*
 * fireworks.as - Kenneth Kufluk (http://kenneth.kufluk.com/)
 * MIT Licensed
 * http://js-fireworks.appspot.com/
 *
 */
function rgb2hex(r, g, b):Number {
    return(r<<16 | g<<8 | b);
}
var FireworkDisplay = {
    GRAVITY : 5,
    FRAME_RATE : 30,
    DEPLOYMENT_RATE : 10,
    FIREWORK_SPEED : 2,
    DISPERSION_WIDTH : 1,
    DISPERSION_HEIGHT : 2,
    FIREWORK_PAYLOAD : 10,
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
        FireworkDisplay.ctx.clear();
        var firecount = 0;
        for (var i1=0;i1<FireworkDisplay.fireworks.length;i1++) {
            if (FireworkDisplay.fireworks[i1]==null) continue; 
            if (FireworkDisplay.fireworks[i1].status!=FireworkDisplay.FIREWORK_EXPLODED) {
                firecount++;
            }
            FireworkDisplay.displayFirework(FireworkDisplay.fireworks[i1]);
        }
    },
    addFireworks : function() {
        if (FireworkDisplay.blockPointer>=FireworkDisplay.allBlocks.length) {
            return;
        }
        var fw = FireworkDisplay.fireworks[FireworkDisplay.fireworks.length] = new Firework(FireworkDisplay.fireworks.length);
        var targetx = FireworkDisplay.allBlocks[FireworkDisplay.blockPointer][0];
        targetx = (((targetx)) / 300) * FireworkDisplay.DISPERSION_HEIGHT;
        var targety = FireworkDisplay.allBlocks[FireworkDisplay.blockPointer][1];
        targety = (((10-targety) / 100) * FireworkDisplay.DISPERSION_WIDTH) + 3.5;
        FireworkDisplay.launchFirework(fw, targetx, targety);
        FireworkDisplay.blockPointer++;
        setTimeout(FireworkDisplay.addFireworks, 1000/FireworkDisplay.DEPLOYMENT_RATE);
    },
    launchText :  function(canvas) {

        FireworkDisplay.fireworks = [];
        FireworkDisplay.blockPointer = 0;
        clearTimeout(FireworkDisplay.gameloop);
        //CANVAS
        FireworkDisplay.canvas = canvas;

        FireworkDisplay.ctx = FireworkDisplay.canvas.graphics;
        FireworkDisplay.ctx.clear();
        FireworkDisplay.ctx.lineStyle(1, 0xdddddd);
        FireworkDisplay.canvaswidth = 500;
        FireworkDisplay.canvasheight = 500;

        var text = "hello world";

        var chararr = '';
        var maxWidthOffset = 0;
        var totalHeightOffset = 0;
        var totalWidthOffset = new Array();
        var widthCounter = 0;
        totalWidthOffset[widthCounter] = 0;
        for (var i2=0;i2<text.length;i2++) {
            if (text.charAt(i2)==' ') {
                totalHeightOffset += FireworkDisplay.TEXT_LINE_HEIGHT;
                widthCounter++;
                totalWidthOffset[widthCounter] = 0;
            } else {
                maxWidthOffset = 0;
                for (var j1=0;j1<FONT_FIREWORK[text.charAt(i2)].length;j1++) {
                    chararr = FONT_FIREWORK[text.charAt(i2)][j1];
                    maxWidthOffset = Math.max(maxWidthOffset, chararr[0]);
                }
                totalWidthOffset[widthCounter] += maxWidthOffset + 40;
            }
        }


        FireworkDisplay.allBlocks = new Array();
        var windowHeight = 500;
        var offsetTop = totalHeightOffset;
        offsetTop += (windowHeight-totalHeightOffset)/6;
        var offsetLeft = 0;
        var heightOffsetCount = 0;
        for (var i3=0;i3<text.length;i3++) {
            if (text.charAt(i3)==' ') {
                heightOffsetCount++;
                offsetTop = offsetTop - FireworkDisplay.TEXT_LINE_HEIGHT;
                offsetLeft = 0;
            } else {
                maxWidthOffset = 0;
                for (var j2=0;j2<FONT_FIREWORK[text.charAt(i3)].length;j2++) {
                    chararr = FONT_FIREWORK[text.charAt(i3)][j2];
                    FireworkDisplay.allBlocks[FireworkDisplay.allBlocks.length] = [(chararr[0]+offsetLeft)-(totalWidthOffset[heightOffsetCount]/2), chararr[1]-offsetTop];
                    maxWidthOffset = Math.max(maxWidthOffset, chararr[0]);
                }
                offsetLeft += maxWidthOffset+40;  //plus character spacing
            }
        }

        FireworkDisplay.gameloop = setInterval(FireworkDisplay.updateDisplay, 1000/FireworkDisplay.FRAME_RATE);
        
        FireworkDisplay.addFireworks();
        
    },
    launchFirework : function(fw, dispersion, speed) {
        fw.dx = dispersion;
        fw.dy = speed;
        fw.status = FireworkDisplay.FIREWORK_LAUNCHED;
    },
    disperseFirework : function(fw, speed) {
        fw.dx = speed * (0.5-Math.random());
        fw.dy = speed * (0.5-Math.random()) + 1;
    },
    explodeFirework : function(fw, speed) {
        fw.status = FireworkDisplay.FIREWORK_EXPLODED;
        fw.r = (Math.random() /2) + 0.5;
        fw.g = (Math.random() /2) + 0.5;
        fw.b = (Math.random() /2) + 0.5;
        fw.brightness = 200;
        FireworkDisplay.ctx.lineStyle(1, rgb2hex(200, 200, 200));
        // add the fragments
        var frags = Math.random() * FireworkDisplay.FIREWORK_PAYLOAD;
        for (var i4=0;i4<frags;i4++) { 
            var spark = FireworkDisplay.fireworks[FireworkDisplay.fireworks.length] = new Firework(FireworkDisplay.fireworks.length);
            spark.x = fw.x;
            spark.y = fw.y;
            spark.r = fw.r;
            spark.g = fw.g;
            spark.b = fw.b;
            spark.status = FireworkDisplay.FIREWORK_FRAGMENT;
            FireworkDisplay.disperseFirework(spark, Math.random()*FireworkDisplay.FRAGMENT_SPREAD);
        }
    },
    destroyFirework : function(fw) {
        FireworkDisplay.fireworks[fw.index] = null;
    },
    displayFirework : function(fw, speed) {
        if (fw.y<0) FireworkDisplay.destroyFirework(fw);
        if (fw.status==FireworkDisplay.FIREWORK_EXPLODED) {
            var radius         = 3;                    // Arc radius
            var startAngle     = 0;                     // Starting point on circle
            var endAngle       = Math.PI*2; // End point on circle
            var anticlockwise  = true; // clockwise or anticlockwise
            FireworkDisplay.ctx.beginFill(rgb2hex(200, 200, 200));
            FireworkDisplay.ctx.drawCircle(fw.x, FireworkDisplay.canvasheight-fw.y, radius);
            FireworkDisplay.ctx.endFill();
            return;
        }
        fw.colour = rgb2hex(80, 80, 80);
        FireworkDisplay.ctx.lineStyle(1, fw.colour);
        var forces = {x:0,y:-0.05};
        if (fw.status==FireworkDisplay.FIREWORK_FRAGMENT) {
            forces.y = FireworkDisplay.GRAVITY/-100;
            fw.colour = rgb2hex(Math.round(fw.r*fw.brightness), Math.round(fw.g*fw.brightness), Math.round(fw.b*fw.brightness));
            FireworkDisplay.ctx.lineStyle(1, fw.colour);
            fw.brightness-=5;
            if (fw.brightness<0) FireworkDisplay.destroyFirework(fw);
        }
        if (fw.dy<-1 && fw.status==FireworkDisplay.FIREWORK_LAUNCHED) {
            FireworkDisplay.explodeFirework(fw);
        }
        fw.start = {x:fw.x, y:fw.y};
        //apply accelerations
        fw.dx += forces.x*FireworkDisplay.FIREWORK_SPEED;
        fw.dy += forces.y*FireworkDisplay.FIREWORK_SPEED;
        //apply velocities
        fw.x += fw.dx*FireworkDisplay.FIREWORK_SPEED;
        fw.y += fw.dy*FireworkDisplay.FIREWORK_SPEED;
        //show
        if (fw.previous) {
            FireworkDisplay.ctx.moveTo(fw.previous.x, FireworkDisplay.canvasheight-fw.previous.y);
            FireworkDisplay.ctx.lineTo(fw.x, FireworkDisplay.canvasheight-fw.y);
        }
        fw.previous = {x:fw.start.x, y:fw.start.y};
    }
}

var Firework = function(index) {
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