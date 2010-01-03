package  
{
	import com.kufluk.kenneth.FireworkDisplay;

	import flash.display.BitmapData;

	/**
	 * Particle manager implementing simple LinkedList
	 * @author Eugene Zatepyakin
	 */
	public class FireworkManager 
	{
		public static const MAX_PARTICLES:uint = 5000;
		public static const VMAX:Number = 0.013;
		public static const VMAX2:Number = VMAX * VMAX;
		
		public static const fwdisplay:FireworkDisplay = new FireworkDisplay();
		
		
		public function FireworkManager() 
		{
			fwdisplay.init();
			reset();
		}
		
		public function update(bmp:BitmapData):void
		{
			// add fireworks if needed
			fwdisplay.addFireworks(bmp);
			// update firework positions
			// draw fireworks
			fwdisplay.updateDisplay(bmp);

		}
		
		public function reset():void
		{
		}
		
		public function addParticles(x:Number, y:Number, n:int):void
		{
		}
		
		public function addParticle(x:Number, y:Number):void
		{
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