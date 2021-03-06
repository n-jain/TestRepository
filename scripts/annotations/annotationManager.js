BluVueSheet.AnnotationManager = function (tileView, scope) {
	var annotations = [];
	var selectedAnnotations = [];
	var currentAnnotation = null;
	var lasso = null;
	var touchedHandle = -1;
	var cancelClick = false;

	var movePrevX = null;
	var movePrevY = null;

	this.captureMouse = false;
	this.captureKeyboard = false;
	this.scaleAnnotation = null;
    this.scaleAnnotationMaster = null;

	var removeFromArray = function (array, element) {
		array.splice(array.indexOf(element), 1);
	};

	this.onmousedown = function (x, y) {
		this.captureMouse = false;
		//create new annotation
		if (toolToAnnotation(tileView.getTool()) !== NO_ANNOTATION && currentAnnotation === null) {
			var annType = toolToAnnotation(tileView.getTool());
			if (this.scaleAnnotation !== null && tileView.getTool() == BluVueSheet.Constants.Tools.Ruler) annType = MEASURE_ANNOTATION;
			var ann = new BluVueSheet.Annotation(annType, tileView, scope.userId, scope.sheet.projectId, scope.sheet.id);
			ann.points[0] = new BluVueSheet.Point(x, y);

			// Arrows always have a direction, so assign the END POINT now (it's point[1])
			if (annType == ARROW_ANNOTATION)
				ann.points[1] = new BluVueSheet.Point(x, y);

			currentAnnotation = ann;
			if (ann.type == LASSO_ANNOTATION)lasso = ann;
			if (currentAnnotation.type == MEASURE_ANNOTATION) {
				currentAnnotation.measurement = new BluVueSheet.Measurement(0, this.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
			}

			if (currentAnnotation.type == FREE_FORM_ANNOTATION)
				currentAnnotation.closed = true;

		    //Added by Neha [DEV Flair-Solutions] : To handle the newly added annotations
			if (currentAnnotation.type == AUDIO_ANNOTATION || currentAnnotation.type == VIDEO_ANNOTATION || currentAnnotation.type == PHOTO_ANNOTATION) {
			     currentAnnotation.calcBounds();
			     this.selectSingleAnnotation(currentAnnotation);
			     annotations.push(currentAnnotation);
			    
			    scope.isShowAttachmentsButton = true;
			    scope.showAttachmentsPanel();
			 
			    this.saveSelectedAnnotations();
			    
			}
			 

			this.captureMouse = true;
			return;
		}

		//add point to existing polygon annotation
		if (tileView.getTool() == BluVueSheet.Constants.Tools.Polygon) {
			currentAnnotation.points[currentAnnotation.points.length] = new BluVueSheet.Point(x, y);
			this.captureMouse = true;
			cancelClick = true;
			return;
		}

		//check if selected annotation is being touched
		var selectIndex = -1;
		var i;
		for (i = 0; i < selectedAnnotations.length; i++) {
			if (selectedAnnotations[i].bounds.inset(-BOUND_DIST).contains(x, y)) {
				selectIndex = i;
			}
		}

		if (selectedAnnotations.length == 1) {
			touchedHandle = -1;
			for (i in selectedAnnotations[0].drawables) {
				var drawable = selectedAnnotations[0].drawables[i];
				if (drawable.isActive() && drawable.getBounds().contains(x, y)) {
					this.captureMouse = drawable;
					touchedHandle = true;
				}
			}
		}

		// panning annotations
		if (selectIndex != -1 && touchedHandle == -1) {
			for (i = 0; i < selectedAnnotations.length; i++) {
				selectedAnnotations[i].x_handle = x - selectedAnnotations[i].bounds.centerX();
				selectedAnnotations[i].y_handle = y - selectedAnnotations[i].bounds.centerY();
			}
			this.captureMouse = true;
		}
	};

	this.onmouseup = function (x, y) {
		var save = false;
		var i;
		for (i = 0; i < selectedAnnotations.length; i++) {
			if (selectedAnnotations[i].applyOffset()) {
				save = true;
			}
		}
		if (touchedHandle != -1) {
			save = true;
		}
		this.captureMouse = false;
		if (tileView.getTool() != BluVueSheet.Constants.Tools.Polygon) {

			var tool = tileView.getTool();


			if (currentAnnotation !== null) {
				if (currentAnnotation.points.length == 2 && currentAnnotation.points[0].x == currentAnnotation.points[1].x && currentAnnotation.points[0].y == currentAnnotation.points[1].y) {
					this.configureDefaultAnnotation(x, y);
				}
				else if (currentAnnotation.points.length == 1) {
					this.configureDefaultAnnotation(x, y);
				}

				this.finishAnnotation(x, y);
			}

			if (tool != BluVueSheet.Constants.Tools.Pen && tool != BluVueSheet.Constants.Tools.Highlighter)
				tileView.deselectTool();
		}
		if (lasso !== null) {
			this.selectAllInLasso();
			lasso = null;
		}
		if (save) {
			this.saveSelectedAnnotations();

			for (i = 0; i < selectedAnnotations.length; i++) {
				if (selectedAnnotations[i].type === SCALE_ANNOTATION) {
					this.recalculateMeasurements();
					break;
				}
			}
		}
	};

	this.onmousemove = function (x, y) {
		var i;
		// new annotation
		if (currentAnnotation !== null) {
			if(currentAnnotation.type==FREE_FORM_ANNOTATION||currentAnnotation.type==LASSO_ANNOTATION||currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION){
				currentAnnotation.points[currentAnnotation.points.length] = new BluVueSheet.Point(x, y);
			} else if (currentAnnotation.type != POLYGON_ANNOTATION) {
				if (currentAnnotation.rectType) {
					if (Math.abs(x - currentAnnotation.points[0].x) < BOUND_DIST / tileView.scale) {
						x += x < currentAnnotation.points[0].x ? -BOUND_DIST / tileView.scale : BOUND_DIST / tileView.scale;
					}

					if (Math.abs(y - currentAnnotation.points[0].y) < BOUND_DIST / tileView.scale) {
						y += y < currentAnnotation.points[0].y ? -BOUND_DIST / tileView.scale : BOUND_DIST / tileView.scale;
					}
				}

				if (currentAnnotation.type == ARROW_ANNOTATION) {
					// drag moves the arrowhead, not the endpoint
					currentAnnotation.points[0] = new BluVueSheet.Point(x, y);
				}
				else
					currentAnnotation.points[1] = new BluVueSheet.Point(x, y);
			}
			if (currentAnnotation.type == MEASURE_ANNOTATION) {
				currentAnnotation.updateMeasure();
			}
		} else if (this.captureMouse) {
			if (this.captureMouse.onDrag) {
				this.captureMouse.onDrag(x, y, {
					annotations: annotations,
					selectedAnnotations: selectedAnnotations
				});

				tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[0]));
			}
			else if (touchedHandle == -1) {
				for (i = 0; i < selectedAnnotations.length; i++) {
					//move text box if it is present
					tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[i]));
					selectedAnnotations[i].offsetTo(x, y);
				}
			}
			this.saveSelectedAnnotations();

			cancelClick = true;
		}
		else // test for rollover cursors
		{
			var cursor = 'auto';
			for (i = 0; i < annotations.length; i++) {
				var a = annotations[i],
					attachmentContains = a.attachmentIndicatorBounds && a.attachmentIndicatorBounds.contains(x, y),
					hyperlinkContains = a.hyperlinkIndicatorBounds && a.hyperlinkIndicatorBounds.contains(x, y),
					attachmentHyperlinkContains = a.attachmentHyperlinkIndicatorBounds && a.attachmentHyperlinkIndicatorBounds.contains(x, y);

				if ((attachmentContains || hyperlinkContains || attachmentHyperlinkContains) && ((!scope.isAdmin && annotations[i].userId == scope.userId) || scope.isAdmin)) {
					cursor = 'pointer';
				}
				else if (a.drawables && a.drawables.length) {
					for (var j in a.drawables) {
						var drawable = a.drawables[j];
						if (drawable.isActive()) {
							if (drawable.getBounds().contains(x, y)) {
								var hoverOptions = drawable.onMouseOver ? drawable.onMouseOver() : {cursor: 'pointer'};
								cursor = hoverOptions.cursor || cursor;
							}
						}
					}
				}
			}
			angular.element(scope.currentSheet.canvas).css('cursor', cursor);
		}
	};
	this.onclick = function (x, y) {

		if (scope.selectedTool !== null && scope.selectedTool.name == 'polygon') {
			return;
		}

		if (cancelClick) {
			cancelClick = false;
			return;
		}

		cancelClick = false;
		this.handleClick(x, y);
	};

	this.ondblclick = function (x, y, e) {
		if (tileView.getTool() == BluVueSheet.Constants.Tools.Polygon) {
			if (currentAnnotation !== null)if (currentAnnotation.type == POLYGON_ANNOTATION) {
				currentAnnotation.points.splice(currentAnnotation.points.length - 1, 1);
				if (BluVueSheet.Point.dist(new BluVueSheet.Point(x, y), currentAnnotation.points[0]) < HANDLE_TOUCH_RADIUS / tileView.scale) {
					currentAnnotation.points.splice(currentAnnotation.points.length - 1, 1);
					currentAnnotation.closed = true;
				}
				tileView.deselectTool();
			}
		}
    else {
      var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);

      tileView.setMaxMinScale( tileView.scale );

      var mouse2 = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);

      var nx = mouse2.x - mouse.x;
      var ny = mouse2.y - mouse.y;

      //centers zoom around mouse
      tileView.setScroll(tileView.scrollX + nx, tileView.scrollY + ny);
      tileView.updateRes();
    }
	};

	this.handleClick = function (x, y) {
		var showAttachments = false, showHyperlinks = false, showAnnotationHyperlinks = false;
		//get which annotations are touched
		var touchedAnnotations = [];
		var i;
		for (i = 0; i < annotations.length; i++) {
			if (!scope.isAdmin && (annotations[i].userId === null || annotations[i].userId != scope.userId) && CALLOUT_ANNOTATION !== annotations[i].type) {
				continue;
			}

			var attachmentIndicatorBounds = annotations[i].attachmentIndicatorBounds,
				hyperlinkIndicatorBounds = annotations[i].hyperlinkIndicatorBounds,
				attachmentHyperlinkIndicatorBounds = annotations[i].attachmentHyperlinkIndicatorBounds;
			if (attachmentIndicatorBounds && attachmentIndicatorBounds.contains(x, y)) {
				touchedAnnotations[touchedAnnotations.length] = annotations[i];
				showAttachments = true;
			}
			else if (hyperlinkIndicatorBounds && hyperlinkIndicatorBounds.contains(x, y)) {
				touchedAnnotations[touchedAnnotations.length] = annotations[i];
				showHyperlinks = true;
			}
			else if (attachmentHyperlinkIndicatorBounds && attachmentHyperlinkIndicatorBounds.contains(x, y)) {
				touchedAnnotations[touchedAnnotations.length] = annotations[i];
				showAnnotationHyperlinks = true;
			}
			else {
				var bounds = annotations[i].bounds;

				if (bounds.width() * tileView.scale < 30)
					bounds = bounds.inset(-(20 / tileView.scale), 0);
				if (bounds.height() * tileView.scale < 30)
					bounds = bounds.inset(0, -(20 / tileView.scale));

				if (bounds.contains(x, y)) {
					touchedAnnotations[touchedAnnotations.length] = annotations[i];
				}
			}
		}
		//get which are selected already
		var selected = [];
		var anySelected = false;
		for (i = 0; i < touchedAnnotations.length; i++) {
			selected[i] = touchedAnnotations[i].selected;
			if (selected[i]) anySelected = true;
		}
		//decide what to do
		if (touchedAnnotations.length === 0) {
			for (i = 0; i < annotations.length; i++) {
				annotations.selectIndex = 0;
			}
			if (selectedAnnotations.length !== 0) {
				this.deselectAllAnnotations();
			}
		} else {
			for (i = 0; i < touchedAnnotations.length; i++) {
				if (!anySelected) {
					var ann = touchedAnnotations[i];
					if (ann.selectIndex <= 0) {
						this.selectSingleAnnotation(touchedAnnotations[i]);
						ann.selectIndex = touchedAnnotations.length;
						break;
					}
				}
				if (selected[i] && touchedAnnotations[i].type != TEXT_ANNOTATION) {
					this.deselectAllAnnotations();
				}
			}
			for (i = 0; i < touchedAnnotations.length; i++) {
				if (!anySelected) touchedAnnotations[i].selectIndex -= 1;
			}
		}

		if (showAttachments) {
			scope.changeFilterAttachmentPanel('selected');
			scope.showAttachmentsPanel(true);
		}

		if(showHyperlinks) {
			scope.goToLinkFromSelectedAnnotation();
		}

		if(showAnnotationHyperlinks) {
			scope.showAttachmentsHyperlinksConfirm();
		}
	};

	this.isAllowMovedAnnotations = function (x, y) {
		if (!selectedAnnotations.length) {
			return true;
		}

		var minX = selectedAnnotations[0].points[0].x,
			maxX = selectedAnnotations[0].points[0].x,
			minY = selectedAnnotations[0].points[0].y,
			maxY = selectedAnnotations[0].points[0].y;
		var i;

		for (i in selectedAnnotations) {
			for (var j in selectedAnnotations[i].points) {
				if (selectedAnnotations[i].points[j].x < minX) {
					minX = selectedAnnotations[i].points[j].x;
				}

				if (selectedAnnotations[i].points[j].x > maxX) {
					maxX = selectedAnnotations[i].points[j].x;
				}

				if (selectedAnnotations[i].points[j].y < minY) {
					minY = selectedAnnotations[i].points[j].y;
				}

				if (selectedAnnotations[i].points[j].y > maxY) {
					maxY = selectedAnnotations[i].points[j].y;
				}
			}
		}

		var h = tileView.sheet.textEditor.getHeight() / tileView.scale;
		if (selectedAnnotations.length == 1 && selectedAnnotations[0].type == TEXT_ANNOTATION) {
			if (!tileView.getRotation() && h > maxY - minY) {
				maxY = minY + (tileView.sheet.textEditor.getHeight() - BOUND_DIST * 2) / tileView.scale;
			}

			if (90 == tileView.getRotation() && h > maxX - minX) {
				maxX = minX + (tileView.sheet.textEditor.getHeight() - BOUND_DIST * 2) / tileView.scale;
			}

			if (180 == tileView.getRotation() && h > maxY - minY) {
				minY = maxY - (tileView.sheet.textEditor.getHeight() - BOUND_DIST * 2) / tileView.scale;
			}

			if (270 == tileView.getRotation() && h > maxX - minX) {
				minX = maxX - (tileView.sheet.textEditor.getHeight() - BOUND_DIST * 2) / tileView.scale;
			}
		}

		var realMinX, realMaxX, realMinY, realMaxY;

		if (!tileView.getRotation() || 180 == tileView.getRotation()) {
			realMinX = tileView.screenCoordinatesFromSheetCoordinates(minX, 0).x;
			realMaxX = tileView.screenCoordinatesFromSheetCoordinates(maxX, 0).x;
			realMinY = tileView.screenCoordinatesFromSheetCoordinates(0, minY).y;
			realMaxY = tileView.screenCoordinatesFromSheetCoordinates(0, maxY).y;
		} else {
			realMinX = tileView.screenCoordinatesFromSheetCoordinates(minX, 0).y;
			realMaxX = tileView.screenCoordinatesFromSheetCoordinates(maxX, 0).y;
			realMinY = tileView.screenCoordinatesFromSheetCoordinates(0, minY).x;
			realMaxY = tileView.screenCoordinatesFromSheetCoordinates(0, maxY).x;
		}

		var canvas_size = document.getElementsByTagName('canvas')[0],
			padding = 25;

		if (!tileView.getRotation() &&
			((realMinX < padding && movePrevX > x) ||
			(realMaxX > canvas_size.width - padding && movePrevX < x) ||
			(realMinY < padding && movePrevY > y) ||
			(realMaxY > canvas_size.height - padding && movePrevY < y))) {
			return false;
		}

		if (180 == tileView.getRotation() &&
			((realMaxY < padding && movePrevY < y) ||
			(realMinY > canvas_size.height - padding && movePrevY > y) ||
			(realMaxX < padding && movePrevX < x) ||
			(realMinX > canvas_size.width - padding && movePrevX > x))) {
			return false;
		}

		if (90 == tileView.getRotation() &&
			((realMaxY < padding && movePrevY < y) ||
			(realMinY > canvas_size.width - padding && movePrevY > y) ||
			(realMinX < padding && movePrevX > x) ||
			(realMaxX > canvas_size.height - padding && movePrevX < x))) {
			return false;
		}

		if (270 == tileView.getRotation() &&
			((realMaxX < padding && movePrevX < x) ||
			(realMinX > canvas_size.height - padding && movePrevX > x) ||
			(realMinY < padding && movePrevY > y) ||
			(realMaxY > canvas_size.width - padding && movePrevY < y))) {
			return false;
		}

		movePrevX = x;
		movePrevY = y;

		for (i in selectedAnnotations) {
			selectedAnnotations[i].applyMoveOffset();
		}

		return true;
	};

	this.textUpdate = function (text) {
		if (selectedAnnotations.length == 1)
			if (selectedAnnotations[0].type == TEXT_ANNOTATION)
				selectedAnnotations[0].text = text;
	};
	this.updateTextEditorIfPresent = function () {
		if (currentAnnotation === null && touchedHandle == -1 && selectedAnnotations.length == 1) {
			tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[0]));
		}
	};
	function calcTextEditorLocation(annotation) {
		var x;
		var y;
		var condition;
		var padding = BOUND_DIST / tileView.scale;
		var w = tileView.sheet.textEditor.getWidth() / tileView.scale;

		if (annotation == undefined) {
			return tileView.screenCoordinatesFromSheetCoordinates(0, 0);
		}

		switch (scope.sheet.rotation) {
			case 90:
				x = annotation.getPoint(0, true).x + annotation.offset_x;
				y = annotation.getPoint(0, true).y + annotation.offset_y - padding;
				condition = tileView.screenCoordinatesFromSheetCoordinates(0, annotation.getPoint(6, true).y).x;
				if (condition > window.innerWidth / 2) {
					y = annotation.getPoint(6, true).y + annotation.offset_y + padding + w;
				}
				break;
			case 180:
				x = annotation.getPoint(6, true).x + annotation.offset_x - padding;
				y = annotation.getPoint(6, true).y + annotation.offset_y;
				condition = tileView.screenCoordinatesFromSheetCoordinates(annotation.getPoint(2, true).x, 0).x;
				if (condition > window.innerWidth / 2) {
					x = annotation.getPoint(2, true).x + annotation.offset_x + padding + w;
				}
				break;
			case 270:
				x = annotation.getPoint(4, true).x + annotation.offset_x;
				y = annotation.getPoint(4, true).y + annotation.offset_y + padding;
				condition = tileView.screenCoordinatesFromSheetCoordinates(0, annotation.getPoint(0, true).y).x;
				if (condition > window.innerWidth / 2) {
					y = annotation.getPoint(0, true).y + annotation.offset_y - padding - w;
				}
				break;
			default:
				x = annotation.getPoint(2, true).x + annotation.offset_x + padding;
				y = annotation.getPoint(2, true).y + annotation.offset_y;
				condition = tileView.screenCoordinatesFromSheetCoordinates(annotation.getPoint(0, true).x, 0).x;
				if (condition > window.innerWidth / 2) {
					x = annotation.getPoint(0, true).x + annotation.offset_x - padding - w;
				}
				break;
		}

		return tileView.screenCoordinatesFromSheetCoordinates(x, y);
	}

	this.setTextSize = function (textSize) {
		if (selectedAnnotations.length == 1)
			if (selectedAnnotations[0].type == TEXT_ANNOTATION) {
				selectedAnnotations[0].textSize = textSize;
				this.saveSelectedAnnotations();
			}
	};

	/**
	 * Selects a single annotation, clearing any previous selection, and surfacing
	 * the editor controls.
	 **/
	this.selectSingleAnnotation = function (annotation) {
		this.deselectAllAnnotations();
		var valid = this.selectAnnotation(annotation);

		if (annotation.type == TEXT_ANNOTATION && valid) {
			this.captureKeyboard = true;
			tileView.sheet.textEditor.setText(annotation.text);
			tileView.sheet.textEditor.show(calcTextEditorLocation(annotation));
			annotation.added = true;
		}
		tileView.sheet.floatingOptionsMenu.show();
	};

	/**
	 * Selects an array of annotations, clearing any previous selection, and
	 * surfacing the editor controls.
	 **/
	this.setSelectedAnnotations = function (annotations) {
		this.deselectAllAnnotations();
		for (var i = 0; i < annotations.length; i++) {
			this.selectAnnotation(annotations[i]);
		}
		tileView.sheet.floatingOptionsMenu.show();
	};

	// Returns true if the annotation is personal or if the user is an admin.
	this.isSelectable = function (annotation) {
		return (annotation != undefined && ( annotation.userId || scope.isAdmin )) || CALLOUT_ANNOTATION === annotation.type;
	};

	/**
	 * Adds a single annotation to the selection group without surfacing the
	 * annotation editor.
	 *
	 * Implementor note:  This is probably not what you want - try using
	 * setSelectedAnnotations() or selectSingleAnnotation(), as appropriate.
	 **/
	this.selectAnnotation = function (annotation, updateUI) {
		if (!this.isSelectable(annotation)) {
			return false;
		}

		selectedAnnotations.push(annotation);
		annotation.selected = true;
		annotation.showHandles = (selectedAnnotations.length == 1);
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);

		if (updateUI) {
			tileView.sheet.floatingOptionsMenu.show();
		}

		// Master Callout Annotation
		if(CALLOUT_ANNOTATION === annotation.type && null === annotation.userId) {
			scope.goToLinkFromSelectedAnnotation();

			if(scope.isAdmin) {

			} else {
				this.deselectAllAnnotations();
			}

		}

		return true;
	};

	this.deselectAllAnnotations = function () {
		if (selectedAnnotations.length == 1) {
			if (selectedAnnotations[0].type == TEXT_ANNOTATION) {
				this.saveSelectedAnnotations();
			}

			if (selectedAnnotations[0].type == CALLOUT_ANNOTATION && !selectedAnnotations[0].links.length) {
				this.deleteAnnotation(selectedAnnotations[0]);
			}
		}
		var toKill = [];
		selectedAnnotations = [];
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);
		var i;
		for (i = 0; i < annotations.length; i++) {
			annotations[i].selected = false;
			annotations[i].showHandles = false;
			if (annotations[i].type == TEXT_ANNOTATION && !annotations[i].text && annotations[i].added) {
				toKill[toKill.length] = annotations[i];
			}
		}

		this.hideSelectionUI();

		for (i = 0; i < toKill.length; i++) {
			removeFromArray(annotations, toKill[i]);
		}
	};

	/**
	 * Deselects a single annotation.  If deselecting ALL annotations, it's far
	 * more efficient to call deselectAllAnnotations()
	 **/
	this.deselectAnnotation = function deselectAnnotation(annotation) {
		if (!annotation)
			return;

		if (selectedAnnotations.length == 1) {
			if (selectedAnnotations[0].type == TEXT_ANNOTATION) {
				this.saveSelectedAnnotations();
			}
		}

		var newSelection = [];
		for (var i = 0; i < selectedAnnotations.length; i++) {
			if (annotation.id !== selectedAnnotations[i].id)
				newSelection.push(selectedAnnotations[i]);
		}
		selectedAnnotations = newSelection;
		tileView.setSelectedOptionsForAnnotations([], tileView);
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);

		annotation.selected = false;
		annotation.showHandles = false;
		if (annotation.type == TEXT_ANNOTATION && !annotation.text && annotations[i].added) {
			removeFromArray(annotations, annotation);
		}

		if (selectedAnnotations.length === 0)
			this.hideSelectionUI();
	};

	this.hideSelectionUI = function hideSelectionUI() {
		this.captureKeyboard = false;
		tileView.sheet.textEditor.hide();
		tileView.sheet.floatingOptionsMenu.hide();
	};

	this.selectAllInLasso = function () {
		this.deselectAllAnnotations();
		for (var i = 0; i < annotations.length; i++) {
			var pointsInLasso = 0;
			for (var j = 0; j < 8; j += 2)    if (pointInLasso(annotations[i].getPoint(j, false)))pointsInLasso++;
			if (pointsInLasso >= 3 && this.isSelectable(annotations[i])) {
				selectedAnnotations[selectedAnnotations.length] = annotations[i];
				annotations[i].selected = true;
			}
		}
		if (selectedAnnotations.length == 1) {
			selectedAnnotations[0].showHandles = true;
		}
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);
		if (selectedAnnotations.length > 0) {
			tileView.sheet.floatingOptionsMenu.show();
		}
	};

	/**
	 * Deletes the given annotation.
	 **/
	this.deleteAnnotation = function deleteAnnotation(annotation, suppressSync) {
		if (annotation) {
			this.deselectAnnotation(annotation);
			removeFromArray(annotations, annotation);

			if (annotation.type == SCALE_ANNOTATION) {
				this.scaleAnnotation = null;
				this.recalculateMeasurements();
			}

			if (!suppressSync)
				scope.scheduleAnnotationSync(null, [annotation.id], null, false);
		}
	};

	this.deleteSelectedAnnotations = function () {
		var self = this,
			dialog = new BluVueSheet.Dialog(),
			title = "Delete Annotation?",
			msg = "This will permanently delete " + (selectedAnnotations.length == 1 ? "this annotation" : (selectedAnnotations.length + " annotations") ),
			col_attachments = 0;

		for (var i in selectedAnnotations) {
			col_attachments += selectedAnnotations[i].attachments.length;
		}

		if (col_attachments) {
			title = selectedAnnotations.length == 1 ? "Delete Annotation with Attachments?" : "Delete Annotations and Attachments? ";
			msg = selectedAnnotations.length == 1 ? "This annotation has " + col_attachments + " attachments. The attachments and the annotation will be permanently deleted." : "The " + selectedAnnotations.length + " selected annotations have a total of " + col_attachments + " attachments. The attachments and and annotations will be permanently deleted.";
		}

		dialog.showConfirmDialog({
			title: title,
			message: msg,
			okLabel: "Delete",
			okAction: function () {
				var tempSelected = selectedAnnotations;
				var reAdded = false;

				function deleteFailed() {
					if (!reAdded) {
						for (var i = 0; i < tempSelected.length; i++) {
							var annotation = tempSelected[i];
							annotations[annotations.length] = annotation;
							if (annotation.type == SCALE_ANNOTATION)self.scaleAnnotation = annotation;
						}
						reAdded = true;
					}
				}

				// Make a shallow clone of the selections to avoid odditity of
				// walking an array while it's being mutated.
				var tmp = selectedAnnotations.slice();
				var deleteList = [];
				for (var i = 0; i < tmp.length; i++) {
					deleteList.push(tmp[i].id);
					self.deleteAnnotation(tmp[i], true);
				}
				scope.scheduleAnnotationSync(null, deleteList, null, false);

				selectedAnnotations = [];
				tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);
				self.captureKeyboard = false;
				tileView.sheet.textEditor.hide();
				tileView.sheet.floatingOptionsMenu.hide();

				dialog.hide();
			}
		});
	};

  /**
   * Units Panel Annotation.
   **/
    this.showUnitsPanel = function() {
      //var annotations = this.getSelectedAnnotation();
      /*console.log(annotations[0].hasArea);
      console.log(annotations[0].hasPerimeter);*/

      var self = this,
      dialog = new BluVueSheet.Dialog({showType: 'unit'}),
      title = "Show Units",
      m = selectedAnnotations[0].measurement;
	    console.log(selectedAnnotations[0])

      var holder = angular.element( "<div class='bluvue-editor-units'/>" );

      //Main Unit Screen
      var firstUnitScreen = angular.element( "<div class='unit-screen-1 unit-screen'/>" );

      //Length
      var firstUnitScreenLength = angular.element( "<div class='unit-length'/>" );
      firstUnitScreenLength.append(angular.element( "<div class='unit-screen-title'>Length</div>" ));
      var bodyScreen = angular.element( "<div class='unit-screen-body'/>"),
      bodyScreenShowLength = angular.element( "<div class='unit-screen-body-row'/>"),
      bodyScreenShowLengthName = angular.element( "<span class='unit-screen-body-row-left'>Show length in</span>"),
      bodyScreenShowLengthVal = angular.element( "<span class='unit-screen-body-row-right'></span>" );
      //select length row
      bodyScreenShowLength.on('click', function() {
        angular.element( document.getElementsByClassName('dialog-top-button')[1]).addClass('hide');
        secondUnitScreenTitle.text('Length');
        secondUnitScreenBody.empty();
        for( var i=0; i<units.length; i++ )
        {
          if( units[i] != 'FTIN' )
          {
            // unit id is i, unit name is displayNames[i]
            var selected = (i == defaultUnit) ? " selected" : "";
            secondUnitScreenBody.append( angular.element( "<div class='list-units" + selected + "' data-val='" + i + "'>"+ UnitDisplayFullNames[i] +"</div>").on('click', function(e) {
              angular.element(document.querySelector('.list-units.selected')).removeClass('selected');
              angular.element(e.target).addClass('selected');
              bodyScreenShowLengthVal.text(angular.element(e.target).text());
              bodyScreenShowLengthVal.attr('data-val', angular.element(e.target).attr('data-val'));
              defaultUnit = angular.element(e.target).attr('data-val');
            }) );
          }
        }
        var label = document.getElementsByClassName('dialog-top-button')[0];
        label.innerHTML = 'Back';
        angular.element(firstUnitScreen).toggleClass('unit-hide');
        angular.element(secondUnitScreen).toggleClass('unit-hide');
      });

      var unitType = BluVueSheet.Constants.Length;
      var units = BluVueSheet.Constants.UnitNames[ unitType ];
      var UnitDisplayFullNames = BluVueSheet.Constants.UnitDisplayFullNames[ unitType ];
      var defaultUnit = m && m.type === unitType ? m.unit : 1;
      bodyScreenShowLengthVal.append(UnitDisplayFullNames[defaultUnit]);
      bodyScreenShowLength.append(bodyScreenShowLengthName).append(bodyScreenShowLengthVal);
      bodyScreen.append(bodyScreenShowLength);


      if(selectedAnnotations[0].hasPerimeter && selectedAnnotations[0].hasArea) {
        var bodyScreenShowLengthDisplay = angular.element( "<div class='unit-screen-body-row'/>"),
          bodyScreenShowLengthNameDisplay = angular.element( "<span class='unit-screen-body-row-left'>Display on Annotation</span>"),
          bodyScreenShowLengthValDisplay = angular.element( "<span class='unit-screen-body-row-right switch'></span>" );

        var bodyScreenShowLengthCheckbox = angular.element( '<input id="cmn-toggle-length" class="cmn-toggle cmn-toggle-round" type="checkbox">' ),
        bodyScreenShowLengthLabel = angular.element( '<label for="cmn-toggle-length"></label>' );

        if(m && m.type === unitType && (selectedAnnotations[0].areaMeasured || selectedAnnotations[0].perimeterMeasured)) {
          bodyScreenShowLengthCheckbox.prop('checked', true);
        }
        bodyScreenShowLengthCheckbox.on( 'click', function(){
          if(bodyScreenShowLengthCheckbox.attr('checked')) {
            bodyScreenShowvAreaCheckbox.prop('checked', false);
          }
        });
        bodyScreenShowLengthValDisplay.append(bodyScreenShowLengthCheckbox).append(bodyScreenShowLengthLabel);

        bodyScreenShowLengthDisplay.append(bodyScreenShowLengthNameDisplay).append(bodyScreenShowLengthValDisplay);
        bodyScreen.append(bodyScreenShowLengthDisplay);
      }

      firstUnitScreenLength.append(bodyScreen);
      firstUnitScreen.append(firstUnitScreenLength)
      //END LENGTH

      //Area
      if(selectedAnnotations[0].hasPerimeter && selectedAnnotations[0].hasArea) {
        var firstUnitScreenArea = angular.element( "<div class='unit-area'/>" );
        firstUnitScreenArea.append(angular.element( "<div class='unit-screen-title'>Area</div>" ));
        var bodyScreenArea = angular.element( "<div class='unit-screen-body'/>"),
          bodyScreenShowArea = angular.element( "<div class='unit-screen-body-row'/>"),
          bodyScreenShowAreaName = angular.element( "<span class='unit-screen-body-row-left'>Show area in</span>"),
          bodyScreenShowAreaVal = angular.element( "<span class='unit-screen-body-row-right'></span>" );

        //select area row
        bodyScreenShowArea.on('click', function() {
          angular.element( document.getElementsByClassName('dialog-top-button')[1]).addClass('hide');
          secondUnitScreenTitle.text('Area');
          secondUnitScreenBody.empty();
          for( var i=0; i<unitsArea.length; i++ )
          {
            var selected = (i == defaultUnitArea) ? " selected" : "";
            secondUnitScreenBody.append( angular.element( "<div class='list-units" + selected + "' data-val='" + i + "'>"+ UnitDisplayFullNamesArea[i] +"</div>").on('click', function(e) {
              angular.element(document.querySelector('.list-units.selected')).removeClass('selected');
              angular.element(e.target).addClass('selected');
              bodyScreenShowAreaVal.text(angular.element(e.target).text());
              bodyScreenShowAreaVal.attr('data-val', angular.element(e.target).attr('data-val'));
              defaultUnitArea = angular.element(e.target).attr('data-val');
            }) );
          }
          var label = document.getElementsByClassName('dialog-top-button')[0];
          label.innerHTML = 'Back';
          angular.element(firstUnitScreen).toggleClass('unit-hide');
          angular.element(secondUnitScreen).toggleClass('unit-hide');
        });

        var unitTypeArea = BluVueSheet.Constants.Area;
        var unitsArea = BluVueSheet.Constants.UnitNames[ unitTypeArea ];
        var UnitDisplayFullNamesArea = BluVueSheet.Constants.UnitDisplayFullNames[ unitTypeArea ];
        var defaultUnitArea = m && m.type === unitTypeArea ? m.unit : 1;

        bodyScreenShowAreaVal.append(UnitDisplayFullNamesArea[defaultUnitArea]);
        bodyScreenShowArea.append(bodyScreenShowAreaName).append(bodyScreenShowAreaVal);
        bodyScreenArea.append(bodyScreenShowArea);

        var bodyScreenShowAreaDisplay = angular.element( "<div class='unit-screen-body-row'/>"),
          bodyScreenShowAreaNameDisplay = angular.element( "<span class='unit-screen-body-row-left'>Display on Annotation</span>"),
          bodyScreenShowAreaValDisplay = angular.element( "<span class='unit-screen-body-row-right switch'></span>" );

        var bodyScreenShowvAreaCheckbox = angular.element( '<input id="cmn-toggle-area" class="cmn-toggle cmn-toggle-round" type="checkbox">' ),
        bodyScreenShowAreaLabel = angular.element( '<label for="cmn-toggle-area"></label>' );

        if(m && m.type === unitTypeArea && (selectedAnnotations[0].areaMeasured || selectedAnnotations[0].perimeterMeasured)) {
          bodyScreenShowvAreaCheckbox.prop('checked', true);
        }

        bodyScreenShowvAreaCheckbox.on( 'click', function(){
          if(bodyScreenShowvAreaCheckbox.attr('checked')) {
            bodyScreenShowLengthCheckbox.prop('checked', false);
          }
        });

        bodyScreenShowAreaValDisplay.append(bodyScreenShowvAreaCheckbox).append(bodyScreenShowAreaLabel);

        bodyScreenShowAreaDisplay.append(bodyScreenShowAreaNameDisplay).append(bodyScreenShowAreaValDisplay);
        bodyScreenArea.append(bodyScreenShowAreaDisplay);
        firstUnitScreenArea.append(bodyScreenArea);
        firstUnitScreen.append(firstUnitScreenArea);
      }
      //END Area
      holder.append(firstUnitScreen);
      //Second Unit Screen
      var secondUnitScreen = angular.element( "<div class='unit-screen-2 unit-screen unit-hide'/>"),
      secondUnitScreenTitle = angular.element( "<div class='unit-screen-title'></div>"),
      secondUnitScreenBody = angular.element( "<div class='unit-screen-body'/>");
      secondUnitScreen.append(secondUnitScreenTitle).append(secondUnitScreenBody);
      holder.append(secondUnitScreen);

      dialog.showConfirmDialog({
        title: title,
        bodyElement: holder,
        hideOkButton: true,
        hideCancelButton: true,
        button1Action: function() {
          //
          var label = document.getElementsByClassName('dialog-top-button')[0];
          if(label.innerHTML == 'Cancel') {
            dialog.hide();
          }
          else {
            var label = document.getElementsByClassName('dialog-top-button')[0];
            label.innerHTML = 'Cancel';
            angular.element(firstUnitScreen).toggleClass('unit-hide');
            angular.element(secondUnitScreen).toggleClass('unit-hide');
            angular.element( document.getElementsByClassName('dialog-top-button')[1]).removeClass('hide');
          }
        },
        button2Action: function() {
          if(selectedAnnotations[0].hasPerimeter && selectedAnnotations[0].hasArea) {
	        if(m === null) {
		        selectedAnnotations[0].measurement = new BluVueSheet.Measurement(0, self.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
		        m = selectedAnnotations[0].measurement;
	        }

            if (bodyScreenShowLengthCheckbox.attr('checked')) {
              selectedAnnotations[0].areaMeasured=false;
              selectedAnnotations[0].perimeterMeasured=true;
              m.type = 0;
              m.changeToUnit( defaultUnit );
            }
            else if(bodyScreenShowvAreaCheckbox.attr('checked')) {
              selectedAnnotations[0].areaMeasured=true;
              selectedAnnotations[0].perimeterMeasured=false;
              m.type = 1;
              m.changeToUnit( defaultUnitArea );
            }
            else {
              selectedAnnotations[0].areaMeasured=false;
              selectedAnnotations[0].perimeterMeasured=false;
              m = new BluVueSheet.Measurement(0, self.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
            }
          }
          else {
            m.changeToUnit( defaultUnit );
          }
          selectedAnnotations[0].updateMeasure();
          self.saveSelectedAnnotations();
          dialog.hide();
        },
        button2Label:'Save'
      });
    };
	/**
	 * Clones the given annotation, making sure that ID and user fields are
	 * reset appropriately
	 **/
	this.cloneAnnotation = function (annotation) {

		var clone = loadAnnotationJSON(JSON.parse(JSON.stringify(annotation.toSerializable())), tileView);
		clone.id = scope.generateUUID();
		clone.added = true;
		clone.userId = scope.userId;

		clone.attachments = clone.attachments || {};
		for (var i = 0; i < clone.attachments.length; i++) {
			var attachment = clone.attachments[i];
			attachment.id = scope.generateUUID();
			attachment.annotationId = clone.id;
			attachment.annotation = clone;
			attachment.createdDate = scope.generateTimestamp();
			attachment.userId = scope.userId;
			attachment.email = scope.email;
		}

		return clone;
	};

	this.copySelectedAnnotations = function () {
		var copies = [];
		for (var i = 0; i < selectedAnnotations.length; i++) {
			copies[i] = this.cloneAnnotation(selectedAnnotations[i]);

			copies[i].offset_x = -25 / tileView.scale;
			copies[i].offset_y = -25 / tileView.scale;
			copies[i].applyOffset();

			scope.scheduleAnnotationSync([copies[i]], null, null, false);
			annotations[annotations.length] = copies[i];
		}
		this.setSelectedAnnotations(copies);
	};

	this.fillSelectedAnnotations = function () {
		var totalFilled = 0, totalCanFilled = 0;
		var ret = false;
		var i;
		for (i = 0; i < selectedAnnotations.length; i++) {
			if (selectedAnnotations[i].fill && tileView.isFillableAnnotation(selectedAnnotations[i].type))
				totalFilled++;

			if (tileView.isFillableAnnotation(selectedAnnotations[i].type))
				totalCanFilled++;
		}

		for (i = 0; i < selectedAnnotations.length; i++) {
			if (tileView.isFillableAnnotation(selectedAnnotations[i].type)) {
				selectedAnnotations[i].fill = totalFilled < totalCanFilled;
				ret = selectedAnnotations[i].fill;
			}
		}
		this.saveSelectedAnnotations();
		return ret;
	};

	this.colorSelectedAnnotations = function (color) {
		var ret = false;
		for (var i = 0; i < selectedAnnotations.length; i++) {
			selectedAnnotations[i].setColor(color);
			ret = true;
		}
		this.saveSelectedAnnotations();
		return ret;
	};

	this.perimeterSelectedAnnotation = function () {
		selectedAnnotations[0].perimeterMeasured = !selectedAnnotations[0].perimeterMeasured;
		if (selectedAnnotations[0].perimeterMeasured) {
			selectedAnnotations[0].areaMeasured = false;
			selectedAnnotations[0].measurement = new BluVueSheet.Measurement(0, this.scaleAnnotation.measurement.unit, BluVueSheet.Constants.Length);
			selectedAnnotations[0].updateMeasure();
		}
		this.saveSelectedAnnotations();
	};

	this.areaSelectedAnnotation = function () {
		selectedAnnotations[0].areaMeasured = !selectedAnnotations[0].areaMeasured;
		if (selectedAnnotations[0].areaMeasured) {
			selectedAnnotations[0].perimeterMeasured = false;
			selectedAnnotations[0].measurement = new BluVueSheet.Measurement(0, BluVueSheet.Measurement.toArea(this.scaleAnnotation.measurement.unit), BluVueSheet.Constants.Area);
			selectedAnnotations[0].updateMeasure();
		}
		this.saveSelectedAnnotations();
	};

	this.convertToUnit = function (type, subType) {
		for (var i = 0; i < selectedAnnotations.length; i++) {
			var ann = selectedAnnotations[i];
			if (type === BluVueSheet.Constants.Length && ann.type === MEASURE_ANNOTATION) {
				ann.measurement.changeToUnit(subType);
			} else if (type === BluVueSheet.Constants.Area && ann.areaMeasured) {
				ann.measurement.changeToUnit(subType);
			}
		}
		this.saveSelectedAnnotations();
	};

	this.isAnnotationContextMaster = function () {
		for (var i = 0; i < selectedAnnotations.length; i++) {
			if (selectedAnnotations[i].userId) {
				return false;
			}
		}
		return true;
	};

	this.masterSelectedAnnotations = function toggleAnnotationContextMaster() {
		this.setAnnotationContextMaster(!this.isAnnotationContextMaster());
	};

	this.setAnnotationContextMaster = function (isMaster) {
		var i;
		for (i in selectedAnnotations) {
			if (selectedAnnotations[i].type == MEASURE_ANNOTATION && isMaster) {
				for (var j in annotations) {
					if (annotations[j].type == SCALE_ANNOTATION) {
						annotations[j].userId = null;
						scope.scheduleAnnotationSync( [annotations[j]], null, null, false );
					}
				}
			}

      if(selectedAnnotations[i].type == SCALE_ANNOTATION && !isMaster) {
        this.scaleAnnotationMaster = null;
      }
		}

		for (i = 0; i < selectedAnnotations.length; i++) {
			selectedAnnotations[i].userId = isMaster ? null : scope.userId;
		}
    var data = BluVueSheet.Constants.AnnotationMenuButtons.TypeSwitcher.states[isMaster ? 'master' : 'personal'];
    var typeSwitcher = isMaster ? 'personal' : 'master';
    angular.element(document.getElementsByClassName('type-switcher-button-' + typeSwitcher)[0]).text(data.parentText).removeClass('type-switcher-button-' + typeSwitcher).addClass(isMaster ? 'type-switcher-button-master' : 'type-switcher-button-personal');
		this.saveSelectedAnnotations();
	};

	// Checks whether a point is inside a polygon.
	// See:  http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
	// Credit:
	//   Jonas Raoni Soares Silva  - http://jsfromhell.com/math/is-point-in-poly [rev. #0]
	var isPointInPoly = function (poly, pt) {
		var c = false;
		for (var i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
			if (((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
				&& (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x))
				c = !c;
		return c;
	};
	var pointInLasso = function (point) {
		return isPointInPoly(lasso.points, point);
	};

	this.drawAllAnnotations = function (context) {
		for (var i = 0; i < annotations.length; i++) {
			annotations[i].drawMe(context, scope);
		}
		if (currentAnnotation !== null) {
			currentAnnotation.drawMe(context, scope);
		}
	};

	this.recalculateMeasurements = function () {
		for (var j = 0; j < annotations.length; j++) {
			if (annotations[j].measurement !== null && annotations[j].type !== SCALE_ANNOTATION) {
				annotations[j].updateMeasure();
			}
		}
	};

	this.updateCalibration = function (annotation, onSuccess) {
		var mgr = this;
		annotation = annotation || selectedAnnotations[0];

		var dialog = new BluVueSheet.Dialog();
		var holder = angular.element("<div class='bluvue-editor-holder'/>");
		var defaultValue = annotation.measurement ? (" value='" + annotation.measurement.amount + "'") : "";
		var editor = angular.element("<input class='bluvue-scale-edit'" + defaultValue + "></input>");
		editor.on('click', function (e) {
			e.stopPropagation();
		});
		holder.append(editor);

		var unitType = BluVueSheet.Constants.Length;
		var units = BluVueSheet.Constants.UnitNames[unitType];
		var displayNames = BluVueSheet.Constants.UnitDisplayNames[unitType];
		var defaultUnit = annotation.measurement ? annotation.measurement.unit : 1;  // unit[1] is FT
		var unitEditor = angular.element("<select class='bluvue-annotation-unit-edit'></select>");
		for (var i = 0; i < units.length; i++) {
			if (units[i] != 'FTIN') {
				// unit id is i, unit name is displayNames[i]
				var selected = (i == defaultUnit) ? " selected" : "";
				unitEditor.append(angular.element("<option value='" + i + "'" + selected + ">" + displayNames[i] + "</option>"));
			}
		}
		unitEditor.on('click', function (e) {
			e.stopPropagation();
		});
		holder.append(unitEditor);

		var entryValidator = function entryValidator(okButton) {
			var txtVal = editor.val();
			var valid = txtVal && !isNaN(Number(txtVal));
			okButton.css('visibility', valid ? 'visible' : 'hidden');
		};

		// Spoof BluVueSheet.KeyboardControls to make it not eat our keypresses
		var oldKeyCapture = this.captureKeyboard;
		this.captureKeyboard = true;
		dialog.showConfirmDialog({
			title: 'Calibrate Scale',
			//message: 'Enter Scale with Units',
			message: "Enter Scale with Units",
			bodyElement: holder,
			okLabel: 'Set',
			validatorFactory: function createValidator(okButton) {
				editor.on('change keypress paste input', function () {
					entryValidator(okButton);
				});

				// Validate the initial condition too...
				entryValidator(okButton);
			},
			okAction: function saveScaleCalibrationAction() {
				var amount = Number(editor.val());
				var unit = parseInt(unitEditor[0].value, 10);
				annotation.measurement = new BluVueSheet.Measurement(amount, unit, unitType);
				mgr.scaleAnnotation = annotation;
				if (onSuccess)
					onSuccess(annotation);
				else
					scope.scheduleAnnotationSync([annotation], null, null, false);


				mgr.selectSingleAnnotation(annotation);

				mgr.recalculateMeasurements();

				dialog.hide();
			},
			cancelAction: function hideAction() {
				this.captureKeyboard = oldKeyCapture;
				dialog.hide();
			}
		});
	};

	this.finishAnnotation = function () {
		var mgr = this;
		var doSave = function doSave(annotation) {
			//force annotation to be Personal
			annotation.userId = scope.userId;
			annotation.calcBounds();
			annotations.push(annotation);
			if (annotation.type != TEXT_ANNOTATION) {
				annotation.added = true;
				scope.scheduleAnnotationSync([annotation], null, null, false);
			}
		};

		if (currentAnnotation !== null) {
			this.deselectAllAnnotations();
			if (currentAnnotation.points.length > 1 && currentAnnotation.type != LASSO_ANNOTATION) {
				if (currentAnnotation.type == SCALE_ANNOTATION) {
					this.updateCalibration(currentAnnotation, doSave);
				} else {
			              if(currentAnnotation.type==PEN_ANNOTATION||currentAnnotation.type==HIGHLIGHTER_ANNOTATION) {
					              var new_points = [currentAnnotation.points[0]],
						                d = currentAnnotation.type==PEN_ANNOTATION ? DISTANCE_BETWEEN_PEN_POINTS : DISTANCE_BETWEEN_HIGHLIGHTER_POINTS;
						                dist = tileView.scale < 1.2 ? d * tileView.scale : d / tileView.scale;
					              for(var i in currentAnnotation.points) {
						              var cur_point = tileView.screenCoordinatesFromSheetCoordinates(currentAnnotation.points[i].x, currentAnnotation.points[i].y),
							                new_point = tileView.screenCoordinatesFromSheetCoordinates(new_points[new_points.length-1].x, new_points[new_points.length-1].y);

						              if(Math.sqrt(Math.pow(new_point.x - cur_point.x, 2) + Math.pow(new_point.y - cur_point.y, 2)) > dist) {
														new_points.push(currentAnnotation.points[i]);
						              }
					              }

				                if(currentAnnotation.points.length != new_points.length) {
					                new_points.push((currentAnnotation.points[currentAnnotation.points.length-1]));
				                }

				              console.log(currentAnnotation.points.length, new_points.length);

				                currentAnnotation.points = new_points;
			              }

					doSave(currentAnnotation);
				}
			}
			if (currentAnnotation.type == TEXT_ANNOTATION)
				this.selectSingleAnnotation(currentAnnotation);

			if (currentAnnotation.type == CALLOUT_ANNOTATION) {
				tileView.annotationManager.selectAnnotation(currentAnnotation);
				tileView.sheet.floatingOptionsMenu.show();
				scope.showLinkPanel(true, true, null);
			}

			cancelClick = true;
		}
		currentAnnotation = null;
	};
	this.updateOptionsMenu = function () {
		tileView.setSelectedOptionsForAnnotations(selectedAnnotations, tileView);
	};

	this.updateOptionsMenuUI = function (selectedAnnotations) {
		tileView.sheet.textEditor.setLoc(calcTextEditorLocation(selectedAnnotations[0]));
	};

	this.loadAnnotation = function (jsonString) {
		this.addAnnotation(loadAnnotationJSON(JSON.parse(jsonString), tileView));
	};

	this.addAnnotation = function addAnnotation(annotation) {
		annotation.added = true;
		if (annotation.type == SCALE_ANNOTATION) {
      if(!annotation.userId) {
        for (var i = 0; i < annotations.length; i++) {
          annotations[i].scaleAnnotation = null;
        }
        this.scaleAnnotationMaster = annotation.id;
      }

      if(!this.scaleAnnotationMaster || this.scaleAnnotationMaster == annotation.id) {
        this.scaleAnnotation = annotation;
        for (var i = 0; i < annotations.length; i++) {
          annotations[i].updateMeasure();
        }
      }
		}
		annotations.push(annotation);
	};

	this.saveSelectedAnnotations = function () {
		for (var i = 0; i < selectedAnnotations.length; i++) {
			if (selectedAnnotations[i].type === TEXT_ANNOTATION && selectedAnnotations[i].text.length === 0) {
				continue;
			}
			scope.scheduleAnnotationSync([selectedAnnotations[i]], null, null, false);
		}
	};


	/**
	 * Called by the system when an annotation is externally updated.  Updates
	 * will be passed as an array of annotation state objects (deserialized JSON
	 * states).
	 **/
	this.onExternalAnnotationUpdate = function onExternalAnnotationUpdate(serializedAnnotations) {
		var mgr = this;
		if (serializedAnnotations && serializedAnnotations.length) {
			serializedAnnotations.forEach(function (serializedAnnotation) {
				var annotation = loadAnnotationJSON(serializedAnnotation, tileView);
				var oldAnnotation = mgr.getAnnotation(annotation.id);

				// TODO: Test to see if local annotation is dirty (i.e., with unapplied local edits)
				var isDirty = false;

				if (!isDirty && !annotation.equals(oldAnnotation)) {
					var isSelected = mgr.isSelected(annotation.id);

					if (!isSelected) {
						mgr.deleteAnnotation(oldAnnotation, true);
						mgr.addAnnotation(annotation);
					}
					// Otherwise, ignore the external edit - we own the edit state here.
					// Network-wide, the last one to save their edits will win this race
					// and apply across the board.
				}
			});

			scope.isShowAttachmentsButton = scope.currentSheet.tileView.annotationManager.getAttachments(false).length;
		}
	};


	/**
	 * Called by the system when an annotation is externally deleted.  Updates
	 * will be passed as an array of annotation ids.
	 **/
	this.onExternalAnnotationDelete = function onExternalAnnotationDelete(annotationIds) {
		var mgr = this;
		if (annotationIds && annotationIds.length) {
			annotationIds.forEach(function (id) {
				mgr.deleteAnnotation(mgr.getAnnotation(id), true);
			});
		}
	};

	this.isSelected = function isSelected(annotationId) {
		for (var i = 0; i < selectedAnnotations.length; i++)
			if (selectedAnnotations[i].id == annotationId)
				return true;
		return false;
	};

	this.getSelectedAnnotation = function getSelectedAnnotation() {
		return selectedAnnotations;
	};

	this.getAnnotations = function getAnnotations() {
		return annotations;
	};

	this.getAnnotation = function getAnnotation(annotationId) {
		for (var i = 0; i < annotations.length; i++) {
			if (annotations[i].id == annotationId)
				return annotations[i];
		}
	};

	this.configureDefaultAnnotation = function (x, y) {

		var width = 75 / tileView.scale;
		var height = 75 / tileView.scale;

		switch (currentAnnotation.type) {
			case SQUARE_ANNOTATION:
			case CIRCLE_ANNOTATION:
			case CALLOUT_ANNOTATION:
			case CLOUD_ANNOTATION:
			case X_ANNOTATION:
			case ARROW_ANNOTATION:
			case LINE_ANNOTATION:
				currentAnnotation.points[0] = new BluVueSheet.Point(x, y);
				currentAnnotation.points[1] = new BluVueSheet.Point(x + width, y + height);
				break;
			case MEASURE_ANNOTATION:
			case SCALE_ANNOTATION:
				currentAnnotation.points[1] = new BluVueSheet.Point(x + width, y);
				break;

			default:
				console.log("No default shape logic for type", currentAnnotation.type);
		}
	};

	this.getAttachments = function getAttachments(selectedOnly) {
		var attachments = [];
		var items = selectedOnly ? selectedAnnotations : annotations;
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			if (item.attachments && item.attachments.length) {
				for (var j = 0; j < item.attachments.length; j++) {
					attachments.push(item.attachments[j]);
				}
			}
		}
		return attachments;
	};

	this.addAttachment = function addAttachment(annotation, attachment) {
		attachment.annotation = annotation;
		attachment.annotationId = annotation.id;

		annotation.attachments.push(attachment);
		scope.scheduleAnnotationSync([annotation], null, null, false);

		this.selectSingleAnnotation(annotation);
		angular.element(document.querySelector('.bv-options-attachments')).addClass('another-status');
	};

	this.removeAttachment = function removeAttachment( annotation, attachment_id ) {
		for(var i in annotation.attachments) {
			if(annotation.attachments[i].id == attachment_id) {
				annotation.attachments.splice(i, 1);
			}
		}
    scope.scheduleAnnotationSync( [annotation], null, null, false );

		this.selectSingleAnnotation(annotation);
		angular.element(document.querySelector('.bv-options-attachments')).addClass('another-status');
	};

	this.issetMasterMeasurementAnnotation = function() {
		for(var i in annotations) {
			if(annotations[i].userId === null && (annotations[i].type == MEASURE_ANNOTATION || annotations[i].type == FREE_FORM_ANNOTATION || annotations[i].type == POLYGON_ANNOTATION || annotations[i].type == SQUARE_ANNOTATION || annotations[i].type == CIRCLE_ANNOTATION || annotations[i].type == CALLOUT_ANNOTATION)) {
				return true;
			}
		}

		return false;
	};

  this.hasUnselectedMasterMeasurment = function () {

    for (var i in annotations) {
      if(annotations[i]) {
        if (annotations[i].userId === null && annotations[i].hasMeasurement() && !annotations[i].selected) {
          return true;
        }
      }
    }

    return false;
  };

  this.hasSelectedMeasurment = function () {
    for (var i in annotations) {
      if(annotations[i]) {
        if (annotations[i].hasMeasurement() && annotations[i].selected) {
          return true;
        }
      }
    }

    return false;
  };

  this.showAttachmentsPanel = function() {
    scope.changeFilterAttachmentPanel('selected');
    scope.showAttachmentsPanel(true);
  };

  this.changeAnnotationType = function(newState) {
    this.setAnnotationContextMaster(newState == 'master');
  };
};
