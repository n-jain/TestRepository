BluVueSheet.TileView = function (sheet, canvas, optionsMenu, scope, setLoading, setLoaded, deselectTool) {
	var context;
    var t = this;

	this.optionsMenu=optionsMenu;
	this.sheet = sheet;

    this.deselectTool = deselectTool;
	this.tileLoader;
	this.annotationManager;
	this.keyboardControls;
	this.mouseControls;

	this.scrollX;
	this.scrollY;
	this.scale;

	this.color;
	this.textSize = 128;
    this.canDraw = false;
	var tool;
    this.animationFrameRequest = null;

	this.setLoading = function () {
	    this.canDraw = false;
	    setLoading();
	}
	this.setLoaded = function () {
        if (!this.canDraw) {
	        this.canDraw = true;
	        setLoaded();
        }
    }

	this.create = function(sheetObj){
		context=canvas.getContext('2d');

		context.imageSmoothingEnabled=false;
		context.mozImageSmoothingEnabled=false;
		context.webkitImageSmoothingEnabled=false;
		
		this.scrollX=0;
	    this.scrollY=0;
	    this.scale=1;
	    this.tileLoader = new BluVueSheet.TileLoader(sheetObj.slicesUrl, sheetObj.previewUrl, this);
	    this.keyboardControls = new BluVueSheet.KeyboardControls(this);
	    this.mouseControls = new BluVueSheet.MouseControls(this);
	    this.annotationManager = new BluVueSheet.AnnotationManager(this, scope);

		this.color=new Color(1,0,0,1);
		tool = null;

		for(var i=0; i<sheetObj.annotations.length; i++){
			this.annotationManager.loadAnnotation(sheetObj.annotations[i].data);
		}
	}

	this.dispose = function () {
	    this.canDraw = false;
	    window.cancelAnimationFrame(this.animationFrameRequest);
	    this.drawAll();

	}

	this.drawAll = function () {
	    canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		context.clearRect(0,0,canvas.width,canvas.height);
		context.save();

		if (!this.canDraw) { return; }
		context.scale(this.scale,this.scale);
		context.translate(this.scrollX, this.scrollY);
		context.rotate(scope.sheet.rotation/180*Math.PI);
		this.tileLoader.drawAllTiles(context);
		this.annotationManager.drawAllAnnotations(context);
		context.restore();
	}

	this.fitToScreen = function () {
	    var headerHeight = BluVueSheet.Constants.HeaderHeight;
	    var footerHeight = BluVueSheet.Constants.FooterHeight;
	    var canvasDim = this.tileLoader.width / canvas.width > this.tileLoader.height / (canvas.height - headerHeight - footerHeight) ? canvas.width : canvas.height - headerHeight - footerHeight;
	    var sheetDim = this.tileLoader.width / canvas.width > this.tileLoader.height / canvas.height ? this.tileLoader.width : this.tileLoader.height;
	    this.scale = 0.9 * canvasDim / sheetDim;
	    this.scrollX = (canvas.width - (this.tileLoader.width * this.scale)) / (2 * this.scale);
	    this.scrollY = (canvas.height + headerHeight - footerHeight - (this.tileLoader.height * this.scale)) / (2 * this.scale);
		this.updateRes();
	}

    this.mainLoopKeyboardControls = function() {
        t.keyboardControls.handleControls();
    }

	this.render = function(){
		t.drawAll();

		this.animationFrameRequest = requestAnimationFrame(t.render);
	}

	this.setColor = function(color){
		if(!this.annotationManager.colorSelectedAnnotations(color))this.color=color;
	}

    this.convertToUnit = function(type, subType) {
        this.annotationManager.convertToUnit(type, subType);
    }

	this.setTool = function (newTool) {
	    this.optionsMenu.deselectAllButtons();

		tool = newTool;
		this.annotationManager.finishAnnotation();
		this.annotationManager.updateOptionsMenu();
	}

	this.getTool = function(){
		return tool;
	}
	this.optionChosen = function (option) {
        switch (option) {
        case BluVueSheet.Constants.OptionButtons.Delete.id:
            this.annotationManager.deleteSelectedAnnotations();
            break;
        case BluVueSheet.Constants.OptionButtons.Fill.id:
            this.annotationManager.fillSelectedAnnotations();
            break;
        case BluVueSheet.Constants.OptionButtons.Area.id:
            this.annotationManager.areaSelectedAnnotation();
            break;
        case BluVueSheet.Constants.OptionButtons.Master.id:
            this.annotationManager.masterSelectedAnnotations();
            break;
        }
        this.annotationManager.updateOptionsMenu();
    };

	this.updateRes = function(){
		this.tileLoader.setTileRes(5);
		if(this.scale>0.038)this.tileLoader.setTileRes(4);
		if(this.scale>0.075)this.tileLoader.setTileRes(3);
		if(this.scale>0.15)this.tileLoader.setTileRes(2);
		if(this.scale>0.3)this.tileLoader.setTileRes(1);
	}
}
