BluVueSheet.AnnotationManager = function(tileView, scope){
    var annotations = new Array();
	var selectedAnnotations = new Array();
	var toSave = new Array();
	var currentAnnotation = null;
	var lasso = null;
	var touchedHandle=-1;
	var cancelClick=false;
	this.captureMouse=false;
	this.captureKeyboard=false;
	this.scaleAnnotation = null;
	var me = this;

	var removeFromArray = function(array, element){
	    array.splice(array.indexOf(element),1);
	}

	setInterval(function(){
		for(var i=0; i<toSave.length; i++){
			me.saveAnnotation(toSave[i]);
		}
	}, 15000);

	this.onmousedown = function(x,y){
		this.captureMouse = false;
		//create new annotation
		if(toolToAnnotation(tileView.getTool())!=NO_ANNOTATION&&currentAnnotation==null){
			var annType = toolToAnnotation(tileView.getTool());
			if (this.scaleAnnotation != null && tileView.getTool() == BluVueSheet.Constants.Tools.Ruler) annType = MEASURE_ANNOTATION;
			var ann = new BluVueSheet.Annotation(annType, tileView, scope.userId, scope.sheet.projectId, scope.sheet.id);
			ann.points[0] = new BluVueSheet.Point(x, y);

			// Arrows always have a direction, so assign the END POINT now (it's point[1])
			if( annType == ARROW_ANNOTATION )
  			ann.points[1] = new BluVueSheet.Point(x,y);

			currentAnnotation = ann;
			if(ann.type==LASSO_ANNOTATION)lasso=ann;
			if(currentAnnotation.type==MEASURE_ANNOTATION){
			    currentAnnotation.measurement = new BluVueSheet.Measurement(0, this.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
			}

      if( currentAnnotation.type==FREE_FORM_ANNOTATION )
          currentAnnotation.closed = true;

			this.captureMouse = true;
		    return;
		}

		//add point to existing polygon annotation
		if(tileView.getTool()==BluVueSheet.Constants.Tools.Polygon){
		    currentAnnotation.points[currentAnnotation.points.length] = new BluVueSheet.Point(x, y);
		    this.captureMouse = true;
		    cancelClick = true;
		    return;
		}

		//check if selected annotation is being touched
		var selectIndex=-1;
		for(var i=0; i<selectedAnnotations.length; i++){
			if(selectedAnnotations[i].bounds.inset(-BOUND_DIST).contains(x,y)){
				selectIndex=i;
			}
		}

		if(selectedAnnotations.length==1){
			touchedHandle=-1;
			var annotation = selectedAnnotations[0];
			if(annotation.rectType){
				for(var i=0; i<8;i++){
					if(isHandleTouched(x,y,i,annotation))touchedHandle=i;
				}
			} else {
				for(var i=0; i<annotation.points.length;i++){
					if(isHandleTouched(x,y,i,annotation))touchedHandle=i;
				}
			}
			if(touchedHandle!=-1)this.captureMouse=true;
		}

        // panning annotations
		if(selectIndex!=-1&&touchedHandle==-1){
			for(var i=0; i<selectedAnnotations.length; i++){
				selectedAnnotations[i].x_handle = x-selectedAnnotations[i].bounds.centerX();
				selectedAnnotations[i].y_handle = y-selectedAnnotations[i].bounds.centerY();
			}
			this.captureMouse = true;
		}
	}
	this.onmouseup = function(x,y){
		var save = false;
		for(var i=0; i<selectedAnnotations.length; i++){
			if(selectedAnnotations[i].applyOffset()){
				save = true;
			}
		}
		if(touchedHandle!=-1){
			save=true;
		}
		this.captureMouse = false;
		if(tileView.getTool()!= BluVueSheet.Constants.Tools.Polygon){
		  var tool = tileView.getTool();
			this.finishAnnotation();
	    if( tool != BluVueSheet.Constants.Tools.Pen && tool != BluVueSheet.Constants.Tools.Highlighter)
  	      tileView.deselectTool();
		}
		if(lasso!=null){
			this.selectAllInLasso();
			lasso=null;
		}
		if (save) {
		    this.saveSelectedAnnotations();

        for (var i = 0; i < selectedAnnotations.length; i++) {
            if (selectedAnnotations[i].type === SCALE_ANNOTATION) {
                this.recalculateMeasurements();
                break;
            }
        }
    }
	}
	this.onmousemove = function (x, y) {
        // new annotation
		if(currentAnnotation!=null){
			if(currentAnnotation.type==FREE_FORM_ANNOTATION||currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION||currentAnnotation.type==LASSO_ANNOTATION){
			    currentAnnotation.points[currentAnnotation.points.length] = new BluVueSheet.Point(x, y);
			} else if (currentAnnotation.type != POLYGON_ANNOTATION) {
                if (currentAnnotation.rectType) {
			        if (Math.abs(x - currentAnnotation.points[0].x) < BOUND_DIST / tileView.scale) {
			            x += x < currentAnnotation.points[0].x ? -BOUND_DIST / tileView.scale : BOUND_DIST / tileView.scale;
			        }

			        if (Math.abs(y - currentAnnotation.points[0].y) < BOUND_DIST / tileView.scale) {
			            y += y < currentAnnotation.points[0].y ? -BOUND_DIST / tileView.scale : BOUND_DIST / tileView.scale;
			        }
                }

          if( currentAnnotation.type == ARROW_ANNOTATION )
          {
              // drag moves the arrowhead, not the endpoint
              currentAnnotation.points[0] = new BluVueSheet.Point(x, y);
          }
          else
  			      currentAnnotation.points[1] = new BluVueSheet.Point(x, y);
			}
			if(currentAnnotation.type==MEASURE_ANNOTATION){
				currentAnnotation.updateMeasure();
			}
		} else if (this.captureMouse) {
			if(touchedHandle==-1){
				for(var i=0; i<selectedAnnotations.length; i++) {
					//move text box if it is present
					tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[i]));
					tileView.sheet.floatingToolsMenu.setLoc(calcFloatingToolsMenuLocation(selectedAnnotations));
					tileView.sheet.floatingOptionsMenu.setLoc(calcFloatingOptionsMenuLocation(selectedAnnotations));
					selectedAnnotations[i].offsetTo(x,y);
				}
			} else {
				var annotation = selectedAnnotations[0];
				if (annotation.rectType) {
				    annotation.scaleWithHandleTo(x, y, touchedHandle);
				    tileView.sheet.textEditor.setLoc(calcTextEditorLocation(annotation));
					tileView.sheet.floatingToolsMenu.setLoc(calcFloatingToolsMenuLocation(selectedAnnotations));
					tileView.sheet.floatingOptionsMenu.setLoc(calcFloatingOptionsMenuLocation(selectedAnnotations));
				} else {
			        annotation.points[touchedHandle] = new BluVueSheet.Point(x, y);
				    annotation.calcBounds();
				    annotation.updateMeasure();

				    if (annotation.type === SCALE_ANNOTATION) {
				        for (var i = 0; i < annotations.length; i++) {
				            annotations[i].updateMeasure();
				        }
				    }
					tileView.sheet.floatingToolsMenu.setLoc(calcFloatingToolsMenuLocation(selectedAnnotations));
					tileView.sheet.floatingOptionsMenu.setLoc(calcFloatingOptionsMenuLocation(selectedAnnotations));
				}
			}

			cancelClick=true;
		}
	}
	this.onclick = function(x,y){

        if(scope.selectedTool != null && scope.selectedTool.name == 'polygon') {
            return;
        }

	    if (cancelClick) {
	        cancelClick = false;
	        return;
	    }

	    cancelClick = false;
	    this.handleClick(x, y);
	}
	this.ondblclick = function(x,y){
	    if (tileView.getTool() == BluVueSheet.Constants.Tools.Polygon) {
			if(currentAnnotation!=null)if(currentAnnotation.type==POLYGON_ANNOTATION){
				currentAnnotation.points.splice(currentAnnotation.points.length-1,1);
				if (BluVueSheet.Point.dist(new BluVueSheet.Point(x, y), currentAnnotation.points[0]) < HANDLE_TOUCH_RADIUS / tileView.scale){
					currentAnnotation.points.splice(currentAnnotation.points.length-1,1);
					currentAnnotation.closed=true;
				}
				tileView.deselectTool();
			}
		}
	}

    this.handleClick = function(x, y) {
        //get which annotations are touched
        var touchedAnnotations = new Array();
        for (var i = 0; i < annotations.length; i++) {
            var bounds = annotations[i].bounds;
            if (bounds.width() * tileView.scale < 30)
                bounds = bounds.inset(-(20 / tileView.scale), 0);
            if (bounds.height() * tileView.scale < 30)
                bounds = bounds.inset(0, -(20 / tileView.scale));

            if (bounds.contains(x, y)) {
                touchedAnnotations[touchedAnnotations.length] = annotations[i];
            }
        }
        //get which are selected already
        var selected = new Array();
        var anySelected = false;
        for (var i = 0; i < touchedAnnotations.length; i++) {
            selected[i] = touchedAnnotations[i].selected;
            if (selected[i]) anySelected = true;
        }
        //decide what to do
        if (touchedAnnotations.length == 0) {
            for (var i = 0; i < annotations.length; i++) {
                annotations.selectIndex = 0;
            }
            if (selectedAnnotations.length != 0) {
                this.deselectAllAnnotations();
            }
        } else {
            for (var i = 0; i < touchedAnnotations.length; i++) {
                if (!anySelected) {
                    var ann = touchedAnnotations[i];
                    if (ann.selectIndex <= 0) {
                        this.selectSingleAnnotation(touchedAnnotations[i]);
                        ann.selectIndex = touchedAnnotations.length;
                        break;
                    }
                }
                if (selected[i] && touchedAnnotations[i].type != TEXT_ANNOTATION) {
                    this.deselectAllAnnotations();
                }
            }
            for (var i = 0; i < touchedAnnotations.length; i++) {
                if (!anySelected) touchedAnnotations[i].selectIndex -= 1;
            }
        }
    }

	this.textUpdate = function (text) {
		if(selectedAnnotations.length==1)
			if(selectedAnnotations[0].type==TEXT_ANNOTATION)
				selectedAnnotations[0].text=text;
	}
	this.updateTextEditorIfPresent= function(){
		if(currentAnnotation==null&&touchedHandle==-1&&selectedAnnotations.length==1) {
		    tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[0]));
			tileView.sheet.floatingToolsMenu.setLoc(calcFloatingToolsMenuLocation(selectedAnnotations));
			tileView.sheet.floatingOptionsMenu.setLoc(calcFloatingOptionsMenuLocation(selectedAnnotations));
		}
	}
	function calcTextEditorLocation(annotation) {
	    var x;
	    var y;
	    var padding = BOUND_DIST / tileView.scale;
	    var w = tileView.sheet.textEditor.getWidth() / tileView.scale;

	    switch (scope.sheet.rotation) {
	        case 90:
	            x = annotation.getPoint(0, true).x + annotation.offset_x;
	            y = annotation.getPoint(0, true).y + annotation.offset_y - padding;
	            if (y - w < 0) {
	                y = annotation.getPoint(6, true).y + annotation.offset_y + padding + w;
	            }
	            break;
	        case 180:
	            x = annotation.getPoint(6, true).x + annotation.offset_x - padding;
	            y = annotation.getPoint(6, true).y + annotation.offset_y;
	            if (x - w < 0) {
	                x = annotation.getPoint(2, true).x + annotation.offset_x + padding + w;
	            }
	            break;
	        case 270:
	            x = annotation.getPoint(4, true).x + annotation.offset_x;
	            y = annotation.getPoint(4, true).y + annotation.offset_y + padding;
	            if (y + w > window.innerWidth) {
	                y = annotation.getPoint(0, true).y + annotation.offset_y - padding - w;
	            }
	            break;
	        default:
	            x = annotation.getPoint(2, true).x + annotation.offset_x + padding;
	            y = annotation.getPoint(2, true).y + annotation.offset_y;
	            if (x + w > window.innerWidth) {
	                x = annotation.getPoint(0, true).x + annotation.offset_x - padding - w;
	            }
	            break;
	    }

	    return tileView.screenCoordinatesFromSheetCoordinates(x, y);
	}

	function calcFloatingToolsMenuLocation(annotations) {
	    var w = tileView.sheet.floatingToolsMenu.getWidth() / tileView.scale;
	    var minX = -1;
	    var maxX = -1;
	    var minY = -1;
	    var maxY = -1;

	    for (var i = 0; i < annotations.length; i++) {
	        var pmix = 0, pmax = 0, pmay = 0, pmiy = 0;

	        switch (scope.sheet.rotation) {
	            case 90:
	                pmix = annotations[i].getPoint(0, true).x;
	                pmiy = annotations[i].getPoint(0, true).y;
	                pmay = annotations[i].getPoint(6, true).y;
	                break;
	            case 180:
	                pmax = annotations[i].getPoint(4, true).x;
	                pmix = annotations[i].getPoint(6, true).x;
	                pmiy = annotations[i].getPoint(4, true).y;
	                break;
	            case 270:
	                pmix = annotations[i].getPoint(2, true).x;
	                pmiy = annotations[i].getPoint(2, true).y;
	                pmay = annotations[i].getPoint(4, true).y;
	                break;
	            default:
	                pmix = annotations[i].getPoint(0, true).x;
	                pmax = annotations[i].getPoint(2, true).x;
	                pmiy = annotations[i].getPoint(2, true).y;
	                break;
	        }

	        var offsetX = annotations[i].offset_x;
	        var offsetY = annotations[i].offset_y;
	        var amix = pmix + offsetX;
	        var amax = pmax + offsetX;
	        var amiy = pmiy + offsetY;
	        var amay = pmay + offsetY;

	        if (amix < minX || minX == -1) minX = amix;
	        if (amax > maxX || maxX == -1) maxX = amax;
	        if (amay > maxY || maxY == -1) maxY = amay;
	        if (amiy < minY || minY == -1) minY = amiy;
	    }

	    switch (scope.sheet.rotation) {
	        case 90:
	            return tileView.screenCoordinatesFromSheetCoordinates(minX + BOUND_DIST / tileView.scale, (minY + maxY + w) / 2);
	        case 180:
	            return tileView.screenCoordinatesFromSheetCoordinates((minX + maxX + w) / 2, minY - BOUND_DIST / tileView.scale);
	        case 270:
	            return tileView.screenCoordinatesFromSheetCoordinates(minX - BOUND_DIST / tileView.scale, (minY + maxY - w) / 2);
	        default:
	            return tileView.screenCoordinatesFromSheetCoordinates((minX + maxX - w) / 2, minY + BOUND_DIST / tileView.scale);
	    }
	}

	function calcFloatingOptionsMenuLocation(annotations) {
	    var w = tileView.sheet.floatingOptionsMenu.getWidth() / tileView.scale;
		var minX = -1;
		var maxX = -1;
		var minY = -1;
		var maxY = -1;
		for (var i = 0; i < annotations.length; i++) {
		    var pmix = 0, pmax = 0, pmay = 0, pmiy = 0;

		    switch (scope.sheet.rotation) {
		        case 90:
		            pmax = annotations[i].getPoint(4, true).x;
		            pmiy = annotations[i].getPoint(0, true).y;
		            pmay = annotations[i].getPoint(4, true).y;
		            break;
		        case 180:
		            pmax = annotations[i].getPoint(0, true).x;
		            pmix = annotations[i].getPoint(2, true).x;
		            pmay = annotations[i].getPoint(0, true).y;
		            break;
		        case 270:
		            pmax = annotations[i].getPoint(0, true).x;
		            pmiy = annotations[i].getPoint(0, true).y;
		            pmay = annotations[i].getPoint(6, true).y;
		            break;
		        default:
		            pmix = annotations[i].getPoint(0, true).x;
		            pmax = annotations[i].getPoint(2, true).x;
		            pmay = annotations[i].getPoint(4, true).y;
		            break;
		    }

		    var offsetX = annotations[i].offset_x;
            var offsetY = annotations[i].offset_y;
			var amix = pmix + offsetX;
			var amax = pmax + offsetX;
		    var amiy = pmiy + offsetY;
			var amay = pmay + offsetY;

			if (amix < minX || minX == -1) minX = amix;
			if (amax > maxX || maxX == -1) maxX = amax;
			if (amay > maxY || maxY == -1) maxY = amay;
		    if (amiy < minY || minY == -1) minY = amiy;
		}

		switch (scope.sheet.rotation) {
		    case 90:
                return tileView.screenCoordinatesFromSheetCoordinates(maxX + BOUND_DIST / tileView.scale, (minY + maxY + w) / 2);
		    case 180:
		        return tileView.screenCoordinatesFromSheetCoordinates((minX + maxX + w) / 2, maxY - BOUND_DIST / tileView.scale);
		    case 270:
		        return tileView.screenCoordinatesFromSheetCoordinates(maxX - BOUND_DIST / tileView.scale, (minY + maxY - w) / 2);
		    default:
		        return tileView.screenCoordinatesFromSheetCoordinates((minX + maxX - w) / 2, maxY + BOUND_DIST / tileView.scale);
        }
	}

	this.setTextSize = function(textSize){
		if(selectedAnnotations.length==1)
			if(selectedAnnotations[0].type==TEXT_ANNOTATION){
				selectedAnnotations[0].textSize=textSize;
				this.saveSelectedAnnotations();
			}
	}

	/**
	 * Selects a single annotation, clearing any previous selection, and surfacing
	 * the editor controls.
	 **/
	this.selectSingleAnnotation = function(annotation){
		this.deselectAllAnnotations();
		var valid = this.selectAnnotation(annotation);
		if(annotation.type==TEXT_ANNOTATION&&valid) {
		    this.captureKeyboard = true;
			tileView.sheet.textEditor.setText(annotation.text);
			tileView.sheet.textEditor.show(calcTextEditorLocation(annotation));
			annotation.added=true;
		}
		tileView.sheet.floatingToolsMenu.show(calcFloatingToolsMenuLocation(selectedAnnotations));
		tileView.sheet.floatingOptionsMenu.show(calcFloatingOptionsMenuLocation(selectedAnnotations));
	}

	/**
	 * Selects an array of annotations, clearing any previous selection, and
	 * surfacing the editor controls.
	 **/
	this.setSelectedAnnotations = function( annotations ) {
	  this.deselectAllAnnotations();
		for(var i=0; i<annotations.length; i++){
		  this.selectAnnotation( annotations[i] );
		}
		tileView.sheet.floatingToolsMenu.show( calcFloatingToolsMenuLocation(selectedAnnotations) );
		tileView.sheet.floatingOptionsMenu.show( calcFloatingOptionsMenuLocation(selectedAnnotations) );
	}

	/**
	 * Adds a single annotations to the selection group without surfacing the
	 * annotation editor.
	 *
	 * Implementor note:  This is probably not what you want - try using
	 * setSelectedAnnotations() or selectSingleAnnotation(), as appropriate.
	 **/
	this.selectAnnotation = function(annotation){
		if(!scope.isAdmin&&(annotation.userId==undefined||annotation.userId==""))return false;
		selectedAnnotations[selectedAnnotations.length]=annotation;
		annotation.selected=true;
		annotation.showHandles=true;
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
		return true;
	}

	this.deselectAllAnnotations = function(){
		if(selectedAnnotations.length==1){
			if(selectedAnnotations[0].type==TEXT_ANNOTATION){
				this.saveSelectedAnnotations();
			}
		}
		var toKill = new Array();
		selectedAnnotations=new Array();
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
		for(var i=0;i<annotations.length; i++){
			annotations[i].selected=false;
			annotations[i].showHandles=false;
			if(annotations[i].type==TEXT_ANNOTATION&&annotations[i].text==""&&annotations[i].added){
				toKill[toKill.length]=annotations[i];
			}
		}
		this.captureKeyboard=false;
		tileView.sheet.textEditor.hide();
		tileView.sheet.floatingToolsMenu.hide();
		tileView.sheet.floatingOptionsMenu.hide();
		for(var i=0; i<toKill.length; i++){
			removeFromArray(annotations,toKill[i]);
		}
	}
	this.selectAllInLasso = function(){
		this.deselectAllAnnotations();
		for(var i=0; i<annotations.length; i++){
			var pointsInLasso = 0;
			for(var j=0; j<8; j+=2)	if(pointInLasso(annotations[i].getPoint(j, false)))pointsInLasso++;
			if(pointsInLasso>=3){
				selectedAnnotations[selectedAnnotations.length]=annotations[i];
				annotations[i].selected=true;
			}
		}
		if(selectedAnnotations.length==1){
			selectedAnnotations[0].showHandles=true;
		}
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
		if(selectedAnnotations.length>0){
		  tileView.sheet.floatingToolsMenu.show(calcFloatingToolsMenuLocation(selectedAnnotations));
		  tileView.sheet.floatingOptionsMenu.show(calcFloatingOptionsMenuLocation(selectedAnnotations));
		}
	}
	this.deleteSelectedAnnotations = function(){
	  var self = this;
	  var dialog = new BluVueSheet.Dialog();
	  var msg =  "This will permanently delete " + (selectedAnnotations.length == 1 ? "this annotation" : (selectedAnnotations.length + " annotations") );
	  dialog.showConfirmDialog( {
	    title: "Delete Annotation?",
	    message: msg,
	    okLabel:"Delete",
	    okAction:function(){
	      var tempSelected = selectedAnnotations;
    		var reAdded = false;
    		function deleteFailed(){
    			if(!reAdded){
    				for(var i=0; i<tempSelected.length; i++){
    					var annotation=tempSelected[i];
    					annotations[annotations.length] = annotation;
    					if(annotation.type==SCALE_ANNOTATION)self.scaleAnnotation=annotation;
    				}
    				reAdded=true;
    			}
    		}
    		for(var i=0; i<selectedAnnotations.length; i++){
    			var annotation = selectedAnnotations[i];
    			removeFromArray(annotations, annotation);
    			if(annotation.type==SCALE_ANNOTATION)self.scaleAnnotation=null;
    			scope.deleteAnnotation(selectedAnnotations[i].id).then(function(){
    				//succeeded, do nothing
    			})["catch"](function(error){
    				deleteFailed();
    			})["finally"](function(){
    				//nothing else is needed
    			});
    		}
    		selectedAnnotations = new Array();
    		tileView.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
    		self.captureKeyboard=false;
    		tileView.sheet.textEditor.hide();
    		tileView.sheet.floatingToolsMenu.hide();
    		tileView.sheet.floatingOptionsMenu.hide();
	    }
	  });
	}
	this.copySelectedAnnotations = function(){
		var copies = new Array();
		for(var i=0; i<selectedAnnotations.length; i++){
			copies[i] = loadAnnotationJSON(JSON.parse(JSON.stringify(new AnnotationJSON(selectedAnnotations[i]))), tileView);
			copies[i].id = createUUID();
			copies[i].added = true;
			copies[i].offset_x = -25/tileView.scale;
			copies[i].offset_y = -25/tileView.scale;
			copies[i].applyOffset();
			this.saveAnnotation(copies[i]);
			annotations[annotations.length] = copies[i];
		}
		this.setSelectedAnnotations( copies );
	}
	this.fillSelectedAnnotations = function(){
		var totalFilled= 0, totalCanFilled = 0;
		var ret = false;
		for(var i=0; i<selectedAnnotations.length; i++) {
            if(selectedAnnotations[i].fill && tileView.isFillableAnnotation(selectedAnnotations[i].type))
                totalFilled++;

            if(tileView.isFillableAnnotation(selectedAnnotations[i].type))
                totalCanFilled++;
        }

		for(var i=0; i<selectedAnnotations.length; i++){
            if(tileView.isFillableAnnotation(selectedAnnotations[i].type)) {
                selectedAnnotations[i].fill=totalFilled<totalCanFilled;
                ret = selectedAnnotations[i].fill;
            }
		}
		this.saveSelectedAnnotations();
		return ret;
	}
	this.colorSelectedAnnotations = function(color){
		var ret = false;
		for(var i=0; i<selectedAnnotations.length; i++){
			selectedAnnotations[i].setColor(color);
			ret=true;
		}
		this.saveSelectedAnnotations();
		return ret;
	}
	this.perimeterSelectedAnnotation = function(){
		selectedAnnotations[0].perimeterMeasured=!selectedAnnotations[0].perimeterMeasured;
		if(selectedAnnotations[0].perimeterMeasured){
    	  selectedAnnotations[0].areaMeasured=false;
		    selectedAnnotations[0].measurement = new BluVueSheet.Measurement(0, this.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
		  	selectedAnnotations[0].updateMeasure();
		}
		this.saveSelectedAnnotations();
	}
	this.areaSelectedAnnotation = function(){
		selectedAnnotations[0].areaMeasured=!selectedAnnotations[0].areaMeasured;
		if(selectedAnnotations[0].areaMeasured){
    	  selectedAnnotations[0].perimeterMeasured=false;
		    selectedAnnotations[0].measurement = new BluVueSheet.Measurement(0, BluVueSheet.Measurement.toArea(this.scaleAnnotation.measurement.unit), BluVueSheet.Constants.Area);
		  	selectedAnnotations[0].updateMeasure();
		}
		this.saveSelectedAnnotations();
	}
    this.convertToUnit = function(type, subType) {
        for (var i = 0; i < selectedAnnotations.length; i++) {
            var ann = selectedAnnotations[i];
            if (type === BluVueSheet.Constants.Length && ann.type === MEASURE_ANNOTATION) {
                ann.measurement.changeToUnit(subType);
            } else if (type === BluVueSheet.Constants.Area && ann.areaMeasured) {
                ann.measurement.changeToUnit(subType);
            }
        }
       	this.saveSelectedAnnotations();
    }
  this.isAnnotationContextMaster = function(){
		for(var i=0; i<selectedAnnotations.length; i++){
			if( selectedAnnotations[i].userId ){
				return false;
			}
		}
		return true;
	}
	this.masterSelectedAnnotations = function toggleAnnotationContextMaster(){
	  this.setAnnotationContextMaster( !this.isAnnotationContextMaster() );
	}
	this.setAnnotationContextMaster = function( isMaster ) {
		for( var i = 0; i < selectedAnnotations.length; i++) {
			selectedAnnotations[i].userId = isMaster ? null : scope.userId;
		}
		this.saveSelectedAnnotations();
	}
	var pointInLasso = function(point){
		//create a horizontal line at this y value, then cross it with every line from the polygon created by lasso tool (use every other point for fast speed if needed)
		//find all intersections. count how many have an x value greater/less than. if both numbers are even, it is outside (ray goes through and comes out)
		//if odd number, then at some point ray didn't enter, only came out, so point lies inside lasso
		var intersections = new Array();
		for(var i=0; i<lasso.points.length; i++){
			var p1 = lasso.points[i];
			var p2 = lasso.points[(i+1)%lasso.points.length];
			var gx = p1.x>p2.x?p1.x:p2.x;//greater x
			var lx = p1.x<p2.x?p1.x:p2.x;//lesser x
			var gy = p1.y>p2.y?p1.y:p2.y;//""
			var ly = p1.y<p2.y?p1.y:p2.y;//""

			if(p1.x-p2.x==0){
			    if (point.y > ly && point.y < gy) intersections[intersections.length] = new BluVueSheet.Point(p1.x, point.y);
			}else{
				var m = (p2.y-p1.y)/(p2.x-p1.x);
				var xi = ((point.y-p1.y)/m) + p1.x;
				if (xi > lx && xi < gx) intersections[intersections.length] = new BluVueSheet.Point(xi, point.y);
			}
		}
		var il = 0;
		var ir = 0;
		for(var i=0; i<intersections.length; i++){
			if(intersections[i].x>point.x)ir++;
			else if(intersections[i].x<point.x)il++;
		}
		return ir%2==1&&il%2==1;
	}
	this.drawAllAnnotations = function(context){
		for(var i=0; i<annotations.length; i++){
			annotations[i].drawMe(context);
		}
		if(currentAnnotation!=null){
			currentAnnotation.drawMe(context);
		}
	}
	this.recalculateMeasurements = function() {
	    for (var j = 0; j < annotations.length; j++)
	    {
          if( annotations[j].measurement !== null && annotations[j].type !== SCALE_ANNOTATION )
          {
              this.saveAnnotation( annotations[j] );
              annotations[j].updateMeasure();
          }
      }
	}

	this.updateCalibration = function( annotation, onSuccess ) {
	    var mgr = this;
	    annotation = annotation || selectedAnnotations[0];

			var dialog = new BluVueSheet.Dialog();
      var holder = angular.element( "<div class='bluvue-editor-holder'/>" );
      var defaultValue = annotation.measurement ? (" value='"+annotation.measurement.amount+"'") : "";
      var editor = angular.element( "<input class='bluvue-scale-edit'"+defaultValue+"></input>" );
      editor.on( 'click', function(e){ e.stopPropagation(); } );
      holder.append( editor );

      var unitType = BluVueSheet.Constants.Length;
      var units = BluVueSheet.Constants.UnitNames[ unitType ];
      var displayNames = BluVueSheet.Constants.UnitDisplayNames[ unitType ];
      var defaultUnit = annotation.measurement ? annotation.measurement.unit : 1;  // unit[1] is FT
      var unitEditor = angular.element( "<select class='bluvue-annotation-unit-edit'></select>" );
      for( var i=0; i<units.length; i++ )
      {
          if( units[i] != 'FTIN' )
          {
            // unit id is i, unit name is displayNames[i]
              var selected = (i == defaultUnit) ? " selected" : "";
              unitEditor.append( angular.element( "<option value='" + i + "'" + selected + ">"+ displayNames[i] +"</option>") );
          }
      }
      unitEditor.on( 'click', function(e){ e.stopPropagation(); } );
      holder.append( unitEditor );

      var entryValidator = function entryValidator( okButton ){
          var txtVal = editor.val();
          var valid = txtVal && !isNaN( Number( txtVal ) );
          okButton.css( 'visibility', valid?'visible':'hidden' );
      }

      // Spoof BluVueSheet.KeyboardControls to make it not eat our keypresses
      var oldKeyCapture = this.captureKeyboard;
      this.captureKeyboard=true;
      dialog.showConfirmDialog( {
          title: 'Calibrate Scale',
          //message: 'Enter Scale with Units',
          message: "Enter Scale with Units",
          bodyElement: holder,
          okLabel:'Set',
          validatorFactory: function createValidator( okButton ) {
              editor.on( 'change keypress paste input', function(){
                  entryValidator(okButton);
              });

              // Validate the initial condition too...
              entryValidator( okButton );
          },
          okAction: function saveScaleCalibrationAction() {
              var amount = Number( editor.val() );
              var unit = parseInt( unitEditor[0].value,10 );
              annotation.measurement = new BluVueSheet.Measurement( amount, unit, unitType );
  						mgr.scaleAnnotation=annotation;
  						if( onSuccess )
  						    onSuccess( annotation );
  						else
  						    mgr.saveAnnotation( annotation );
  						mgr.recalculateMeasurements();
          },
          cancelAction: function hideAction(){
              this.captureKeyboard=oldKeyCapture;
              dialog.hide();
          }
      });
	}

	this.finishAnnotation = function()
	{
	    var mgr = this;
  	  var doSave = function doSave( annotation ) {
  	      annotation.calcBounds();
  				annotations.push( annotation );
  				if( annotation.type != TEXT_ANNOTATION )
  				{
  					 annotation.added = true;
  					 mgr.saveAnnotation( annotation );
  				}
  	  };

  		if( currentAnnotation!=null )
  		{
          this.deselectAllAnnotations();
          if( currentAnnotation.points.length>1 && currentAnnotation.type!=LASSO_ANNOTATION )
          {
              if( currentAnnotation.type==SCALE_ANNOTATION )
              {
                  this.updateCalibration( currentAnnotation, doSave );
              }
              else
              {
                  doSave( currentAnnotation );
              }
          }
          if(currentAnnotation.type==TEXT_ANNOTATION)
              this.selectSingleAnnotation(currentAnnotation);

          cancelClick=true;
      }
      currentAnnotation=null;
  }
	this.updateOptionsMenu = function(){
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
	}
	var isHandleTouched = function(x,y,id,annotation){
		var handleLoc = annotation.rectType?annotation.getPoint(id,true):annotation.points[id];
		return BluVueSheet.Point.dist(new BluVueSheet.Point(x, y), handleLoc) < HANDLE_TOUCH_RADIUS / tileView.scale;
	}
	this.loadAnnotation = function(jsonString){
		var annotation = loadAnnotationJSON(JSON.parse(jsonString), tileView);
		annotation.added=true;
		if(annotation.type==SCALE_ANNOTATION){
			this.scaleAnnotation=annotation;
			for(var i=0; i<annotations.length; i++){
				annotations[i].updateMeasure();
			}
		}
		annotations[annotations.length] = annotation;
	}
	this.saveSelectedAnnotations = function(){
	    for (var i = 0; i < selectedAnnotations.length; i++) {
            if (selectedAnnotations[i].type === TEXT_ANNOTATION && selectedAnnotations[i].text.length === 0) {
                continue;
            }
			this.saveAnnotation(selectedAnnotations[i]);
		}
	}
	this.saveAnnotation = function(annotation){
	    scope.saveAnnotation(annotation.id, annotation.projectId, annotation.sheetId, annotation.userId === undefined ? null : annotation.userId, annotation.type, new AnnotationJSON(annotation)).then(function () {
			removeFromArray(toSave, annotation);
		})['catch'](function(error){
			if(toSave.indexOf(annotation)==-1){
				toSave[toSave.length]=annotation;
			}
		});
	}

	/**
	 * Called by the system when an annotation is externally updated.  Updates
	 * will be passed as an array of annotation state objects (deserialized JSON
	 * states).
	 **/
	this.onExternalAnnotationUpdate = function onExternalAnnotationUpdate( annotations ) {
	  console.log( "TODO: Implement annotationManager.onExternalAnnotationUpdate()" );
	}


	/**
	 * Called by the system when an annotation is externally deleted.  Updates
	 * will be passed as an array of annotation ids.
	 **/
	this.onExternalAnnotationDelete = function onExternalAnnotationDelete( annotations ) {
	  console.log( "TODO: Implement annotationManager.onExternalAnnotationDelete()" );
	}
}
