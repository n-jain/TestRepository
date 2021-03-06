BluVueSheet.Annotation = function Annotation(type, tileView, userId, projectId, sheetId) {
	this.rectType = !(type == POLYGON_ANNOTATION || type == LINE_ANNOTATION || type == ARROW_ANNOTATION ||
	type == SCALE_ANNOTATION || type == MEASURE_ANNOTATION);

	this.id = createUUID();
	this.userId = userId;
	this.projectId = projectId;
	this.sheetId = sheetId;

	this.type = type;
	this.points = [];

	this.selected = false;
	this.showHandles = false;
	this.selectIndex = 0;
	this.added = false;

	this.color = tileView.color.clone();
	this.fill = false;
	this.perimeterMeasured = false;
	this.areaMeasured = false;

	this.text = "";
	this.textSize = tileView.textSize;

	this.closed = false;
	this.attachments = [];

	this.tileView = tileView;
	this.offset_x = 0;
	this.offset_y = 0;
	this.x_handle = undefined;
	this.y_handle = undefined;

	this.measurement = null;
	this.updateMeasure = function () {
	};
	this.hasArea = false;
	this.hasPerimeter = false;
	this.bounds = undefined;
	this.links = [];

	this.setColor = function (color) {
		this.color = color.clone();
		var alpha = type == HIGHLIGHTER_ANNOTATION ? 0.6 : 1;
		this.color.alpha = alpha;
	};

	this.setColor(this.color);

	if (type == LASSO_ANNOTATION) {
		this.color = new Color(0, 0.2, 1, 1);
		this.fill = true;
	}

	this.lineWidth = (type == HIGHLIGHTER_ANNOTATION ? LINE_WIDTH_HIGHLIGHTER : LINE_WIDTH) / tileView.scale;
	if (type != HIGHLIGHTER_ANNOTATION)if (this.lineWidth > 7.5)this.lineWidth = 7.5;
	if (type == HIGHLIGHTER_ANNOTATION)if (this.lineWidth > 75)this.lineWidth = 75;

	this.toSerializable = function toSerializable() {
		return new AnnotationJSON(this);
	};

	var initMeasurement = function (self, linearCalc, areaCalc) {
		self.hasPerimeter = (typeof(linearCalc) == 'function');
		self.hasArea = (typeof(areaCalc) == 'function');

		self.updateMeasure = function () {
			if (self.areaMeasured && self.hasArea)
				areaCalc.apply(self);
			else if (!self.areaMeasured && self.hasPerimeter)
				linearCalc.apply(self);

			return self.measurement;
		};
	};

	switch (type) {
		case MEASURE_ANNOTATION:
			initMeasurement(this, updateMeasureLength, undefined);
			break;
		case SQUARE_ANNOTATION:
			initMeasurement(this, updateMeasureRectPerimeter, updateMeasureRectArea);
			break;
		case POLYGON_ANNOTATION:
			initMeasurement(this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea);
			break;
		case FREE_FORM_ANNOTATION:
			initMeasurement(this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea);
			break;
		case PEN_ANNOTATION:
			initMeasurement(this, updateMeasurePolygonPerimeter, updateMeasurePolygonArea);
			break;
		case CIRCLE_ANNOTATION:
		case CALLOUT_ANNOTATION:
			initMeasurement(this, updateMeasureEllipsePerimeter, updateMeasureEllipseArea);
			break;

		// Unimplemented cases fall through to the default case
		default:
		case LINE_ANNOTATION:
		case ARROW_ANNOTATION:
		case HIGHLIGHTER_ANNOTATION:
		case SCALE_ANNOTATION:
		case X_ANNOTATION:
		case CLOUD_ANNOTATION:
		case TEXT_ANNOTATION:
		case NO_ANNOTATION:
	    case LASSO_ANNOTATION:
	        //Added by Neha [DEV Flair-Solutions]
	    case AUDIO_ANNOTATION:
	    case VIDEO_ANNOTATION:
	    case PHOTO_ANNOTATION:
			initMeasurement(this, undefined, undefined);
	}

  this.hasMeasurement = function hasMeasurement() {
    return (this.type == MEASURE_ANNOTATION) || (this.hasArea && this.areaMeasured) || (this.hasPerimeter && this.perimeterMeasured);
  };

	this.getLength = function getLength(p1, p2) {
		p1 = p1 || this.points[0];
		p2 = p2 || this.points[1];
		return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
	};

	this.calcBounds = function () {
		this.bounds = new BluVueSheet.Rect(0, 0, 0, 0);
		this.bounds.left = this.points[0].x;
		this.bounds.top = this.points[0].y;
		this.bounds.right = this.points[0].x;
		this.bounds.bottom = this.points[0].y;
		for (var i = 1; i < this.points.length; i++) {
			var x = this.points[i].x;
			var y = this.points[i].y;
			if (x < this.bounds.left)this.bounds.left = x;
			if (x > this.bounds.right)this.bounds.right = x;
			if (y < this.bounds.top)this.bounds.top = y;
			if (y > this.bounds.bottom)this.bounds.bottom = y;
		}
	};

	this.drawMe = function (context, scope) {
		this.drawables = [];

		context.strokeStyle = this.color.toStyle();
		context.lineWidth = this.lineWidth;
		context.fillStyle = this.color.transparent().toStyle();
		context.save();
		context.translate(this.offset_x, this.offset_y);

		if (this.selected && (this.type == SCALE_ANNOTATION || this.type == MEASURE_ANNOTATION)) {
			this.drawMeasurementHairLines(context);
		}

		drawFunctions[type].call(this, context);
		if (this.type == TEXT_ANNOTATION && (this.selected || !this.added)) {
			context.strokeStyle = "#000000";
			context.lineWidth = 2 / tileView.scale;
			drawRectangle.call(this, context);
		}

		this.drawables.push.apply(this.drawables, this.updateSelected(context));

		if (this.areaMeasured || this.perimeterMeasured) {
			this.drawMeasurement(context);
		}

		var existsVisibleLinks = false;

		this.links.forEach(function(link) {
		    if (!link.hidden) {
		        existsVisibleLinks = true;
		    }
		});

		if (!this.selected && this.attachments.length && existsVisibleLinks && ((this.userId == null && scope.isAdmin) || (this.userId != null && this.userId == scope.userId))) {
			this.attachmentIndicatorBounds = null;
			this.hyperlinkIndicatorBounds = null;

			this.attachmentHyperlinkIndicatorBounds = this.drawAttachmentsHyperlink.call(this, context);
		} else {
			this.attachmentHyperlinkIndicatorBounds = null;

			if (!this.selected && this.attachments.length) {
				this.attachmentIndicatorBounds = this.drawAttachments.call(this, context);
			}
			else
				this.attachmentIndicatorBounds = null;

			if (!this.selected && existsVisibleLinks && ((this.userId == null && scope.isAdmin) || (this.userId != null && this.userId == scope.userId))) {
				this.hyperlinkIndicatorBounds = this.drawHyperlink.call(this, context);
			}
			else
				this.hyperlinkIndicatorBounds = null;
		}



		renderDrawables(context, this.drawables);

		context.restore();
	};

	/**
	 * Draws an attachments indicator lozenge, returning the bounding box in sheet coordinates of that lozenge
	 **/
	this.drawAttachments = function (context) {

		if (!this.added) {
			return;
		}

		var theta = this.tileView.getRotation() / -180 * Math.PI;
		var isFlipped = (this.tileView.getRotation() == 90 || this.tileView.getRotation() == 270);
		context.save();

		var x = this.bounds.left + (this.bounds.width() / 2);
		var y = this.bounds.top + (this.bounds.height() / 2);
		var width = isFlipped ? this.bounds.height() : this.bounds.width();
		var height = isFlipped ? this.bounds.width() : this.bounds.height();

		// Set canvas to rotated relative coordinates with center of annotation at
		// center of screen
		context.translate(x, y);
		context.rotate(theta);

		var relativeBounds = {
			x: 0,
			y: 0,
			width: 34 / tileView.scale,
			height: 20 / tileView.scale
		};

		// Evaluate location of the indicator appropriate for the annotation shape
		switch (this.type) {
			case SQUARE_ANNOTATION:
			case TEXT_ANNOTATION:
			case X_ANNOTATION:
			case CLOUD_ANNOTATION:
				relativeBounds.x = width / 2;
				relativeBounds.y = -height / 2;
				break;
		//**
		    case SCALE_ANNOTATION:
		        relativeBounds.x = width / 2;
		        relativeBounds.y = -height / 2;
		        break;
			case CIRCLE_ANNOTATION:
			case CALLOUT_ANNOTATION:
				relativeBounds.x = (0.25 * width );
				relativeBounds.y = -(0.433 * height );
				break;

			default:
				var max_x = this.points[0].x,
					min_x = this.points[0].x,
					max_y = this.points[0].y,
					min_y = this.points[0].y;

				for (var i in this.points) {
					if (!this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y <= min_y) {
						max_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = this.points[i].x - x;
						relativeBounds.y = this.points[i].y - y;
					}

					if (90 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y <= min_y) {
						min_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = y - this.points[i].y;
						relativeBounds.y = this.points[i].x - x;
					}

					if (180 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y >= max_y) {
						min_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = x - this.points[i].x;
						relativeBounds.y = y - this.points[i].y;
					}

					if (270 == this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y >= max_y) {
						max_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = this.points[i].y - y;
						relativeBounds.y = x - this.points[i].x;
					}
				}
		}

		context.strokeStyle = 'rgba(229, 43, 46, 0.7)';
		context.fillStyle = 'rgba(229, 43, 46, 0.7)';
		this.roundRect(context, relativeBounds.x, relativeBounds.y, relativeBounds.width, relativeBounds.height, 12 / tileView.scale, true, false);

		// Reset canvas to SCREEN coordinates instead of SHEET coordinates while
		// still honoring the rotation position - this lets us use normal font
		// rendering and graphics compositing
		context.translate(relativeBounds.x, relativeBounds.y);
		context.scale(1 / tileView.scale, 1 / tileView.scale);

		context.font = (12) + 'pt Helvetica';
		context.fillStyle = "#fff";
		context.fillText(this.attachments.length, 18, 16);

		var attach_icon = new Image();

	    //Updated by Neha [DEV Flair-Solutions] : To place the camera icon on sheet

		if (this.type == AUDIO_ANNOTATION ||
		    this.type == VIDEO_ANNOTATION ||
		    this.type == PHOTO_ANNOTATION) {
		    attach_icon.src = "images/update/icon-toolbars-camera-white.png";
		}
        else
		attach_icon.src = "images/update/icon-paperclip-dark.png";
		context.drawImage(attach_icon, 2, 2, 16, 16);

		context.restore();

		// Calculate the SHEET coordinates of the lozenge bounding box for use in
		// click testing
		var sheetPolygon = {};
		switch (this.tileView.getRotation()) {
			default:
			case 0:
				sheetPolygon.x1 = x + relativeBounds.x;
				sheetPolygon.y1 = y + relativeBounds.y;
				sheetPolygon.x2 = x + relativeBounds.x + relativeBounds.width;
				sheetPolygon.y2 = y + relativeBounds.y + relativeBounds.height;
				break;

			case 90:
				sheetPolygon.x1 = x + relativeBounds.y;
				sheetPolygon.y1 = y - relativeBounds.x;
				sheetPolygon.x2 = x + relativeBounds.y + relativeBounds.height;
				sheetPolygon.y2 = y - relativeBounds.x - relativeBounds.width;
				break;

			case 180:
				sheetPolygon.x1 = x - relativeBounds.x;
				sheetPolygon.y1 = y - relativeBounds.y;
				sheetPolygon.x2 = x - relativeBounds.x - relativeBounds.width;
				sheetPolygon.y2 = y - relativeBounds.y - relativeBounds.height;
				break;

			case 270:
				sheetPolygon.x1 = x - relativeBounds.y;
				sheetPolygon.y1 = y + relativeBounds.x;
				sheetPolygon.x2 = x - relativeBounds.y - relativeBounds.height;
				sheetPolygon.y2 = y + relativeBounds.x + relativeBounds.width;
				break;
		}
		return new BluVueSheet.Rect(
			Math.min(sheetPolygon.x1, sheetPolygon.x2),
			Math.min(sheetPolygon.y1, sheetPolygon.y2),
			Math.max(sheetPolygon.x1, sheetPolygon.x2),
			Math.max(sheetPolygon.y1, sheetPolygon.y2));
	};

	this.drawHyperlink = function (context) {

		if (!this.added) {
			return;
		}

		var theta = this.tileView.getRotation() / -180 * Math.PI;
		var isFlipped = (this.tileView.getRotation() == 90 || this.tileView.getRotation() == 270);
		context.save();

		var x = this.bounds.left + (this.bounds.width() / 2);
		var y = this.bounds.top + (this.bounds.height() / 2);
		var width = isFlipped ? this.bounds.height() : this.bounds.width();
		var height = isFlipped ? this.bounds.width() : this.bounds.height();

		// Set canvas to rotated relative coordinates with center of annotation at
		// center of screen
		context.translate(x, y);
		context.rotate(theta);

		var relativeBounds = {
			x: 0,
			y: 0,
			width: 24 / tileView.scale,
			height: 24 / tileView.scale
		};

		// Evaluate location of the indicator appropriate for the annotation shape
		switch (this.type) {
			case SQUARE_ANNOTATION:
			case TEXT_ANNOTATION:
			case X_ANNOTATION:
			case CLOUD_ANNOTATION:
				relativeBounds.x = width / 2;
				relativeBounds.y = -height / 2;
				break;

			case CIRCLE_ANNOTATION:
			case CALLOUT_ANNOTATION:
				relativeBounds.x = (0.25 * width );
				relativeBounds.y = -(0.433 * height );
				break;

			default:
				var max_x = this.points[0].x,
					min_x = this.points[0].x,
					max_y = this.points[0].y,
					min_y = this.points[0].y;

				for (var i in this.points) {
					if (!this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y <= min_y) {
						max_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = this.points[i].x - x;
						relativeBounds.y = this.points[i].y - y;
					}

					if (90 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y <= min_y) {
						min_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = y - this.points[i].y;
						relativeBounds.y = this.points[i].x - x;
					}

					if (180 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y >= max_y) {
						min_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = x - this.points[i].x;
						relativeBounds.y = y - this.points[i].y;
					}

					if (270 == this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y >= max_y) {
						max_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = this.points[i].y - y;
						relativeBounds.y = x - this.points[i].x;
					}
				}
		}

		// Reset canvas to SCREEN coordinates instead of SHEET coordinates while
		// still honoring the rotation position - this lets us use normal font
		// rendering and graphics compositing
		context.translate(relativeBounds.x, relativeBounds.y);
		context.scale(1 / tileView.scale, 1 / tileView.scale);

		var attach_icon = new Image();
		attach_icon.src = "images/update/annotation-link.png";
		context.globalAlpha = 0.7;
		context.drawImage(attach_icon, 2, 2, 24, 24);


		context.restore();

		// Calculate the SHEET coordinates of the lozenge bounding box for use in
		// click testing
		var sheetPolygon = {};
		switch (this.tileView.getRotation()) {
			default:
			case 0:
				sheetPolygon.x1 = x + relativeBounds.x;
				sheetPolygon.y1 = y + relativeBounds.y;
				sheetPolygon.x2 = x + relativeBounds.x + relativeBounds.width;
				sheetPolygon.y2 = y + relativeBounds.y + relativeBounds.height;
				break;

			case 90:
				sheetPolygon.x1 = x + relativeBounds.y;
				sheetPolygon.y1 = y - relativeBounds.x;
				sheetPolygon.x2 = x + relativeBounds.y + relativeBounds.height;
				sheetPolygon.y2 = y - relativeBounds.x - relativeBounds.width;
				break;

			case 180:
				sheetPolygon.x1 = x - relativeBounds.x;
				sheetPolygon.y1 = y - relativeBounds.y;
				sheetPolygon.x2 = x - relativeBounds.x - relativeBounds.width;
				sheetPolygon.y2 = y - relativeBounds.y - relativeBounds.height;
				break;

			case 270:
				sheetPolygon.x1 = x - relativeBounds.y;
				sheetPolygon.y1 = y + relativeBounds.x;
				sheetPolygon.x2 = x - relativeBounds.y - relativeBounds.height;
				sheetPolygon.y2 = y + relativeBounds.x + relativeBounds.width;
				break;
		}
		return new BluVueSheet.Rect(
			Math.min(sheetPolygon.x1, sheetPolygon.x2),
			Math.min(sheetPolygon.y1, sheetPolygon.y2),
			Math.max(sheetPolygon.x1, sheetPolygon.x2),
			Math.max(sheetPolygon.y1, sheetPolygon.y2));
	};

	this.drawAttachmentsHyperlink = function (context) {

		if (!this.added) {
			return;
		}

		var theta = this.tileView.getRotation() / -180 * Math.PI;
		var isFlipped = (this.tileView.getRotation() == 90 || this.tileView.getRotation() == 270);
		context.save();

		var x = this.bounds.left + (this.bounds.width() / 2);
		var y = this.bounds.top + (this.bounds.height() / 2);
		var width = isFlipped ? this.bounds.height() : this.bounds.width();
		var height = isFlipped ? this.bounds.width() : this.bounds.height();

		// Set canvas to rotated relative coordinates with center of annotation at
		// center of screen
		context.translate(x, y);
		context.rotate(theta);

		var relativeBounds = {
			x: 0,
			y: 0,
			width: 48 / tileView.scale,
			height: 24 / tileView.scale
		};

		// Evaluate location of the indicator appropriate for the annotation shape
		switch (this.type) {
			case SQUARE_ANNOTATION:
			case TEXT_ANNOTATION:
			case X_ANNOTATION:
			case CLOUD_ANNOTATION:
				relativeBounds.x = width / 2;
				relativeBounds.y = -height / 2;
				break;

			case CIRCLE_ANNOTATION:
			case CALLOUT_ANNOTATION:
				relativeBounds.x = (0.25 * width );
				relativeBounds.y = -(0.433 * height );
				break;

			default:
				var max_x = this.points[0].x,
					min_x = this.points[0].x,
					max_y = this.points[0].y,
					min_y = this.points[0].y;

				for (var i in this.points) {
					if (!this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y <= min_y) {
						max_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = this.points[i].x - x;
						relativeBounds.y = this.points[i].y - y;
					}

					if (90 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y <= min_y) {
						min_x = this.points[i].x;
						min_y = this.points[i].y;
						relativeBounds.x = y - this.points[i].y;
						relativeBounds.y = this.points[i].x - x;
					}

					if (180 == this.tileView.getRotation() && this.points[i].x <= min_x && this.points[i].y >= max_y) {
						min_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = x - this.points[i].x;
						relativeBounds.y = y - this.points[i].y;
					}

					if (270 == this.tileView.getRotation() && this.points[i].x >= max_x && this.points[i].y >= max_y) {
						max_x = this.points[i].x;
						max_y = this.points[i].y;
						relativeBounds.x = this.points[i].y - y;
						relativeBounds.y = x - this.points[i].x;
					}
				}
		}

		// Reset canvas to SCREEN coordinates instead of SHEET coordinates while
		// still honoring the rotation position - this lets us use normal font
		// rendering and graphics compositing
		context.translate(relativeBounds.x, relativeBounds.y);
		context.scale(1 / tileView.scale, 1 / tileView.scale);

		var attach_icon = new Image();
		attach_icon.src = "images/update/bv-btn-linkattach.png";
		context.globalAlpha = 0.7;
		context.drawImage(attach_icon, 2, 2, 48, 24);


		context.restore();

		// Calculate the SHEET coordinates of the lozenge bounding box for use in
		// click testing
		var sheetPolygon = {};
		switch (this.tileView.getRotation()) {
			default:
			case 0:
				sheetPolygon.x1 = x + relativeBounds.x;
				sheetPolygon.y1 = y + relativeBounds.y;
				sheetPolygon.x2 = x + relativeBounds.x + relativeBounds.width;
				sheetPolygon.y2 = y + relativeBounds.y + relativeBounds.height;
				break;

			case 90:
				sheetPolygon.x1 = x + relativeBounds.y;
				sheetPolygon.y1 = y - relativeBounds.x;
				sheetPolygon.x2 = x + relativeBounds.y + relativeBounds.height;
				sheetPolygon.y2 = y - relativeBounds.x - relativeBounds.width;
				break;

			case 180:
				sheetPolygon.x1 = x - relativeBounds.x;
				sheetPolygon.y1 = y - relativeBounds.y;
				sheetPolygon.x2 = x - relativeBounds.x - relativeBounds.width;
				sheetPolygon.y2 = y - relativeBounds.y - relativeBounds.height;
				break;

			case 270:
				sheetPolygon.x1 = x - relativeBounds.y;
				sheetPolygon.y1 = y + relativeBounds.x;
				sheetPolygon.x2 = x - relativeBounds.y - relativeBounds.height;
				sheetPolygon.y2 = y + relativeBounds.x + relativeBounds.width;
				break;
		}
		return new BluVueSheet.Rect(
			Math.min(sheetPolygon.x1, sheetPolygon.x2),
			Math.min(sheetPolygon.y1, sheetPolygon.y2),
			Math.max(sheetPolygon.x1, sheetPolygon.x2),
			Math.max(sheetPolygon.y1, sheetPolygon.y2));
	};

	this.roundRect = function (ctx, x, y, width, height, radius, fill, stroke) {
		if (typeof stroke == "undefined") {
			stroke = true;
		}
		if (typeof radius === "undefined") {
			radius = 5;
		}

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();

		if (stroke) {
			ctx.stroke();
		}
		if (fill) {
			ctx.fill();
		}
	};

	this.updateSelected = function (context) {
		var drawables;
		if (this.selected && ( this.rectType || !this.showHandles )) {
			context.save();
			this.drawBoundsRect(context);
			context.restore();
		}

		if (this.rectType) {
			drawables = this.createHandlesRect(context);
		}
		else if (this.type == SCALE_ANNOTATION || this.type == MEASURE_ANNOTATION) {
			drawables = this.createHandlesMeasurement(context);
		}
		else {
			drawables = this.createHandlesPoint(context);
		}

		return drawables || [];
	};
	this.drawBoundsRect = function (context) {
		context.strokeStyle = "#7e7e7e";

		var gap = 5 / tileView.scale;
		var dash = 2 * gap;
		var oldStroke = setPatternStroke(context, [dash, gap]);
		{
			context.lineWidth = 3 / tileView.scale;
			var bounds = this.bounds.inset(-BOUND_DIST / tileView.scale);
			context.strokeRect(bounds.left, bounds.top, bounds.width(), bounds.height());
		}
		setPatternStroke(context, oldStroke);
	};

	this.createHandlesRect = function (context) {
		var handles = [];
		for (var i = 0; i < 8; i++) {
			handles.push(new BluVueSheet.AnnotationHandleDrawable(this, this.getPoint(i, true), i, tileView));
		}
		return handles;
	};

	this.createHandlesMeasurement = function (context) {
		if (this.points && this.points.length == 2) {
			var radius = BOUND_DIST / tileView.scale;
			var theta = Math.atan2((this.points[1].y - this.points[0].y), (this.points[1].x - this.points[0].x));
			var x2 = radius * Math.cos(theta);
			var y2 = radius * Math.sin(theta);

			return [
				new BluVueSheet.AnnotationHandleDrawable(this, {
					x: this.points[0].x - x2,
					y: this.points[0].y - y2
				}, 0, tileView),
				new BluVueSheet.AnnotationHandleDrawable(this, {
					x: this.points[1].x + x2,
					y: this.points[1].y + y2
				}, 1, tileView)
			];
		}
	};

	this.drawMeasurementHairLines = function (context) {
		var baseEndLength = 32;
		var endLength = baseEndLength * this.lineWidth;
		var theta = Math.atan2((this.points[1].y - this.points[0].y), (this.points[1].x - this.points[0].x));

		for (var i = 0; i <= 1; i++) {
			context.save();
			context.beginPath();
			context.moveTo(this.points[i].x, this.points[i].y);
			context.lineTo(this.points[i].x + (Math.cos(theta + Math.PI / 2) * endLength), this.points[i].y + (Math.sin(theta + Math.PI / 2) * endLength));
			context.moveTo(this.points[i].x, this.points[i].y);
			context.lineTo(this.points[i].x + (Math.cos(theta - Math.PI / 2) * endLength), this.points[i].y + (Math.sin(theta - Math.PI / 2) * endLength));
			context.lineCap = 'round';
			context.lineJoin = "round";
			context.lineWidth = 4;
			context.strokeStyle = '#000000';
			context.stroke();
			context.restore();
		}
	};

	this.createHandlesPoint = function (context) {
		var handles = [];
		for (var i = 0; i < this.points.length; i++) {
			handles.push(new BluVueSheet.AnnotationHandleDrawable(this, this.points[i], i, tileView));
		}
		return handles;
	};

	this.drawMeasurement = function (context) {
		if (!this.measurement || !tileView.annotationManager.scaleAnnotation)
			return;

		var theta = this.tileView.getRotation() / -180 * Math.PI;
		var drawWidth = Math.abs(this.bounds.width() * Math.cos(theta) - this.bounds.height() * Math.sin(theta));
		var text = htmlDecode(this.measurement.toString());
		var textSize = 128;
		var col = 0;

		context.font = textSize + "px Verdana";
		while (context.measureText(text).width > drawWidth && col < 6) {
			textSize *= 0.75;
			context.font = textSize + "px Verdana";
			col++;
		}

		context.save();
		context.translate(this.bounds.centerX(), this.bounds.centerY());
		context.rotate(theta);
		context.fillStyle = this.color.toStyle();

		context.textAlign = "center";
		context.fillText(text, 0, textSize / 3);
		context.restore();
	};

	this.getPoint = function (id, handle) {

		if (!this.bounds)
			this.calcBounds();

		var rect = this.bounds.clone();
		if (handle) {
			rect = rect.inset(-BOUND_DIST / tileView.scale);
		}

		var loc = new BluVueSheet.Point();
		switch (id) {//0 is top left, increases clockwise
			case 0:
				loc.x = rect.left;
				loc.y = rect.top;
				break;
			case 1:
				loc.x = rect.centerX();
				loc.y = rect.top;
				break;
			case 2:
				loc.x = rect.right;
				loc.y = rect.top;
				break;
			case 3:
				loc.x = rect.right;
				loc.y = rect.centerY();
				break;
			case 4:
				loc.x = rect.right;
				loc.y = rect.bottom;
				break;
			case 5:
				loc.x = rect.centerX();
				loc.y = rect.bottom;
				break;
			case 6:
				loc.x = rect.left;
				loc.y = rect.bottom;
				break;
			case 7:
				loc.x = rect.left;
				loc.y = rect.centerY();
				break;
		}
		return loc;
	};

	this.offsetTo = function (x, y) {
		this.offset_x = x - this.x_handle - this.bounds.centerX();
		this.offset_y = y - this.y_handle - this.bounds.centerY();
	};

	this.applyOffset = function () {
		if (this.offset_y !== 0 || this.offset_x !== 0) {
			for (var i = 0; i < this.points.length; i++) {
				this.points[i].x += this.offset_x;
				this.points[i].y += this.offset_y;
			}
			this.calcBounds();
			this.offset_x = 0;
			this.offset_y = 0;
			return true;
		}
		return false;
	};

	this.applyMoveOffset = function () {
		if ((this.offset_y !== 0 || this.offset_x !== 0) && !isNaN(this.offset_x) && !isNaN(this.offset_y)) {
			for (var i = 0; i < this.points.length; i++) {
				this.points[i].x += this.offset_x;
				this.points[i].y += this.offset_y;
			}
			this.calcBounds();
			this.offset_x = 0;
			this.offset_y = 0;
			return true;
		}
		return false;
	};

	this.scaleWithHandleTo = function (x, y, handleId) {
		var xPositive = [2, 3, 4].indexOf(handleId) >= 0;
		var yPositive = [4, 5, 6].indexOf(handleId) >= 0;
		var scalingX = [0, 6, 7, 2, 3, 4].indexOf(handleId) >= 0;
		var scalingY = [0, 1, 2, 4, 5, 6].indexOf(handleId) >= 0;

		var scaleOrigin = this.getPoint((handleId + 4) % 8, false);

		var xDis = scaleOrigin.x - x;
		var yDis = scaleOrigin.y - y;
		var flippedX = (x < scaleOrigin.x && xPositive) || (x > scaleOrigin.x && !xPositive);
		var flippedY = (y < scaleOrigin.y && yPositive) || (y > scaleOrigin.y && !yPositive);

		var xScale = scalingX && !flippedX ? Math.abs(xDis / (this.bounds.width() + BOUND_DIST / tileView.scale)) : 1;
		var yScale = scalingY && !flippedY ? Math.abs(yDis / (this.bounds.height() + BOUND_DIST / tileView.scale)) : 1;

		// force min size
		if (Math.abs(this.bounds.width() * xScale) < BOUND_DIST / tileView.scale) {
			xScale = 1;
		}
		if (Math.abs(this.bounds.height() * yScale) < BOUND_DIST / tileView.scale) {
			yScale = 1;
		}

		var matrix = new BluVueSheet.ScaleMatrix(xScale, yScale, scaleOrigin.x, scaleOrigin.y);
		for (var i = 0; i < this.points.length; i++) {
			matrix.applyTo(this.points[i]);
		}

		this.calcBounds();
		this.updateMeasure();
	};

	var drawFunctions = [];
	drawFunctions[LASSO_ANNOTATION] = drawPoints;
	drawFunctions[SQUARE_ANNOTATION] = drawRectangle;
	drawFunctions[X_ANNOTATION] = drawX;
	drawFunctions[CIRCLE_ANNOTATION] = drawCircle;
	drawFunctions[CALLOUT_ANNOTATION] = drawCircle;
	drawFunctions[CLOUD_ANNOTATION] = drawCloud;
	drawFunctions[POLYGON_ANNOTATION] = drawPoints;
	drawFunctions[TEXT_ANNOTATION] = drawText;
	drawFunctions[LINE_ANNOTATION] = drawLine;
	drawFunctions[ARROW_ANNOTATION] = drawArrow;
	drawFunctions[PEN_ANNOTATION] = drawPoints;
	drawFunctions[FREE_FORM_ANNOTATION] = drawPoints;
	drawFunctions[HIGHLIGHTER_ANNOTATION] = drawPoints;
	drawFunctions[SCALE_ANNOTATION] = drawScale;
	drawFunctions[MEASURE_ANNOTATION] = drawMeasure;
    //Added by Neha [DEV Flair-Solutions]
	drawFunctions[AUDIO_ANNOTATION] = drawCamera;
	drawFunctions[VIDEO_ANNOTATION] = drawCamera;
	drawFunctions[PHOTO_ANNOTATION] = drawCamera;


	function setMeasurement(annotation, value, isArea) {
		if (annotation.measurement && annotation.tileView.annotationManager.scaleAnnotation) {
			var m = annotation.tileView.annotationManager.scaleAnnotation.measurement;
			var l = annotation.tileView.annotationManager.scaleAnnotation.getLength();

			var scale = m.amount / l;
			if (isArea)
				annotation.measurement.setAmount(value * scale * scale, BluVueSheet.Measurement.toArea(m.unit));
			else
				annotation.measurement.setAmount(value * scale, m.unit);
		}
	}

	function updateMeasureRectArea() {
		var w = Math.abs(this.points[0].x - this.points[1].x);
		var h = Math.abs(this.points[0].y - this.points[1].y);
		setMeasurement(this, w * h, true);
	}

	function updateMeasureRectPerimeter() {
		var w = Math.abs(this.points[0].x - this.points[1].x);
		var h = Math.abs(this.points[0].y - this.points[1].y);
		setMeasurement(this, w + w + h + h, false);
	}

	function updateMeasureEllipseArea() {
		var a = Math.abs(this.points[0].x - this.points[1].x) / 2;
		var b = Math.abs(this.points[0].y - this.points[1].y) / 2;
		setMeasurement(this, Math.PI * a * b, true);
	}

	function updateMeasureEllipsePerimeter() {
		// Ramanujan's 3rd approximation of ellipse perimeter
		// http://www.mathsisfun.com/geometry/ellipse-perimeter.html
		var a = Math.abs(this.points[0].x - this.points[1].x) / 2;
		var b = Math.abs(this.points[0].y - this.points[1].y) / 2;
		var h = (a - b) * (a - b) / (a + b) / (a + b);
		setMeasurement(this, Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))), false);
	}

	function updateMeasureLength() {
		setMeasurement(this, this.getLength(), false);
	}

	function updateMeasurePolygonArea(tileView) {
		// Bail if the area is self intersecting
		if (isSelfIntersecting(this)) {
			setMeasurement(this, 0, true);
		}
		else {
			var a = 0;
			for (var i = 0; i < this.points.length; i++) {
				a += this.points[i].x * this.points[(i + 1) % this.points.length].y;
				a -= this.points[(i + 1) % this.points.length].x * this.points[i].y;
			}
			setMeasurement(this, Math.abs(a) / 2, true);
		}
	}

	function updateMeasurePolygonPerimeter(tileView) {
		var p = 0;
		for (var i = 0; i < this.points.length; i++) {
			p += this.getLength(this.points[i], this.points[(i + 1) % this.points.length]);
		}
		setMeasurement(this, p, false);
	}

	function updateMeasurePolylineLength(tileView) {
		var p = 0;
		for (var i = 1; i < this.points.length; i++) {
			p += this.getLength(this.points[i - 1], this.points[i]);
		}
		setMeasurement(this, p, false);
	}

	function isSelfIntersecting(annotation) {
		if (annotation.points.length > 3) {
			for (var i = 0; i < annotation.points.length; i++) {
				var a1 = annotation.points[i];
				var a2 = annotation.points[(i + 1) % annotation.points.length];
				if (!pointsEqual(a1, a2)) {
					for (var j = 0; j < annotation.points.length; j++) {
						var b1 = annotation.points[j];
						var b2 = annotation.points[(j + 1) % annotation.points.length];

						if (!( pointsEqual(a1, b1) || pointsEqual(a1, b2) ||
							pointsEqual(a2, b1) || pointsEqual(a2, b2) ||
							pointsEqual(b1, b2) )) {

							if (linesIntersect(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y, b2.x, b2.y))
								return true;
						}
					}
				}
			}
		}
		return false;
	}

	var EPSILON = 0.001;

	function pointsEqual(p1, p2) {
		return (Math.abs(p1.x - p2.x) < EPSILON) &&
			(Math.abs(p1.y - p2.y) < EPSILON);
	}

	function linesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
		var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
		var numera = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
		var numerb = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

		// Are the line parallel
		if (Math.abs(denom) < EPSILON) {
			return false;
		}

		// Is the intersection along the the segments
		var mua = numera / denom;
		var mub = numerb / denom;
		if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
			return false;
		}

		return true;
	}

	this.equals = function equals(that) {
		if (this == that)
			return true;
		if (this && that) {
			var j1 = JSON.stringify(new AnnotationJSON(this));
			var j2 = JSON.stringify(new AnnotationJSON(that));
			return j1.localeCompare(j2) === 0;
		}
	};

	function drawRectangle(context) {
		if (this.points.length == 2) {
			if (this.fill)context.fillRect(this.points[0].x, this.points[0].y, this.points[1].x - this.points[0].x, this.points[1].y - this.points[0].y);
			context.strokeRect(this.points[0].x, this.points[0].y, this.points[1].x - this.points[0].x, this.points[1].y - this.points[0].y);
		}
	}

	function drawX(context) {
		if (this.points.length == 2) {
			context.save();
			var x1 = this.points[0].x;
			var y1 = this.points[0].y;
			var x2 = this.points[1].x;
			var y2 = this.points[1].y;
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.moveTo(x1, y2);
			context.lineTo(x2, y1);

			context.restore();
			context.stroke();
		}
	}

	function drawCircle(context) {
		if (this.points.length == 2) {
		    context.beginPath();
		    var centerX = (this.points[0].x + this.points[1].x) / 2;
		    var centerY = (this.points[0].y + this.points[1].y) / 2;
		    var width = this.points[0].x - this.points[1].x;
		    var height = this.points[0].y - this.points[1].y;
		    context.save();
		    context.scale(width / 2, height / 2);
		    context.arc(2 * centerX / width, 2 * centerY / height, 1, 0, 2 * Math.PI, false);
		    context.restore();
		    if (this.fill) { context.fill() }
            context.stroke();
		}
	}

	function drawCloud(context) {
		if (this.points.length == 2) {
			context.save();

			var arcRadius = 20;
			var beta = .5 * Math.PI;
			var gx = (this.points[0].x > this.points[1].x ? this.points[0].x : this.points[1].x);
			var gy = (this.points[0].y > this.points[1].y ? this.points[0].y : this.points[1].y);
			var lx = (this.points[0].x < this.points[1].x ? this.points[0].x : this.points[1].x);
			var ly = (this.points[0].y < this.points[1].y ? this.points[0].y : this.points[1].y);

			context.beginPath();

		    //draw bottom
			drawCloudSideAndCorner(arcRadius, beta, gx, gy, lx, gy, context);
		    //draw left side
			drawCloudSideAndCorner(arcRadius, beta, lx, gy, lx, ly, context);
		    //draw top
			drawCloudSideAndCorner(arcRadius, beta, lx, ly, gx, ly, context);
		    //draw right side
			drawCloudSideAndCorner(arcRadius, beta, gx, ly, gx, gy, context);

            //draw fill
			if (this.fill) { context.fill() }

			context.lineJoin = "round";
			context.lineCap = "round";
            context.stroke();
		}
	}

	function drawCloudSideAndCorner(arcRadius, beta, startX, startY, stopX, stopY, context) {
        //Calculate Rotation Angle
	    var rotationAngle = Math.atan2((stopY - startY), (stopX - startX));
	    rotationAngle -= Math.PI;
	    if (rotationAngle < 0) { rotationAngle += 2 * Math.PI;}

	    var arcScalar = .8 * arcRadius;
	    var theta = Math.acos((arcRadius + arcScalar) / (2 * arcRadius));
	    var alpha = (Math.PI - theta);
	    var totalLength = Math.sqrt((startX-stopX)*(startX-stopX) + (startY-stopY)*(startY-stopY));

	    if (totalLength == 0) { return;}

        //move one arc length froms start vertex
	    var currentX = startX;
	    var currentY = startY;
	    if (startX > stopX) {
	        currentX -= Math.abs((arcRadius + arcScalar) * Math.cos(rotationAngle));
	    } else if (startX < stopX) { currentX += Math.abs((arcRadius + arcScalar) * Math.cos(rotationAngle)); }
	    if (startY > stopY) {
	        currentY -= Math.abs((arcRadius + arcScalar) * Math.sin(rotationAngle));
	    } else if (startY < stopY) { currentY += Math.abs((arcRadius + arcScalar) * Math.sin(rotationAngle)); }

        //draw Side until last arc
	    var distanceToEdge = Math.sqrt((currentX - stopX) * (currentX - stopX) + (currentY - stopY) * (currentY - stopY));
	    while (distanceToEdge > 2 * arcRadius) {
            context.arc(currentX, currentY, arcRadius, rotationAngle + theta, rotationAngle + theta + alpha, false);
	        context.arc(currentX, currentY, arcRadius, rotationAngle+theta + alpha, rotationAngle + alpha, true);

	        if (startX > stopX) {
	            currentX -= Math.abs((arcRadius + arcScalar) * Math.cos(rotationAngle));
	        } else if (startX < stopX) { currentX += Math.abs((arcRadius + arcScalar) * Math.cos(rotationAngle)); }
	        if (startY > stopY) {
	            currentY -= Math.abs((arcRadius + arcScalar) * Math.sin(rotationAngle));
	        } else if (startY < stopY) { currentY += Math.abs((arcRadius + arcScalar) * Math.sin(rotationAngle)); }

	        distanceToEdge = Math.sqrt((currentX - stopX) * (currentX - stopX) + (currentY - stopY) * (currentY - stopY));
	    }

	    var gamma;
	    var phi;
	    var psi;

	    //Check if there is room for a last arc
	    if (totalLength > 2 * arcRadius) {
	        gamma = Math.acos((distanceToEdge) / (2 * arcRadius));
	        phi = 2 * Math.PI - gamma - beta;
	        psi = Math.PI - theta - gamma;

            //draw last arc
	        if (distanceToEdge >= (arcRadius + arcScalar)) {
	            context.arc(currentX, currentY, arcRadius, rotationAngle + theta, rotationAngle + theta + alpha, false);
	            context.arc(currentX, currentY, arcRadius, rotationAngle + theta + alpha, rotationAngle + alpha, true);
	        } else {
	            context.arc(currentX, currentY, arcRadius, rotationAngle + theta, rotationAngle + theta + psi, false);
	        }

	        //draw corner
	        currentX = stopX;
	        currentY = stopY;
	        context.arc(currentX, currentY, arcRadius, rotationAngle + gamma, rotationAngle + gamma + phi, false);
	        context.arc(currentX, currentY, arcRadius, rotationAngle + gamma + phi, rotationAngle + gamma + phi - theta, true);
        } else {
	        gamma = Math.acos((totalLength) / (2 * arcRadius));
	        phi = 2 * Math.PI - gamma - beta;

	        //Backtrack from previous arc
	        currentX = startX;
	        currentY = startY;
	        context.arc(currentX, currentY, arcRadius, rotationAngle + Math.PI, rotationAngle + Math.PI - gamma, true);

	        //Draw corner
	        currentX = stopX;
	        currentY = stopY;
	        context.arc(currentX, currentY, arcRadius, rotationAngle + gamma, rotationAngle + gamma + phi, false);
	        context.arc(currentX, currentY, arcRadius, rotationAngle + gamma + phi, rotationAngle + gamma + phi - theta, true);
	    }
	}

	function drawPoints(context) {
		if (this.points.length > 1) {
			context.save();

			context.beginPath();
			context.moveTo(this.points[0].x, this.points[0].y);
			for (var i = 1; i < this.points.length; i++) {
				context.lineTo(this.points[i].x, this.points[i].y);
			}
			if (this.closed) {
				context.lineTo(this.points[0].x, this.points[0].y);
			}
			if (this.fill && this.type != HIGHLIGHTER_ANNOTATION) context.fill();

			context.lineCap = 'round';
			context.lineJoin = "round";
			context.stroke();
			context.restore();
		}

		if (!this.added && this.type == POLYGON_ANNOTATION) {
			context.beginPath();
			context.arc(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, 10 / tileView.scale, 0, 2 * Math.PI, false);
			context.fillStyle = this.color.toStyle();
			context.fill();
			context.strokeStyle = this.color.toStyle();
			context.lineWidth = 2 / tileView.scale;
			context.stroke();
		}
	}

	function drawText(context) {
		if (this.points.length > 1) {
			context.save();
			var x = (this.points[0].x < this.points[1].x ? this.points[0].x : this.points[1].x);
			var y = (this.points[0].y < this.points[1].y ? this.points[0].y : this.points[1].y);
			var w = Math.abs(this.points[0].x - this.points[1].x);
			var h = Math.abs(this.points[0].y - this.points[1].y);
			context.font = this.textSize + "px Verdana";
			context.fillStyle = this.color.toStyle();
			context.translate(x, y);

			context.beginPath();
			context.rect(0, 0, w, h);
			context.clip();

			var currentY = this.textSize;
			var lines = this.text.split("\n");

			for (var i = 0; i < lines.length; i++) {
				var j;
				var lines2 = [];
				lines2[0] = "";
				var currentLine = 0;
				var words = lines[i].split(" ");
				for (j = 0; j < words.length; j++) {
					var temp = lines2[currentLine] + words[j] + " ";
					if (context.measureText(temp).width <= w || !lines2[currentLine]) {
						lines2[currentLine] = temp;
					} else {
						lines2[lines2.length] = words[j] + " ";
						currentLine++;
					}
				}
				for (j = 0; j < lines2.length; j++) {
					context.fillText(lines2[j], 0, currentY);
					currentY += this.textSize;
				}
			}
			context.restore();
		}
	}

	function drawLine(context) {
		if (this.points.length == 2) {
			context.save();
			var x1 = this.points[0].x;
			var y1 = this.points[0].y;
			var x2 = this.points[1].x;
			var y2 = this.points[1].y;
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.lineCap = 'round';
			context.lineJoin = "round";
			context.restore();
			context.stroke();
		}
	}

    //Added by Neha
	function drawCamera(context) {
	    context.save();
	    var x1 = this.points[0].x;
	    var y1 = this.points[0].y;
	    var imageObj = new Image();

	    imageObj.onload = function () {
	        context.drawImage(imageObj, x1, y1);
	    };
	    imageObj.src = 'images/update/icon-toolbars-camera-white.png';

	    context.restore();
	    //context.stroke();
	}

	function drawArrow(context) {
		if (this.points.length == 2) {
			context.save();
			var x1 = this.points[0].x;
			var y1 = this.points[0].y;
			var x2 = this.points[1].x;
			var y2 = this.points[1].y;
			context.beginPath();

			context.moveTo(x1, y1);
			context.lineTo(x2, y2);

			var angle = Math.atan((y2 - y1) / (x2 - x1));
			if ((x2 - x1) < 0)angle += Math.PI;
			var length = this.lineWidth * 20;
			var da = Math.PI / 6;
			//draw two arrow things
			context.moveTo(x1, y1);
			context.lineTo(x1 + (length * Math.cos(angle + da)), y1 + (length * Math.sin(angle + da)));

			context.moveTo(x1, y1);
			context.lineTo(x1 + (length * Math.cos(angle - da)), y1 + (length * Math.sin(angle - da)));

			context.restore();
			context.stroke();
		}
	}

	function drawScale(context) {
		if (this.points.length == 2) {
			var x1 = this.points[0].x;
			var y1 = this.points[0].y;
			var x2 = this.points[1].x;
			var y2 = this.points[1].y;

			context.save();

			var baseEndLength = 8;
			var measureSpace;
			var text;
			var textSize;

			if (this.measurement) {
				var myLength = this.getLength();
				text = htmlDecode(this.measurement.toString());
				textSize = 128;
				var col = 0;

				context.font = textSize + "px Verdana";
				while (context.measureText(text).width > myLength / 1.5 && col < 6) {
					textSize *= 0.75;
					context.font = textSize + "px Verdana";
					col++;
				}

				measureSpace = context.measureText(text).width / myLength;
			} else {
				measureSpace = 0;
			}

			//text space
			var bx1 = x1 + (x2 - x1) * (0.5 - measureSpace / 1.5);
			var by1 = y1 + (y2 - y1) * (0.5 - measureSpace / 1.5);
			var bx2 = x1 + (x2 - x1) * (0.5 + measureSpace / 1.5);
			var by2 = y1 + (y2 - y1) * (0.5 + measureSpace / 1.5);

			//ends
			var endLength = baseEndLength * this.lineWidth;
			var theta = Math.atan2((y2 - y1), (x2 - x1));

			context.beginPath();

			//first half
			context.moveTo(x1, y1);
			context.lineTo(bx1, by1);

			//second half
			context.moveTo(bx2, by2);
			context.lineTo(x2, y2);

			//end 1
			var angle1 = (Math.PI / 8) * 3;
			var angle2 = (Math.PI / 8) * 5;
			var angle3 = Math.PI * 1.5;
			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta + angle3) * endLength), y1 + (Math.sin(theta + angle3) * endLength));
			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta - angle1) * endLength), y1 + (Math.sin(theta - angle1) * endLength));

			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta + angle2) * endLength), y1 + (Math.sin(theta + angle2) * endLength));
			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta - angle3) * endLength), y1 + (Math.sin(theta - angle3) * endLength));

			//end 2
			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta + angle3) * endLength), y2 + (Math.sin(theta + angle3) * endLength));
			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta - angle1) * endLength), y2 + (Math.sin(theta - angle1) * endLength));

			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta + angle2) * endLength), y2 + (Math.sin(theta + angle2) * endLength));
			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta - angle3) * endLength), y2 + (Math.sin(theta - angle3) * endLength));

			drawLinearText(context, text, textSize, this.color, x1, y1, x2, y2, theta, this.tileView.getRotation());

			context.restore();
			context.stroke();
		}
	}

	function drawLinearText(context, text, textSize, color, x1, y1, x2, y2, theta, rotation) {
		var cx = (x2 + x1) / 2;
		var cy = (y2 + y1) / 2;

		context.save();
		context.translate(cx, cy);
		context.rotate(theta);
		if (( x1 > x2 && rotation === 0) ||
			( y1 < y2 && rotation == 90 ) ||
			( x1 < x2 && rotation == 180) ||
			( y1 > y2 && rotation == 270 )) {
			context.rotate(Math.PI);
		}
		context.fillStyle = color.toStyle();
		context.textAlign = "center";
		context.fillText(text, 0, textSize / 3);
		context.restore();
	}

	function drawMeasure(context) {
		if (this.points.length == 2) {
			var x1 = this.points[0].x;
			var y1 = this.points[0].y;
			var x2 = this.points[1].x;
			var y2 = this.points[1].y;

			context.save();

			var baseEndLength = 8;
			var measureSpace;
			var textSize;
			var text;

			if (this.measurement && tileView.annotationManager.scaleAnnotation) {
				var myLength = this.getLength();
				textSize = 32 * this.lineWidth;
				text = htmlDecode(this.measurement.toString());
				context.font = textSize + "px Verdana";
				while (context.measureText(text).width > (myLength / 1.5) && textSize > 32) {
					textSize -= 2 * this.lineWidth;
					context.font = textSize + "px Verdana";
				}
				measureSpace = context.measureText(text).width / myLength;
			} else {
				measureSpace = 0;
			}

			//text space
			var bx1 = x1 + (x2 - x1) * (0.5 - measureSpace / 1.5);
			var by1 = y1 + (y2 - y1) * (0.5 - measureSpace / 1.5);
			var bx2 = x1 + (x2 - x1) * (0.5 + measureSpace / 1.5);
			var by2 = y1 + (y2 - y1) * (0.5 + measureSpace / 1.5);

			context.beginPath();

			//first half
			context.moveTo(x1, y1);
			context.lineTo(bx1, by1);

			//second half
			context.moveTo(bx2, by2);
			context.lineTo(x2, y2);

			//ends
			var endLength = baseEndLength * this.lineWidth;
			var theta = Math.atan2((y2 - y1), (x2 - x1));

			//end 1
			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta + Math.PI / 2) * endLength), y1 + (Math.sin(theta + Math.PI / 2) * endLength));
			context.moveTo(x1, y1);
			context.lineTo(x1 + (Math.cos(theta - Math.PI / 2) * endLength), y1 + (Math.sin(theta - Math.PI / 2) * endLength));

			//end 2
			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta + Math.PI / 2) * endLength), y2 + (Math.sin(theta + Math.PI / 2) * endLength));
			context.moveTo(x2, y2);
			context.lineTo(x2 + (Math.cos(theta - Math.PI / 2) * endLength), y2 + (Math.sin(theta - Math.PI / 2) * endLength));

			drawLinearText(context, text, textSize, this.color, x1, y1, x2, y2, theta, this.tileView.getRotation());

			context.restore();
			context.stroke();
		}
	}

	function setPatternStroke(context, pattern) {
		var oldStroke = null;
		if (context.setLineDash !== undefined) {
			oldStroke = context.getLineDash();
			context.setLineDash(pattern);
		}
		else if (context.mozDash !== undefined) {
			oldStroke = context.mozDash;
			context.mozDash = pattern;
		}
		return oldStroke;
	}

	/**
	 * Draws the given drawables in the canvas
	 **/
	function renderDrawables(canvas, drawables) {
		canvas.save();
		for (var i in drawables) {
			var drawable = drawables[i];
			if (drawable.isActive())
				drawable.draw(canvas);
		}
		canvas.restore();
	}
};  // End of Annotation

function createUUID() {
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
function AnnotationJSON(annotation) {
    //Updated by Neha [DEV Flair-Solutions] : To include newly added annotation for BWA-2633
	var rectType = !(annotation.type == POLYGON_ANNOTATION || annotation.type == LINE_ANNOTATION || annotation.type == ARROW_ANNOTATION ||
	annotation.type == SCALE_ANNOTATION || annotation.type == MEASURE_ANNOTATION || annotation.type == PEN_ANNOTATION ||
	annotation.type == FREE_FORM_ANNOTATION || annotation.type == HIGHLIGHTER_ANNOTATION || annotation.type == AUDIO_ANNOTATION ||
	annotation.type == VIDEO_ANNOTATION || annotation.type == PHOTO_ANNOTATION);
	this.points = undefined;
	this.x = undefined;
	this.y = undefined;
	this.width = undefined;
	this.height = undefined;
	this.text = undefined;
	this.textSize = undefined;
	this.distance = undefined;
	this.closed = undefined;
	//UNIVERSAL
	this.id = annotation.id.replace(/-/g, "");
	this.projectId = annotation.projectId.replace(/-/g, "");
	this.sheetId = annotation.sheetId.replace(/-/g, "");
	this.userId = annotation.userId ? annotation.userId.replace(/-/g, "") : undefined;

	this.type = annotation.type;
	this.colorRed = annotation.color.red;
	this.colorGreen = annotation.color.green;
	this.colorBlue = annotation.color.blue;
	this.zOrder = 0;
	this.fill = annotation.fill ? 1 : 0;
	this.perimeterVisible = annotation.perimeterMeasured ? 1 : 0;
	this.areaVisible = annotation.areaMeasured ? 1 : 0;
	this.unitOfMeasure = undefined;
	this.lineWidth = annotation.lineWidth;
	if (annotation.measurement) {
		this.unitOfMeasure = BluVueSheet.Constants.UnitNames[annotation.measurement.type][annotation.measurement.unit].toLowerCase();
	} else {
		this.unitOfMeasure = "na";
	}

	this.attachments = [];
	var context = this;
	if (annotation.attachments) {
		annotation.attachments.forEach(function (attachment) {
			var serializable = {
				createdDate: attachment.createdDate,
				id: attachment.id,
				name: attachment.name,
				mimeType: attachment.mimeType,
				url: attachment.url,
				userId: attachment.userId,
				email: attachment.email,
				amazonKeyPath: attachment.amazonKeyPath,
				annotationId: attachment.annotation.id
			};
			if (attachment.location) {
				serializable.location = JSON.parse(JSON.stringify(attachment.location));
			}
			context.attachments.push(serializable);
		});
	}

	//SPECIFIC
	if (!rectType)
		this.points = annotation.points;
	else {
		this.x = annotation.bounds.left;
		this.y = annotation.bounds.top;
		this.width = annotation.bounds.width();
		this.height = annotation.bounds.height();
	}
	if (annotation.type == TEXT_ANNOTATION) {
		this.text = annotation.text;
		this.textSize = annotation.textSize;
	}
	if (annotation.type == SCALE_ANNOTATION || annotation.type == MEASURE_ANNOTATION) {
		this.distance = annotation.measurement.amount;
	}
	if (annotation.type == POLYGON_ANNOTATION || annotation.type == FREE_FORM_ANNOTATION) {
		this.closed = annotation.closed ? 1 : 0;
	}
}

function loadAnnotationJSON(json, tileView) {
	var normalizeGuid = function normalizeGuid(guid) {
		return guid.replace(/-/g, '');
	};

	var annotation = new BluVueSheet.Annotation(json.type, tileView);
	annotation.id = normalizeGuid(json.id);
	annotation.projectId = json.projectId;
	annotation.sheetId = json.sheetId;
	annotation.userId = json.userId;

	annotation.color.red = json.colorRed;
	annotation.color.green = json.colorGreen;
	annotation.color.blue = json.colorBlue;
	annotation.zOrder = json.zOrder;
	annotation.fill = json.fill == 1;
	annotation.areaMeasured = json.areaVisible == 1;
	annotation.perimeterMeasured = json.perimeterVisible == 1;
	annotation.lineWidth = json.lineWidth;
	annotation.attachments = json.attachments || [];
	annotation.attachments.forEach(function (attachment) {
		attachment.annotation = annotation;
	});

	annotation.links = json.links || [];

	if (json.unitOfMeasure != "na") {
		var unitInfo = BluVueSheet.Measurement.toUnit(json.unitOfMeasure);
		if (json.type == SCALE_ANNOTATION || json.type == MEASURE_ANNOTATION) {
			annotation.measurement = new BluVueSheet.Measurement(json.distance, unitInfo[0], unitInfo[1]);
		} else {
			annotation.measurement = new BluVueSheet.Measurement(0, unitInfo[0], unitInfo[1]);
		}
	}
	var rectType = !(annotation.type == POLYGON_ANNOTATION || annotation.type == LINE_ANNOTATION || annotation.type == ARROW_ANNOTATION ||
	annotation.type == SCALE_ANNOTATION || annotation.type == MEASURE_ANNOTATION || annotation.type == PEN_ANNOTATION || annotation.type == FREE_FORM_ANNOTATION || annotation.type == HIGHLIGHTER_ANNOTATION
    || annotation.type == AUDIO_ANNOTATION || annotation.type == VIDEO_ANNOTATION || annotation.type == PHOTO_ANNOTATION);
	if (rectType) {
		annotation.points = [new BluVueSheet.Point(json.x, json.y), new BluVueSheet.Point(json.x + json.width, json.y + json.height)];
	} else {
		annotation.points = json.points;
	}
	if (json.type == TEXT_ANNOTATION) {
		annotation.text = json.text;
		annotation.textSize = json.textSize;
	}
	if (json.type == POLYGON_ANNOTATION || annotation.type == FREE_FORM_ANNOTATION) {
		annotation.closed = json.closed == 1;
	}
	annotation.calcBounds();
	annotation.updateMeasure();
	return annotation;
}
function htmlDecode(input) {
	var e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes[0].nodeValue;
}
