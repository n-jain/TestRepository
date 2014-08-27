var xmlHttp = null;
function httpGet(command){
	xmlHttp = new XMLHttpRequest();
	var url = "http://api.gondor.bluvue.com/"+command;
	xmlHttp.onreadystatechange = ProcessRequest;
	xmlHttp.open("GET", url, true);
	xmlHttp.setRequestHeader("Host","api.gondor.bluvue.com");
	xmlHttp.setRequestHeader("Authorization","Basic bWF1bnZ6QGdtYWlsLmNvbToxMTBlZmY3ZDQwYTM3NzlmNDUxM2MxYmU2ZjhmZmZjZg==");
	xmlHttp.send();
}
function ProcessRequest(){
	console.log(xmlHttp);
}