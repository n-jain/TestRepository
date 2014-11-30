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