function Annotation(type, tileView){
	this.id=createUUID();
	this.type=type;
	this.tileView=tileView;
	var alpha=type==HIGHLIGHTER_ANNOTATION?"0.6":"1";
	this.color="rgba(255,0,0,"+alpha+")";
	
	this.lineWidth=(type==HIGHLIGHTER_ANNOTATION?LINE_WIDTH_HIGHLIGHTER:LINE_WIDTH)/tileView.scale;	
	if(type!=HIGHLIGHTER_ANNOTATION)if(this.lineWidth>7.5)this.lineWidth=7.5;
	if(type==HIGHLIGHTER_ANNOTATION)if(this.lineWidth>75)this.lineWidth=75;
	
	this.points=new Array();
	
	this.measurement;

	this.drawMe = function(x,y,context){
		context.strokeStyle=this.color;
		context.lineWidth=this.lineWidth;
		drawFunctions[type].call(this,x,y,context);
	}
	this.updateMeasure;
	if(type==MEASURE_ANNOTATION)this.updateMeasure=updateMeasureLength;
	if(type==SQUARE_ANNOTATION)this.updateMeasure=updateMeasureRect;
	if(type==POLYGON_ANNOTATION||type==PEN_ANNOTATION)this.updateMeasure=updateMeasurePoly;
	this.getLength = function(){
		return Math.sqrt((this.points[1].x-this.points[0].x)*(this.points[1].x-this.points[0].x)+(this.points[1].y-this.points[0].y)*(this.points[1].y-this.points[0].y));
	}
}
function updateMeasureLength(){
	if(this.tileView.annotationManager.scaleAnnotation!=null){
		var m = this.tileView.annotationManager.scaleAnnotation.measurement;
		var l = this.tileView.annotationManager.scaleAnnotation.getLength();
		this.measurement.setAmount(m.amount*(this.getLength()/l), m.unit);
	}
}
function updateMeasureRect(tileView){

}
function updateMeasurePoly(tileView){

}
function drawArc(x1,y1,x2,y2,start,angle,context){
	context.save();
	context.beginPath();
	var centerX = (x1+x2)/2;
	var centerY = (y1+y2)/2;
	var width = x1-x2;
	var height = y1-y2;
	context.scale(width/2, height/2);
	context.arc(2*centerX/width,2*centerY/height,1,start+angle,start,false);
	context.restore();
	context.stroke();
}
function drawRectangle(x,y,context){
	if(this.points.length==2){
		context.strokeRect(this.points[0].x+x, this.points[0].y+y, this.points[1].x-this.points[0].x, this.points[1].y-this.points[0].y);
	}
}
function drawX(x,y,context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x+x;
		var y1 = this.points[0].y+y;
		var x2 = this.points[1].x+x;
		var y2 = this.points[1].y+y;
		context.beginPath();
		context.moveTo(x1,y1);
		context.lineTo(x2,y2);
		context.moveTo(x1,y2);
		context.lineTo(x2,y1);
		
		context.restore();
		context.stroke();
	}
}
function drawCircle(x,y,context){
	if(this.points.length==2){
 		drawArc(this.points[0].x+x,this.points[0].y+y,this.points[1].x+x,this.points[1].y+y,0,2*Math.PI,context);
	}
}
function drawCloud(x,y,context){
	if(this.points.length==2){
		context.save();

		var arcSize = 15;
		var gx = this.points[0].x>this.points[1].x?this.points[0].x+x:this.points[1].x+x;
		var gy = this.points[0].y>this.points[1].y?this.points[0].y+y:this.points[1].y+y;
		var lx = this.points[0].x<this.points[1].x?this.points[0].x+x:this.points[1].x+x;
		var ly = this.points[0].y<this.points[1].y?this.points[0].y+y:this.points[1].y+y;

		var currentX=gx;
		var currentY=gy;
		var wc = Math.floor((gx-lx)/(arcSize*this.lineWidth));
		var hc = Math.floor((gy-ly)/(arcSize*this.lineWidth));
		if(wc<1)wc=1;
		if(hc<1)hc=1;
		arcSizeW = (arcSize*this.lineWidth)+((gx-lx-((arcSize*this.lineWidth)*wc))/wc);
		arcSizeH = (arcSize*this.lineWidth)+((gy-ly-((arcSize*this.lineWidth)*hc))/hc);
		//draw bottom
		currentX-=arcSizeW;
		for(var i=0; i<wc; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH, 0, Math.PI,context);
			currentX-=arcSizeW;
		}
		currentX+=arcSizeW/2;
		currentY-=arcSizeH/2;
		//draw left
		for(var i=0; i<hc; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH, Math.PI/2, Math.PI,context);
			currentY-=arcSizeH;
		}
		currentX+=arcSizeW/2;
		currentY+=arcSizeH/2;
		//draw top
		for(var i=0; i<wc; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH, Math.PI, Math.PI,context);
			currentX+=arcSizeW;
		}
		currentY+=arcSizeH/2;
		currentX-=arcSizeW/2;
		//draw right
		for(var i=0; i<hc; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH, 1.5*Math.PI, Math.PI,context);
			currentY+=arcSizeH;
		}
		context.restore();
		context.stroke();
	}
}
function drawPoints(x,y,context){
	if(this.points.length>1){
		context.save();
		context.beginPath();
		context.moveTo(this.points[0].x+x,this.points[0].y+y);
		for(var i=1; i<this.points.length; i++){
			context.lineTo(this.points[i].x+x,this.points[i].y+y);
		}
		context.restore();
		context.stroke();
	}
}
function drawText(x,y,context){

}
function drawLine(x,y,context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x+x;
		var y1 = this.points[0].y+y;
		var x2 = this.points[1].x+x;
		var y2 = this.points[1].y+y;
		context.beginPath();
		context.moveTo(x1,y1);
		context.lineTo(x2,y2);
		
		context.restore();
		context.stroke();
	}
}
function drawArrow(x,y,context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x+x;
		var y1 = this.points[0].y+y;
		var x2 = this.points[1].x+x;
		var y2 = this.points[1].y+y;
		context.beginPath();
		
		context.moveTo(x1,y1);
		context.lineTo(x2,y2);
		
		var angle = Math.atan((y2-y1)/(x2-x1));
		if((x2-x1)<0)angle+=Math.PI;
		var length = this.lineWidth*20;
		var da = Math.PI/6;
		//draw two arrow things
		context.moveTo(x1,y1);
		context.lineTo(x1+(length*Math.cos(angle+da)), y1+(length*Math.sin(angle+da)));
		
		context.moveTo(x1,y1);
		context.lineTo(x1+(length*Math.cos(angle-da)), y1+(length*Math.sin(angle-da)));	

		context.restore();
		context.stroke();
	}
}
function drawScale(x,y,context){
	if(this.points.length==2){
		var x1 = this.points[0].x+x;
		var y1 = this.points[0].y+y;
		var x2 = this.points[1].x+x;
		var y2 = this.points[1].y+y;

		context.save();

		var baseEndLength = 8;
		var measureSpace;
		if(this.measurement!=null){
			var myLength = this.getLength();
			var textSize = 22*this.lineWidth;
			var text = this.measurement.toString();
			context.font = textSize+"px Verdana";
			while(context.measureText(text).width>(myLength/3.5)&&textSize>16){
				textSize-=4*this.lineWidth;
				context.font = textSize+"px Verdana";
			}
			measureSpace = context.measureText(text).width/myLength;
		} else {
			measureSpace = 0;
		}

		//text space
		var bx1=x1+(x2-x1)*(0.5-measureSpace/1.5);
		var by1=y1+(y2-y1)*(0.5-measureSpace/1.5);
		var bx2=x1+(x2-x1)*(0.5+measureSpace/1.5);
		var by2=y1+(y2-y1)*(0.5+measureSpace/1.5);

		//ends
		var endLength = baseEndLength*this.lineWidth;
		var theta = Math.atan2((y2-y1),(x2-x1));

		context.beginPath();

		//first half
		context.moveTo(x1, y1);
		context.lineTo(bx1, by1);
		
		//second half
		context.moveTo(bx2, by2);
		context.lineTo(x2, y2);
		
		//end 1
		var angle1 = (Math.PI/8)*3;
		var angle2 = (Math.PI/8)*5;
		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta+angle1)*endLength), y1+(Math.sin(theta+angle1)*endLength));
		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta-angle1)*endLength), y1+(Math.sin(theta-angle1)*endLength));

		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta+angle2)*endLength), y1+(Math.sin(theta+angle2)*endLength));
		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta-angle2)*endLength), y1+(Math.sin(theta-angle2)*endLength));

		//end 2
		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta+angle1)*endLength), y2+(Math.sin(theta+angle1)*endLength));
		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta-angle1)*endLength), y2+(Math.sin(theta-angle1)*endLength));			

		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta+angle2)*endLength), y2+(Math.sin(theta+angle2)*endLength));
		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta-angle2)*endLength), y2+(Math.sin(theta-angle2)*endLength));

		//draw text
		if(this.measurement!=null){
			var cx = (x2+x1)/2;
			var cy = (y2+y1)/2;

			context.save();

			context.translate(cx,cy);
			context.rotate(theta);
			if(x1>x2){
				context.rotate(Math.PI);
			}
			context.fillStyle = this.color;
			context.textAlign = "center";
			
			context.fillText(this.measurement.toString(),0,textSize/3);

			context.restore();
		}

		context.restore();
		context.stroke();
	}
}
function drawMeasure(x,y,context){
	if(this.points.length==2){
		var x1 = this.points[0].x+x;
		var y1 = this.points[0].y+y;
		var x2 = this.points[1].x+x;
		var y2 = this.points[1].y+y;

		context.save();

		var baseEndLength = 8;
		var measureSpace;

		var baseEndLength = 8;
		var measureSpace;
		if(this.measurement!=null){
			console.log(this.measurement);
			var myLength = this.getLength();
			var textSize = 22*this.lineWidth;
			var text = this.measurement.toString();
			context.font = textSize+"px Verdana";
			while(context.measureText(text).width>(myLength/3.5)&&textSize>16){
				textSize-=4*this.lineWidth;
				context.font = textSize+"px Verdana";
			}
			measureSpace = context.measureText(text).width/myLength;
		} else {
			measureSpace = 0;
		}
		
		//text space
		var bx1=x1+(x2-x1)*(0.5-measureSpace/1.5);
		var by1=y1+(y2-y1)*(0.5-measureSpace/1.5);
		var bx2=x1+(x2-x1)*(0.5+measureSpace/1.5);
		var by2=y1+(y2-y1)*(0.5+measureSpace/1.5);

		context.beginPath();

		//first half
		context.moveTo(x1, y1);
		context.lineTo(bx1, by1);
		
		//second half
		context.moveTo(bx2, by2);
		context.lineTo(x2, y2);

		//ends
		var endLength = baseEndLength*this.lineWidth;
		var theta = Math.atan2((y2-y1),(x2-x1));

		//end 1
		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta+Math.PI/2)*endLength), y1+(Math.sin(theta+Math.PI/2)*endLength));
		context.moveTo(x1,y1);
		context.lineTo(x1+(Math.cos(theta-Math.PI/2)*endLength), y1+(Math.sin(theta-Math.PI/2)*endLength));
		
		//end 2
		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta+Math.PI/2)*endLength), y2+(Math.sin(theta+Math.PI/2)*endLength));
		context.moveTo(x2,y2);
		context.lineTo(x2+(Math.cos(theta-Math.PI/2)*endLength), y2+(Math.sin(theta-Math.PI/2)*endLength));	

		//draw text
		if(this.measurement!=null){
			var cx = (x2+x1)/2;
			var cy = (y2+y1)/2;

			context.save();

			context.translate(cx,cy);
			context.rotate(theta);
			if(x1>x2){
				context.rotate(Math.PI);
			}
			context.fillStyle = this.color;
			context.textAlign = "center";
			
			context.fillText(this.measurement.toString(),0,textSize/3);

			context.restore();
		}

		context.restore();
		context.stroke();
	}
}
var drawFunctions = new Array();
drawFunctions[SQUARE_ANNOTATION]=drawRectangle;
drawFunctions[X_ANNOTATION]=drawX;
drawFunctions[CIRCLE_ANNOTATION]=drawCircle;
drawFunctions[CLOUD_ANNOTATION]=drawCloud;
drawFunctions[POLYGON_ANNOTATION]=drawPoints;
drawFunctions[TEXT_ANNOTATION]=drawText;
drawFunctions[LINE_ANNOTATION]=drawLine;
drawFunctions[ARROW_ANNOTATION]=drawArrow;
drawFunctions[PEN_ANNOTATION]=drawPoints;
drawFunctions[HIGHLIGHTER_ANNOTATION]=drawPoints;
drawFunctions[SCALE_ANNOTATION]=drawScale;
drawFunctions[MEASURE_ANNOTATION]=drawMeasure;
function createUUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
