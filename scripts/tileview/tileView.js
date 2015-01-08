BluVueSheet.TileView = function (sheet, canvas, scope, setLoading, setLoaded, deselectTool) {
	var context;
    var t = this;

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
    this.loadingStep = 0;

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

		this.color=BluVueSheet.Constants.Colors[0].color;
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

    this.drawProgressIndicator = function() {
        var can = canvas;
        var ctx = context;

        ctx.save();

        var totalDuration = 80;
        var duration = 20;
        var startStep2 = 15;
        var startStep3 = 30;
        var maxRadius = 8;
        var minRadius = 0;
        var radius = minRadius + (maxRadius - minRadius) * (t.loadingStep / duration);
        if (radius > maxRadius && radius <= maxRadius * 2) { radius = maxRadius - (radius - maxRadius); }
        if (radius > maxRadius * 2) { radius = 0; }
        ctx.translate(can.width / 2 - maxRadius - maxRadius, can.height / 2);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        if (t.loadingStep >= startStep2) {
            radius = minRadius + (maxRadius - minRadius) * ((t.loadingStep - startStep2) / duration);
            if (radius > maxRadius && radius <= maxRadius * 2) { radius = maxRadius - (radius - maxRadius); }
            if (radius > maxRadius * 2) { radius = 0; }
            ctx.translate(2 * maxRadius, 0);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }

        if (t.loadingStep >= startStep3) {
            radius = minRadius + (maxRadius - minRadius) * ((t.loadingStep - startStep3) / duration);
            if (radius > maxRadius && radius <= maxRadius * 2) { radius = maxRadius - (radius - maxRadius); }
            if (radius > maxRadius * 2) { radius = 0; }
            ctx.translate(2 * maxRadius, 0);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        
        t.loadingStep++;

        if (t.loadingStep > totalDuration) {
            t.loadingStep = 0;
        }
    };

    this.drawAll = function () {
	    canvas.width=window.innerWidth;
		canvas.height=window.innerHeight;
		context.clearRect(0,0,canvas.width,canvas.height);
		context.save();

		if (!this.canDraw) {
		    this.drawProgressIndicator();
		    return;
		}
		context.scale(this.scale,this.scale);
		context.translate(this.scrollX, this.scrollY);
		context.rotate(scope.sheet.rotation / 180 * Math.PI);

		var visibleLeft = this.scrollX < 0 ? this.scrollX * -1 : 0;
		var visibleTop = this.scrollY < 0 ? this.scrollY * -1 : 0;
		var visibleWidth = canvas.width / this.scale;
		var visibleHeight = canvas.height / this.scale;

		this.tileLoader.drawAllTiles(context, {
		    x: visibleLeft,
		    y: visibleTop,
		    x2: visibleLeft + visibleWidth,
		    y2: visibleTop + visibleHeight
		});
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
	    this.sheet.optionsMenu.deselectAllButtons();

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
        case BluVueSheet.Constants.OptionButtons.Perimeter.id:
            this.annotationManager.perimeterSelectedAnnotation();
            break;
        case BluVueSheet.Constants.OptionButtons.Master.id:
            this.annotationManager.masterSelectedAnnotations();
            break;
        case BluVueSheet.Constants.OptionButtons.Copy.id:
        	this.annotationManager.copySelectedAnnotations();
            break;
        }
        this.annotationManager.updateOptionsMenu();
    };

    this.setSelectedOptionsForAnnotations = function(selectedAnnotations,tileView){
    	this.sheet.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
    	this.sheet.floatingToolsMenu.setSelectedToolsForAnnotations( selectedAnnotations, tileView );
    	this.sheet.floatingOptionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
    }

	this.updateRes = function () {
	    if (this.scale > 0.75 || !this.tileLoader.levelAvailable[1]) { this.tileLoader.setTileRes(0); }
	    else if (this.scale > 0.375 || !this.tileLoader.levelAvailable[2]) { this.tileLoader.setTileRes(1); }
	    else if (this.scale > 0.1875 || !this.tileLoader.levelAvailable[3]) { this.tileLoader.setTileRes(2); }
	    else if (this.scale > 0.09375 || !this.tileLoader.levelAvailable[4]) { this.tileLoader.setTileRes(3); }
	    else { this.tileLoader.setTileRes(4); }
	}
}
