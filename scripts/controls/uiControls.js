function ToolMenu(){
	var names = ["Lasso","Square","X","Circle","Cloud","Polygon","Text","Line","Arrow","Pen","Highlighter","Ruler","Mail"];

	var toolMenu = document.createElement("div");
	toolMenu.id = "tool_menu";

	for(var i=0; i<names.length; i++){
		var button = document.createElement("input");
		button.type = "image";
		button.className = "tool_button";
		button.src = "images/toolbar/toolbar_"+names[i].toLowerCase()+".png";
		button.name = names[i];
		button.onclick = function(){
			setTool(window[this.name.toUpperCase()+"_TOOL"]);
		};
		toolMenu.appendChild(button);
		var br  = document.createElement("br");
		toolMenu.appendChild(br);
	}
	document.getElementsByTagName("body")[0].appendChild(toolMenu);
}
function OptionsMenu(){
	var names = ["Master","Fill","Ruler","Area","Color","Delete"];

	var optionsMenu = document.createElement("div");
	optionsMenu.id = "options_menu";

	var addButton = function(index){
		var button = document.getElementById("button_"+names[index]);
		if(button!=null)return;

		button = document.createElement("input");
		button.type = "image";
		button.className = "tool_button";
		button.src = "images/optionsmenu/annotation_toolbar_"+names[index].toLowerCase()+".png";
		button.name = names[index];
		button.id = "button_"+names[index];
		button.onclick = function(){
			optionChosen(window[this.name.toUpperCase()+"_OPTION"]);
		};
		optionsMenu.appendChild(button);
	}
	var removeButton = function(index){
		var button = document.getElementById("button_"+names[index]);
		if(button!=null)optionsMenu.removeChild(button);
	}
	var setButtonSelected = function(index,bool){
		//make button brighter
	}
	this.setColor = function(color){
		//set color overlay
	}
	this.setSelectedAnnotations = function(selectedAnnotations,tileView){
		var userIsAdmin = true;
		for(var i=0; i<names.length; i++)removeButton(i);
		if(selectedAnnotations.length>0){
			if(userIsAdmin){
				addButton(0);
				var master = false;
				for(var i=0; i<selectedAnnotations.length; i++){
					if(selectedAnnotations.userId==null)
						master=true;
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
	document.getElementById("top_right").appendChild(optionsMenu);
}
function ColorMenu(){
	var colors = [	new Color(1,0,0,1),new Color(0,1,0,1),new Color(0,0,1,1),
					new Color(1,1,0,1),new Color(1,0.647,0,1),new Color(1,0,1,1),
					new Color(0.333,0.102,0.545,1),new Color(0,0,0,1),new Color(0.8,0.8,0.8,1)
				 ];
	var colorMenu = document.createElement("div");
	colorMenu.id = "color_menu";

	for(var i=0; i<colors.length; i++){
		var button = document.createElement("div");
		button.className = "color_button";
		button.style.background = colors[i].toStyle();
		button.name = colors[i].toStyle();
		button.onclick = function(){
			setColor(this.name);
		};
		colorMenu.appendChild(button);
		if(i%3==2){
			var br  = document.createElement("br");
			colorMenu.appendChild(br);			
		}
	}
	this.show = function(){
		document.getElementById("top_right").appendChild(colorMenu);
	}
	this.hide = function(){
		if(document.getElementById(colorMenu.id)!=null)
			document.getElementById("top_right").removeChild(colorMenu);
	}
}
function TextEditor(){
	var textSizes = [32,64,128,256,512];
	var textEditor = document.createElement("div");
	textEditor.id = "text_editor";
	
	var textSizeMenu = document.createElement("div");
	textSizeMenu.id = "text_size_menu";
	for(var i=0; i<textSizes.length; i++){
		var button = document.createElement("input");
		button.type = "image";
		button.className = "text_size_button";
		button.src = "images/optionsmenu/annotation_toolbar_text.png";
		button.name = textSizes[i];
		button.onclick = function(){
			setTextSize(parseInt(this.name));
		};
		textSizeMenu.appendChild(button);
	}
	textEditor.appendChild(textSizeMenu);
	
	var textBox = document.createElement("textarea");
	textBox.id = "text_editor_input";
	textBox.onchange = function(){
		textUpdate(textBox.value);
	}
	textBox.onkeyup = function(){
		textUpdate(textBox.value);
	}
	textEditor.appendChild(textBox);

	this.show = function(x,y){
		textEditor.style.left=x+"px";
		textEditor.style.top=y+"px";
		document.getElementsByTagName("body")[0].appendChild(textEditor);
	}
	this.hide = function(){
		if(document.getElementById(textEditor.id)!=null)
			document.getElementsByTagName("body")[0].removeChild(textEditor);
	}
	this.setLoc = function(x,y){
		textEditor.style.left=x+"px";
		textEditor.style.top=y+"px";
	}
	this.setText = function(text){
		textBox.value = text;
	}
}