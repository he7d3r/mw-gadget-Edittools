/**
 * Allow customization of edittools
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 * @author: [[wikt:en:User:Conrad.Irwin]]
 * @source: [[wikt:en:User:Conrad.Irwin/edittools.js]] and [[wikt:en:MediaWiki:Commons.js]] (cookies)
 */
/*jshint browser: true, devel: true, camelcase: true, curly: true, eqeqeq: true, immed: true, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: true, undef: true, unused: true, strict: true, trailing: true, maxlen: 120, evil: true, onevar: true */
/*global jQuery, mediaWiki, sajax_init_object, escape, unescape */
( function ( mw, $ ) {
'use strict';


function setCookie(cookieName, cookieValue) {
 var today = new Date(),
     expire = new Date(),
     nDays = 30;
 expire.setTime( today.getTime() + (3600000 * 24 * nDays) );
 document.cookie = cookieName + '=' + escape(cookieValue) +
                 ';path=/w' +
                 ';expires='+expire.toGMTString();
 document.cookie = cookieName + '=' + escape(cookieValue) +
                 ';path=/wiki' +
                 ';expires='+expire.toGMTString();
}

function getCookie(cookieName) {
  var len, end,
      start = document.cookie.indexOf( cookieName + '=' );
  if ( start === -1 ) {return '';}
  len = start + cookieName.length + 1;
  if ( ( !start ) &&
    ( cookieName !== document.cookie.substring( 0, cookieName.length ) ) )
      {
        return '';
      }
  end = document.cookie.indexOf( ';', len );
  if ( end === -1 ) {end = document.cookie.length;}
  return unescape( document.cookie.substring( len, end ) );
}
/*
function deleteCookie(cookieName) {
  if ( getCookie(cookieName) ) {
    document.cookie = cookieName + '=' + ';path=/w' +
    ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
    document.cookie = cookieName + '=' + ';path=/wiki' +
    ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
  }
}
*/

/**
 * startAjaxGet starts an XmlHttpRequest call on mediawiki.
 *  should be in a library somewhere
**/
function startAjaxGet(url,onsuccess,argument){
    /*jshint camelcase: false */
    var req = sajax_init_object(); /* FIXME */
    /*jshint camelcase: true */
    if(!req) {return false;}
    req.onreadystatechange=function(){
        if( req.readyState === 4 ){
            if( req.status === 200 ) {
                if($.isFunction(onsuccess)){ onsuccess(req.responseText,argument); }
            }
        }
    };
    req.open('GET',url);
    req.send(''); //the '' is required for firefox 3b2
    return true;
}
/**
 * extractText(node) is a W3C DOM compliant cross-browser way of
 *  saying (node.innerText) though it may well be slower (no benchmarking)
**/
/*
function extractText(el){
    var i, nod, output='';
    for( i=0;i<el.childNodes.length;i++ ){
        nod=el.childNodes[i];
        if( nod.nodeName.toUpperCase()==='#TEXT' ){
            output+=nod.nodeValue;
        }else if(nod.nodeName.indexOf('#')!==0){
            output+=extractText(nod);
        }
    }
    return output;
}
*/
/**
 * Faz com que as fórmulas em LaTeX sejam clicáveis
**/
function wetLaTeX(el){
	var imgs, prox, div, math, lab, tag, c, onClick, i;
	imgs = el.getElementsByTagName('img');
	if(imgs.length>0){
		prox = document.getElementById('edittools-select');
		if (prox){
			prox = prox.nextSibling;
			div = prox.parentNode;
			math = document.createElement('input');
			math.type = 'checkbox';
			math.id = 'edittools-math';
			math.name = 'edittools-math';
			div.insertBefore(math, prox);

			lab = document.createElement('label');
			lab.innerHTML = 'Incluir <tt>&lt;math&gt;&lt;/math&gt;</tt> em volta das fórmulas.<br />';
			lab.setAttribute('for','edittools-math');
			div.insertBefore(lab, prox);
		}
	}
	onClick = function() {
		var m0, m1;
		tag = this.alt.split('\\Box', 2);
		c = document.getElementById('edittools-math');
		m0 = ''; m1 = '';
		if (c && c.checked) {
			m0 = '<math>';
			m1 = '</math>';
		}
		if (1 < tag.length){
			mw.toolbar.insertTags(m0 + tag[0], tag[1] + m1, 'X');}
		else if (tag.length === 1){
			mw.toolbar.insertTags(m0 + tag[0] + m1,'', '');}
		else{
			mw.toolbar.insertTags(m0 + '\\Box' + m1, '', '');}
		return false;
	};
	for (i=0; i<imgs.length; i++){
		if (!$( imgs[i] ).hasClass('tex')) {continue;}
		imgs[i].onclick = onClick;
	}
}

var wet = {}; // Wiktionary Edit Tools global object
/**
 * wetInit starts the process of sorting the edittools, should be called every
 *  page load.
**/
function wetInit(){
    var i, p;
    //Check we are in edit mode
    wet.div=document.getElementById('editpage-specialchars');
    if(!wet.div){return false;}
    //Set everything up for us
    wet.sel=document.createElement('select');
    wet.ps={};wet.os={};wet.fp=0;
    // Get any user edittools section
    startAjaxGet(
        mw.config.get( 'wgScript' ) +
		'?title=User:'+encodeURIComponent( mw.config.get( 'wgUserName' ) ) +
		'/edittools&action=render',
        wetUserAjax
    );
    //Parse the stuff we already have
    for(i=0;i<wet.div.childNodes.length;i++){
        p = wet.div.childNodes[i];
        if(p.nodeName.toUpperCase()==='P'){
            if(p.getAttribute('id')){
                wetAddOption(p);
            }
        }
    }
    //Insert select.
    wet.div.insertBefore(wet.sel,wet.div.childNodes[0]);
    wet.sel.setAttribute('id','edittools-select');
    try{
        wet.sel.addEventListener('change',function(){wetSelectSet();},false);
    }catch(e){
        wet.sel.attachEvent('onchange',function(){wetSelectSet();});
    }
    wetSelectFirst();
}
function wetUserAjax(resText){
    var div, i, p;
    if(resText.indexOf('class="noarticletext"')>-1) {return wetSelectFirst();}

    div=document.createElement('div');
    wet.div.appendChild(div);
    div.style.display='inline';
    div.innerHTML=resText;
    //Add the stuff we don't have.
    for(i=0;i<div.childNodes.length;i++){
        p = div.childNodes[i];
        if(p.nodeName.toUpperCase()==='P'){
            if(p.getAttribute('id')){
                wetAddOption(p,true);
            }
        }
    }
    wetLaTeX(div);
    wetSelectFirst();
}
function wetGetsetAjax(resText,which){
    try{
        wet.ps[which].innerHTML+=resText.replace(/<\/?p[^>]*>/g,'');
        var cn = wet.ps[which].className;
        cn=cn.replace(/( +)?delayload( +)?/g,'');
        wet.ps[which].className=cn;
    }catch(e){
        alert('[[Mediawiki:Edittools/'+which+']] contains illegal elements (<span>s only!)');
    }
}
function wetAddOption(p,before){
    var nme=p.getAttribute('id'), opt;
    p.style.cssText='display:none';

    opt=document.createElement('option');
    opt.setAttribute('value',nme);
    opt.appendChild(document.createTextNode(decodeURIComponent(nme.replace(/.([0-9A-F]{2})/g,'%$1')).replace('_',' ')));

    if(before){
        wet.sel.insertBefore(opt,wet.sel.childNodes[wet.fp]);
        wet.fp+=1;
    }else{
        wet.sel.appendChild(opt);
    }
    wet.ps[nme]=p;
}
function wetSelectSet(index){
    var which;
    if(typeof(index)==='undefined'&&wet.sel.selectedIndex>-1){
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
        which=wet.sel.options[wet.currentIndex].getAttribute('value');
        wet.ps[which].style.cssText='display:inline';
        if(wet.ps[which].className.indexOf('delayload')>=0){
            startAjaxGet(
                mw.config.get('wgScript')+'?title=Mediawiki:Edittools/'+
			which.replace(/.([0-9A-F]{2})/g,'%$1')+
			'&action=render',
                wetGetsetAjax,
		which
           );
        }
    }
}
wet.done=0;
function wetSelectFirst(){
    var index;
    wet.done+=1;
    if(wet.done<2){return false;}
    index=parseInt(getCookie('edittoolscharsubset'),10);
    if(isNaN(index)){index=0;}
    wetSelectSet(index);
}
if ( mw.config.get( 'wgAction' ) === 'edit' ){
    mw.loader.using( 'mediawiki.action.edit', function(){
        $(wetInit);
    } );
}
window.addCharSubsetMenu = function () {return false;};//Turn off current edittools

}( mediaWiki, jQuery ) );