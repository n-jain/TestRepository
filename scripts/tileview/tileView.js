function TileView(canvas,toolMenu,optionsMenu,colorMenu,textEditor){
	var context;
	
	this.toolMenu=toolMenu;
	this.optionsMenu=optionsMenu;
	this.colorMenu=colorMenu;
	this.textEditor=textEditor;

	this.tileLoader;
	this.annotationManager;
	this.keyboardControls;
	this.mouseControls;

	this.scrollX;
	this.scrollY;
	this.scale;

	this.draw;
	this.color;
	this.textSize=128;
	var tool;

	var firstDraw;

	this.create = function(slicePath, previewPath){
		context=canvas.getContext('2d');

		context.imageSmoothingEnabled=false;
		context.mozImageSmoothingEnabled=false;
		context.webkitImageSmoothingEnabled=false;
		
		this.scrollX=0;
	    this.scrollY=0;
	    this.scale=1;
		this.tileLoader = new TileLoader(slicePath,previewPath);
		this.keyboardControls = new KeyboardControls(this);
		this.mouseControls = new MouseControls(this);
		this.annotationManager = new AnnotationManager(this);

		this.draw=false;
		this.firstDraw=false;
		this.color=new Color(1,0,0,1);
		tool=NO_TOOL;
	}

	this.drawAll = function() {
		canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		context.clearRect(0,0,canvas.width,canvas.height);
		context.save();
		context.scale(this.scale,this.scale);
		context.translate(this.scrollX, this.scrollY);
		this.tileLoader.drawAllTiles(context);
		this.annotationManager.drawAllAnnotations(context);
		context.restore();
	}

	this.mainLoop = function(){
		this.keyboardControls.handleControls();
		if(this.draw||!this.firstDraw){
			if(this.tileLoader.tiles!=null)if(this.tileLoader.loaded==this.tileLoader.tiles.length)firstDraw=true;
			this.drawAll();
		}
	}

	this.setColor = function(color){
		if(!this.annotationManager.colorSelectedAnnotations(color))this.color=color;
	}

	this.setTool = function(newTool){
		tool=newTool;
		this.annotationManager.finishAnnotation();
		this.annotationManager.updateOptionsMenu();
	}

	this.getTool = function(){
		return tool;
	}
	this.optionChosen = function(option){
		switch(option){
			case DELETE_OPTION:
				this.annotationManager.deleteSelectedAnnotations();
				break;
			case FILL_OPTION:
				this.annotationManager.fillSelectedAnnotations();
				break;
			case AREA_OPTION:
				this.annotationManager.areaSelectedAnnotation();
				break;
			case MASTER_OPTION:
				this.annotationManager.masterSelectedAnnotations();
				break;
		}
		this.annotationManager.updateOptionsMenu();
	}
	this.updateRes = function(){
		this.tileLoader.setTileRes(5);
		if(this.scale>0.063)this.tileLoader.setTileRes(4);
		if(this.scale>0.125)this.tileLoader.setTileRes(3);
		if(this.scale>0.25)this.tileLoader.setTileRes(2);
		if(this.scale>0.5)this.tileLoader.setTileRes(1);
	}
}