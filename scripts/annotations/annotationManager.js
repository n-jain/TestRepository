function AnnotationManager(tileView){
	var annotations = new Array();
	var selectedAnnotations = new Array();
	var currentAnnotation;
	this.scaleAnnotation;

	this.onmousedown = function(x,y){
		//create new annotation
		if(toolToAnnotation(tileView.getTool())!=NO_ANNOTATION&&currentAnnotation==null){
			var annType = toolToAnnotation(tileView.getTool());
			if(this.scaleAnnotation!=null&&tileView.getTool()==RULER_TOOL)annType=MEASURE_ANNOTATION;
			var ann = new Annotation(annType, tileView);
			ann.points[0] = new Point(x,y);
			currentAnnotation = ann;

			if(currentAnnotation.type==MEASURE_ANNOTATION){
				currentAnnotation.measurement = new Measurement(0,this.scaleAnnotation.measurement.unit,LENGTH);
			}
		}
		//add point to existing polygon annotation
		if(tileView.getTool()==POLYGON_TOOL){
			currentAnnotation.points[currentAnnotation.points.length] = new Point(x,y);
		}
	}
	this.onmouseup = function(x,y){
		if(tileView.getTool()!=POLYGON_TOOL){
			this.finishAnnotation();
			if(tileView.getTool()!=PEN_TOOL&&tileView.getTool()!=HIGHLIGHTER_TOOL)tileView.setTool(NO_TOOL);
		}
	}
	this.onmousemove = function(x,y){
		if(currentAnnotation!=null){
			if(currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION||currentAnnotation.type==LASSO_ANNOTATION){
				currentAnnotation.points[currentAnnotation.points.length] = new Point(x,y);
			} else if(currentAnnotation.type!=POLYGON_ANNOTATION){
				currentAnnotation.points[1] = new Point(x,y);
			}
			if(currentAnnotation.type==MEASURE_ANNOTATION){
				currentAnnotation.updateMeasure();
			}
		}
	}
	this.onclick = function(x,y){
		var lastSelectedId="";
		if(selectedAnnotations.length==1)lastSelectedId=selectedAnnotations[0].id;
		//get which annotations are touched
		var touchedAnnotations = new Array(); 
		for(var i=0;i<annotations.length; i++){
			var bounds = annotations[i].bounds;
			if(bounds.width()*tileView.scale<30)
				bounds=bounds.inset(-(20/tileView.scale),0);
			if(bounds.height()*tileView.scale<30)
				bounds=bounds.inset(0,-(20/tileView.scale));			
			if(bounds.contains(x,y))  {
				touchedAnnotations[touchedAnnotations.length]=annotations[i];
			}
		}
		//get which are selected already
		var selected = new Array();
		var anySelected = false;
		for(var i=0; i<touchedAnnotations.length; i++){
			selected[i] = touchedAnnotations[i].selected;
			if(selected[i])anySelected=true;
		}
		//decide what to do
		if(touchedAnnotations.length==0){
			for(var i=0; i<annotations.length; i++){
				annotations.selectIndex=0;
			}
			if(selectedAnnotations.length!=0){
				this.deselectAllAnnotations();				
			}
		} else {
			for(var i=0; i<touchedAnnotations.length; i++){
				if(!anySelected){
					var ann = touchedAnnotations[i];
					if(ann.selectIndex<=0){
						this.selectSingleAnnotation(touchedAnnotations[i]);
						ann.selectIndex = touchedAnnotations.length;
						break;
					}
				}
				if(selected[i]&&touchedAnnotations[i].type!=TEXT_ANNOTATION){
					this.deselectAllAnnotations();
				}
			}
			for(var i=0;i<touchedAnnotations.length; i++){
				if(!anySelected)touchedAnnotations[i].selectIndex-=1;	
			}
		}
	}
	this.selectSingleAnnotation = function(annotation){
		this.deselectAllAnnotations();
		this.selectAnnotation(annotation);
		selectedAnnotations[selectedAnnotations.length]=annotation;
		annotation.selected=true;
		annotation.showHandles=true;
	}
	this.selectAnnotation = function(annotation){
		selectedAnnotations[selectedAnnotations.length]=annotation;
		annotation.selected=true;
		annotation.showHandles=true;
	}
	this.deselectAllAnnotations = function(){
		selectedAnnotations=new Array();
		for(var i=0;i<annotations.length; i++){
			annotations[i].selected=false;
			annotations[i].showHandles=false;
		}
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
							measurement=createMeasurement(measureString);
							currentAnnotation.measurement=measurement;
						}
					}
					if(!del)this.scaleAnnotation=currentAnnotation;
				}
				if(!del){
					currentAnnotation.calcBounds();
					annotations[annotations.length] = currentAnnotation;
				}
			}
		}
		currentAnnotation=null;
	}
	this.clearAnnotations = function(){
		annotations = new Array();
		this.scaleAnnotation=null;
	}
}
function removeFromArray(array, element){
	array.splice(array.indexOf(element),1);
}