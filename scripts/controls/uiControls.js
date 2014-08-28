function ToolMenu(){
	var names = ["Lasso","Square","X","Circle","Cloud","Polygon","Text","Line","Arrow","Pen","Highlighter","Ruler","Mail"];

	var toolMenu = document.createElement("div");
	toolMenu.id = "tool_menu";

	for(var i=0; i<names.length; i++){
		var button = document.createElement("input");
		button.type = "image";
		button.className = "tool_button";
		button.src = "toolbar_images/toolbar_"+names[i].toLowerCase()+".png";
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
	var names = ["Master","Fill","Ruler","Area","Text","Color","Delete"];

	var optionsMenu = document.createElement("div");
	optionsMenu.id = "options_menu";

	for(var i=0; i<names.length; i++){
		var button = document.createElement("input");
		button.type = "image";
		button.className = "tool_button";
		button.src = "optionsmenu_images/annotation_toolbar_"+names[i].toLowerCase()+".png";
		button.name = names[i];
		button.onclick = function(){
			optionChosen(window[this.name.toUpperCase()+"_OPTION"]);
		};
		optionsMenu.appendChild(button);
	}

	document.getElementsByTagName("body")[0].appendChild(optionsMenu);
}