package 
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.geom.ColorTransform;
	
	import flash.ui.ContextMenu;
	import flash.ui.ContextMenuItem;
	import flash.display.StageScaleMode;

	/**
	 * Fireworks application
	 * @author Kenneth Kufluk
	 * Based on FluidSolver from Eugene Zatepyakin http://blog.inspirit.ru/?p=248
	 * and JS-Fireworks http://js-fireworks.appspot.com/
	 */
	public class Main extends Sprite 
	{
		private const fade2alpha:ColorTransform = new ColorTransform( 1, 1, 1, .7);
		
		public static const sw:uint = 800;
		public static const sh:uint = 600;
		
		public static const FLUID_WIDTH:uint = 50;
		
		public static const isw:Number = 1 / sw;
		public static const ish:Number = 1 / sh;
		
		public static const aspectRatio:Number = sw * ish;
		public static const aspectRatio2:Number = aspectRatio * aspectRatio;
		
		public static var drawFluid:Boolean = true;
		public static var drawParticles:Boolean = false;
		public static var drawLines:Boolean = true;
		public static var drawMode:uint = 1;
		
		public static var screen:BitmapData = new BitmapData(sw, sh, true, 0);
		
		public static var mx:uint = 0;
		public static var my:uint = 0;
		
		public static var frameCount:uint = 0;
		
		private var display:Bitmap;
		private var fm:FireworkManager;
		
		public function Main():void 
		{
			if (stage) init();
			else addEventListener(Event.ADDED_TO_STAGE, init);
		}
		
		private function init(e:Event = null):void 
		{
			removeEventListener(Event.ADDED_TO_STAGE, init);
			
			initStage();
			
			fm = new FireworkManager();
			
			display = new Bitmap( screen, 'never', true );
			
			display.y = 40;
			
			addChild(display);

			addEventListener(Event.ENTER_FRAME, render);
		}
		
		private function render(e:Event):void 
		{			
			drawFireworksBitmap();
			frameCount = ++frameCount % 0xFFFFFFFF;
		}
		
		public function drawFireworksBitmap():void
		{
			screen.lock();
			screen.colorTransform( screen.rect, fade2alpha );
			fm.update(screen);
			screen.unlock( screen.rect );
		}
		
		private function initStage():void
		{
			stage.scaleMode = StageScaleMode.NO_SCALE;
			
			var myContextMenu:ContextMenu = new ContextMenu();
			myContextMenu.hideBuiltInItems();
			
			var copyr:ContextMenuItem = new ContextMenuItem("© kenneth :)", true, false);
			myContextMenu.customItems.push(copyr);
			
			contextMenu = myContextMenu;
		}
		
	}
	
}