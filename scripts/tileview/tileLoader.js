BluVueSheet.TileLoader = function(slicePath, previewPath, tileView){
	this.levelAvailable = new Array();
	this.loaded=0;
	this.zoomLevel=1000;
	this.tileSize = 512;
	this.preview = new Image();
	this.preview.src = previewPath;
	this.width = 0;
	this.height = 0;
	this.tileView = tileView;
	this.allTiles = [];
	var totalTiles = 0;

    for (var j = 0; j < 5; j++) { this.allTiles[j] = []; }

	var me = this;

	//Drawing tiles
	this.drawAllTiles = function (context, rect) {
	    if (this.width == 0 || this.height == 0) { return; }
	    
	    context.drawImage(this.preview, 0, 0, this.width, this.height);
	    var tiles = this.allTiles[this.zoomLevelIndex(this.zoomLevel)];
	    for (var i = 0; i < tiles.length; i++) {
	        if (tiles[i].getRight() > rect.x &&
	            tiles[i].getBottom() > rect.y &&
	            tiles[i].x < rect.x2 &&
	            tiles[i].y < rect.y2) {
	            tiles[i].drawMe(context);
	        }
	    }
	};

	//Tile creation
	this.loadTiles = function(data){
		var zip = new JSZip(data);
		var pngs = zip.file(/.png/);
	    totalTiles = pngs.length;
	    for (var i = 0; i < pngs.length; i++) {
	        var tile = new BluVueSheet.Tile(pngs[i], this);
	        this.allTiles[tile.zoomLevelIndex].push(tile);
	    }
	}

	//Tile data loading
	
	this.doneLoading = function(err,data){
	    if (err) {
	        tileView.setLoaded();
			throw err;
	    }

	    me.loadTiles(data);
	}

    tileView.setLoading();
    JSZipUtils.getBinaryContent(slicePath, me.doneLoading);
    
	this.calcSize = function(){
	    if (this.loaded !== totalTiles) { return; }

	    this.width = 0;
		this.height = 0;
		for (var i = 4; i >= 0; i--) {
            if (this.allTiles[i].length === 0) { continue; }

		    var tiles = this.allTiles[i],
		        w = 0,
		        h = 0;
		    for (var k = 0; k < tiles.length; k++) {
		        var tile = tiles[k];
                if (tile.getRight() > w) { w = tile.getRight(); }
                if (tile.getBottom() > h) { h = tile.getBottom(); }
		    }

		    this.width = w;
		    this.height = h;
		    break;
		}

	    //set zoom level
		tileView.fitToScreen();
		tileView.setLoaded();
	}

	this.zoomLevelIndex = function (level) {
        switch (level) {
	        case 1000:
	            return 0;
	        case 500:
	            return 1;
	        case 250:
	            return 2;
	        case 125:
	            return 3;
	        case 63:
	            return 4;
	        default:
	            return -1;
	    }
	}

    this.setTileRes = function(level) {
        if (!this.levelAvailable[level]) { throw "level not available"; }

        switch (level) {
            case 0:
                this.zoomLevel = 1000;
                break;
            case 1:
                this.zoomLevel = 500;
                break;
            case 2:
                this.zoomLevel = 250;
                break;
            case 3:
                this.zoomLevel = 125;
                break;
            case 4:
                this.zoomLevel = 63;
                break;
        }
    };
}
