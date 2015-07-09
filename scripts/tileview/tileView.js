BluVueSheet.TileView = function (sheet, canvas, scope, setLoading, setLoaded, deselectTool) {
	var context;
    var t = this;

    this.sheet = sheet;
    this.canvas = canvas;

    this.deselectTool = deselectTool;
	this.tileLoader = undefined;
	this.annotationManager = undefined;
	this.mouseControls = undefined;

	this.scrollX = undefined;
	this.scrollY = undefined;
	this.scale = undefined;

	this.color = undefined;
	this.textSize = 128;
    this.canDraw = false;
	var tool;
	this.animationFrameRequest = null;
    this.loadingStep = 0;

	this.setLoading = function () {
	    this.canDraw = false;
	    setLoading();
	};
	this.setLoaded = function () {
        if (!this.canDraw) {
	        this.canDraw = true;
	        setLoaded();
        }
    };

	this.create = function(sheetObj){
		context=canvas.getContext('2d');

		context.imageSmoothingEnabled=false;
		context.mozImageSmoothingEnabled=false;
		context.webkitImageSmoothingEnabled=false;
		
		this.scrollX=0;
	    this.scrollY=0;
	    this.scale=1;
	    this.tileLoader = new BluVueSheet.TileLoader(sheetObj.slicesUrl, sheetObj.previewUrl, this);
	    this.mouseControls = new BluVueSheet.MouseControls(this);
	    this.annotationManager = new BluVueSheet.AnnotationManager(this, scope);

		this.color=BluVueSheet.Constants.Colors[0].color;
		tool = null;

		for(var i=0; i<sheetObj.annotations.length; i++){
			this.annotationManager.loadAnnotation(sheetObj.annotations[i].data);
		}
	};

	this.dispose = function () {
	    this.canDraw = false;
	    window.cancelAnimationFrame(this.animationFrameRequest);
	    this.drawAll();

	};

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

        if( !this.canDraw ) {
            this.drawProgressIndicator();
            return;
        }

	      var tempIsShowAttachmentsButton = scope.isShowAttachmentsButton;
	      scope.isShowAttachmentsButton = this.annotationManager.getAttachments(false).length;

	      if(!tempIsShowAttachmentsButton && scope.isShowAttachmentsButton) {
		      scope.$apply();
	      }

        context.save();

        context.scale(this.scale, this.scale);
        context.translate(this.scrollX, this.scrollY);
        context.translate(canvas.width / this.scale / 2, canvas.height / this.scale / 2);

        context.rotate(scope.sheet.rotation / 180 * Math.PI);
        context.translate(-this.tileLoader.width / 2, -this.tileLoader.height / 2);

        // A default clip is applied to match the viewport, so there's no need to
        // downsample the draw rectangle to the canvas's view area.
        var drawRect = {
          x:0, y:0,
          x2:this.tileLoader.width, y2:this.tileLoader.height
        };

    		this.tileLoader.drawAllTiles( context, drawRect );
    		//debugDraw( context, drawRect );
    		this.annotationManager.drawAllAnnotations(context);

    		context.restore();
  	};

    function debugDraw( context, r ){
        context.save();
        //console.log( "drawRect", r.x, r.y, r.x2, r.y2 );
        context.beginPath();
        context.rect( r.x, r.y, r.x2, r.y2 );
        context.fillStyle = 'rgba(225,0,0,0.25)';
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = 'red';
        context.stroke();

        context.font = '400pt Times';
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillText('1', r.x-150, r.y+200);
        context.fillText('2', r.x2-150, r.y2+200);
        context.restore();
    }

    this.fitToScreen = function () {
	    var headerHeight = BluVueSheet.Constants.HeaderHeight;
	    var footerHeight = BluVueSheet.Constants.FooterHeight;
	    var canvasDim = this.tileLoader.width / canvas.width > this.tileLoader.height / (canvas.height - headerHeight - footerHeight) ? canvas.width : canvas.height - headerHeight - footerHeight;
	    var sheetDim = this.tileLoader.width / canvas.width > this.tileLoader.height / canvas.height ? this.tileLoader.width : this.tileLoader.height;
	    this.setScale( 0.8 * canvasDim / sheetDim );
	    this.setScroll( 0,0 );
	    this.updateRes();
	};

	/**
	 * Updates scrollX and scrollY, honoring any scroll clamps that may exist (e.g., edge of screen)
	 **/
	this.setScroll = function updateScrollWithClamps( x, y ) {
  	  var margin = Math.max( BluVueSheet.Constants.HeaderHeight, BluVueSheet.Constants.FooterHeight )/this.scale;
      var sheetSize = this.getSheetSize();

  	  var sw = sheetSize.width;
  	  var sh = sheetSize.height;

      var cw = (this.canvas.width/this.scale);
      var ch = (this.canvas.height/this.scale);

  	  var w2 = sw/2 - cw/2 + margin;
  	  var h2 = sh/2 - ch/2 + margin;

      if( cw > (sw + margin) )   // canvas wider than a sheet, use center
          x = 0;
      else if( x > w2 )          // narrower, enforce left clamp
          x = w2;
      else if( x < -w2 )         // narrower, enforce right clamp
          x = -w2;

      if( ch > sh + margin )   // canvas taller than a sheet, use middle
          y = h2/2;
      else if( y > h2 )               //  shorter, enforce top clamp
          y = h2;
      else if( y < -h2 )         // shorter, enforce bottom clamp
          y = -h2;

       if(cw < ch) {
          y /= 3.5 - y/7;
       }

	    this.scrollX = x;
	    this.scrollY = y;
	};

	this.setScale = function( newScale ) {
      var sheetSize = this.getSheetSize();
      var minScale = Math.min( (window.innerWidth)/sheetSize.width,
                               (window.innerHeight-180)/sheetSize.height );

      if( newScale < minScale )
          newScale = minScale;
      if( newScale > MAX_SCALE )
          newScale = MAX_SCALE;

      this.scale = newScale;
      return newScale;
	};

	this.getSheetSize = function() {
	    var theta = -this.getRotation() * Math.PI / 180;

	    return {
   	      width: Math.abs( this.tileLoader.width * Math.cos( theta ) - this.tileLoader.height * Math.sin( theta ) ),
   	      height: Math.abs( this.tileLoader.width * Math.sin( theta ) + this.tileLoader.height * Math.cos( theta ) )
	    };
	};

	this.render = function(){
		t.drawAll();

		this.animationFrameRequest = requestAnimationFrame(t.render);
	};

	this.setColor = function(color){
		if(!this.annotationManager.colorSelectedAnnotations(color))this.color=color;
	};

    this.convertToUnit = function(type, subType) {
        this.annotationManager.convertToUnit(type, subType);
    };

	this.setTool = function (newTool) {
	    this.sheet.optionsMenu.deselectAllButtons();

		tool = newTool;
		this.annotationManager.finishAnnotation();
		this.annotationManager.updateOptionsMenu();
	};

	this.getTool = function(){
		return tool;
	};

    this.getRotation = function() {
        return scope.sheet.rotation;
    };

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
        case BluVueSheet.Constants.OptionButtons.Calibrate.id:
          	this.annotationManager.updateCalibration();
            break;
        case BluVueSheet.Constants.OptionButtons.Attachments.id:
	        this.annotationManager.showAttachmentsPanel();
	        break;
        }
        this.annotationManager.updateOptionsMenu();
    };

	this.optionChosenToolbar = function (option) {
		switch (option) {
			case BluVueSheet.Constants.AnnotationMenuButtons.Delete.id:
				this.annotationManager.deleteSelectedAnnotations();
				break;
			case BluVueSheet.Constants.AnnotationMenuButtons.Fill.id:
				this.annotationManager.fillSelectedAnnotations();
				break;
			case BluVueSheet.Constants.AnnotationMenuButtons.Copy.id:
				this.annotationManager.copySelectedAnnotations();
				break;
			case BluVueSheet.Constants.AnnotationMenuButtons.Attachments.id:
				this.annotationManager.showAttachmentsPanel();
				break;
			case BluVueSheet.Constants.AnnotationMenuButtons.TypeSwitcher.states.personal.id:
			case BluVueSheet.Constants.AnnotationMenuButtons.TypeSwitcher.states.master.id:
				this.annotationManager.changeAnnotationType();
				break;
      case BluVueSheet.Constants.AnnotationMenuButtons.Ruler.id:
        this.annotationManager.showUnitsPanel();
        break;
		}
	};

    this.setSelectedOptionsForAnnotations = function(selectedAnnotations,tileView){
    	this.sheet.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
    	this.sheet.floatingToolsMenu.setSelectedToolsForAnnotations( selectedAnnotations, tileView );
    	this.sheet.floatingOptionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
    };

	this.updateRes = function () {
	    if (this.scale > 0.75 || !this.tileLoader.levelAvailable[1]) { this.tileLoader.setTileRes(0); }
	    else if (this.scale > 0.375 || !this.tileLoader.levelAvailable[2]) { this.tileLoader.setTileRes(1); }
	    else if (this.scale > 0.1875 || !this.tileLoader.levelAvailable[3]) { this.tileLoader.setTileRes(2); }
	    else if (this.scale > 0.09375 || !this.tileLoader.levelAvailable[4]) { this.tileLoader.setTileRes(3); }
	    else { this.tileLoader.setTileRes(4); }
	};

	this.sheetCoordinatesFromScreenCoordinates = function(x, y) {
	    var centerX = this.tileLoader.width / 2;
	    var centerY = this.tileLoader.height / 2;

	    var x1 = x / this.scale - this.scrollX - (this.canvas.width / this.scale - this.tileLoader.width) / 2;
	    var y1 = y / this.scale - this.scrollY - (this.canvas.height / this.scale - this.tileLoader.height) / 2;

	    // rotate
	    var angle = this.getRotation() * Math.PI / 180 * -1;
	    var newX = centerX + (x1 - centerX) * Math.cos(angle) - (y1 - centerY) * Math.sin(angle);
	    var newY = centerY + (x1 - centerX) * Math.sin(angle) + (y1 - centerY) * Math.cos(angle);

	    var p = new BluVueSheet.Point(newX, newY);

	    return p;
	};

	this.screenCoordinatesFromSheetCoordinates = function (x, y) {
	    var centerX = this.tileLoader.width / 2;
	    var centerY = this.tileLoader.height / 2;

	    // rotate back
	    var angle = this.getRotation() * Math.PI / 180;
	    var newX = centerX + (x - centerX) * Math.cos(angle) - (y - centerY) * Math.sin(angle);
	    var newY = centerY + (x - centerX) * Math.sin(angle) + (y - centerY) * Math.cos(angle);

	    var x1 = newX * this.scale + this.scrollX * this.scale + (this.canvas.width - this.tileLoader.width * this.scale) / 2;
	    var y1 = newY * this.scale + this.scrollY * this.scale + (this.canvas.height - this.tileLoader.height * this.scale) / 2;

	    return new BluVueSheet.Point(x1, y1);
    };

    this.isFillableAnnotation = function(type) {
        return type != TEXT_ANNOTATION && type != HIGHLIGHTER_ANNOTATION &&
            type != LINE_ANNOTATION && type != ARROW_ANNOTATION &&
            type != MEASURE_ANNOTATION && type != SCALE_ANNOTATION;
    };
};
