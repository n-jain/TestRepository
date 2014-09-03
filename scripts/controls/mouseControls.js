function MouseControls(tileView){
	//gesture vars
	var mouse_start_x;
	var mouse_start_y;
	var tileview_start_x;
	var tileview_start_y;
	var dragging=false;
	var clickStartTime;
	var clickTime = 300;
	var clickMove=10;
	this.onmousewheel = function(e){
		var x = e.clientX/tileView.scale-tileView.scrollX;
		var y = e.clientY/tileView.scale-tileView.scrollY;
		
		var delta = wheelDistance(e);
		tileView.scale*=1.0+(delta/15);

		var nx = e.clientX/tileView.scale-tileView.scrollX;
		var ny = e.clientY/tileView.scale-tileView.scrollY;
		//centers zoom around mouse
		tileView.scrollX+=nx-x;
		tileView.scrollY+=ny-y;
	}
	this.onmousedown = function(e){
		tileView.colorMenu.hide();
		var x = e.clientX/tileView.scale-tileView.scrollX;
		var y = e.clientY/tileView.scale-tileView.scrollY;
		var window_x = e.clientX;
		var window_y = e.clientY;

		//Gesture things
		mouse_start_x=window_x;
		mouse_start_y=window_y;
		tileview_start_x=tileView.scrollX;
		tileview_start_y=tileView.scrollY;
		clickStartTime = getTime();

		//Event things
		tileView.annotationManager.onmousedown(x,y);

		if(!tileView.annotationManager.captureMouse){
			dragging=true;
		}
	}
	this.onmouseup = function(e){
		var x = e.clientX/tileView.scale-tileView.scrollX;
		var y = e.clientY/tileView.scale-tileView.scrollY;
		tileView.annotationManager.onmouseup(x,y);
		dragging=false;
		var moved=false;
		moved = Math.abs(mouse_start_x-e.clientX)>clickMove&&Math.abs(mouse_start_y-e.clientY)>clickMove;
		if(getTime()-clickStartTime<clickTime&&!moved&&tileView.getTool()==NO_TOOL){
			tileView.annotationManager.onclick(x,y);
		}
	}
	this.onmousemove = function(e){
		var x = e.clientX/tileView.scale-tileView.scrollX;
		var y = e.clientY/tileView.scale-tileView.scrollY;
		var window_x = e.clientX;
		var window_y = e.clientY;
		tileView.annotationManager.onmousemove(x,y);
		if(dragging){
			tileView.scrollX=tileview_start_x+(window_x-mouse_start_x)/tileView.scale;
			tileView.scrollY=tileview_start_y+(window_y-mouse_start_y)/tileView.scale;
		}
	}
	var wheelDistance = function(evt){
		if (!evt) evt = event;
		var w=evt.wheelDelta, d=evt.detail;
		if (d){
			if (w) return w/d/40*d>0?1:-1;
 		else return -d/3;
		} else return w/120;
	}
}
function getTime(){
	return new Date().getTime();
}