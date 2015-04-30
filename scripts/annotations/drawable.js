BluVueSheet.AnnotationHandleDrawable = function AnnotationHandleDrawable( annotation, point, pointIndex, tileView )
{
  var radius = 10/tileView.scale;
  var bounds = new BluVueSheet.Rect( point.x-radius, point.y-radius, point.x+radius, point.y+radius );

  this.isActive = function() 
  {
    return annotation.selected && annotation.showHandles;
  };
    
  this.getBounds = function() 
  {
    return bounds;
  };
    
  this.draw = function( context ) 
  {
    context.beginPath();
    context.arc( point.x, point.y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = 'white';
    context.fill();
  
    context.strokeStyle = '#070707';
    context.lineWidth = 2/tileView.scale;
    context.stroke();
  };
  
  this.onMouseOver = function() 
  {
    var cursor;
    if( annotation.rectType )
      switch( pointIndex )
      {
        case 0:  return { cursor: 'nw-resize' };
        case 1:  return { cursor: 'n-resize' };
        case 2:  return { cursor: 'ne-resize' };
        case 3:  return { cursor: 'e-resize' };
        case 4:  return { cursor: 'se-resize' };
        case 5:  return { cursor: 's-resize' };
        case 6:  return { cursor: 'sw-resize' };
        case 7:  return { cursor: 'w-resize' };
        default: return { cursor: 'move' };
      }
    else
      return { cursor: 'move' };
  };
    
  this.onDrag = function( x, y, context ) 
  {
    if( annotation.rectType )
    {
      annotation.scaleWithHandleTo( x, y, pointIndex );
    } 
    else 
    {
      annotation.points[pointIndex] = new BluVueSheet.Point(x, y);
      annotation.calcBounds();
      annotation.updateMeasure();
      
      if( annotation.type === SCALE_ANNOTATION )
      {
        context.annotations.forEach( function( annotation ) {
          if( annotation && annotation.updateMeasure )
            annotation.updateMeasure();
        });
      }
    }
  };
};
