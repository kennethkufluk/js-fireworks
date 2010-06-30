package com.kufluk.kenneth
{
	import com.kufluk.kenneth.PointFont;
	import com.kufluk.kenneth.Firework;
	import flash.display.BitmapData;
	/*
	 * FireworkDisplay - Kenneth Kufluk (http://kenneth.kufluk.com/)
	 * MIT Licensed
	 * http://js-fireworks.appspot.com/
	 * @author Kenneth Kufluk
	 */
	public class FireworkDisplay {
		private static const GRAVITY:int=5;
		private static const FIREWORK_SPEED:int=2;
		private static const DISPERSION_WIDTH:int=1;
		private static const DISPERSION_HEIGHT:int=2;
   		private static const FIREWORK_PAYLOAD:int=30;
   		private static const FRAGMENT_SPREAD:int=8;
   		private static const TEXT_LINE_HEIGHT:int=70;
   		private static const FIREWORK_LAUNCHED:int=1;
   		private static const FIREWORK_EXPLODED:int=2;
   		private static const FIREWORK_FRAGMENT:int=3;
    	private var canvaswidth :Number= 500;
    	private var canvasheight :Number= 500;
    	private var blockPointer :int= 0;
    	private var fireworks :Array= [];
    	private var allBlocks :Array= [];
    	private static const font:PointFont = new PointFont();
    	
		public function updateDisplay(bmp:BitmapData) :void {
	        var firecount:int = 0;
	        for (var i1:int=0;i1<fireworks.length;i1++) {
	            if (fireworks[i1]==null) continue; 
	            if (fireworks[i1].status!=FIREWORK_EXPLODED) {
	                firecount++;
	            }
	            displayFirework(bmp, fireworks[i1]);
	        }
    	}
	    public function addFireworks(bmp:BitmapData) :void {
	        if (blockPointer>=allBlocks.length) {
	            return;
	        }
	        var fw:Firework = fireworks[fireworks.length] = new Firework(fireworks.length);
	        var targetx:Number = allBlocks[blockPointer][0];
	        targetx = (((targetx)) / 300) * DISPERSION_HEIGHT;
	        var targety:Number = allBlocks[blockPointer][1];
	        targety = (((10-targety) / 100) * DISPERSION_WIDTH) + 3.5;
	        fw.launchFirework(targetx, targety);
	        blockPointer++;
	    }
	    public function init() :void {
	        fireworks = [];
	        blockPointer = 0;
	        var text:String = "Not Your Mother's ActionScript";
	        var charx:int = 0;
	        var chary:int = 0;
	        var maxWidthOffset:int = 0;
	        var totalHeightOffset:int = 0;
	        var totalWidthOffset:Array = new Array();
	        var widthCounter:int = 0;
	        totalWidthOffset[widthCounter] = 0;
	        for (var i2:int=0;i2<text.length;i2++) {
	            if (text.charAt(i2)==' ') {
	                totalHeightOffset += TEXT_LINE_HEIGHT;
	                widthCounter++;
	                totalWidthOffset[widthCounter] = 0;
	            } else {
	                maxWidthOffset = 0;
	                for (var j1:int=0;j1<font.FONT[text.charAt(i2)].length;j1++) {
	                    charx = font.FONT[text.charAt(i2)][j1][0];
	                    maxWidthOffset = Math.max(maxWidthOffset, charx);
	                }
	                totalWidthOffset[widthCounter] += maxWidthOffset + 40;
 	            }
	        }
	
	
	        allBlocks = new Array();
	        var windowHeight:int = 500;
	        var offsetTop:int = totalHeightOffset;
	        offsetTop += (windowHeight-totalHeightOffset)/6;
	        var offsetLeft:int = 0;
	        var heightOffsetCount:int = 0;
	        for (var i3:int=0;i3<text.length;i3++) {
	            if (text.charAt(i3)==' ') {
	                heightOffsetCount++;
	                offsetTop = offsetTop - TEXT_LINE_HEIGHT;
	                offsetLeft = 0;
	            } else {
	                maxWidthOffset = 0;
	                for (var j2:int=0;j2<font.FONT[text.charAt(i3)].length;j2++) {
	                    charx = font.FONT[text.charAt(i3)][j2][0];
	                    chary = font.FONT[text.charAt(i3)][j2][1];
	                    allBlocks[allBlocks.length] = [(charx+offsetLeft)-(totalWidthOffset[heightOffsetCount]/2), chary-offsetTop];
	                    maxWidthOffset = Math.max(maxWidthOffset, charx);
	                }
	                offsetLeft += maxWidthOffset+40;  //plus character spacing
	            }
	        }

 	    }
	    public function disperseFirework(fw:Firework, speed:Number):void {
	        fw.dx = speed * (0.5-Math.random());
	        fw.dy = speed * (0.5-Math.random()) + 1;
	    }
	    public function explodeFirework(fw:Firework):void {
	        fw.status = FIREWORK_EXPLODED;
	        fw.r = (Math.random() /2) + 0.5;
	        fw.g = (Math.random() /2) + 0.5;
	        fw.b = (Math.random() /2) + 0.5;
	        fw.brightness = 200;
	        // add the fragments
	        var frags:Number = Math.random() * FIREWORK_PAYLOAD;
	        for (var i4:int=0;i4<frags;i4++) { 
	            var spark:Firework = fireworks[fireworks.length] = new Firework(fireworks.length);
	            spark.x = fw.x;
	            spark.y = fw.y;
	            spark.r = fw.r;
	            spark.g = fw.g;
	            spark.b = fw.b;
	            spark.status = FIREWORK_FRAGMENT;
	            disperseFirework(spark, Math.random()*FRAGMENT_SPREAD);
	        }
	    }
	    public function destroyFirework(fw:Firework):void {
	        fireworks[fw.index] = null;
	    }
	    public function displayFirework(bmp:BitmapData, fw:Firework):void {
	        if (fw.y<0) destroyFirework(fw);
	        if (fw.status==FIREWORK_EXPLODED) {
	            var radius:Number         = 3;                    // Arc radius
	            var startAngle:Number     = 0;                     // Starting point on circle
	            var endAngle:Number       = Math.PI*2; // End point on circle
	            var anticlockwise:Boolean  = true; // clockwise or anticlockwise
				bmp.setPixel32(fw.x, canvasheight-fw.y, 0xCCFFCCFF);
/////////////
//	            ctx.beginFill(rgb2hex(200, 200, 200));
//	            ctx.drawCircle(fw.x, canvasheight-fw.y, radius);
//	            ctx.endFill();
	            return;
	        }
	       	fw.colour = 0x66FFFFFF;
//	        ctx.lineStyle(1, fw.colour);
	        var forces:Object = {x:0,y:-0.05};
	        if (fw.status==FIREWORK_FRAGMENT) {
	            forces.y = GRAVITY/-100;
	        	fw.colour = fw.brightness << 24 | (fw.r * 0xFF) << 16 | (fw.g * 0xFF) << 8 | fw.b * 0xFF;
//	            ctx.lineStyle(1, fw.colour);
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
	        if (fw.previous.x>0) {
	            line(bmp, fw.previous.x, canvasheight-fw.previous.y, fw.x, canvasheight-fw.y, fw.colour);
	        }
	        fw.previous.x = fw.start.x;
	        fw.previous.y = fw.start.y;
	    }
		public static function line(bmp:BitmapData, x0:int, y0:int, x1:int, y1:int, c:uint):void
		{	
			var x:int = x0;
			var y:int = y0;		
			var dx:int = x1 - x0;
			var dy:int = y1 - y0;
			var xinc:int = ( dx > 0 ) ? 1 : -1;
			var yinc:int = ( dy > 0 ) ? 1 : -1;
			var cumul:int;
			var i:int;			
			
			dx = (dx ^ (dx >> 31)) - (dx >> 31);//abs
			dy = (dy ^ (dy >> 31)) - (dy >> 31);
			
			bmp.setPixel32(x, y, c);
			
			if ( dx > dy ) {
				cumul = dx >> 1 ;
		  		for ( i = 1; i <= dx; ++i ) {
					x += xinc;
					cumul += dy;
					if (cumul >= dx){
			  			cumul -= dx;
			  			y += yinc;
					}
					bmp.setPixel32(x, y, c);
				}
			} else {
		  		cumul = dy >> 1;
		  		for ( i = 1; i <= dy; ++i ) {
					y += yinc;
					cumul += dx;
					if ( cumul >= dy ) {
			  			cumul -= dy;
			  			x += xinc;
					}
					bmp.setPixel32(x, y, c);
				}
			}
		}
	}
}