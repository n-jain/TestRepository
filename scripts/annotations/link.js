BluVueSheet.Link = function() {
	this.uri            = null;
	this.createdDate    = null;
	this.name           = null;
	this.id             = null;
	this.hidden         = false;
	this.action         = 0;
};

BluVueSheet.Link.searchByID = function(scope, id) {
	var annotations = scope.currentSheet.tileView.annotationManager.getAnnotations(),
		colAnnotations = annotations.length;

	outerBreak: for(var i = 0; i < colAnnotations; i++) {
		var _links = annotations[i].links, _col = _links.length;

		for(var j = 0; j < _col; j++) {
			if(_links[j].id == id) {
				return _links[j];
			}
		}
	}

	return null;
};

BluVueSheet.Link.removeByID = function(scope, id) {
	var annotations = scope.currentSheet.tileView.annotationManager.getAnnotations(),
		colAnnotations = annotations.length;

	for(var i = 0; i < colAnnotations; i++) {
		var _links = annotations[i].links, _col = _links.length;

		for(var j = 0; j < _col; j++) {
			if(_links[j].id == id) {
				annotations[i].links.splice(j, 1);

				return;
			}
		}
	}


};
