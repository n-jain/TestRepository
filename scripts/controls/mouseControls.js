BluVueSheet.MouseControls = function(tileView) {
    'use strict';

    var mouseStartX = 0;
    var mouseStartY = 0;
    var tileviewStartX = 0;
    var tileviewStartY = 0;
    var dragging = false;
    var initialScale = 0;
    var touchCenter = { x: 0, y: 0 };
    var latestTapPosition = { x: 0, y: 0 };
    var latestTapTime = 0;
    var DOUBLE_TAP_TIMEOUT = 600;
    var DOUBLE_TAP_DISTANCE = 20;
    

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        }

        e.returnValue = false;
    }

    this.onmousewheel = function(e) {
        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);

        var delta = wheelDistance(e);
        var newScale = tileView.setScale( tileView.scale * (1.0 + (delta / 15)) );

        var mouse2 = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);

        var nx = mouse2.x - mouse.x;
        var ny = mouse2.y - mouse.y;

        //centers zoom around mouse
        tileView.setScroll( tileView.scrollX + nx, tileView.scrollY + ny );

        tileView.updateRes();

        tileView.annotationManager.updateTextEditorIfPresent();

        preventDefault(e);
    };

    this.onmousedown = function(e) {
        tileView.sheet.hideOptionMenus();

        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);
        var windowX = e.clientX;
        var windowY = e.clientY;

        //Gesture things
        mouseStartX = windowX;
        mouseStartY = windowY;
        tileviewStartX = tileView.scrollX;
        tileviewStartY = tileView.scrollY;

        //Event things
        tileView.annotationManager.onmousedown(mouse.x, mouse.y);

        if (!tileView.annotationManager.captureMouse) {
            dragging = true;
        }

        preventDefault(e);
    };

    this.onmouseup = function(e) {
        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);
        tileView.annotationManager.onmouseup(mouse.x, mouse.y);
        dragging = false;
    };

    this.onmousemove = function (e) {
        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);
        var window_x = e.clientX;
        var window_y = e.clientY;

	      if(tileView.annotationManager.isAllowMovedAnnotations(mouse.x, mouse.y)) {
		      tileView.annotationManager.onmousemove(mouse.x, mouse.y);
		      if (dragging) {
			      tileView.setScroll(tileviewStartX + (window_x - mouseStartX) / tileView.scale,
				      tileviewStartY + (window_y - mouseStartY) / tileView.scale);
			      tileView.annotationManager.updateTextEditorIfPresent();
		      }
	      }
    };

    this.onclick = function (e) {
        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);
        tileView.annotationManager.onclick(mouse.x, mouse.y);
    };

    this.ondblclick = function(e) {
        var mouse = tileView.sheetCoordinatesFromScreenCoordinates(e.clientX, e.clientY);
        tileView.annotationManager.ondblclick(mouse.x, mouse.y);
    };

    var wheelDistance = function(evt) {
        if (!evt) { evt = event; }
        var w = evt.wheelDelta, d = evt.detail;
        if (d) {
            if (w) {
                return w / d / 40 * d > 0 ? 1 : -1;
            } else {
                return -d / 3;
            }
        } else {
            return w / 120;
        }
    };
    
    //#region Touch Events
    this.ontouchstart = function (e) {
        dragging = false;

        tileView.sheet.hideOptionMenus();

        initialScale = tileView.scale;
        if (e.touches.length === 1) {
            touchCenter.x = e.touches[0].clientX;
            touchCenter.y = e.touches[0].clientY;
            tileviewStartX = tileView.scrollX;
            tileviewStartY = tileView.scrollY;

            var loc = tileView.sheetCoordinatesFromScreenCoordinates(e.touches[0].clientX, e.touches[0].clientY);
            tileView.annotationManager.onmousedown(loc.x, loc.y);
            dragging = !tileView.annotationManager.captureMouse;

        } else if (e.touches.length === 2) {
            touchCenter.x = Math.floor((e.touches[0].clientX + e.touches[1].clientX) / 2);
            touchCenter.y = Math.floor((e.touches[0].clientY + e.touches[1].clientY) / 2);
        }

        preventDefault(e);
    }

    this.ontouchmove = function (e) {
        if (e.touches.length === 1) {
            var loc = tileView.sheetCoordinatesFromScreenCoordinates(e.touches[0].clientX, e.touches[0].clientY);
            tileView.annotationManager.onmousemove(loc.x, loc.y);
            if (dragging) {
                tileView.setScroll( tileviewStartX + (e.touches[0].clientX - touchCenter.x) / tileView.scale,
                                    tileviewStartY + (e.touches[0].clientY - touchCenter.y) / tileView.scale );
            }

        } else if (e.touches.length === 2) {
            var newScale = initialScale * e.scale;
            newScale = tileView.setScale( newScale );
            var dx = touchCenter.x / newScale - touchCenter.x / tileView.scale;
            var dy = touchCenter.y / newScale - touchCenter.y / tileView.scale;
            tileView.setScroll( tileView.scrollX + dx, tileView.scrollY + dy );
            tileView.updateRes();
        }
        preventDefault(e);
    };

    var distance = function(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    this.ontouchend = function (e) {
        if (e.changedTouches.length === 1) {
            var touch = e.changedTouches[0];
            var loc = tileView.sheetCoordinatesFromScreenCoordinates(touch.clientX, touch.clientY);
            var now = new Date().getTime();
            var deltaTime = now - latestTapTime;
            var deltaDistance = distance(latestTapPosition, { x: touch.clientX, y: touch.clientY });
            latestTapTime = new Date().getTime();
            latestTapPosition = { x: touch.clientX, y: touch.clientY };
            if (deltaTime < DOUBLE_TAP_TIMEOUT && deltaTime > 0 && deltaDistance < DOUBLE_TAP_DISTANCE) {
                // doubletap
                tileView.annotationManager.ondblclick(loc.x, loc.y);
            } else {
                // singletap or drag stop
                if (touch.clientX === touchCenter.x && touch.clientY === touchCenter.y) {
                    tileView.annotationManager.handleClick(loc.x, loc.y);
                } else {
                    tileView.annotationManager.onmouseup(loc.x, loc.y);
                }
            }
            
            dragging = false;
        }
    }

    this.ontouchcancel = function(e) {
        dragging = false;
    }
    //#endregion
};
