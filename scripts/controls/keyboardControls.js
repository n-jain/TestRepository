function KeyboardControls(tileView){
	//controls variables
	var scrollDown;
	var scrollUp;
	var scrollLeft;
	var scrollRight;
	var zoomIn;
	var zoomOut;
	var scrollSpeed=16;

	this.handleControls = function(){
		if(scrollLeft)tileView.scrollX+=scrollSpeed/tileView.scale;
		if(scrollRight)tileView.scrollX-=scrollSpeed/tileView.scale;
		if(scrollUp)tileView.scrollY+=scrollSpeed/tileView.scale;
		if(scrollDown)tileView.scrollY-=scrollSpeed/tileView.scale;
		if(zoomIn)tileView.scale*=1.09;
		if(zoomOut)tileView.scale/=1.09;
		tileView.draw = (zoomIn||zoomOut||scrollLeft||scrollRight||scrollUp||scrollDown);
	}

	this.onKeyDown = function(event){
		switch(event.keyCode){
			case 65://A
				scrollLeft=true;
				break;
			case 87://W
				scrollUp=true;
				break;
			case 68://D
				scrollRight=true;
				break;
			case 83://S
				scrollDown=true;
				break;
			case 81://Q
				zoomIn=true;
				break;
			case 69://E
				zoomOut=true;
				break;
		}
	}
	this.onKeyUp = function(event){
		switch(event.keyCode){
			case 65://A
				scrollLeft=false;
				break;
			case 87://W
				scrollUp=false;
				break;
			case 68://D
				scrollRight=false;
				break;
			case 83://S
				scrollDown=false;
				break;
			case 81://Q
				zoomIn=false;
				break;
			case 69://E
				zoomOut=false;
				break;
		}
	}	
}