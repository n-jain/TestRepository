function TileView(canvas){
	var context;
	this.tileLoader;
	this.annotationManager;
	this.keyboardControls;
	this.mouseControls;

	this.scrollX;
	this.scrollY;
	this.scale;
	this.scaleAnnotation;

	this.draw;
	var firstDraw;
	var tool;

	this.create = function(){
		context=canvas.getContext('2d');

		context.imageSmoothingEnabled=false;
		context.mozImageSmoothingEnabled=false;
		context.webkitImageSmoothingEnabled=false;
		
		this.scrollX=0;
	    this.scrollY=0;
	    this.scale=1;
		this.tileLoader = new TileLoader();
		this.keyboardControls = new KeyboardControls(this);
		this.mouseControls = new MouseControls(this);
		this.annotationManager = new AnnotationManager(this);

		this.draw=false;
		this.firstDraw=false;
		tool=NO_TOOL;
	}

	this.drawAll = function() {
		canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		context.clearRect(0,0,canvas.width,canvas.height);
		context.scale(this.scale,this.scale);
		this.tileLoader.drawAllTiles(this.scrollX, this.scrollY, context);
		this.annotationManager.drawAllAnnotations(this.scrollX, this.scrollY, context);
		context.scale(1/this.scale,1/this.scale);
	}

	this.mainLoop = function(){
		this.keyboardControls.handleControls();
		if(this.draw||!this.firstDraw){
			if(this.tileLoader.tiles!=null)if(this.tileLoader.loaded==this.tileLoader.tiles.length)firstDraw=true;
			this.drawAll();
		}
	}

	this.setTool = function(newTool){
		tool=newTool;
		this.annotationManager.finishAnnotation();
	}

	this.getTool = function(){
		return tool;
	}
}