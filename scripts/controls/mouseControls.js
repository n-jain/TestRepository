BluVueSheet.MouseControls = function(tileView) {
    'use strict';

    var mouseStartX = 0;
    var mouseStartY = 0;
    var tileviewStartX = 0;
    var tileviewStartY = 0;
    var dragging = false;

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        }

        e.returnValue = false;
    }

    this.onmousewheel = function(e) {
        var mouse = mouseLoc(e);

        var delta = wheelDistance(e);
        var newScale = tileView.scale * (1.0 + (delta / 15));

        if (newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
            tileView.scale = newScale;
        }

        var nx = e.clientX / tileView.scale - tileView.scrollX;
        var ny = e.clientY / tileView.scale - tileView.scrollY;
        //centers zoom around mouse
        tileView.scrollX += nx - mouse.x;
        tileView.scrollY += ny - mouse.y;

        tileView.updateRes();

        preventDefault(e);
    };

    this.onmousedown = function(e) {
        tileView.sheet.hideOptionMenus();

        var mouse = mouseLoc(e);
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
        var mouse = mouseLoc(e);
        tileView.annotationManager.onmouseup(mouse.x, mouse.y);
        dragging = false;
    };

    this.onmousemove = function(e) {
        var mouse = mouseLoc(e);
        var window_x = e.clientX;
        var window_y = e.clientY;
        tileView.annotationManager.onmousemove(mouse.x, mouse.y);
        if (dragging) {
            tileView.scrollX = tileviewStartX + (window_x - mouseStartX) / tileView.scale;
            tileView.scrollY = tileviewStartY + (window_y - mouseStartY) / tileView.scale;
        }
    };

    this.onclick = function(e) {
        var mouse = mouseLoc(e);
        tileView.annotationManager.onclick(mouse.x, mouse.y);
    };

    this.ondblclick = function(e) {
        var mouse = mouseLoc(e);
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

    function mouseLoc(e) {
        var x = e.clientX / tileView.scale - tileView.scrollX;
        var y = e.clientY / tileView.scale - tileView.scrollY;
        return new BluVueSheet.Point(x, y);
    }
};
