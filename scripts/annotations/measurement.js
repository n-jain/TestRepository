//LENGTH
var IN=0;
var FT=1;
var FT_IN=2;
var YD=3;
var MI=4;
var CM=5;
var M=6;
var KM=7;
	
//AREA
var IN2=0;
var FT2=1;
var YD2=2;
var AC=3;
var MI2=4;
var CM2=5;
var M2=6;
var HA=7;
var KM2=8;

//TYPES
var LENGTH = 0;
var AREA = 1;

var unitNames = [["IN","FT","FT IN","YD","MI","CM","M","KM"],
				["IN2","FT2","YD2","AC","MI2","CM2","M2","HA","KM2"]];

function Measurement(amount, unit, type){
	var convMult = [[
		//LENGTH UNIT CONVERSIONS
		[1,1/12,1/12,1/36,1/63360,2.54,.0254,.0000254],
		[12,1,1,1/3,1/5280,30.48,.3048,.0003048],
		[12,1,1,1/3,1/5280,30.48,.3048,.0003048],
		[36,3,3,1,1/1760,91.44,.9144,.0009144],
		[63360,5280,5280,1760,1,160934,1609.34,1.60934],
		[0.393701,0.0328084,0.0328084,0.0109631,1/160934,1,1/100,1/100000],
		[39.3701,3.28084,3.28084,1.09631,1/1609.34,100,1,1/1000],
		[39370.1,3280.84,3280.84,1096.31,0.621371,100000,1000,1]
	],[
		//AREA UNIT CONVERSIONS
		[1,1/144,1/1296,1/6273000,1/4014000000,6.4516,0.00064516,1/15500000,1/1550000000],
		[144,1,1/9,1/43560,1/27880000,929.0304,0.092903,1/107639,1/10763900],
		[1296,9,1,1/4840,1/3098000,8361.2736,0.836127,1/11959.9,1/1195990],
		[6273000,43560,4840,1,0.0015625,40468564.224,4046.86,0.404686,.00404686],
		[4014000000,27880000,3098000,640,1,25899881100,2589988,258.999,2.58999],
		[0.15500031,1/929.0304,1/8361.2736,1/40468564.224,1/25899881100,1,.0001,1/100000000,1/10000000000],
		[1550,10.7639,1.19599,1/4046.86,1/2589988,10000,1,.0001,.000001],
		[15500000,107639,11959.9,2.47105,0.00386102,100000000,10000,1,.01],
		[1550000000,10763900,1195990,247.105,0.386102,1000000000,1000000,100,1],
	]];
	this.unit=unit;
	this.amount=amount;
	this.type=type;
	this.setAmount=function(amount,unit){
		if(unit!=-1&&this.unit!=-1&&this.type!=-1)
			this.amount = amount*convMult[this.type][unit][this.unit];
	}
	this.convertTo=function(newUnit){
		return this.amount*convMult[this.type][this.unit][newUnit];
	}
	this.changeToUnit=function(unit){
		this.amount = this.amount*convMult[this.type][this.unit][unit];
		this.unit=unit;
	}
	this.toString=function(){
		var str = "";
		if(this.unit!=-1&&this.type!=-1)
		if(!(this.unit==FT_IN&&this.type==LENGTH)){
			var a = amount+"";//format to X.XX
			str = a+" "+unitNames[this.type][this.unit];
		}else{
			if(Math.floor(amount)!=0){
				str+=Math.floor(amount);
				str+="\' ";				
			}
			var inches = Math.round((this.amount-Math.floor(this.amount))*12);
			str+=inches+"\"";
		}
		return str;
	}
}

function toUnit(str){
	var s = str.toLowerCase();
	if(s==="m")return [M,LENGTH];
	if(s==="cm")return [CM,LENGTH];
	if(s==="km")return [KM,LENGTH];

	if(s==="in"||s==="inch"||s==="inches"||s==="\"")return [IN,LENGTH];
	if(s==="ft"||s==="foot"||s==="feet"||s==="\'")return [FT,LENGTH];
	if(s==="ftin")return [FT_IN,LENGTH];
	if(s==="yd"||s==="yard"||s==="yards")return [YD,LENGTH];
	if(s==="mi"||s==="mile"||s==="miles")return [MI,LENGTH];
	
	//area units load from JSON
	if(s==="in2")return [IN2,AREA];
	if(s==="ft2")return [FT2,AREA];
	if(s==="yd2")return [YD2,AREA];
	if(s==="ac")return [AC,AREA];
	if(s==="mi2")return [MI2,AREA];

	if(s==="cm2")return [CM2,AREA];
	if(s==="m2")return [M2,AREA];
	if(s==="ha")return [HA,AREA];
	if(s==="km2")return [KM2,AREA];
	return [-1,-1];
}

function toArea(lengthUnit){
	switch(lengthUnit){
		case IN:return IN2;
		case FT:return FT2;
		case FT_IN:return FT2;
		case YD:return YD2;
		case MI:return MI2;
		case CM:return CM2;
		case M:return M2;
		case KM:return KM2;
	}
	return -1;
}

function createMeasurement(str){
	function isDigit(str){
		return !isNaN(parseInt(str));
	}
	if(str.length()<2)return null;//at least a number and letter

	var numStart = 0;
	var numStarted = false;
	var numEnd = 0;
	var numEnded = false;
	//find locations where numbers stop and units start
	for(var i=0; i<str.length; i++){
		if(!numStarted&&isDigit(str.charAt(i))){
			numStarted=true;
			numStart=i;
		}
		if(!(isDigit(str.charAt(i))||str.charAt(i)=='.')&&!numEnded&&numStarted){
			numEnd=i;
			numEnded=true;
		}
	}
	var amount = 0;
	amount = parseFloat(str.substring(numStart, numEnd));
	
	var unitStart = 0;
	var unitEnd = 0;
	var unitStarted = false;
	//find the start of the unit
	for(var i=numEnd; i<str.length; i++){
		if(str.charAt(i)!=' '&&!unitStarted){
			unitStart=i;
			unitStarted=true;
		}
		if((str.charAt(i)==' '||isDigit(str.charAt(i)))&&unitStarted){
			unitEnd = i;
			i=str.length;
		}
	}
	var unitInfo = toUnit(str.substring(unitStart));
	var type = unitInfo[1];
	var unit = unitInfo[0];
	if(unitEnd==0)unitEnd=str.length;
	if(unit == -1){
		 unitInfo = toUnit(str.substring(unitStart, unitEnd));
		 unit = unitInfo[0];
		 if(unit == -1)return null;
		 if(unit == FT){
			var m = create(str.substring(unitEnd));
			if(m==null)return null;
			if(m.unit==IN){
				unit = FT_IN;
				amount += m.convertTo(FT);
			}
		 }else{
			 return null;
		 }
	}
	return new Measurement(amount,unit,type);
}