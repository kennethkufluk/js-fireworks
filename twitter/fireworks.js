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

!function(){
  var GRAVITY = 5,
      FRAME_RATE = 30,
      DEPLOYMENT_RATE = 30,
      FIREWORK_SPEED = 3,
      DISPERSION_WIDTH = 1,
      DISPERSION_HEIGHT = 2,
      FIREWORK_PAYLOAD = 10,
      FRAGMENT_SPREAD = 8,
      TEXT_LINE_HEIGHT = 70,
      FIREWORK_READY = 0,
      FIREWORK_LAUNCHED = 1,
      FIREWORK_EXPLODED = 2,
      FIREWORK_FRAGMENT = 3,
      canvas = 0,
      canvaswidth = 0,
      canvasheight = 0,
      ctx = 0,
      blockPointer = 0,
      fireworks = [],
      allBlocks = new Array(),
      gameloop = 0,
      tweets=[],
      tweetcount=0;

  var updateDisplay = function() {
    ctx.clearRect(0, 0, canvaswidth, canvasheight);
    var firecount = 0;
    for (var i=0;i<fireworks.length;i++) {
      if (!fireworks[i]) continue;
      if (fireworks[i].status!=FIREWORK_EXPLODED) {
        firecount++;
      }
      displayFirework(fireworks[i]);
    }
    if (firecount == 0) {
        launchText();
    }

    $('#fireCount').html(firecount);
  };
  var addFireworks = function() {
    if (blockPointer>=allBlocks.length) {
      return;
    }
    var fw = fireworks[fireworks.length] = new Firework(fireworks.length);
    var targetx = allBlocks[blockPointer][0];
    targetx = (((targetx)) / 400) * DISPERSION_HEIGHT;
    var targety = allBlocks[blockPointer][1] + 50;

    // Note to future self:
    // You're not calculating final positions, just initial velocity and angle
    // Which makes calculating final positions *really hard*
    // So best not to try, really
    targety = (((-targety) / 100) * DISPERSION_WIDTH) + 4.5;
    launchFirework(fw, targetx, targety);
    blockPointer++;
    setTimeout(addFireworks, 1000/DEPLOYMENT_RATE);
  };
  var launchText = function() {
    tweetcount = tweetcount % tweets.length;
    var tweet = tweets[tweetcount++];
    var text = tweet.text;
    if (text.substr(0,4)=='RT @' || text.substr(0,1)=='@') {
      return launchText();
    }
    text = text.replace(/https?:\/\/.+?(,| |$)/, ''); //strip URLs
    text = text.replace(/&amp;/, '&'); //strip entities

    //{"from_user_id_str":"52795855","profile_image_url":"http://a0.twimg.com/profile_images/392241937/BreakfastArea_normal.JPG","created_at":"Sun, 20 Mar 2011 22:35:01 +0000","from_user":"couture_drapery","id_str":"49599855135428609","metadata":{"result_type":"recent"},"to_user_id":null,"text":"Happy Birthday Twitter 5yrs old!!!!!!!","id":49599855135428610,"from_user_id":52795855,"geo":null,"iso_language_code":"en","to_user_id_str":null,"source":"&lt;a href=&quot;http://twitter.com/&quot;&gt;web&lt;/a&gt;"}

    $('#author').html('<img src="' + tweet.profile_image_url + '">' +
                     '<p>@' + tweet.from_user + '</p>');



    fireworks = [];
    blockPointer = 0;
    clearTimeout(gameloop);
    //CANVAS
    canvas = $("#cv").get(0);
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = "2";
    ctx.strokeStyle = "rgb(255, 255, 255)";
    canvaswidth = $(window).width();
    canvasheight = $(window).height() - 100;

    if (_gaq) _gaq.push(['_trackEvent', 'Tweet', text]);

    function charsPerLine(lineno, width, height) {
      return (width / 100);
    }

/*
    // break into lines
    var lines = [''];
    var lineno = 0;
    var textwords = text.split(/ /);
    for (var i=0, word; word=textwords[i] ;i++) {
      if (lines[lineno].length+word.length > charsPerLine(lineno, canvaswidth, canvasheight)) {
//        lines[lineno] = lines[lineno].replace(/ $/,'');
        lineno++;
        lines[lineno] = word;
      } else {
        lines[lineno] += word + ' ';
      }
    }

    // add to a larger array of all points
    allBlocks = new Array();
    for (var k=0; k<lines.length; k++) {
      var line = lines[k];
      for (var i=0;i<line.length;i++) {
        var char = FONT_FIREWORK[line.charAt(i)];
        if (!char) continue;
        for (var j=0;j<char.length;j++) {
          var charpixel = char[j];
          var centreOffset = line.length / 2;
          allBlocks.push([charpixel[0] + ((i - centreOffset)*40), charpixel[1] + (k*50)]);
        }
      }
    }

*/

    // break into lines
    var lines = [''];
    var lineno = 0;
    var textwords = text.split(/ /);
    for (var i=0, word; word=textwords[i] ;i++) {
      if (lines[lineno].length+word.length > charsPerLine(lineno, canvaswidth, canvasheight)) {
//        lines[lineno] = lines[lineno].replace(/ $/,'');
        lineno++;
        lines[lineno] = word;
      } else {
        lines[lineno] += ' ' + word;
      }
    }

    // this complicated thing tries to center horizontally and vertically
    // which is not too easy.  It accounts for variation in letter with too.
    var totalHeightOffset = 0;
    var totalWidthOffset = new Array();
    var widthCounter = 0;
    totalWidthOffset[widthCounter] = 0;

    for (var i=0, line; line=lines[i] ;i++) {
      totalHeightOffset += TEXT_LINE_HEIGHT;
      widthCounter++;
      totalWidthOffset[widthCounter] = 0;

      for (var j=0, char; char=line.charAt(j) ;j++) {
        var maxWidthOffset = 0;
        var chararr = FONT_FIREWORK[char];
        if (!chararr) continue;
        for (var k=0;k<chararr.length;k++) {
          var charpoint = chararr[k];
          maxWidthOffset = Math.max(maxWidthOffset, charpoint[0]);
        }
        if (char==' ') maxWidthOffset = 20;
        totalWidthOffset[widthCounter] += maxWidthOffset + 40;
      }
    }

    allBlocks = new Array();
    var windowHeight = $(window).height();
    var offsetTop = totalHeightOffset;
    offsetTop += (windowHeight-totalHeightOffset)/6;
    var offsetLeft = 0;
    var heightOffsetCount = 0;
    for (var i=0, line; line=lines[i] ;i++) {
      heightOffsetCount++;
      offsetTop = offsetTop - TEXT_LINE_HEIGHT;
      offsetLeft = 0;
      for (var j=0, char; char=line.charAt(j) ;j++) {
        var maxWidthOffset = 0;
        var chararr = FONT_FIREWORK[char];
        if (!chararr) continue;
        for (var k=0;k<chararr.length;k++) {
          var charpoint = chararr[k];
          allBlocks[allBlocks.length] = [(charpoint[0]+offsetLeft)-(totalWidthOffset[heightOffsetCount]/2), charpoint[1]-offsetTop];
          maxWidthOffset = Math.max(maxWidthOffset, charpoint[0]);
        }
        if (char==' ') maxWidthOffset = 20;
        offsetLeft += maxWidthOffset+40;  //plus character spacing
      }
    }


    gameloop = setInterval(updateDisplay, 1000/FRAME_RATE);

    addFireworks();

  };
  var launchFirework = function(fw, dispersion, speed) {
    fw.dx = dispersion;
    fw.dy = speed;
    fw.status = FIREWORK_LAUNCHED;
  };
  var disperseFirework = function(fw, speed) {
    fw.dx = speed * (0.5-Math.random());
    fw.dy = speed * (0.5-Math.random()) + 1;
  };
  var explodeFirework = function(fw, speed) {
    fw.status = FIREWORK_EXPLODED;
    fw.r = (Math.random() /2) + 0.5;
    fw.g = (Math.random() /2) + 0.5;
    fw.b = (Math.random() /2) + 0.5;
    fw.brightness = 200;
    ctx.strokeStyle = "rgb(200, 200, 200)";
    // add the fragments
    var frags = Math.random() * FIREWORK_PAYLOAD;
    for (var i=0;i<frags;i++) {
      var spark = fireworks[fireworks.length] = new Firework(fireworks.length);
      spark.x = fw.x;
      spark.y = fw.y;
      spark.r = fw.r;
      spark.g = fw.g;
      spark.b = fw.b;
      spark.status = FIREWORK_FRAGMENT;
      disperseFirework(spark, Math.random()*FRAGMENT_SPREAD);
    }
  };
  var destroyFirework = function(fw) {
    delete fireworks[fw.index];
  };
  var displayFirework = function(fw, speed) {
    if (fw.y<0) destroyFirework(fw);
    if (fw.status==FIREWORK_EXPLODED) {
      ctx.beginPath();
      ctx.fillStyle = "rgb(200, 200, 200)";
      var radius     = 3;          // Arc radius
      var startAngle   = 0;           // Starting point on circle
      var endAngle     = Math.PI*2; // End point on circle
      var anticlockwise  = true; // clockwise or anticlockwise
      ctx.arc(fw.x, canvas.height-fw.y, radius, startAngle, endAngle, anticlockwise);
      ctx.fill();
      return;
    }
    fw.colour = "rgb(80, 80, 80)";
    ctx.strokeStyle = fw.colour;
    var forces = {x:0,y:-0.05};
    if (fw.status==FIREWORK_FRAGMENT) {
      forces.y = GRAVITY/-100;
      fw.colour = "rgb("+Math.round(fw.r*fw.brightness)+", "+Math.round(fw.g*fw.brightness)+", "+Math.round(fw.b*fw.brightness)+")";
      ctx.strokeStyle = fw.colour;
      fw.brightness-=5;
      if (fw.brightness<0) destroyFirework(fw);
    }
    if (fw.dy<-1 && fw.status==FIREWORK_LAUNCHED) {
      explodeFirework(fw);
    }
    fw.start = {x:fw.x, y:fw.y};
    //apply accelerations
    fw.dx += forces.x*FIREWORK_SPEED;
    fw.dy += forces.y*FIREWORK_SPEED;
    //apply velocities
    fw.x += fw.dx*FIREWORK_SPEED;
    fw.y += fw.dy*FIREWORK_SPEED;
    //show
    if (fw.previous) {
      ctx.beginPath();
      ctx.moveTo(fw.previous.x, canvas.height-fw.previous.y);
      ctx.lineTo(fw.x, canvas.height-fw.y);
      ctx.stroke();
      ctx.closePath();
    }
    fw.previous = {x:fw.start.x, y:fw.start.y};
  }

  var Firework = function(index) {
    this.index = index;
    this.dx = 0;
    this.dy = 0;
    this.x = canvaswidth/2;
    this.y = 0;
    this.status = FIREWORK_READY;
    this.brightness = 255;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.start = {x:0, y:0};
    this.previous = 0;
  }

  $(document).ready(function(){

    // reload the page when it's resized
    var resizeTimer = null;
    $(window).bind('resize', function() {
      if (document.all) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout("location.reload()", 100);
    });

    // load some tweets from twitter
    var message = "";

    $.getJSON('http://search.twitter.com/search.json?callback=?', {
        q: 'twitter 5yrs happy',
        result_type: 'mixed'
      }, function(data) {
        // kick off the fireworks
        tweets = data.results;
        launchText();
      });


  });


  // Home-made point-based font.
  var FONT_FIREWORK = {" ":[],"!":[[5,-40],[5,-30],[5,-20],[5,0]],"\"":[[20,-40],[20,-30],[5,-40],[5,-30]],"#":[[35,-40],[45,-30],[35,-30],[15,-40],[25,-30],[35,-20],[45,-10],[15,-30],[35,-10],[5,-30],[15,-20],[25,-10],[35,0],[15,-10],[5,-10],[15,0]],"%":[[45,-40],[35,-30],[15,-40],[45,-10],[5,-40],[15,-30],[25,-20],[35,-10],[45,0],[5,-30],[35,0],[15,-10],[5,0]],"&":[[35,-40],[25,-40],[35,-30],[15,-40],[35,-20],[15,-30],[25,-20],[15,-20],[25,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0],[25,10],[5,0]],"'":[[5,-40],[5,-30]],"(":[[15,-40],[5,-30],[5,-20],[5,-10],[15,0]],")":[[5,-40],[15,-30],[15,-20],[15,-10],[5,0]],"*":[[25,-40],[5,-40],[15,-30],[25,-20],[5,-20]],"+":[[20,-40],[35,-20],[20,-30],[25,-20],[15,-20],[20,-10],[5,-20],[20,0]],",":[[5,0],[5,10]],"-":[[35,-20],[25,-20],[15,-20],[5,-20]],"-":[[35,-20],[25,-20],[15,-20],[5,-20]],".":[[5,0]],"/":[[45,-40],[35,-30],[25,-20],[15,-10],[5,0]],":":[[5,-30],[5,-10]],";":[[5,-30],[5,-10],[5,0]],"<":[[15,-25],[5,-15],[15,-5]],"=":[[35,-30],[25,-30],[15,-30],[35,-10],[5,-30],[25,-10],[15,-10],[5,-10]],">":[[5,-25],[15,-15],[5,-5]],"?":[[35,-40],[25,-40],[35,-30],[15,-40],[35,-20],[5,-40],[25,-20],[15,-20],[15,0]],"@":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[35,0],[15,-15],[5,-20],[25,0],[15,-5],[5,-10],[15,5],[5,0]],"A":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"B":[[25,-40],[15,-40],[25,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"C":[[35,-40],[25,-40],[15,-40],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"D":[[35,-30],[25,-40],[15,-40],[35,-20],[5,-40],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"E":[[35,-40],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"F":[[35,-40],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"G":[[35,-40],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"H":[[35,-40],[35,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"I":[[25,-40],[15,-40],[5,-40],[15,-30],[15,-20],[15,-10],[25,0],[15,0],[5,0]],"J":[[35,-40],[25,-40],[35,-30],[35,-20],[35,-10],[25,0],[5,-10],[15,0]],"K":[[35,-40],[25,-30],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"L":[[5,-40],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"M":[[35,-40],[35,-30],[25,-30],[35,-20],[5,-40],[15,-30],[35,-10],[20,-20],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"N":[[35,-40],[35,-30],[35,-20],[5,-40],[15,-30],[25,-20],[35,-10],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"O":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"P":[[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"Q":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[5,-30],[25,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"R":[[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"S":[[35,-35],[25,-40],[15,-40],[35,-15],[25,-20],[5,-35],[35,-5],[15,-20],[5,-25],[25,0],[15,0],[5,-5]],"T":[[35,-40],[25,-40],[15,-40],[20,-30],[5,-40],[20,-20],[20,-10],[20,0]],"U":[[35,-40],[35,-30],[35,-20],[5,-40],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"V":[[35,-40],[35,-30],[35,-20],[5,-40],[5,-30],[25,-10],[5,-20],[15,-10],[20,0]],"W":[[35,-40],[35,-30],[20,-40],[35,-20],[20,-30],[5,-40],[35,-10],[20,-20],[5,-30],[35,0],[20,-10],[5,-20],[25,0],[5,-10],[15,0]],"X":[[35,-40],[25,-30],[5,-40],[15,-30],[20,-20],[25,-10],[35,0],[15,-10],[5,0]],"Y":[[35,-40],[35,-30],[5,-40],[25,-20],[5,-30],[15,-20],[20,-10],[20,0]],"Z":[[35,-40],[25,-40],[15,-40],[25,-30],[5,-40],[20,-20],[35,0],[15,-10],[25,0],[15,0],[5,0]],"_":[[45,0],[35,0],[25,0],[15,0],[5,0]],"a":[[25,-30],[35,-20],[15,-30],[35,-10],[25,-15],[5,-30],[35,0],[15,-15],[25,0],[5,-10],[15,0]],"b":[[25,-30],[35,-20],[5,-40],[15,-30],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0]],"c":[[35,-30],[25,-30],[15,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"d":[[35,-40],[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"e":[[25,-30],[35,-20],[15,-30],[25,-15],[35,0],[15,-15],[5,-20],[25,0],[5,-10],[15,0]],"f":[[25,-40],[15,-40],[25,-20],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"g":[[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[25,-10],[35,0],[5,-20],[15,-10],[25,10],[15,10],[5,10]],"h":[[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"i":[[5,-40],[5,-20],[5,-10],[5,0]],"j":[[15,-40],[15,-20],[15,-10],[15,0],[5,10]],"k":[[35,-30],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20],[5,-10],[5,0]],"l":[[5,-40],[5,-30],[5,-20],[5,-10],[15,0]],"m":[[35,-30],[45,-20],[25,-30],[45,-10],[15,-30],[25,-20],[45,0],[5,-30],[25,-10],[5,-20],[25,0],[5,-10],[5,0]],"n":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-30],[35,0],[5,-20],[5,-10],[5,0]],"o":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-20],[25,0],[5,-10],[15,0]],"p":[[25,-30],[35,-20],[15,-30],[35,-10],[5,-30],[5,-20],[25,0],[5,-10],[15,0],[5,0],[5,10]],"q":[[35,-30],[25,-30],[35,-20],[15,-30],[35,-10],[35,0],[5,-20],[25,0],[35,10],[5,-10],[15,0]],"r":[[35,-30],[25,-30],[5,-30],[15,-20],[5,-20],[5,-10],[5,0]],"s":[[35,-30],[25,-30],[15,-30],[35,-10],[25,-15],[15,-15],[5,-20],[25,0],[15,0],[5,0]],"t":[[25,-30],[5,-40],[15,-30],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"u":[[35,-30],[35,-20],[35,-10],[5,-30],[35,0],[5,-20],[25,0],[5,-10],[15,0]],"v":[[35,-30],[35,-20],[5,-30],[25,-10],[5,-20],[15,-10],[20,0]],"w":[[35,-30],[35,-20],[20,-30],[35,-10],[20,-20],[5,-30],[35,0],[20,-10],[5,-20],[25,0],[5,-10],[15,0]],"x":[[35,-30],[25,-20],[5,-30],[15,-20],[25,-10],[35,0],[15,-10],[5,0]],"y":[[35,-30],[35,-20],[35,-10],[5,-30],[25,-10],[35,0],[5,-20],[15,-10],[25,10],[15,10]],"z":[[35,-30],[25,-30],[15,-30],[25,-20],[5,-30],[35,0],[15,-10],[25,0],[15,0],[5,0]],"0":[[35,-30],[25,-40],[15,-40],[35,-20],[35,-10],[15,-25],[25,-15],[5,-30],[5,-20],[25,0],[5,-10],[15,0]],"1":[[15,-40],[15,-30],[5,-30],[15,-20],[15,-10],[15,0]],"2":[[35,-35],[25,-40],[35,-25],[15,-40],[25,-20],[5,-35],[15,-20],[35,0],[25,0],[5,-10],[15,0],[5,0]],"3":[[25,-40],[35,-30],[15,-40],[5,-40],[25,-20],[35,-10],[15,-20],[25,0],[15,0],[5,0]],"4":[[35,-40],[35,-30],[35,-20],[5,-40],[25,-20],[35,-10],[5,-30],[15,-20],[35,0],[5,-20]],"5":[[35,-40],[25,-40],[15,-40],[35,-15],[5,-40],[25,-20],[35,-5],[5,-30],[15,-20],[5,-20],[25,0],[15,0],[5,0]],"6":[[35,-40],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[5,-20],[25,0],[5,-10],[15,0]],"7":[[35,-40],[35,-30],[25,-40],[15,-40],[5,-40],[25,-20],[5,-30],[25,-10],[25,0]],"8":[[35,-35],[25,-40],[35,-25],[15,-40],[35,-15],[25,-20],[5,-35],[35,-5],[15,-20],[5,-25],[25,0],[5,-15],[15,0],[5,-5]],"9":[[35,-30],[25,-40],[15,-40],[35,-20],[25,-20],[35,-10],[5,-30],[15,-20],[5,-20],[25,0],[15,0],[5,0]]};
}();

