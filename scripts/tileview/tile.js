BluVueSheet.Tile = function(zipObject,tileLoader){
	this.name=zipObject.name;
	this.zoomLevel = 0;
    this.zoomLevelIndex = -1;
	this.x = 0;
	this.y = 0;
    
	this.image=new Image();
	this.image.src="data:image/png;base64,"+(btoa(zipObject.asBinary()));
	var me = this;
	var parts = me.name.split(".")[0].split("_");
	me.zoomLevel = parseInt(parts[0]);
	me.zoomLevelIndex = tileLoader.zoomLevelIndex(me.zoomLevel);
	me.x = parseInt(parts[2]) * tileLoader.tileSize * 1000 / me.zoomLevel;
	me.y = parseInt(parts[1]) * tileLoader.tileSize * 1000 / me.zoomLevel;

	this.image.onload = function() {
		tileLoader.loaded++;
		tileLoader.calcSize();
		tileLoader.levelAvailable[tileLoader.zoomLevelIndex(me.zoomLevel)] = true;
	}
	this.drawMe = function (context) {
	    context.drawImage(this.image, this.x, this.y, this.image.width * 1000 / this.zoomLevel, this.image.height * 1000 / this.zoomLevel);
	}
	this.getRight = function(){
		return this.x+this.image.width * 1000 / me.zoomLevel;
	}
	this.getBottom = function(){
	    return this.y + this.image.height * 1000 / me.zoomLevel;
	}
}
