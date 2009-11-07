function setCookie(cookieName, cookieValue) {
 var today = new Date();
 var expire = new Date();
 var nDays = 30;
 expire.setTime( today.getTime() + (3600000 * 24 * nDays) );
 document.cookie = cookieName + "=" + escape(cookieValue)
                 + ";path=/w"
                 + ";expires="+expire.toGMTString();
 document.cookie = cookieName + "=" + escape(cookieValue)
                 + ";path=/wiki"
                 + ";expires="+expire.toGMTString();
}

function getCookie(cookieName) {
  var start = document.cookie.indexOf( cookieName + "=" );
  if ( start == -1 ) return "";
  var len = start + cookieName.length + 1;
  if ( ( !start ) &&
    ( cookieName != document.cookie.substring( 0, cookieName.length ) ) )
      {
        return "";
      }
  var end = document.cookie.indexOf( ";", len );
  if ( end == -1 ) end = document.cookie.length;
  return unescape( document.cookie.substring( len, end ) );
}

function deleteCookie(cookieName) {
  if ( getCookie(cookieName) ) {
    document.cookie = cookieName + "=" + ";path=/w" +
    ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
    document.cookie = cookieName + "=" + ";path=/wiki" +
    ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
  }
}


/**
 * startAjaxGet starts an XmlHttpRequest call on mediawiki.
 *  should be in a library somewhere
**/
function startAjaxGet(url,onsuccess,argument){
    var req = sajax_init_object();
    if(!req) return false;
    req.onreadystatechange=function(){
        if( req.readyState == 4 )
            if( req.status == 200 )
                if(typeof(onsuccess)=='function')onsuccess(req.responseText,argument);
    }
    req.open("GET",url);
    req.send(''); //the '' is required for firefox 3b2
    return true;    
}
/**
 * extractText(node) is a W3C DOM compliant cross-browser way of
 *  saying (node.innerText) though it may well be slower (no benchmarking)
**/
function extractText(el){
    var output="";
    for( var i=0;i<el.childNodes.length;i++ ){
        var nod=el.childNodes[i];
        if( nod.nodeName.toUpperCase()=='#TEXT' ){
            output+=nod.nodeValue;
        }else if(nod.nodeName.indexOf('#')!=0){
            output+=extractText(nod);
        }
    }
    return output;
}
var wet = {}; //Wiktionary Edit Tools global object
/**
 * wet_init starts the process of sorting the edittools, should be called every
 *  page load.
**/
function wet_init(){
    //Check we are in edit mode
    wet.div=document.getElementById('editpage-specialchars');
    if(!wet.div)return false;
    //Set everything up for us
    wet.sel=document.createElement('select');
    wet.ps={};wet.os={};wet.fp=0;
    //Get any user edittools section
    startAjaxGet(
        wgScript+'?title=User:'+encodeURIComponent(wgUserName)+'/edittools&action=render',
        wet_user_ajax
    );
    //Parse the stuff we already have
    for(var i=0;i<wet.div.childNodes.length;i++){
        var p = wet.div.childNodes[i];
        if(p.nodeName.toUpperCase()=='P'){
            if(p.getAttribute('id')){
                wet_add_option(p);
            }
        }
    }
    //Insert select.
    wet.div.insertBefore(wet.sel,wet.div.childNodes[0]);
    wet.sel.setAttribute('id','edittools-select');
    try{
        wet.sel.addEventListener('change',function(){wet_select_set()},false);
    }catch(e){
        wet.sel.attachEvent('onchange',function(){wet_select_set()});
    }
    wet_select_first()
}
function wet_user_ajax(resText){
    if(resText.indexOf('class="noarticletext"')>-1) return wet_select_first();

    var div=document.createElement('div');
    wet.div.appendChild(div);
    div.style.display="inline";
    div.innerHTML=resText;
    //Add the stuff we don't have.
    for(var i=0;i<div.childNodes.length;i++){
        var p = div.childNodes[i];
        if(p.nodeName.toUpperCase()=='P'){
            if(p.getAttribute('id')){
                wet_add_option(p,true);
            }
        }
    }
    wet_select_first()
}
function wet_getset_ajax(resText,which){
    try{
        wet.ps[which].innerHTML+=resText.replace(/<\/?p[^>]*>/g,'');
        var cn = wet.ps[which].className;
        cn=cn.replace(/( +)?delayload( +)?/g,'');
        wet.ps[which].className=cn;
    }catch(e){
        alert("[[Mediawiki:Edittools/"+which+"]] contains illegal elements (<span>s only!)");
    }
}
function wet_add_option(p,before){
    var nme=p.getAttribute('id');
    p.style.cssText='display:none';

    var opt=document.createElement('option');
    opt.setAttribute('value',nme);
    opt.appendChild(document.createTextNode(decodeURIComponent(nme.replace(/.([0-9A-F]{2})/g,"%$1")).replace('_',' ')));

    if(before){
        wet.sel.insertBefore(opt,wet.sel.childNodes[wet.fp]);
        wet.fp+=1;
    }else{
        wet.sel.appendChild(opt);
    }
    wet.ps[nme]=p;
}
function wet_select_set(index){
    if(typeof(index)=='undefined'&&wet.sel.selectedIndex>-1){
        index=wet.sel.selectedIndex;
    }
    if(index>-1&&wet.sel.options[index]){
        if(wet.currentIndex>-1&&wet.sel.options[wet.currentIndex]){
            wet.ps[
             wet.sel.options[wet.currentIndex].getAttribute('value')
            ].style.cssText='display: none';
        }
        wet.currentIndex=index;
        wet.sel.options[index].selected=true;
        setCookie('edittoolscharsubset',wet.currentIndex);
        var which=wet.sel.options[wet.currentIndex].getAttribute('value');
        wet.ps[which].style.cssText='display:inline';
        if(wet.ps[which].className.indexOf('delayload')>=0){
            startAjaxGet(
                wgScript+'?title=Mediawiki:Edittools/'+which.replace(/.([0-9A-F]{2})/g,"%$1")+'&action=render',
                wet_getset_ajax,which
           )
        }
    }
}
wet.done=0;
function wet_select_first(){
    wet.done+=1;
    if(wet.done<2)return false;
    var index=parseInt(getCookie('edittoolscharsubset'));
    if(isNaN(index))index=0;
    wet_select_set(index);
}
addOnloadHook(wet_init);
function addCharSubsetMenu() {return false;}//Turn off current edittools