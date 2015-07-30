BluVueSheet.Sheet = function() {
    this.tileView = null;

    this.optionsMenu = null;
    this.floatingOptionsMenu = null;
    this.textEditor = null;
    this.toolMenuExtension = null;

    this.userInterface = null;
    this.disposed = false;
    this.canvas = null;

    this.projectId = null;
    this.sheetId = null;
    this.mainLoopTimeout = null;

    var t = this;

    this.setLoaded = function () {
        t.userInterface.style.display = "block";
	      document.getElementById('bluvue-sheet-tool-menu-disabled').style.display = 'none';
    };

    this.setLoading = function () {
        t.userInterface.style.display = "none";
	      document.getElementById('bluvue-sheet-tool-menu-disabled').style.display = 'block';
    };

    this.loadSheet = function (sheet, scope, elem) {
        this.sheetId = sheet.sheetId;
        this.projectId = sheet.projectId;
        this.name = sheet.name;
        this.notes = sheet.notes;

        //make on screen controls
        this.userInterface = document.createElement("div");

        this.optionsMenu = new BluVueSheet.OptionsMenu(this, scope);
        this.floatingOptionsMenu = new BluVueSheet.FloatingOptionsMenu(this, scope);
        this.textEditor = new BluVueSheet.TextEditor(this.textUpdate, this.setTextSize);
        this.toolMenuExtension = new BluVueSheet.ToolMenuExtension(this, scope);

        this.optionsMenu.appendTo(this.userInterface);
        this.userInterface.appendChild(this.textEditor.textEditorElement);
        elem.append(this.userInterface);
        
        this.canvas = elem.find('canvas')[0];
        this.setLoading();

        //make tileView
        this.tileView = new BluVueSheet.TileView(this, this.canvas, scope, this.setLoading, this.setLoaded, scope.deselectTool);
        this.tileView.create(sheet);
        this.tileView.render();

        //setup mouse controls
        this.canvas.onmousedown = this.tileView.mouseControls.onmousedown;
        this.canvas.onmouseup = this.tileView.mouseControls.onmouseup;
        this.canvas.onmousemove = this.tileView.mouseControls.onmousemove;
        this.canvas.onclick = this.tileView.mouseControls.onclick;
        this.canvas.ondblclick = this.tileView.mouseControls.ondblclick;

        this.canvas.addEventListener("touchstart", this.tileView.mouseControls.ontouchstart, true);
        this.canvas.addEventListener("touchmove", this.tileView.mouseControls.ontouchmove, true);
        this.canvas.addEventListener("touchend", this.tileView.mouseControls.ontouchend, true);
        this.canvas.addEventListener("touchcancel", this.tileView.mouseControls.ontouchcancel, true);
        this.canvas.addEventListener("mousewheel", this.tileView.mouseControls.onmousewheel, true);
        this.canvas.addEventListener("DOMMouseScroll", this.tileView.mouseControls.onmousewheel, true);

	      var controlId = ['.bluvue-sheet-header', '.bluvue-sheet-tool-menu', '#attachments-button', '#floating-indicators-panel', '#next-sheet-arrow', '#previous-sheet-arrow'];

	      for(var i in controlId) {
		      angular.element(document.querySelector(controlId[i]))[0].onmouseup = this.tileView.mouseControls.onmouseup;
		      angular.element(document.querySelector(controlId[i]))[0].onmousemove = this.tileView.mouseControls.onmousemove;
	      }

        // Force a sync to ensure remote content is up to date
	      scope.scheduleAnnotationSync( null, null, function(){}, true );
    };

    this.dispose = function () {
        if (t.disposed) { return; }
        clearTimeout(t.mainLoopTimeout);
        t.tileView.dispose();
        t.userInterface.parentElement.removeChild(t.userInterface);

        t.canvas.onmousedown = null;
        t.canvas.onmouseup = null;
        t.canvas.onmousemove = null;
        t.canvas.onclick = null;
        t.canvas.ondblclick = null;

        this.canvas.removeEventListener("mousewheel", t.tileView.mouseControls.onmousewheel, true);
        this.canvas.removeEventListener("DOMMouseScroll", t.tileView.mouseControls.onmousewheel, true);
        this.canvas.removeEventListener("touchstart", this.tileView.mouseControls.ontouchstart, true);
        this.canvas.removeEventListener("touchmove", this.tileView.mouseControls.ontouchmove, true);
        this.canvas.removeEventListener("touchend", this.tileView.mouseControls.ontouchend, true);
        this.canvas.removeEventListener("touchcancel", this.tileView.mouseControls.ontouchcancel, true);
        t.disposed = true;
    };

    this.resetZoom = function() {
        t.tileView.fitToScreen();
    };

    this.setTool = function (tool) {
        t.tileView.setTool(tool);
    };

    this.hideOptionMenus = function() {
        t.optionsMenu.hideAllMenus();
    };

    this.convertToUnit = function(type, subType) {
        t.tileView.convertToUnit(type, subType);
        t.optionsMenu.lengthUnitConverter.hide();
        t.optionsMenu.areaUnitConverter.hide();
    };

    this.setColor = function (colorName) {
        var color = colorFromString(colorName);
        t.tileView.setColor(color);
        t.optionsMenu.setColor(color);
        t.optionsMenu.colorMenu.hide();
    };

    this.textUpdate = function (text) {
        t.tileView.annotationManager.textUpdate(text);
    };

    this.setTextSize = function (textSize) {
        t.tileView.annotationManager.setTextSize(textSize);
        t.tileView.textSize = textSize;
    };
};

