BluVueSheet.TileView = function(canvas,toolMenu,optionsMenu,colorMenu,textEditor,scope){
	var context;
    var t = this;
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

	this.create = function(sheet){
		context=canvas.getContext('2d');

		context.imageSmoothingEnabled=false;
		context.mozImageSmoothingEnabled=false;
		context.webkitImageSmoothingEnabled=false;
		
		this.scrollX=0;
	    this.scrollY=0;
	    this.scale=1;
	    this.tileLoader = new BluVueSheet.TileLoader(sheet.slicesUrl, sheet.previewUrl, this);
	    this.keyboardControls = new BluVueSheet.KeyboardControls(this);
	    this.mouseControls = new BluVueSheet.MouseControls(this);
	    this.annotationManager = new BluVueSheet.AnnotationManager(this, scope);

		this.draw=false;
		this.firstDraw=false;
		this.color=new Color(1,0,0,1);
		tool=NO_TOOL;

		for(var i=0; i<sheet.annotations.length; i++){
			this.annotationManager.loadAnnotation(sheet.annotations[i].data);
		}
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

	this.fitToScreen = function(){
		var canvasDim = this.tileLoader.width/canvas.width>this.tileLoader.height/canvas.height?canvas.width:canvas.height;
		var sheetDim = this.tileLoader.width/canvas.width>this.tileLoader.height/canvas.height?this.tileLoader.width:this.tileLoader.height;
		this.scale = 0.9*canvasDim/sheetDim;
		this.scrollX = (canvas.width-(this.tileLoader.width*this.scale))/(2*this.scale);
		this.scrollY = (canvas.height-(this.tileLoader.height*this.scale))/(2*this.scale);
		this.updateRes();
	}

	this.mainLoop = function(){
		t.keyboardControls.handleControls();
		if(t.draw||!t.firstDraw){
			if(t.tileLoader.tiles!=null)if(t.tileLoader.loaded==t.tileLoader.tiles.length)firstDraw=true;
			t.drawAll();
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
		if(this.scale>0.038)this.tileLoader.setTileRes(4);
		if(this.scale>0.075)this.tileLoader.setTileRes(3);
		if(this.scale>0.15)this.tileLoader.setTileRes(2);
		if(this.scale>0.3)this.tileLoader.setTileRes(1);
	}
}
