function Rect(left,top,right,bottom){
	this.left=left;
	this.right=right;
	this.top=top;
	this.bottom=bottom;
	this.width = function(){
		return Math.abs(this.right-this.left);
	}
	this.height = function(){
		return Math.abs(this.bottom-this.top);
	}
	this.centerX = function(){
		return this.left+this.width()/2;
	}
	this.centerY = function(){
		return this.top+this.height()/2;
	}
	this.inset = function(arg0,arg1,arg2,arg3){
		if(arg0==null)return;
		if(arg1==null){
			return this.inset(arg0,arg0,arg0,arg0);
		}
		if(arg2==null){
			return this.inset(arg0,arg1,arg0,arg1);
		}
		var rect = this.clone();
		rect.left+=arg0;
		rect.top+=arg1;
		rect.right-=arg2;
		rect.bottom-=arg3;
		return rect;
	}
	this.clone = function(){
		return new Rect(this.left,this.top,this.right,this.bottom);
	}
	this.containsPoint = function (point){
		return contains(point.x,point.y);
	}
	this.contains = function(x,y){
		return Math.abs(x-this.centerX())<this.width()/2&&Math.abs(y-this.centerY())<this.height()/2;
	}
}