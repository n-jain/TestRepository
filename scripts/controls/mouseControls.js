BluVueSheet.MouseControls = function(tileView){
	//gesture vars
	var mouse_start_x;
	var mouse_start_y;
	var tileview_start_x;
	var tileview_start_y;
	var dragging = false;
	function preventDefault(e) {
	    e = e || window.event;
	    if (e.preventDefault)
	        e.preventDefault();
	    e.returnValue = false;
	}

	this.onmousewheel = function(e){
		var mouse = mouseLoc(e);
		
		var delta = wheelDistance(e);
		tileView.scale*=1.0+(delta/15);

		var nx = e.clientX/tileView.scale-tileView.scrollX;
		var ny = e.clientY/tileView.scale-tileView.scrollY;
		//centers zoom around mouse
		tileView.scrollX+=nx-mouse.x;
		tileView.scrollY+=ny-mouse.y;

		tileView.updateRes();

	    preventDefault(e);
	}
	this.onmousedown = function(e){
		tileView.colorMenu.hide();
		var mouse = mouseLoc(e);
		var window_x = e.clientX;
		var window_y = e.clientY;

		//Gesture things
		mouse_start_x=window_x;
		mouse_start_y=window_y;
		tileview_start_x=tileView.scrollX;
		tileview_start_y=tileView.scrollY;

		//Event things
		tileView.annotationManager.onmousedown(mouse.x,mouse.y);

		if(!tileView.annotationManager.captureMouse){
			dragging=true;
		}

		preventDefault(e);
	}
	this.onmouseup = function(e){
		var mouse = mouseLoc(e);
		tileView.annotationManager.onmouseup(mouse.x,mouse.y);
		dragging=false;
	}
	this.onmousemove = function(e){
		var mouse = mouseLoc(e);
		var window_x = e.clientX;
		var window_y = e.clientY;
		tileView.annotationManager.onmousemove(mouse.x,mouse.y);
		if(dragging){
			tileView.scrollX=tileview_start_x+(window_x-mouse_start_x)/tileView.scale;
			tileView.scrollY=tileview_start_y+(window_y-mouse_start_y)/tileView.scale;
		}
	}
	this.onclick = function(e){
		var mouse = mouseLoc(e);
		tileView.annotationManager.onclick(mouse.x,mouse.y);
	}
	this.ondblclick = function(e){
		var mouse = mouseLoc(e);
		tileView.annotationManager.ondblclick(mouse.x,mouse.y);
	}
	var wheelDistance = function(evt){
		if (!evt) evt = event;
		var w=evt.wheelDelta, d=evt.detail;
		if (d){
			if (w) return w/d/40*d>0?1:-1;
 		else return -d/3;
		} else return w/120;
	}
	function mouseLoc(e){
		var x = e.clientX/tileView.scale-tileView.scrollX;
		var y = e.clientY/tileView.scale-tileView.scrollY;
		return new Point(x,y);
	}
}
