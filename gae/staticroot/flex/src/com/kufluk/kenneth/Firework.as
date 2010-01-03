package com.kufluk.kenneth
{
	/**
	* Individual Firework
	* @author Kenneth Kufluk
	*/
	public class Firework {
		public var index:int;
		public var dx:Number = 0;
		public var dy:Number = 0;
		public var x:Number = 250;
		public var y:Number = 0;
		public var status:int = FIREWORK_READY;
		public var brightness:int = 255;
		public var r:Number = 1;
		public var g:Number = 1;
		public var b:Number = 1;
		public var colour:uint = 0;
		public var start:Object = {x:0, y:0};
		public var previous:Object = {x:0, y:0};
   		private static const FIREWORK_READY:int=0;
   		private static const FIREWORK_LAUNCHED:int=1;
   		private static const FIREWORK_EXPLODED:int=2;
   		private static const FIREWORK_FRAGMENT:int=3;
		public function Firework(index:int) {
			this.index = index;
		}
	    public function launchFirework(dispersion:Number, speed:Number):void {
	        this.dx = dispersion;
	        this.dy = speed;
	        this.status = FIREWORK_LAUNCHED;
	    }
	}
}
