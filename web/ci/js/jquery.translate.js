/* jQuery Translate plugin and related components */
/* http://code.google.com/p/jquery-translate/
 * Version: 1.3.2
 * License: MIT, GPL  (c) 2009 Balazs Endresz
 */
(function(d){var a,j,h,g=false,b=false,i=[];function e(){j=c.GL=google.language;h=j.Languages;g=true;var k;while(k=i.shift()){k()}}function f(){}function c(){this.extend(d.translate);delete this.defaults;delete this.fn}c.prototype={version:"1.3.2",translateInit:function(k,m){var l=this;this.options=m;m.from=this.toLanguageCode(m.from)||"";m.to=this.toLanguageCode(m.to)||"";if(m.fromOriginal&&m.nodes[0]){m.nodes.each(function(n){var o=l.getData(this,m.from,m);if(!o){return false}k[n]=o})}if(typeof k==="string"){if(!m.comments){k=this.stripComments(k)}this.rawSource="<div>"+k+"</div>";this.isString=true}else{if(!m.comments){k=d.map(k,function(n){return l.stripComments(n)})}this.rawSource="<div>"+k.join("</div><div>")+"</div>";this.isString=false}this.from=m.from;this.to=m.to;this.source=k;this.elements=m.nodes;this.rawTranslation="";this.translation=[];this.startPos=0;this.i=0;this.stopped=false;m.start.call(this,m.nodes[0]?m.nodes:k,m.from,m.to,m);if(m.timeout>0){this.timeout=setTimeout(function(){m.onTimeout.call(l,m.nodes[0]?m.nodes:k,m.from,m.to,m)},m.timeout)}(m.toggle&&m.nodes[0])?this.toggle():this.translate();return this},translate:function(){if(this.stopped){return}var t=this,k=this.options;this.rawSourceSub=this.truncate(this.rawSource.substr(this.startPos),1800);this.startPos+=this.rawSourceSub.length;var q=this.rawTranslation.length,u;while((u=this.rawTranslation.lastIndexOf("</div>",q))>-1){q=u-1;var v=this.rawTranslation.substr(0,q),s=v.match(/<div[> ]/gi),r=v.match(/<\/div>/gi);s=s?s.length:0;r=r?r.length:0;if(s!=r+1){continue}var m=d(this.rawTranslation.substr(0,q+7)),p=m.length,n=this.i;if(n==p){break}m.slice(n,p).each(function(l,o){(function(){if(this.stopped){return false}var y=d(o).html().replace(/^\s/,""),x=n+l,z=this.source,A=this.from.length<2&&this.detectedSourceLanguage||this.from;this.translation[x]=y;if(!k.nodes[0]){if(this.isString){this.translation=y}else{z=this.source[x]}k.each.call(this,x,y,z,A,this.to,k)}else{this.each(x,this.elements[x],y,this.source[x],A,this.to,k);k.each.call(this,x,this.elements[x],y,this.source[x],A,this.to,k)}this.i++}).call(t)});break}if(this.rawSourceSub.length>0){j.translate(this.rawSourceSub,this.from,this.to,function(l){(function(){if(l.error){return k.error.call(this,l.error,this.rawSourceSub,this.from,this.to,k)}this.rawTranslation+=l.translation||this.rawSourceSub;this.detectedSourceLanguage=l.detectedSourceLanguage;this.translate()}).call(t)});if(!k.nodes[0]){return}}else{if(!this.rawTranslation){return}var w=this.from.length<2&&this.detectedSourceLanguage||this.from;if(this.timeout){clearTimeout(this.timeout)}if(!k.nodes[0]){k.complete.call(this,this.translation,this.source,w,this.to,k)}else{k.complete.call(this,this.elements.end(),this.elements,this.translation,this.source,w,this.to,k)}}},stop:function(){if(this.stopped){return this}this.stopped=true;this.options.error.call(this,{message:"stopped"});return this}};d.translate=function(m,l,k,o){if(m==a){return new c()}if(d.isFunction(m)){return d.translate.ready(m,l)}var n=new c();return d.translate.ready(function(){return n.translateInit(m,d.translate._getOpt(l,k,o))},false,n)};d.translate.fn=d.translate.prototype=c.prototype;d.translate.fn.extend=d.translate.extend=d.extend;d.translate.extend({stripComments:function(k){return k.replace(/<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)>/g,"")},truncate:function(q,l){var m,u,r,p,o,s,k=encodeURIComponent(q);for(m=0;m<10;m++){try{s=decodeURIComponent(k.substr(0,l-m))}catch(n){continue}if(s){break}}return(!(u=/<(?![^<]*>)/.exec(s)))?((!(r=/>\s*$/.exec(s)))?((p=/[\.\?\!;:](?![^\.\?\!;:]*[\.\?\!;:])/.exec(s))?((o=/>(?![^>]*<)/.exec(s))?(p.index>o.index?s.substring(0,p.index+1):s.substring(0,o.index+1)):s.substring(0,p.index+1)):s):s):s.substring(0,u.index)},getLanguages:function(t,s){if(t==a||(s==a&&!t)){return h}var r={},m=s,p=h;if(s){p=d.translate.getLanguages(t)}else{if(typeof t==="object"){m=t}}if(m){for(var q=0,n=m.length,k,o;q<n;q++){k=d.translate.toLanguageCode(m[q]);for(o in p){if(k===p[o]){r[o]=p[o]}}}}else{for(var o in h){if(j.isTranslatable(h[o])){r[o]=h[o]}}}return r},toLanguage:function(m,n){for(var k in h){if(m===k||m===h[k]||m.toUpperCase()===k||m.toLowerCase()===h[k].toLowerCase()){return n==="lowercase"?k.toLowerCase():n==="capitalize"?k.charAt(0).toUpperCase()+k.substr(1).toLowerCase():k}}},toLanguageCode:function(k){return h.a||h[d.translate.toLanguage(k)]},same:function(l,k){return l===k||d.translate.toLanguageCode(l)===d.translate.toLanguageCode(k)},isTranslatable:function(k){return j.isTranslatable(d.translate.toLanguageCode(k))},getBranding:function(l,k,m){return d(j.getBranding(l,k,m))},load:function(l,m,k){b=true;function n(){google.load(m||"language",k||"1",{callback:e})}(typeof google!=="undefined"&&google.load)?n():d.getScript("http://www.google.com/jsapi?"+(l?"key="+l:""),n);return d.translate},ready:function(k,m,l){g?k():i.push(k);if(!b&&!m){d.translate.load()}return l||d.translate},_getOpt:function(l,k,r,q){var p,n,m={};if(typeof l==="object"){m=l}else{if(!k&&!r){n=l}if(!r&&k){if(typeof k==="object"){n=l;m=k}else{p=l;n=k}}if(l!=a&&k&&r){p=l;n=k;m=r}m.from=p||m.from||"";m.to=n||m.to||""}if(m.fromOriginal){m.toggle=true}if(m.toggle){m.data=true}if(m.async===true){m.async=2}return d.extend({},d.translate._defaults,(q?d.fn.translate.defaults:d.translate.defaults),m)},_defaults:{comments:false,start:f,error:f,each:f,complete:f,onTimeout:f,timeout:0,from:"",to:"",nodes:[],walk:true,returnAll:false,replace:true,rebind:true,data:true,setLangAttr:false,subject:true,not:"",altAndVal:true,async:false,toggle:false,fromOriginal:false}});d.translate.defaults=d.extend({},d.translate._defaults)})(jQuery);(function(c){function a(e,f){return f==="input"&&!!({text:1,button:1,submit:1})[c.attr(e,"type").toLowerCase()]}function b(g,f){var h=g.css("text-align");g.css("direction",f);if(h==="right"){g.css("text-align","left")}if(h==="left"){g.css("text-align","right")}}function d(e,f){var g=e.nodeName.toLowerCase();return typeof f.subject==="string"?f.subject:f.altAndVal&&g==="img"?"alt":f.altAndVal&&a(e,g)?"value":g==="textarea"?"value":"html"}c.translate.fn.extend({toggle:function(){var g=this,h=this.options,f=h.nodes,i=h.to,e=false;f.each(function(j){var l=c(this),k=g.getData(this,i,h);if(!k){return !(e=true)}g.translation.push(k);g.setLangAttr(l,i,h);g.replace(l,k,h);h.each.call(g,j,g.elements[j],k,g.source[j],g.from,i,h)});!e?h.complete.call(this,f.end(),f,g.translation,this.source,this.from,this.to,h):this.translate()},getData:function(e,h,g){var f=c.data(e,"translation");return f&&f[h]&&f[h][d(e,g)]},each:function(g,j,f,h,n,m,l){var k=c(j);this.setData(k,j,f,h,n,m,l);this.replace(k,f,l);this.setLangAttr(k,m,l)},setData:function(i,g,m,n,k,l,f){if(!f.data){return}var j=d(g,f),h=c.data(g,"translation");h=h||c.data(g,"translation",{});(h[k]=h[k]||{})[j]=n;(h[l]=h[l]||{})[j]=m;c.data(g,"translation."+k+"."+j,n);c.data(g,"translation."+l+"."+j,m)},replace:function(h,g,i){if(!i.replace){return}if(typeof i.subject==="string"){return h.attr(i.subject,g)}var j=h[0].nodeName.toLowerCase();if(i.to==="ar"){b(h,"rtl")}else{if(h.css("direction")==="rtl"){b(h,"ltr")}}if(i.altAndVal&&j==="img"){h.attr("alt",g)}else{if(i.altAndVal&&a(h[0],j)){h.val(g)}else{if(j==="textarea"){h.val(g)}else{if(i.rebind){var f=h.find("*").not("script").clone(true);h.html(g);this.copyEvents(f,h.find("*"))}else{h.html(g)}}}}},setLangAttr:function(f,h,g){if(g.setLangAttr){f.attr(g.setLangAttr===true?"lang":g.setLangAttr,h)}},copyEvents:function(f,e){e.each(function(h){var g=c.data(f[h],"events");if(!g){return false}for(var k in g){for(var j in g[k]){c.event.add(this,k,g[k][j],g[k][j].data)}}})}});c.fn.translate=function(f,e,i){var g=c.translate._getOpt(f,e,i,true),h=c.extend({},c.translate._defaults,c.fn.translate.defaults,g,{complete:function(k,j){g.nodes=k;c.translate(j,g)},each:function(){}});if(this.nodesContainingText){return this.nodesContainingText(h)}g.nodes=this;c.translate(c.map(this,function(j){return c(j).html()||c(j).val()}),g);return this};c.fn.translate.defaults=c.extend({},c.translate._defaults)})(jQuery);(function(a){a.translate.ui=a.translate.fn.ui=function(f,d,i){var h="",g="",e="";if(i){g="<"+i+">";e="</"+i+">"}a.each(a.translate.getLanguages(true),function(b,c){h+=("<"+d+">"+g+b.charAt(0)+b.substring(1).toLowerCase()+e+"</"+d+">")});return a("<"+f+' class="jq-translate-ui">'+h+"</"+f+">")}})(jQuery);(function(a){a.translate.fn.progress=function(b,d){if(!this.i){this.pr=0}this.pr+=this.source[this.i].length;var c=100*this.pr/(this.rawSource.length-(11*(this.i+1)));if(b){var f=a(b);if(!this.i&&!f.hasClass("ui-progressbar")){f.progressbar(d)}f.progressbar("option","value",c)}return c}})(jQuery);(function(c){function b(e,f){return f==="input"&&!!({text:1,button:1,submit:1})[c.attr(e,"type").toLowerCase()]}function a(){}a.prototype={init:function(f,e){this.textArray=[];this.elements=[];this.options=e;this.jquery=f;this.n=-1;if(e.async===true){e.async=2}f=f.not("script, "+e.not);f=f.add(f.find("*").not("script, noscript"+e.not));if(e.not){f=f.not(c(e.not).find("*"))}this.jq=f;this.jql=this.jq.length;return this.process()},process:function(){this.n++;var j=this,f=this.options,p="",i=false,h=false,g=this.jq[this.n],l,m,k;if(this.n==this.jql){k=this.jquery.pushStack(this.elements,"nodesContainingText");f.complete.call(k,k,this.textArray);if(f.returnAll===false&&f.walk===false){return this.jquery}return k}if(!g){return this.process()}l=c(g);if(typeof f.subject==="string"){p=l.attr(f.subject)}else{var n=g.nodeName.toLowerCase();if(f.altAndVal&&n==="img"){p=l.attr("alt")}else{if(f.altAndVal&&b(g,n)){p=l.val()}else{if(n==="textarea"){p=l.val()}else{m=g.firstChild;if(f.walk!==true){h=true}else{while(m){if(m.nodeType==1){h=true;break}m=m.nextSibling}}if(!h){p=l.text()}else{if(f.walk!==true){i=true}m=g.firstChild;while(m){if(m.nodeType==3&&m.nodeValue.match(/\S/)!==null){if(m.nodeValue.match(/<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)>/)!==null){if(m.nodeValue.match(/(\S+(?=.*<))|(>(?=.*\S+))/)!==null){i=true;break}}else{i=true;break}}m=m.nextSibling}if(i){p=l.html().replace(/<script[^<]+<[^<]+>/,"");this.jq=this.jq.not(l.find("*"))}}}}}}if(!p){return this.process()}this.elements.push(g);if(f.comments===false){p=this.stripComments(p)}this.textArray.push(p);f.each.call(g,this.elements.length-1,g,p);if(f.async){setTimeout(function(){j.process()},f.async);return this.jquery}else{return this.process()}},stripComments:function(e){return e.replace(/<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)>/g,"")}};c.fn.nodesContainingText=function(e){e=c.extend({},d,c.fn.nodesContainingText.defaults,e);return new a().init(this,e)};var d={not:"",async:false,each:function(){},complete:function(){},comments:false,returnAll:true,walk:true,altAndVal:false,subject:true};c.fn.nodesContainingText.defaults=d})(jQuery);