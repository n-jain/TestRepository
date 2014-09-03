function TileLoader(){
	this.loaded=0;
	this.zoomLevel=1000;
	this.tileSize = 512;
	this.tiles = null;
	this.preview = new Image();
	this.preview.src = "sheet/preview.png";

	//Drawing tiles
	this.drawAllTiles = function(context){
		context.drawImage(this.preview, 0, 0, this.width, this.height);
		if(this.tiles!=null){
			for(var i=0; i<this.tiles.length; i++){
				if(this.zoomLevel==this.tiles[i].zoomLevel){
					this.tiles[i].drawMe(context);
				}
			}
		}
	};

	//Tile creation
	this.loadTiles = function(data){
		var zip = new JSZip(data);
		var pngs = zip.file(/.png/);
		this.tiles = new Array(pngs.length);
		for(var i=0; i<this.tiles.length; i++){
			this.tiles[i]=new Tile(pngs[i],this);
		}
	}

	//Tile data loading
	var me=this;
	this.doneLoading = function(err,data){
		if(err){
			throw err;
		}
		me.loadTiles(data);
	}
	JSZipUtils.getBinaryContent("sheet/slices.zip", this.doneLoading);

	this.width=0;
	this.height=0;
	this.calcSize = function(){
		if(this.loaded==this.tiles.length){
			this.width = 0;
			this.height = 0;
			for(var i=0; i<this.tiles.length; i++){
				if(this.zoomLevel==this.tiles[i].zoomLevel){
					if(this.tiles[i].getRight()>this.width){
						this.width=this.tiles[i].getRight();
					}
					if(this.tiles[i].getBottom()>this.height){
						this.height=this.tiles[i].getBottom();
					}
				}
			}
		}
	}
	this.setTileRes = function(id){
		switch(id){
			case 0:
				this.zoomLevel=1000;
				break;
			case 1:
				this.zoomLevel=500;
				break;
			case 2:
				this.zoomLevel=250;
				break;
			case 3:
				this.zoomLevel=125;
				break;
			case 4:
				this.zoomLevel=63;
				break;
	    }
	}
}