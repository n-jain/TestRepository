function AnnotationManager(tileView){
	var annotations = new Array();
	var currentAnnotation;
	this.onmousedown = function(x,y){
		//create new annotation
		if(toolToAnnotation(tileView.getTool())!=NO_ANNOTATION&&currentAnnotation==null){
			var annType = toolToAnnotation(tileView.getTool());
			if(tileView.scaleAnnotation!=null)annType=MEASURE_ANNOTATION;
			var ann = new Annotation(annType, tileView);
			ann.points[0] = new Point(x,y);
			currentAnnotation = ann;
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
			if(currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION){
				currentAnnotation.points[currentAnnotation.points.length] = new Point(x,y);
			} else if(currentAnnotation.type!=POLYGON_ANNOTATION){
				currentAnnotation.points[1] = new Point(x,y);
			}
		}
	}
	this.drawAllAnnotations = function(x,y,context){
		for(var i=0; i<annotations.length; i++){
			annotations[i].drawMe(x,y,context);
		}
		if(currentAnnotation!=null){
			currentAnnotation.drawMe(x,y,context);
		}
	}
	this.finishAnnotation = function(){
		if(currentAnnotation!=null)
			if(currentAnnotation.points.length>1){
				annotations[annotations.length] = currentAnnotation;
				if(currentAnnotation.type==SCALE_ANNOTATION){
					tileView.scaleAnnotation=currentAnnotation;
				}				
			}
		currentAnnotation=null;
	}
}