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
			currentAnnotation = ann;
			if(ann.type==LASSO_ANNOTATION)lasso=ann;
			if(currentAnnotation.type==MEASURE_ANNOTATION){
			    currentAnnotation.measurement = new BluVueSheet.Measurement(0, this.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
			}
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
			this.finishAnnotation();
		    if (tileView.getTool() != BluVueSheet.Constants.Tools.Pen && tileView.getTool() != BluVueSheet.Constants.Tools.Highlighter)tileView.deselectTool();
		}
		if(lasso!=null){
			this.selectAllInLasso();
			lasso=null;
		}
		if (save) {
		    this.saveSelectedAnnotations();

            for (var i = 0; i < selectedAnnotations.length; i++) {
                if (selectedAnnotations[i].type === SCALE_ANNOTATION) {
                    // change made to scale annotation, update all measurement type annotations.
                    for (var j = 0; j < annotations.length; j++) {
                        if (annotations[j].measurement !== null && annotations[j].type !== SCALE_ANNOTATION) {
                            this.saveAnnotation(annotations[j]);
                        }
                    }
                    break;
                }
            }
        }
	}
	this.onmousemove = function (x, y) {
        // new annotation
		if(currentAnnotation!=null){
			if(currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION||currentAnnotation.type==LASSO_ANNOTATION){
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
					selectedAnnotations[i].offsetTo(x,y);
				}
			} else {
				var annotation = selectedAnnotations[0];
				if (annotation.rectType) {
				    annotation.scaleWithHandleTo(x, y, touchedHandle);
				} else {
			        annotation.points[touchedHandle] = new BluVueSheet.Point(x, y);
				    annotation.calcBounds();
				    annotation.updateMeasure();

				    if (annotation.type === SCALE_ANNOTATION) {
				        for (var i = 0; i < annotations.length; i++) {
				            annotations[i].updateMeasure();
				        }
				    }
				}
			}

			cancelClick=true;
		}
	}
	this.onclick = function(x,y){
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
		}
	}
	function calcTextEditorLocation(annotation){
		var corner = annotation.getPoint(2,true);
		var x = (corner.x+annotation.offset_x+tileView.scrollX)*tileView.scale;
		var y = (corner.y+annotation.offset_y+tileView.scrollY)*tileView.scale;
		var w = tileView.sheet.textEditor.getWidth();
		if(x+w>window.innerWidth){
			corner = annotation.getPoint(0,true);
			x = (corner.x+annotation.offset_x+tileView.scrollX)*tileView.scale-w;
		}
		return new BluVueSheet.Point(x,y);
	}
	this.setTextSize = function(textSize){
		if(selectedAnnotations.length==1)
			if(selectedAnnotations[0].type==TEXT_ANNOTATION){
				selectedAnnotations[0].textSize=textSize;
				this.saveSelectedAnnotations();
			}	
	}
	this.selectSingleAnnotation = function(annotation){
		this.deselectAllAnnotations();
		this.selectAnnotation(annotation);
		if(annotation.type==TEXT_ANNOTATION) {
		    this.captureKeyboard = true;
			tileView.sheet.textEditor.setText(annotation.text);
			tileView.sheet.textEditor.show(calcTextEditorLocation(annotation));
			annotation.added=true;
		}
	}
	this.selectAnnotation = function(annotation){
		selectedAnnotations[selectedAnnotations.length]=annotation;
		annotation.selected=true;
		annotation.showHandles=true;
		tileView.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
	}
	this.deselectAllAnnotations = function(){
		if(selectedAnnotations.length==1){
			if(selectedAnnotations[0].type==TEXT_ANNOTATION){
				this.saveSelectedAnnotations();
			}
		}
		var toKill = new Array();
		selectedAnnotations=new Array();
		tileView.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
		for(var i=0;i<annotations.length; i++){
			annotations[i].selected=false;
			annotations[i].showHandles=false;
			if(annotations[i].type==TEXT_ANNOTATION&&annotations[i].text==""&&annotations[i].added){
				toKill[toKill.length]=annotations[i];
			}
		}
		this.captureKeyboard=false;
		tileView.sheet.textEditor.hide();
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
		tileView.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
	}
	this.deleteSelectedAnnotations = function(){
		var tempSelected = selectedAnnotations;
		var reAdded = false;
		function deleteFailed(){
			if(!reAdded){
				for(var i=0; i<tempSelected.length; i++){
					var annotation=tempSelected[i];
					annotations[annotations.length] = annotation;
					if(annotation.type==SCALE_ANNOTATION)this.scaleAnnotation=annotation;
				}
				reAdded=true;
			}
		}
		for(var i=0; i<selectedAnnotations.length; i++){
			var annotation = selectedAnnotations[i];
			removeFromArray(annotations, annotation);
			if(annotation.type==SCALE_ANNOTATION)this.scaleAnnotation=null;
			scope.deleteAnnotation(selectedAnnotations[i].id).then(function(){
				//succeeded, do nothing
			})["catch"](function(error){
				deleteFailed();
			})["finally"](function(){
				//nothing else is needed
			});
		}
		selectedAnnotations = new Array();
		tileView.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
		this.captureKeyboard=false;
		tileView.sheet.textEditor.hide();
	}
	this.fillSelectedAnnotations = function(){
		var totalFilled=0;
		var ret = false;
		for(var i=0; i<selectedAnnotations.length; i++)
			if(selectedAnnotations[i].fill)
				totalFilled++;
		for(var i=0; i<selectedAnnotations.length; i++){
			selectedAnnotations[i].fill=totalFilled<selectedAnnotations.length;
			ret = selectedAnnotations[i].fill;
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
	this.areaSelectedAnnotation = function(){
		selectedAnnotations[0].areaMeasured=!selectedAnnotations[0].areaMeasured;
		if(selectedAnnotations[0].areaMeasured){
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
	this.masterSelectedAnnotations = function(){
		var master = true;
		for(var i=0; i<selectedAnnotations.length; i++){
			if(selectedAnnotations[i].userId==undefined){
				master=false;
			}
		}

		for (var i = 0; i < selectedAnnotations.length; i++) {
			selectedAnnotations[i].userId=master?undefined:scope.userId;
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
	this.finishAnnotation = function(){
		if(currentAnnotation!=null){
			this.deselectAllAnnotations();
			if(currentAnnotation.points.length>1&&currentAnnotation.type!=LASSO_ANNOTATION){
				var del = false;
				if(currentAnnotation.type==SCALE_ANNOTATION){
					var measureString;
					var cancel=false;
					var measurement;
					while(!cancel&&measurement==null){
						measureString=window.prompt("Enter Scale with Units\n(5\' 2\", 3m, etc.)");
						if(measureString==null){
							cancel=true;
							del=true;
						} else {
						    measurement = BluVueSheet.Measurement.createMeasurement(measureString);
							currentAnnotation.measurement=measurement;
						}
					}
					if(!del)this.scaleAnnotation=currentAnnotation;
				}
				if(!del){
					currentAnnotation.calcBounds();
					annotations[annotations.length] = currentAnnotation;
					if (currentAnnotation.type != TEXT_ANNOTATION) {
					    currentAnnotation.added = true;
					    this.saveAnnotation(currentAnnotation);
					}
				}
			}
			if(currentAnnotation.type==TEXT_ANNOTATION){
				this.selectSingleAnnotation(currentAnnotation);
			}
			cancelClick=true;
		}
		currentAnnotation=null;
	}
	this.updateOptionsMenu = function(){
		tileView.optionsMenu.setSelectedOptionsForAnnotations(selectedAnnotations,tileView);
	}
	var isHandleTouched = function(x,y,id,annotation){
		var handleLoc = annotation.rectType?annotation.getPoint(id,true):annotation.points[id];
		return BluVueSheet.Point.dist(new BluVueSheet.Point(x, y), handleLoc) < HANDLE_TOUCH_RADIUS / tileView.scale;
	}
	this.loadAnnotation = function(jsonString){
		var annotation = loadAnnotationJSON(JSON.parse(jsonString), tileView);
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
}
