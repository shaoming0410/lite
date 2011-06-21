/*
 * List Template
 * License LGPL(您可以在任何地方免费使用,但请不要吝啬您对框架本身的改进)
 * http://www.xidea.org/project/lite/
 * @author jindw
 * @version $Id: template.js,v 1.4 2008/02/28 14:39:06 jindw Exp $
 */

var FOR_STATUS_KEY = '$__for';
var INIT_SCRIPT = String(function(){
	/**
	 * @public
	 */
	function lite__def(name,fn){
		lite__g[name] = fn||this[name];
	}
	/**
	 * @public
	 */
	function lite__init(n,$_context){
		return $_context && n in $_context?$_context[n]:n in lite__g?lite__g[n]:this[n]
	}
	/**
	 * @public
	 */
	function lite__list(source,result,type) {
		if (result){
			if(type == "number" && source>0){
				while(source--){
					result[source] = source+1;
				}
			}else{
				for(type in source){
					result.push(type);
 				}
			}
			return result;
		}
		return source instanceof Array ? source
				: lite__list(source, [],typeof source);
    }
	/**
	 * lite_encode(v1)
	 * lite_encode(v1,/<&/g)
	 * lite_encode(v1,/[<&"]|(&(?:[a-z]+|#\d+);)/ig)
	 * @public
	 */
	function lite__encode(text,exp){
		return String(text).replace(exp||/[<&"]/g,lite__r);
	}
	function lite__r(c,a){return a || "&#"+c.charCodeAt(0)+";"}
	var lite__g = {};
	//避免被压缩
	with(""){
		alert([lite__def,lite__init,lite__list,lite__encode,lite__g,lite__r])
	}
}).replace(/^[^{]+\{\s*|\bwith\b[\s\S]*$/g,'').replace(/\s*([^\w_$\s]+)\s*/g,'$1')
/**
 * JS原生代码翻译器实现
 */
function JSTranslator(name,params,defaults){
    this.name = name;
    this.params = params;
    this.defaults = defaults;
}
/**
 */
JSTranslator.prototype = {
	translate:function(list){
		var result = [];
	    try{
	    	//var result =  stringifyJSON(context.toList())
	        //var list = context.toList();
		    var context = new JSTranslateContext(list,this.name,this.params,this.defaults);
		    context.litePrefix = this.litePrefix || "lite__";
		    context.parse();
		    var code = context.toString();
		    new Function("function x(){"+code+"\n}");
	    }catch(e){
	    	var buf = [];
	    	for(var n in e){
	    		buf.push(n+':'+e[n]);
	    	}
	    	$log.error(code,e);
	        code = "return ('生成js代码失败：'+"+stringifyJSON(buf.join("\n"))+');';
	    }
    	if(!this.litePrefix){
    		result.push("if(!window.lite__def){",INIT_SCRIPT,"}");
    	}
	    result.push(code.replace(/<\/script>/g,'<\\/script>'));
	    return result.join("\n");
	}
}
/**
 * <code>
if(!window.lite__def){
	${INIT_SCRIPT}
}
lite__def('add',function add(a,b){retur a+b});
function($_context){
	var var1 = lite__init('var1',$_context);
	var var2 = lite__init('var2',$_context);
	var var3 = lite__init('var3',$_context);
	....
}
 */
function JSTranslateContext(code,name,params,defaults){
    TranslateContext.call(this,code,name,params,defaults);
    this.defaults = defaults;
}
var GLOBAL_VAR_MAP ={
	"JSON":1,
	"Math":1
}
var GLOBAL_DEF_MAP ={
	"parseInt":1, 	
	"parseFloat":1, 	
	"encodeURIComponent":1, 	
	"decodeURIComponent":1, 	
	"encodeURI":1, 	
	"decodeURI":1, 	
	"isFinite":1, 	
	"isNaN":1
};
function copy(source,target){
	for(var n in source){
		target[n] = source[n];
	}
}

function optimizeFunction(context,functionName,refMap,callMap,params,defaults){
	var text = context.reset();
	var result = [];
	var args = '$_context';
	if(params){
		args = params.join(',');
	}
	var map = {};
	copy(refMap,map);
	copy(callMap,map);
	for(var n in map){
		if(!((n in GLOBAL_VAR_MAP) ||( n in GLOBAL_DEF_MAP))){
			result.push('\tvar ',n,'=',context.litePrefix,'init("',n,'"',(params?'':',$_context'),');\n');
		}
	}
	//(a,b,c=3,d=4)
	//switch(arguments.length){
	//  case 0:
	//	case 1:
	//	case 2
	//		c=3;
	//	case 3
	//		d=4
	//	case 4
	//	default
	//
	//
	//}
	if(defaults && defaults.length){
		result.push('\tswitch(arguments.length){\n');
		var begin = params.length - defaults.length
		for(var i =0;i<params.length;i++){
			result.push('\t	case ',i,':\n');
			if(i>=begin){
				result.push('\t	',params[i],'=',stringifyJSON(defaults[i-begin]),';\n');
			}
		}
		result.push('\t}\n');
	}
	var SP = /^\s*\$_out\.push\((?:(.*)\)\s*;?)\s*$/g;
	if(SP.test(text)){
		var c  =text.replace(SP,'$1');
		if(c.indexOf(',')>0){
			//安全方式吧.
			text = "\treturn ["+c+"].join('');";
		}else{
			text = "\treturn "+c+';';
		}
	}else{
		text = "\tvar $_out=[]\n"+text+"\treturn $_out.join('');\n";
	}
	if(functionName){
    	try{
    		new Function("function "+functionName+"(){}");
    		functionName = "function "+functionName;
    	}catch(e){
    		functionName += "=function";
    	}
    }else{
    	functionName = "function";
    }
    return functionName+"("+args+'){\n'+result.join('')+text.replace(/^[\r\n]+/,'')+'\n}';
}
function PT(pt){
	for(var n in pt){
		this[n]=pt[n];
	}
}
PT.prototype = TranslateContext.prototype
JSTranslateContext.prototype = new PT({
	_appendOutput:function(){
    	var len = arguments.length;
    	var data = Array.prototype.join.call(arguments,'');
    	var lastOut = this._lastOut;//不能用闭包var代替
    	var lastIndex = this.out.length-1;
    	if(lastOut &&  this.out[lastIndex] == lastOut){
    		data = lastOut.substring(0,lastOut.length-2)+","+data+");";
    		this.out[lastIndex] = data;
    	}else{
    		data = "$_out.push("+data+");";
    		this.append(data);
    	}
    	this._lastOut = data
    },
	stringifyEL:function (el){
		return el?stringifyJSEL(el):null;
	},
	parse:function(){
		var code = this.code;
		var params = this.params;
		this.depth=0;
		this.out = [];
	    //add function
	    var fs = [];
	    var defs = this.scope.defs;
	    for(var i=0;i<defs.length;i++){
	        var def = defs[i];
	        var n = def.name;
	        var refMap = def.externalRefMap;
	        var callMap = def.callMap;
	        this.depth++;
	        this.appendCode(def.code);
	        var content = optimizeFunction(this,'',refMap,callMap,def.params,def.defaults);
	        this.depth--;
	        fs.push(this.litePrefix,"def('",n,"',",content,");\n");
	    }
	    this.header = fs.join('');
	    
	    try{
	    	this.depth++;
	        this.appendCode(code);
	        this.depth--;
	    }catch(e){
	        //alert(["编译失败：",buf.join(""),code])
	        throw e;
	    }
	    var refMap = this.scope.externalRefMap;
	    var callMap =this.scope.callMap;
	    this.body = optimizeFunction(this,this.name,refMap,callMap,this.params,this.defaults);
	    //this.append("return $_out.join('');");
	},
	
    appendStatic:function(item){
    	this._appendOutput(stringifyJSON(item));
    },
    appendEL:function(item){
    	this._appendOutput(this.stringifyEL(item[1]))
    },
    appendXT:function(item){
        this._appendOutput(this.litePrefix,"encode(",this.stringifyEL(item[1]),")")
    },
    appendXA:function(item){
        //[7,[[0,"value"]],"attribute"]
        var el = item[1];
        var value = this.stringifyEL(el);
        var attributeName = item.length>2 && item[2];
        var testId = this.allocateId(value);
        if(testId != value){
            this.append(testId,"=",value);
        }
        if(attributeName){
            this.append("if(",testId,"!=null){");
            this.depth++;
            this._appendOutput("' ",attributeName,"=\"',",this.litePrefix,"encode("+testId+"),'\"'");
            this.depth--;
            this.append("}");
            this.freeId(testId);
        }else{
        	this._appendOutput(this.litePrefix,"encode(",value,")")
        }
    },
    appendVar:function(item){
        this.append("var ",item[2],"=",this.stringifyEL(item[1]),";");
    },
    appendCapture:function(item){
        var childCode = item[1];
        var varName = item[2];
        var bufbak = this.allocateId();
        this.append("var ",bufbak,"=$_out;$_out=[];");
        this.appendCode(childCode);
        this.append("var ",varName,"=$_out.join('');$_out=",bufbak,";");
        this.freeId(bufbak);
    },
    appendEncodePlugin:function(item){
        this._appendOutput(this.litePrefix,'encode(',this.stringifyEL(item[1]),',/[<&"]|(&(?:[a-z]+|#\d+);)/ig);')
    },
    processIf:function(code,i){
        var item = code[i];
        var childCode = item[1];
        var testEL = item[2];
        var test = this.stringifyEL(testEL);
        this.append("if(",test,"){");
        this.depth++;
        this.appendCode(childCode)
        this.depth--;
        this.append("}");
        var nextElse = code[i+1];
        var notEnd = true;
        while(nextElse && nextElse[0] == ELSE_TYPE){
            i++;
            var childCode = nextElse[1];
            var testEL = nextElse[2];
            var test = this.stringifyEL(testEL);
            if(test){
                this.append("else if(",test,"){");
            }else{
                notEnd = false;
                this.append("else{");
            }
            this.depth++;
            this.appendCode(childCode)
            this.depth--;
            this.append("}");
            nextElse = code[i+1];
        }
        return i;
    },
    processFor:function(code,i){
        var item = code[i];
        var indexId = this.allocateId();
        var itemsId = this.allocateId();
        var itemsEL = this.stringifyEL(item[2]);
        var varNameId = item[3]; 
        //var statusNameId = item[4]; 
        var childCode = item[1];
        var forInfo = this.findForStatus(item)
        if(forInfo.depth){
            var previousForValueId = this.allocateId();
        }
        //初始化 items 开始
        this.append("var ",indexId,"=0;")
        this.append("var ",itemsId,'=',this.litePrefix,"list(",itemsEL,")");
        
        //初始化 for状态
        var needForStatus = forInfo.ref || forInfo.index || forInfo.lastIndex;
        if(needForStatus){
            if(forInfo.depth){
                this.append("var ",previousForValueId ,"=",FOR_STATUS_KEY,";");
            }
            this.append(FOR_STATUS_KEY," = {lastIndex:",itemsId,".length-1};");
        }
        this.append("for(;",indexId,"<",itemsId,".length;",indexId,"++){");
        this.depth++;
        if(needForStatus){
            this.append(FOR_STATUS_KEY,".index=",indexId,";");
        }
        this.append("var ",varNameId,"=",itemsId,"[",indexId,"];");
        this.appendCode(childCode);
        this.depth--;
        this.append("}");
        
        if(needForStatus && forInfo.depth){
           this.append(FOR_STATUS_KEY,"=",previousForValueId);
        }
        this.freeId(itemsId);;
        if(forInfo.depth){
            this.freeId(previousForValueId);
        }
        var nextElse = code[i+1];
        var notEnd = true;
        var elseIndex = 0;
        while(notEnd && nextElse && nextElse[0] == ELSE_TYPE){
            i++;
            elseIndex++;
            var childCode = nextElse[1];
            var testEL = nextElse[2];
            var test = this.stringifyEL(testEL);
            var ifstart = elseIndex >1 ?'else if' :'if';
            if(test){
                this.append(ifstart,"(!",indexId,"&&",test,"){");
            }else{
                notEnd = false;
                this.append(ifstart,"(!",indexId,"){");
            }
            this.depth++;
            this.appendCode(childCode)
            this.depth--;
            this.append("}");
            nextElse = code[i+1];
        }
        this.freeId(indexId);
        return i;
    },
    toString:function(){
    	return this.header+this.body
    }
});