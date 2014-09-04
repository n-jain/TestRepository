var handleImage = new Image();
handleImage.src="images/ui/handle1.png";
function Annotation(type, tileView){
	this.rectType = !(type==POLYGON_ANNOTATION||type==LINE_ANNOTATION||type==ARROW_ANNOTATION||
					 type==SCALE_ANNOTATION||type==MEASURE_ANNOTATION);

	this.id=createUUID();
	this.userId=userId;
	this.projectId=projectId;
	this.sheetId=sheetId;

	this.type=type;
	this.points=new Array();	

	this.selected=false;
	this.showHandles=false;
	this.selectIndex=0;
	this.added=false;

	this.color=tileView.color.clone();
	this.fill=false;
	this.areaMeasured=false;

	this.text="";
	this.textSize=tileView.textSize;

	this.closed=false;

	this.tileView=tileView;
	this.offset_x=0;
	this.offset_y=0;
	this.x_handle;
	this.y_handle;

	this.measurement;
	this.updateMeasure = function(){};
	this.bounds;

	var alpha=type==HIGHLIGHTER_ANNOTATION?0.6:1;
	this.color.alpha=alpha;
	
	if(type==LASSO_ANNOTATION){
		this.color=new Color(0,0.2,1,1);
		this.fill=true;
	}

	this.lineWidth=(type==HIGHLIGHTER_ANNOTATION?LINE_WIDTH_HIGHLIGHTER:LINE_WIDTH)/tileView.scale;	
	if(type!=HIGHLIGHTER_ANNOTATION)if(this.lineWidth>7.5)this.lineWidth=7.5;
	if(type==HIGHLIGHTER_ANNOTATION)if(this.lineWidth>75)this.lineWidth=75;
	
	if(type==MEASURE_ANNOTATION)this.updateMeasure=updateMeasureLength;
	if(type==SQUARE_ANNOTATION)this.updateMeasure=updateMeasureRect;
	if(type==POLYGON_ANNOTATION||type==PEN_ANNOTATION)this.updateMeasure=updateMeasurePoly;
	
	this.getLength = function(){
		return Math.sqrt((this.points[1].x-this.points[0].x)*(this.points[1].x-this.points[0].x)+(this.points[1].y-this.points[0].y)*(this.points[1].y-this.points[0].y));
	}
	this.calcBounds = function(){
		this.bounds = new Rect(0,0,0,0);
		this.bounds.left = this.points[0].x;
		this.bounds.top = this.points[0].y;
		this.bounds.right = this.points[0].x;
		this.bounds.bottom = this.points[0].y;
		for(var i=1; i<this.points.length; i++){
			var x=this.points[i].x;
			var y=this.points[i].y;
			if(x<this.bounds.left)this.bounds.left=x;
			if(x>this.bounds.right)this.bounds.right=x;
			if(y<this.bounds.top)this.bounds.top=y;
			if(y>this.bounds.bottom)this.bounds.bottom=y;
		}
	}
	this.drawMe = function(context){
		context.strokeStyle=this.color.toStyle();
		context.lineWidth=this.lineWidth;
		context.fillStyle=this.color.transparent().toStyle();
		context.save();
		context.translate(this.offset_x, this.offset_y);
		drawFunctions[type].call(this,context);
		if(this.type==TEXT_ANNOTATION&&(this.selected||!this.added)){
			context.strokeStyle="#000000";
			context.lineWidth=2/tileView.scale;
			drawRectangle.call(this,context);
		}
		if(this.selected){
			this.drawSelected(context);
		}
		if(this.areaMeasured){
			this.drawArea(context);
		}
		context.restore();
	}
	this.drawSelected = function(context){
		if(this.rectType||!this.showHandles)this.drawBoundsRect(context);
		if(this.showHandles){
			if(this.rectType)
				this.drawHandlesRect(context);
			else
				this.drawHandlesPoint(context);
		}
	}
	this.drawBoundsRect = function(context){
		context.strokeStyle="#0022FF"
		context.lineWidth=2/tileView.scale;
		var bounds = this.bounds.inset(-BOUND_DIST/tileView.scale);
		context.strokeRect(bounds.left, bounds.top, bounds.width(), bounds.height());
	}
	this.drawHandlesRect = function(context){
		for(var i=0; i<8; i++){
			var point = this.getPoint(i,true);
			var size = 35/tileView.scale;
			context.drawImage(handleImage,point.x-size/2,point.y-size/2,size,size);
		}
	}
	this.drawHandlesPoint = function(context){
		for(var i=0; i<this.points.length; i++){
			var point = this.points[i];
			var size = 35/tileView.scale;
			context.drawImage(handleImage,point.x-size/2,point.y-size/2,size,size);
		}
	}
	this.drawArea = function(context){
		var textSize=32*this.lineWidth;
		var text = this.measurement.toString();

		context.font = textSize+"px Verdana";

		while(context.measureText(text).width>this.bounds.width()&&textSize>8*this.lineWidth){
			textSize-=8*this.lineWidth;
			context.font = textSize+"px Verdana";
		}
		if(textSize<8*this.lineWidth)textSize=8*this.lineWidth;

		context.save();
		context.translate(this.bounds.centerX(), this.bounds.centerY());
		context.fillStyle = this.color;
		context.textAlign = "center";
		context.fillText(this.measurement.toString(),0,textSize/3);
		context.restore();
	}
	this.getPoint = function(id,handle){
		var rect = this.bounds.clone();
		if(handle)rect=rect.inset(-BOUND_DIST/tileView.scale);
		var loc = new Point();
		switch(id){//0 is top left, increases clockwise
			case 0:loc.x=rect.left;loc.y=rect.top;break;
			case 1:loc.x=rect.centerX();loc.y=rect.top;break;
			case 2:loc.x=rect.right;loc.y=rect.top;break;
			case 3:loc.x=rect.right;loc.y=rect.centerY();break;
			case 4:loc.x=rect.right;loc.y=rect.bottom;break;
			case 5:loc.x=rect.centerX();loc.y=rect.bottom;break;
			case 6:loc.x=rect.left;loc.y=rect.bottom;break;
			case 7:loc.x=rect.left;loc.y=rect.centerY();break;
		}
		return loc;
	}
	this.offsetTo = function(x,y){
		this.offset_x=x-this.x_handle-this.bounds.centerX();
		this.offset_y=y-this.y_handle-this.bounds.centerY();
	}
	this.applyOffset = function(){
		for(var i=0; i<this.points.length; i++){
			this.points[i].x+=this.offset_x;
			this.points[i].y+=this.offset_y;
		}
		this.calcBounds();
		this.offset_x=0;
		this.offset_y=0;
	}
	this.scaleWithHandleTo = function(x,y,handleId){
		var xPositive = (handleId==2||handleId==3||handleId==4);
		var yPositive = (handleId==4||handleId==5||handleId==6);
				
		var scaleOrigin = this.getPoint((handleId+4)%8,false);
		
		var xDis = Math.abs(scaleOrigin.x-x);
		var yDis = Math.abs(scaleOrigin.y-y);
		
		//1 if normal, -1 if flipped
		var xDir = x-scaleOrigin.x>=0?1:-1;if(!xPositive)xDir*=-1;
		var yDir = y-scaleOrigin.y>=0?1:-1;if(!yPositive)yDir*=-1;

		if(handleId==1||handleId==5){xDis=this.bounds.width();xDir=1;}
		if(handleId==3||handleId==7){yDis=this.bounds.height();yDir=1;}
				
		if(xDis<=BOUND_DIST/tileView.scale||xDir==-1)xDis = BOUND_DIST/tileView.scale;
		if(yDis<=BOUND_DIST/tileView.scale||yDir==-1)yDis = BOUND_DIST/tileView.scale;
		
		var xScale = xDir*((this.bounds.width()==0)?1:xDis/this.bounds.width());
		var yScale = yDir*((this.bounds.height()==0)?1:yDis/this.bounds.height());
		
		var matrix = new ScaleMatrix(xDir*xScale, yDir*yScale, scaleOrigin.x, scaleOrigin.y);
		for(var i=0; i<this.points.length; i++){
			matrix.applyTo(this.points[i]);
		}
		this.calcBounds();
		this.updateMeasure();
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
	if(this.tileView.annotationManager.scaleAnnotation!=null){
		var m = this.tileView.annotationManager.scaleAnnotation.measurement;
		var l = this.tileView.annotationManager.scaleAnnotation.getLength();
		var w = Math.abs(this.points[0].x-this.points[1].x);
		var h = Math.abs(this.points[0].y-this.points[1].y);
		this.measurement.setAmount(m.amount*m.amount*w*h/(l*l), toArea(m.unit));
	}
}
function updateMeasurePoly(tileView){
	if(this.tileView.annotationManager.scaleAnnotation!=null){
		var m = this.tileView.annotationManager.scaleAnnotation.measurement;
		var l = this.tileView.annotationManager.scaleAnnotation.getLength();
		var a = 0;
		for(var i=0; i<this.points.length; i++){
			a+=this.points[i].x*this.points[(i+1)%this.points.length].y;
			a-=this.points[(i+1)%this.points.length].x*this.points[i].y;
		}
		this.measurement.setAmount(m.amount*m.amount*a/(l*l), toArea(m.unit));
	}
}
function drawArc(x1,y1,x2,y2,start,angle,context,fill){
	var centerX = (x1+x2)/2;
	var centerY = (y1+y2)/2;
	var width = x1-x2;
	var height = y1-y2;

	context.save();
	context.beginPath();
	context.scale(width/2, height/2);
	context.arc(2*centerX/width,2*centerY/height,1,start+angle,start,false);
	context.restore();
	if(fill)context.fill();
	context.stroke();
}
function drawRectangle(context){
	if(this.points.length==2){
		if(this.fill)context.fillRect(this.points[0].x, this.points[0].y, this.points[1].x-this.points[0].x, this.points[1].y-this.points[0].y);
		context.strokeRect(this.points[0].x, this.points[0].y, this.points[1].x-this.points[0].x, this.points[1].y-this.points[0].y);
	}
}
function drawX(context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x;
		var y1 = this.points[0].y;
		var x2 = this.points[1].x;
		var y2 = this.points[1].y;
		context.beginPath();
		context.moveTo(x1,y1);
		context.lineTo(x2,y2);
		context.moveTo(x1,y2);
		context.lineTo(x2,y1);
		
		context.restore();
		context.stroke();
	}
}
function drawCircle(context){
	if(this.points.length==2){
 		drawArc(this.points[0].x,this.points[0].y,this.points[1].x,this.points[1].y,0,2*Math.PI,context,this.fill);
	}
}
function drawCloud(context){
	if(this.points.length==2){
		context.save();

		var arcSize = 15*this.lineWidth;
		var gx = (this.points[0].x>this.points[1].x?this.points[0].x:this.points[1].x);
		var gy = (this.points[0].y>this.points[1].y?this.points[0].y:this.points[1].y);
		var lx = (this.points[0].x<this.points[1].x?this.points[0].x:this.points[1].x);
		var ly = (this.points[0].y<this.points[1].y?this.points[0].y:this.points[1].y);

		var wc = Math.floor((gx-lx-this.lineWidth)/(arcSize));
		var hc = Math.floor((gy-ly-this.lineWidth)/(arcSize));
		if(wc<1)wc=1;
		if(hc<1)hc=1;
		arcSizeW = arcSize+(gx-lx-this.lineWidth-arcSize*wc)/wc;
		arcSizeH = arcSize+(gy-ly-this.lineWidth-arcSize*hc)/hc;

		//draw top
		var currentX=lx+this.lineWidth/2+arcSizeW/2;
		var currentY=ly+this.lineWidth/2;
		for(var i=0; i<wc-1; i++){
			drawArc(currentX+arcSizeW,currentY+arcSizeH,currentX,currentY,0, Math.PI,context,this.fill);
			currentX+=arcSizeW;
		}
		//draw bottom
		currentX = lx+this.lineWidth/2+arcSizeW/2;
		currentY = gy-arcSizeH-this.lineWidth/2;
		for(var i=0; i<wc-1; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH, 0, Math.PI,context,this.fill);
			currentX+=arcSizeW;
		}
		//draw left
		currentX=lx+this.lineWidth/2;
		currentY=ly+this.lineWidth/2+arcSizeH/2;
		for(var i=0; i<hc-1; i++){
			drawArc(currentX+arcSizeW,currentY+arcSizeH,currentX,currentY,1.5*Math.PI, Math.PI,context,this.fill);
			currentY+=arcSizeH;
		}
		//draw left
		currentX=gx-arcSizeW-this.lineWidth/2;
		currentY=ly+this.lineWidth/2+arcSizeH/2;
		for(var i=0; i<hc-1; i++){
			drawArc(currentX,currentY,currentX+arcSizeW,currentY+arcSizeH,1.5*Math.PI, Math.PI,context,this.fill);
			currentY+=arcSizeH;
		}
		//draw fill
		if(this.fill){
			var inRect = this.bounds.inset(this.lineWidth/2+arcSizeW/2, this.lineWidth/2+arcSizeH/2);
			context.fillRect(inRect.left, inRect.top, inRect.width(), inRect.height());
		}
		context.restore();
		context.stroke();
	}
}
function drawPoints(context){
	if(this.points.length>1){
		context.save();
		
		context.beginPath();
		context.moveTo(this.points[0].x,this.points[0].y);
		for(var i=1; i<this.points.length; i++){
			context.lineTo(this.points[i].x,this.points[i].y);
		}
		if(this.closed){
			context.lineTo(this.points[0].x,this.points[0].y);	
		}
		if(this.fill&&this.type!=HIGHLIGHTER_ANNOTATION)context.fill();
		context.stroke();
		context.restore();
	}
}
function drawText(context){
	if(this.points.length>1){
		context.save();
		var x = (this.points[0].x<this.points[1].x?this.points[0].x:this.points[1].x);
		var y = (this.points[0].y<this.points[1].y?this.points[0].y:this.points[1].y);
		var w = Math.abs(this.points[0].x-this.points[1].x);
		var h = Math.abs(this.points[0].y-this.points[1].y);
		context.font = this.textSize+"px Verdana";
		context.fillStyle = this.color.toStyle();
		context.translate(x,y);

		context.beginPath();
		context.rect(0,0,w,h);
		context.clip();

		var currentY=this.textSize;
		var lines = this.text.split("\n");
		for(var i=0; i<lines.length; i++){
			var lines2 = new Array();
			lines2[0] = "";
			var currentLine = 0;
			var words = lines[i].split(" ");
			for(var j=0; j<words.length; j++){
				var temp = lines2[currentLine] + words[j] + " ";
				if(context.measureText(temp).width<=w||lines2[currentLine]==""){
					lines2[currentLine] = temp;
				}else{
					lines2[lines2.length] = words[j]+" ";
					currentLine++;
				}
			}
			for(var j=0; j<lines2.length; j++){
				context.fillText(lines2[j], 0, currentY);
				currentY+=this.textSize;
			}
		}
		context.restore();
	}
}
function drawLine(context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x;
		var y1 = this.points[0].y;
		var x2 = this.points[1].x;
		var y2 = this.points[1].y;
		context.beginPath();
		context.moveTo(x1,y1);
		context.lineTo(x2,y2);
		
		context.restore();
		context.stroke();
	}
}
function drawArrow(context){
	if(this.points.length==2){
		context.save();
		var x1 = this.points[0].x;
		var y1 = this.points[0].y;
		var x2 = this.points[1].x;
		var y2 = this.points[1].y;
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
function drawScale(context){
	if(this.points.length==2){
		var x1 = this.points[0].x;
		var y1 = this.points[0].y;
		var x2 = this.points[1].x;
		var y2 = this.points[1].y;

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
function drawMeasure(context){
	if(this.points.length==2){
		var x1 = this.points[0].x;
		var y1 = this.points[0].y;
		var x2 = this.points[1].x;
		var y2 = this.points[1].y;

		context.save();

		var baseEndLength = 8;
		var measureSpace;

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
drawFunctions[LASSO_ANNOTATION]=drawPoints;
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
function Color(red,green,blue,alpha){
	this.red=red;
	this.green=green;
	this.blue=blue;
	this.alpha=alpha;
	this.toStyle=function(){
		var style = "rgba("+Math.floor(this.red*255)+","+Math.floor(this.green*255)+","+Math.floor(this.blue*255)+","+(this.alpha)+")";
		return style;
	}
	this.transparent = function(){
		return new Color(this.red,this.green,this.blue,this.alpha*0.3);
	}
	this.clone=function(){
		return new Color(this.red, this.green, this.blue, this.alpha);
	}
}
function AnnotationJSON(annotation){
	var rectType = !(annotation.type==POLYGON_ANNOTATION||annotation.type==LINE_ANNOTATION||annotation.type==ARROW_ANNOTATION||
					 annotation.type==SCALE_ANNOTATION||annotation.type==MEASURE_ANNOTATION||annotation.type==PEN_ANNOTATION||annotation.type==HIGHLIGHTER_ANNOTATION);
	this.points;
	this.x;
	this.y;
	this.width;
	this.height;
	this.text;
	this.textSize;
	this.distance;
	this.closed;
	//UNIVERSAL
	this.id = annotation.id;
	this.projectId = annotation.projectId;
	this.sheetId = annotation.sheetId;
	this.userId = annotation.userId;

	this.type = annotation.type;
	this.colorRed = annotation.color.red;
	this.colorGreen = annotation.color.green;
	this.colorBlue = annotation.color.blue;
	this.zOrder = 0;
	this.fill = annotation.fill?1:0;
	this.areaVisible = annotation.areaMeasured?1:0;
	this.unitOfMeasure;
	this.lineWidth=annotation.lineWidth;
	if(annotation.measurement!=null){
		this.unitOfMeasure = unitNames[annotation.measurement.type][annotation.measurement.unit].toLowerCase();
	} else {
		this.unitOfMeasure = "na";
	}

	//SPECIFIC
	if(!rectType)
		this.points = annotation.points;
	else {
		this.x = annotation.bounds.left;
		this.y = annotation.bounds.top;
		this.width = annotation.bounds.width();
		this.height = annotation.bounds.height();
	}
	if(annotation.type==TEXT_ANNOTATION){
		this.text=annotation.text;
		this.textSize=annotation.textSize;
	}
	if(annotation.type==SCALE_ANNOTATION||annotation.type==MEASURE_ANNOTATION){
		this.distance=annotation.measurement.amount;
	}
	if(annotation.type==POLYGON_ANNOTATION){
		this.closed=annotation.closed;
	}
}
function loadAnnotationJSON(json,tileView){
	var annotation = new Annotation(json.type,tileView);
	annotation.id=json.id;
	annotation.projectId=json.projectId;
	annotation.sheetId=json.sheetId;
	annotation.userId=json.userId;

	annotation.color.red = json.colorRed;
	annotation.color.green = json.colorGreen;
	annotation.color.blue = json.colorBlue;
	annotation.zOrder = json.zOrder;
	annotation.fill = json.fill==1;
	annotation.areaMeasured = json.areaVisible==1;
	annotation.lineWidth = json.lineWidth;
	
	if(json.unitOfMeasure!="na"){
		var unitInfo = toUnit(json.unitOfMeasure);
		if(json.type==SCALE_ANNOTATION||json.type==MEASURE_ANNOTATION){
			annotation.measurement = new Measurement(json.distance,unitInfo[0],unitInfo[1]);			
		} else {
			annotation.measurement = new Measurement(0,unitInfo[0],unitInfo[1]);
		}
	}
	var rectType = !(annotation.type==POLYGON_ANNOTATION||annotation.type==LINE_ANNOTATION||annotation.type==ARROW_ANNOTATION||
					 annotation.type==SCALE_ANNOTATION||annotation.type==MEASURE_ANNOTATION||annotation.type==PEN_ANNOTATION||annotation.type==HIGHLIGHTER_ANNOTATION);
	if(rectType){
		annotation.points = [new Point(json.x,json.y), new Point(json.x+json.width,json.y+json.height)];
	} else {
		annotation.points = json.points;
	}
	if(json.type==TEXT_ANNOTATION){
		annotation.text=json.text;
		annotation.textSize=json.textSize;		
	}
	if(json.type==POLYGON_ANNOTATION){
		annotation.closed=json.closed;
	}
	annotation.calcBounds();
	annotation.updateMeasure();
	return annotation;
}