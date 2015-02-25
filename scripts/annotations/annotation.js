BluVueSheet.Annotation = function Annotation(type, tileView, userId, projectId, sheetId){
	this.rectType = !(type==POLYGON_ANNOTATION||type==LINE_ANNOTATION||type==ARROW_ANNOTATION||
					 type==SCALE_ANNOTATION||type==MEASURE_ANNOTATION);

	this.id=createUUID();
	this.userId = userId;
	this.projectId = projectId;
	this.sheetId = sheetId;

	this.type=type;
	this.points=new Array();

	this.selected=false;
	this.showHandles=false;
	this.selectIndex=0;
	this.added=false;

	this.color=tileView.color.clone();
	this.fill=false;
	this.perimeterMeasured=false;
	this.areaMeasured=false;

	this.text="";
	this.textSize=tileView.textSize;

	this.closed=false;
	this.attachments = [];

	this.tileView=tileView;
	this.offset_x=0;
	this.offset_y=0;
	this.x_handle;
	this.y_handle;

    this.measurement = null;
	this.updateMeasure = function(){};
	this.hasArea = false;
	this.hasPerimeter = false;
	this.bounds;

	this.setColor = function(color){
		this.color=color.clone();
		var alpha=type==HIGHLIGHTER_ANNOTATION?0.6:1;
		this.color.alpha=alpha;
	}
	this.setColor(this.color);

	if(type==LASSO_ANNOTATION){
		this.color=new Color(0,0.2,1,1);
		this.fill=true;
	}

	this.lineWidth=(type==HIGHLIGHTER_ANNOTATION?LINE_WIDTH_HIGHLIGHTER:LINE_WIDTH)/tileView.scale;
	if(type!=HIGHLIGHTER_ANNOTATION)if(this.lineWidth>7.5)this.lineWidth=7.5;
	if(type==HIGHLIGHTER_ANNOTATION)if(this.lineWidth>75)this.lineWidth=75;

  this.toSerializable = function toSerializable() {
    return new AnnotationJSON( this );
  }

  var initMeasurement = function( self, linearCalc, areaCalc )
  {
      self.hasPerimeter = (typeof(linearCalc) == 'function');
      self.hasArea = (typeof(areaCalc) == 'function');

      self.updateMeasure = function() {
          if( self.areaMeasured && self.hasArea )
              areaCalc.apply( self );
          else if( !self.areaMeasured && self.hasPerimeter )
              linearCalc.apply( self );

          return self.measurement;
      }
  };

  switch( type )
  {
      case MEASURE_ANNOTATION: initMeasurement( this, updateMeasureLength, undefined ); break;
      case SQUARE_ANNOTATION: initMeasurement( this, updateMeasureRectPerimeter, updateMeasureRectArea ); break;
      case POLYGON_ANNOTATION: initMeasurement( this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea ); break;
      case FREE_FORM_ANNOTATION: initMeasurement( this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea ); break;
      case PEN_ANNOTATION: initMeasurement( this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea ); break;
      case CIRCLE_ANNOTATION: initMeasurement( this, updateMeasureEllipsePerimeter, updateMeasureEllipseArea ); break;

      // Unimplemented cases fall through to the default case
      case LINE_ANNOTATION:
      case ARROW_ANNOTATION:
      case HIGHLIGHTER_ANNOTATION:
      case SCALE_ANNOTATION:
      case X_ANNOTATION:
      case CLOUD_ANNOTATION:
      case TEXT_ANNOTATION:
      case NO_ANNOTATION:
      case LASSO_ANNOTATION:
      default: initMeasurement( this, undefined, undefined );
  }

  this.getLength = function getLength( p1, p2 )
  {
    p1 = p1 || this.points[0];
    p2 = p2 || this.points[1];
		return Math.sqrt( (p2.x-p1.x)*(p2.x-p1.x) + (p2.y-p1.y)*(p2.y-p1.y) );
  }
	this.calcBounds = function(){
	    this.bounds = new BluVueSheet.Rect(0, 0, 0, 0);
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
		if( this.areaMeasured || this.perimeterMeasured ){
			this.drawMeasurement(context);
		}

		if(!this.selected && this.attachments.length){
			this.drawAttachments.call(this, context);
		}

		context.restore();
	}

	this.drawAttachments = function(context) {
		var x, y;

		if(!this.added) {
			return;
		}

		var theta = this.tileView.getRotation()/-180*Math.PI;
		var isFlipped = (this.tileView.getRotation()==90 || this.tileView.getRotation()==270)
		context.save();

	  x = this.bounds.left + (this.bounds.width() / 2);
    y = this.bounds.top + (this.bounds.height() / 2);

	  context.translate( x, y );
	  context.rotate( theta );

    var width = isFlipped ? this.bounds.height() : this.bounds.width();
    var height = isFlipped ? this.bounds.width() : this.bounds.height();

		switch(this.type) {
      case SQUARE_ANNOTATION:
      case TEXT_ANNOTATION:
      case X_ANNOTATION:
      case CLOUD_ANNOTATION:
        context.translate( width/2, -height/2 );
        break;

      case CIRCLE_ANNOTATION:
        var dx = (0.25 * width );
        var dy = -(0.433 * height );
        context.translate( dx, dy );
        break;

			default:
				var max_x = this.points[0].x,
						min_x = this.points[0].x,
						max_y = this.points[0].y,
						min_y = this.points[0].y,
						dx = 0,
						dy = 0;

				for(var i in this.points) {
					if(!this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y <= min_y) {
						max_x = this.points[i].x;
						min_y = this.points[i].y;
						dx = this.points[i].x - x;
						dy = this.points[i].y - y;
					}

					if(90 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y <= min_y) {
						min_x = this.points[i].x;
						min_y = this.points[i].y;
						dx = y - this.points[i].y;
						dy = this.points[i].x - x;
					}

					if(180 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y >= max_y) {
						min_x = this.points[i].x;
						max_y = this.points[i].y;
						dx = x - this.points[i].x;
						dy = y - this.points[i].y;
					}

					if(270 == this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y >= max_y) {
						max_x = this.points[i].x;
						max_y = this.points[i].y;
						dx = this.points[i].y - y;
						dy = x - this.points[i].x;
					}
				}
				context.translate(dx, dy);
    }

    // Reset canvas to SCREEN coordinates instead of SHEET coordinates
    context.scale( 1/tileView.scale, 1/tileView.scale );

		context.strokeStyle="#e52b2e";
		context.fillStyle="#e52b2e";
		this.roundRect( context, 0, 0, 30, 16, 8.50 , true );

		context.font = (12) + 'pt Helvetica';
		context.fillStyle="#fff";
		context.fillText(this.attachments.length, 16, 13 );

		var attach_icon = new Image();
		attach_icon.src = "images/update/icon-paperclip-dark.png";
		context.drawImage( attach_icon, 0, 0, 16, 16 );

		context.restore();
	};

	this.roundRect = function(ctx, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke == "undefined" ) {
			stroke = true;
		}
		if (typeof radius === "undefined") {
			radius = 5;
		}

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();

		if (stroke) {
			ctx.stroke();
		}
		if (fill) {
			ctx.fill();
		}
	}

	this.drawSelected = function(context){
	  context.save();
		if(this.rectType||!this.showHandles)this.drawBoundsRect(context);
		if(this.showHandles){
			if(this.rectType)
				this.drawHandlesRect(context);
			else
				this.drawHandlesPoint(context);
		}
		context.restore();
	}
	this.drawBoundsRect = function(context){
		context.strokeStyle="#7e7e7e"

    var oldStroke = setPatternStroke( context, [80,40] );
    {
  		context.lineWidth=3/tileView.scale;
  		var bounds = this.bounds.inset(-BOUND_DIST/tileView.scale);
  		context.strokeRect(bounds.left, bounds.top, bounds.width(), bounds.height());
    }
    setPatternStroke( context, oldStroke );
	}
	this.drawHandlesRect = function(context){
		for(var i=0; i<8; i++){
		  drawHandle( context, this.getPoint(i,true), tileView.scale );
		}
	}
	this.drawHandlesPoint = function(context){
		for(var i=0; i<this.points.length; i++){
		  drawHandle( context, this.points[i], tileView.scale );
		}
	}
	this.drawMeasurement = function(context) {
	  if( !this.measurement || !tileView.annotationManager.scaleAnnotation )
	      return;

	  var theta = this.tileView.getRotation()/-180*Math.PI;
	  var drawWidth = Math.abs( this.bounds.width()*Math.cos(theta) - this.bounds.height()*Math.sin(theta) );

		var textSize=32*this.lineWidth;
		var text = htmlDecode( this.measurement.toString() );

	  context.font = textSize+"px Verdana";

		while(context.measureText(text).width>drawWidth&&textSize>8*this.lineWidth){
			textSize-=8*this.lineWidth;
			context.font = textSize+"px Verdana";
		}
		if(textSize<8*this.lineWidth)textSize=8*this.lineWidth;

		context.save();
		context.translate(this.bounds.centerX(), this.bounds.centerY());
		context.rotate( theta );
		context.fillStyle = this.color;
		context.textAlign = "center";
		context.fillText(text,0,textSize/3);
		context.restore();
	}
	this.getPoint = function(id,handle){
	    var rect = this.bounds.clone();
	    if (handle) {
	        rect = rect.inset(-BOUND_DIST / tileView.scale);
	    }

		var loc = new BluVueSheet.Point();
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
		if(this.offset_y!=0||this.offset_x!=0){
			for(var i=0; i<this.points.length; i++){
				this.points[i].x+=this.offset_x;
				this.points[i].y+=this.offset_y;
			}
			this.calcBounds();
			this.offset_x=0;
			this.offset_y=0;
			return true;
		}
		return false;
	}
	this.applyMoveOffset = function(){
		if((this.offset_y!=0||this.offset_x!=0) && !isNaN(this.offset_x) && !isNaN(this.offset_y)){
			for(var i=0; i<this.points.length; i++){
				this.points[i].x+=this.offset_x;
				this.points[i].y+=this.offset_y;
			}
			this.calcBounds();
			this.offset_x=0;
			this.offset_y=0;
			return true;
		}
		return false;
	}
	this.scaleWithHandleTo = function(x,y,handleId) {
	    var xPositive = [2, 3, 4].indexOf(handleId) >= 0;
	    var yPositive = [4, 5, 6].indexOf(handleId) >= 0;
	    var scalingX = [0, 6, 7, 2, 3, 4].indexOf(handleId) >= 0;
	    var scalingY = [0, 1, 2, 4, 5, 6].indexOf(handleId) >= 0;

	    var scaleOrigin = this.getPoint((handleId + 4) % 8, false);

		var xDis = scaleOrigin.x - x;
		var yDis = scaleOrigin.y - y;
	    var flippedX = (x < scaleOrigin.x && xPositive) || (x > scaleOrigin.x && !xPositive);
	    var flippedY = (y < scaleOrigin.y && yPositive) || (y > scaleOrigin.y && !yPositive);

	    var xScale = scalingX && !flippedX ? Math.abs(xDis / (this.bounds.width() + BOUND_DIST / tileView.scale)) : 1;
	    var yScale = scalingY && !flippedY ? Math.abs(yDis / (this.bounds.height() + BOUND_DIST / tileView.scale)) : 1;

        // force min size
		if (Math.abs(this.bounds.width() * xScale) < BOUND_DIST / tileView.scale) { xScale = 1; }
		if (Math.abs(this.bounds.height() * yScale) < BOUND_DIST / tileView.scale) { yScale = 1; }

		var matrix = new BluVueSheet.ScaleMatrix(xScale, yScale, scaleOrigin.x, scaleOrigin.y);
		for(var i=0; i<this.points.length; i++) {
		    matrix.applyTo(this.points[i]);
		}

		this.calcBounds();
		this.updateMeasure();
	}

var drawFunctions = new Array();
	drawFunctions[LASSO_ANNOTATION] = drawPoints;
	drawFunctions[SQUARE_ANNOTATION] = drawRectangle;
	drawFunctions[X_ANNOTATION] = drawX;
	drawFunctions[CIRCLE_ANNOTATION] = drawCircle;
	drawFunctions[CLOUD_ANNOTATION] = drawCloud;
	drawFunctions[POLYGON_ANNOTATION] = drawPoints;
	drawFunctions[TEXT_ANNOTATION] = drawText;
	drawFunctions[LINE_ANNOTATION] = drawLine;
	drawFunctions[ARROW_ANNOTATION] = drawArrow;
	drawFunctions[PEN_ANNOTATION] = drawPoints;
	drawFunctions[FREE_FORM_ANNOTATION] = drawPoints;
	drawFunctions[HIGHLIGHTER_ANNOTATION] = drawPoints;
	drawFunctions[SCALE_ANNOTATION] = drawScale;
	drawFunctions[MEASURE_ANNOTATION] = drawMeasure;

    function setMeasurement( annotation, value, isArea )
    {
        if( annotation.measurement && annotation.tileView.annotationManager.scaleAnnotation!=null )
        {
            var m = annotation.tileView.annotationManager.scaleAnnotation.measurement;
            var l = annotation.tileView.annotationManager.scaleAnnotation.getLength();

            var scale = m.amount / l;
            if( isArea )
                annotation.measurement.setAmount( value * scale * scale, BluVueSheet.Measurement.toArea( m.unit ) );
            else
                annotation.measurement.setAmount( value * scale, m.unit );
        }
    }

  	function updateMeasureRectArea() {
  	    var w = Math.abs(this.points[0].x-this.points[1].x);
        var h = Math.abs(this.points[0].y-this.points[1].y);
        setMeasurement( this, w*h, true );
    }

  	function updateMeasureRectPerimeter() {
        var w = Math.abs(this.points[0].x-this.points[1].x);
        var h = Math.abs(this.points[0].y-this.points[1].y);
        setMeasurement( this, w+w+h+h, false );
    }

    function updateMeasureEllipseArea() {
  	    var a = Math.abs(this.points[0].x-this.points[1].x)/2;
    	  var b = Math.abs(this.points[0].y-this.points[1].y)/2;
    	  setMeasurement( this, Math.PI * a * b, true );
    }

    function updateMeasureEllipsePerimeter() {
        // Ramanujan's 3rd approximation of ellipse perimeter
        // http://www.mathsisfun.com/geometry/ellipse-perimeter.html
	      var a = Math.abs(this.points[0].x-this.points[1].x)/2;
	      var b = Math.abs(this.points[0].y-this.points[1].y)/2;
	      var h = (a - b) * (a - b) / (a + b) / (a + b);
	      setMeasurement(this, Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))), false );
    }

    function updateMeasureLength() {
        setMeasurement( this, this.getLength(), false );
    }

    function updateMeasurePolygonArea( tileView ) {
        // Bail if the area is self intersecting
        if( isSelfIntersecting( this ) )
        {
            setMeasurement( this, 0, true );
        }
        else
        {
        		var a = 0;
        		for( var i=0; i<this.points.length; i++ ) {
        		    a += this.points[i].x * this.points[(i + 1) % this.points.length].y;
        		    a -= this.points[(i + 1) % this.points.length].x * this.points[i].y;
        		}
            setMeasurement( this, Math.abs(a)/2, true );
        }
    }

    function updateMeasurePolygonPerimeter( tileView ) {
    		var p = 0;
    		for( var i=0; i<this.points.length; i++ ) {
    		    p += this.getLength( this.points[i], this.points[ (i + 1) % this.points.length ] );
    		}
        setMeasurement( this,p, false );
    }

    function updateMeasurePolylineLength( tileView ) {
    		var p = 0;
    		for( var i=1; i<this.points.length; i++ ) {
    		    p += this.getLength( this.points[i-1], this.points[i] );
    		}
        setMeasurement( this, p, false );
    }

    function isSelfIntersecting( annotation )
    {
        if( annotation.points.length > 3 )
        {
        		for( var i=0; i<annotation.points.length; i++ )
        		{
        		    var a1 = annotation.points[i];
        		    var a2 = annotation.points[ (i + 1) % annotation.points.length ];
                if( !pointsEqual( a1, a2 ) )
                {
                    for( var j=0; j < annotation.points.length; j++)
                    {
                		    var b1 = annotation.points[j];
                		    var b2 = annotation.points[ (j + 1) % annotation.points.length ];

                        if( !( pointsEqual(a1, b1) || pointsEqual(a1, b2) ||
                               pointsEqual(a2, b1) || pointsEqual(a2, b2) ||
                               pointsEqual(b1, b2) ) )
                        {

                            if( linesIntersect( a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y ) )
                                return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    var EPSILON = .001;
    function pointsEqual( p1, p2 )
    {
        return (Math.abs( p1.x-p2.x ) < EPSILON) &&
               (Math.abs( p1.y-p2.y ) < EPSILON);
    }

    function linesIntersect( x1, y1, x2, y2, x3, y3, x4, y4 )
    {
        var denom = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
        var numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
        var numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);

        // Are the line parallel
        if( Math.abs(denom) < EPSILON ) {
            return false;
        }

        // Is the intersection along the the segments
        var mua = numera / denom;
        var mub = numerb / denom;
        if( mua < 0 || mua > 1 || mub < 0 || mub > 1 ) {
            return false;
        }

        return true;
    }

    this.equals = function equals( that )
    {
        if( this == that )
            return true;
        if( this && that )
        {
            var j1 = JSON.stringify( new AnnotationJSON( this ) );
            var j2 = JSON.stringify( new AnnotationJSON( that ) );
            return j1.localeCompare( j2 ) === 0;
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
		if (this.fill && this.type != HIGHLIGHTER_ANNOTATION) context.fill();

		context.lineCap = 'round';
		context.lineJoin = "round";
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
		context.lineCap = 'round';
		context.lineJoin = "round";
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
			var text = htmlDecode( this.measurement.toString() );
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

    drawLinearText( context, text, textSize, this.color, x1, y1, x2, y2, theta, this.tileView.getRotation() );

		context.restore();
		context.stroke();
	}
}
function drawLinearText( context, text, textSize, color, x1, y1, x2, y2, theta, rotation )
{
		var cx = (x2+x1)/2;
		var cy = (y2+y1)/2;

		context.save();
		context.translate(cx,cy);
		context.rotate(theta);
		if( ( x1>x2 && rotation == 0) ||
		    ( y1<y2 && rotation == 90 ) ||
		    ( x1<x2 && rotation == 180) ||
		    ( y1>y2 && rotation == 270 ) ) {
			context.rotate(Math.PI);
		}
		context.fillStyle = color;
		context.textAlign = "center";
		context.fillText( text ,0,textSize/3);
		context.restore();
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

	  if( this.measurement && tileView.annotationManager.scaleAnnotation )
	  {
			var myLength = this.getLength();
			var textSize = 22*this.lineWidth;
			var text = htmlDecode( this.measurement.toString() );
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

    drawLinearText( context, text, textSize, this.color, x1, y1, x2, y2, theta, this.tileView.getRotation() );

		context.restore();
		context.stroke();
	}
}

function setPatternStroke( context, pattern ) {
  var oldStroke = null;
  if( context.setLineDash !== undefined )
  {
    oldStroke = context.getLineDash();
    context.setLineDash( pattern );
  }
  else if( context.mozDash !== undefined )
  {
    oldStroke = context.mozDash;
    context.mozDash = pattern;
  }
  return oldStroke;
}

function drawHandle( context, point, scale )
{
  context.beginPath();
  context.arc( point.x, point.y, 10/scale, 0, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  context.strokeStyle = '#070707';
  context.lineWidth = 2/scale;
  context.stroke();
}

}  // End of Annotation

function createUUID() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
function AnnotationJSON(annotation) {
    var rectType = !(annotation.type==POLYGON_ANNOTATION||annotation.type==LINE_ANNOTATION||annotation.type==ARROW_ANNOTATION||
					 annotation.type==SCALE_ANNOTATION||annotation.type==MEASURE_ANNOTATION||annotation.type==PEN_ANNOTATION||
					 annotation.type==FREE_FORM_ANNOTATION||annotation.type==HIGHLIGHTER_ANNOTATION);
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
	this.id = annotation.id.replace(/-/g, "");
	this.projectId = annotation.projectId.replace(/-/g, "");
	this.sheetId = annotation.sheetId.replace(/-/g, "");
	this.userId = annotation.userId ? annotation.userId.replace(/-/g, "") : undefined;

	this.type = annotation.type;
	this.colorRed = annotation.color.red;
	this.colorGreen = annotation.color.green;
	this.colorBlue = annotation.color.blue;
	this.zOrder = 0;
	this.fill = annotation.fill?1:0;
	this.perimeterVisible = annotation.perimeterMeasured?1:0;
	this.areaVisible = annotation.areaMeasured?1:0;
	this.unitOfMeasure;
	this.lineWidth=annotation.lineWidth;
	if(annotation.measurement!=null){
	    this.unitOfMeasure = BluVueSheet.Constants.UnitNames[annotation.measurement.type][annotation.measurement.unit].toLowerCase();
	} else {
		this.unitOfMeasure = "na";
	}

	this.attachments = [];
	var context = this;
	if( annotation.attachments )
	{
  	annotation.attachments.forEach( function(attachment) {
  	  var serializable = {
  	    createdDate: attachment.createdDate,
        id: attachment.id,
        name: attachment.name,
        mimeType: attachment.mimeType,
        url: attachment.url,
        userId: attachment.userId,
        email: attachment.email,
        amazonKeyPath: attachment.amazonKeyPath,
        annotationId: attachment.annotation.id
  	  };
  	  if( attachment.location )
  	  {
  	    serializable.location = JSON.parse( JSON.stringify( attachment.location ) );
  	  }
		  context.attachments.push( serializable );
  	});
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
	if(annotation.type==POLYGON_ANNOTATION||annotation.type==FREE_FORM_ANNOTATION){
		this.closed = annotation.closed ? 1 : 0;
	}
}
function loadAnnotationJSON(json,tileView){
  var normalizeGuid = function normalizeGuid( guid ) {
    return guid.replace( /-/g, '' );
  }

    var annotation = new BluVueSheet.Annotation(json.type, tileView);
	annotation.id=normalizeGuid(json.id);
	annotation.projectId=json.projectId;
	annotation.sheetId=json.sheetId;
	annotation.userId=json.userId;

	annotation.color.red = json.colorRed;
	annotation.color.green = json.colorGreen;
	annotation.color.blue = json.colorBlue;
	annotation.zOrder = json.zOrder;
	annotation.fill = json.fill==1;
	annotation.areaMeasured = json.areaVisible==1;
	annotation.perimeterMeasured = json.perimeterVisible==1;
	annotation.lineWidth = json.lineWidth;
	annotation.attachments = json.attachments || [];
	annotation.attachments.forEach( function( attachment ) {
	  attachment.annotation = annotation;
	});

	if(json.unitOfMeasure!="na"){
	    var unitInfo = BluVueSheet.Measurement.toUnit(json.unitOfMeasure);
		if(json.type==SCALE_ANNOTATION||json.type==MEASURE_ANNOTATION){
		    annotation.measurement = new BluVueSheet.Measurement(json.distance, unitInfo[0], unitInfo[1]);
		} else {
		    annotation.measurement = new BluVueSheet.Measurement(0, unitInfo[0], unitInfo[1]);
		}
	}
	var rectType = !(annotation.type==POLYGON_ANNOTATION||annotation.type==LINE_ANNOTATION||annotation.type==ARROW_ANNOTATION||
					 annotation.type==SCALE_ANNOTATION||annotation.type==MEASURE_ANNOTATION||annotation.type==PEN_ANNOTATION||annotation.type==FREE_FORM_ANNOTATION||annotation.type==HIGHLIGHTER_ANNOTATION);
	if(rectType){
	    annotation.points = [new BluVueSheet.Point(json.x, json.y), new BluVueSheet.Point(json.x + json.width, json.y + json.height)];
	} else {
		annotation.points = json.points;
	}
	if(json.type==TEXT_ANNOTATION){
		annotation.text=json.text;
		annotation.textSize=json.textSize;
	}
	if(json.type==POLYGON_ANNOTATION||annotation.type==FREE_FORM_ANNOTATION){
		annotation.closed=json.closed == 1;
	}
	annotation.calcBounds();
	annotation.updateMeasure();
	return annotation;
}
function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes[0].nodeValue;
}
