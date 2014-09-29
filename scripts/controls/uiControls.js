BluVueSheet.ToolMenu = function(setTool){
	var names = ["Lasso","Square","X","Circle","Cloud","Polygon","Text","Line","Arrow","Pen","Highlighter","Ruler"];
    var t = this;
	this.toolMenuElement = document.createElement("div");
	this.toolMenuElement.className = 'bluvue-sheet-tool-menu';
	this.currentToolName = null;

	for(var i=0; i<names.length; i++){
	    var button = document.createElement("div");
	    button.className = "bv-toolbar-image bv-toolbar-" + names[i].toLowerCase();
		button.name = names[i];
		button.onclick = function () {
		    t.deselectAllTools();
            if (t.currentToolName !== this.name) {
                this.className = "bv-toolbar-image bv-toolbar-" + this.name.toLowerCase() + " selected";
                setTool(window[this.name.toUpperCase() + "_TOOL"]);
                t.currentToolName = this.name;
            } else {
                setTool(NO_TOOL);
                t.currentToolName = null;
            }
		};

		this.toolMenuElement.appendChild(button);
	};

	this.deselectAllTools = function () {
        var tools = document.getElementsByClassName("bv-toolbar-image");
        for (var toolIndex = 0; toolIndex < tools.length; toolIndex++) {
            if (tools[toolIndex].className.indexOf("selected") > 0) {
                var tool = tools[toolIndex];
                tool.className = tool.className.substr(0, tool.className.indexOf("selected"));
            }
        }
    };
}
BluVueSheet.OptionsMenu = function(optionChosen){
	var names = ["Master","Fill","Ruler","Area","Color","Delete"];
	var t = this;

	this.optionsMenuElement = document.createElement("div");
	this.optionsMenuElement.className = 'bluvue-sheet-options-menu';

	var addButton = function(index){
		var button = document.getElementById("button_"+names[index]);
		if(button!=null)return;
	    button = document.createElement("div");
	    button.className = "bv-options-image bv-options-" + names[index].toLowerCase();
		button.name = names[index];
		button.id = "button_"+names[index];
		button.onclick = function(){
			optionChosen(window[this.name.toUpperCase()+"_OPTION"]);
		};
		t.optionsMenuElement.appendChild(button);
	}
	var removeButton = function(index){
		var button = document.getElementById("button_"+names[index]);
		if (button != null) { t.optionsMenuElement.removeChild(button); }
	}
	var setButtonSelected = function(index, isSelected){
	    //make button brighter
	    var className = "bv-options-image bv-options-" + names[index].toLowerCase();
	    className = isSelected ? className + " selected" : className;
	    var elem = document.getElementById("button_" + names[index]);
        if (elem) {
            elem.className = className;
        }
	}
    this.deselectAllButtons = function() {
        var btns = document.getElementsByClassName("bv-options-image");
        for (var toolIndex = 0; toolIndex < btns.length; toolIndex++) {
            if (btns[toolIndex].className.indexOf("selected") > 0) {
                var btn = btns[toolIndex];
                btn.className = btn.className.substr(0, btn.className.indexOf("selected"));
            }
        }
    };

	this.setColor = function(color){
		//set color overlay
	}
	this.setSelectedAnnotations = function(selectedAnnotations,tileView){
		var userIsAdmin = true;
		for (var x = 0; x < names.length; x++) { removeButton(x); }

		if(selectedAnnotations.length>0){
			if(userIsAdmin){
				addButton(0);
				var master = false;
				for(var j=0; j<selectedAnnotations.length; j++){
				    if(selectedAnnotations[j].userId === null ||
                         selectedAnnotations[j].userId === undefined) {
					    master=true;
					}
				}

				setButtonSelected(0,master);
			}
		}
		if(selectedAnnotations.length==1){
			var type = selectedAnnotations[0].type;
			this.setColor(selectedAnnotations[0].color);
			if(type==MEASURE_ANNOTATION)
				addButton(2);
			if((type==SQUARE_ANNOTATION||type==POLYGON_ANNOTATION||type==PEN_ANNOTATION)&&tileView.annotationManager.scaleAnnotation!=null){
				if(selectedAnnotations[0].areaMeasured)addButton(2);
				setButtonSelected(3,selectedAnnotations[0].areaMeasured);
				addButton(3);
			}
		} else {
			this.setColor(tileView.color);
		}
		if(selectedAnnotations.length>0){
			var canFill = false;
			for(var i=0; i<selectedAnnotations.length; i++){
				if(selectedAnnotations[i].type!=TEXT_ANNOTATION&&selectedAnnotations[i].type!=HIGHLIGHTER_ANNOTATION&&
						selectedAnnotations[i].type!=LINE_ANNOTATION&&selectedAnnotations[i].type!=ARROW_ANNOTATION&&
						selectedAnnotations[i].type!=MEASURE_ANNOTATION&&selectedAnnotations[i].type!=SCALE_ANNOTATION)
					canFill=true;
			}
			if(canFill){
				var totalFilled = 0;
				addButton(1);
				for(var i=0; i<selectedAnnotations.length; i++){
					if(selectedAnnotations[i].fill)totalFilled++;
				}
				//highlight the fill button if all selected paths are filled
				setButtonSelected(1,totalFilled==selectedAnnotations.length);
			}
		}
		if(tileView.getTool()!=LASSO_TOOL&&(tileView.getTool()!=NO_TOOL||selectedAnnotations.length>0))
			addButton(4);
		if(selectedAnnotations.length>0)
			addButton(5);
	}
}
BluVueSheet.ColorMenu = function(setColor){
	var colors = [	new Color(1,0,0,1),new Color(0,1,0,1),new Color(0,0,1,1),
					new Color(1,1,0,1),new Color(1,0.647,0,1),new Color(1,0,1,1),
					new Color(0.333,0.102,0.545,1),new Color(0,0,0,1),new Color(0.8,0.8,0.8,1)
				 ];
	this.colorMenuElement = document.createElement("div");
	this.colorMenuElement.className = 'bluvue-sheet-color-menu';

	for(var i=0; i<colors.length; i++){
		var button = document.createElement("div");
		button.className = "bluvue-color-button";
		button.style.background = colors[i].toStyle();
		button.name = colors[i].toStyle();
		button.onclick = function(){
			setColor(this.name);
		};
		this.colorMenuElement.appendChild(button);
		if(i%3==2){
			var br = document.createElement("br");
			this.colorMenuElement.appendChild(br);
		}
	}
	this.show = function () {
	    this.colorMenuElement.style.display = 'block';
	}
	this.hide = function(){
	    this.colorMenuElement.style.display = 'none';
	}
}
BluVueSheet.TextEditor = function(textUpdate, setTextSize){
	var textSizes = [32,64,128,256,512];
	this.textEditorElement = document.createElement("div");
	this.textEditorElement.className = "bluvue-text-editor";
	
	var textSizeMenu = document.createElement("div");
	for(var i=0; i<textSizes.length; i++){
		var button = document.createElement("div");
		button.className = "bv-toolbar-image bv-toolbar-image-inline bv-toolbar-text";
		button.name = textSizes[i];
		button.onclick = function(){
			setTextSize(parseInt(this.name));
		};
		textSizeMenu.appendChild(button);
	}
	this.textEditorElement.appendChild(textSizeMenu);
	
	var textBox = document.createElement("textarea");
	textBox.onchange = function(){
		textUpdate(textBox.value);
	}
	textBox.onkeyup = function(){
		textUpdate(textBox.value);
	}
	this.textEditorElement.appendChild(textBox);

	this.show = function(x,y){
	    this.textEditorElement.style.left = x + "px";
	    this.textEditorElement.style.top = y + "px";
	    this.textEditorElement.style.display = 'block';
	}
	this.hide = function(){
	    this.textEditorElement.style.display = 'none';
	}
	this.setLoc = function(x,y){
	    this.textEditorElement.style.left = x + "px";
	    this.textEditorElement.style.top = y + "px";
	}
	this.setText = function(text){
		textBox.value = text;
	}
}
BluVueSheet.CloseSheetButton = function(closeSheet) {
    this.closeMenuElement = document.createElement("span");
    this.closeMenuElement.className = "bluvue-sheet-close-button";
    this.closeMenuElement.innerHTML = "x";
    this.closeMenuElement.onclick = closeSheet;
}

BluVueSheet.LoadingSpinner = function() {
    var createBounce = function(index) {
        var elem = document.createElement("div");
        elem.className = "bounce" + index;
        return elem;
    }

    this.element = document.createElement("div");
    this.element.className = "spinner";
    this.element.appendChild(createBounce(1));
    this.element.appendChild(createBounce(2));
    this.element.appendChild(createBounce(3));
}
