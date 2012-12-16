var xml =
	"<panel id='load-control-panel' type='arrow' orient='vertical' onclick='CombinedStopReload.panelClick(event)' context='toolbar-context-menu'>\
		<hbox>\
			<groupbox>\
				<caption><button action='s-this'  label='stop'/></caption>\
				<toolbarbutton action='s-other'   style='-moz-box-pack:start'>other tabs</toolbarbutton>\
				<toolbarbutton action='s-all'     style='-moz-box-pack:start'>all tabs</toolbarbutton>\
				<toolbarbutton action='f-this'    style='-moz-box-pack:start'>freeze tab</toolbarbutton>\
			</groupbox>\
			<groupbox>\
				<caption><button action='r-this'  label='reload'/></caption>\
				<toolbarbutton action='r-broken'  style='-moz-box-pack:end' image='chrome://global/skin/icons/warning-16.png'>broken tabs</toolbarbutton>\
				<toolbarbutton action='r-other'   style='-moz-box-pack:end'>other tabs</toolbarbutton>\
				<toolbarbutton action='r-stopped' style='-moz-box-pack:end'>stopped tabs</toolbarbutton>\
			</groupbox>\
		</hbox>\
		<hbox>\
			<toolbarbutton action='disableJS' label='allowJavascript' flex='1' type='checkbox'/>\
			<toolbarbutton action='r-memory'  label='reload from memory'  flex='1'/>\
		</hbox>\
	</panel>".replace(/>\s*</g,'><')

appendXML = function(document){
	var mainPopupSet = document.getElementById("mainPopupSet")
	var range = document.createRange()
	range.selectNode(mainPopupSet)
	range.collapse(true)
	var popup = range.createContextualFragment(xml)

	mainPopupSet.appendChild(popup)
}

/******************************************************************/

var Cc = Components.classes;
var Ci = Components.interfaces;
//Components.utils.import("resource://gre/modules/Services.jsm");

function modifyCombinedStopReload(window){with(window){
	CombinedStopReload.switchToStop = function(){
		this.reload.setAttribute("displaystop", "true");
	}
	CombinedStopReload.switchToReload = function(){
		this.reload.removeAttribute("displaystop");
	}
	
	CombinedStopReload.buttonClick = function(event){
		var reloadFlags, button=event.button
		if(button==2){
			var p=document.getElementById("load-control-panel")
			document.getElementsByAttribute('action','disableJS')[0].checked = 
				gBrowser.mCurrentBrowser.webNavigation.allowJavascript
			p.enableRollup(false)
			p.openPopup(event.target,'after_start',0,0,false,true)
		}else if(XULBrowserWindow.isBusy){
			BrowserStop()
		}else{
			if(event.ctrlKey && button==0)
				reloadFlags =  nsIWebNavigation.LOAD_FLAGS_BYPASS_PROXY | nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE;
			else if(event.shiftKey&&button==0 || button==1)
				reloadFlags = nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE
			else if(button==0){
				if(gURLBar.getAttribute("pageproxystate")=='invalid'&&gURLBar.value){
					gURLBar.handleCommand(event)
					return
				}
				reloadFlags = nsIWebNavigation.LOAD_FLAGS_NONE;			
			}
			BrowserReloadWithFlags(reloadFlags);
		}
	}
	CombinedStopReload.panelClick = function(event){
		if(event.button==2)
			return
		switch(event.target.getAttribute('action')){
			case "s-all": 
				iterateBrowsers(function(i){
					i.webNavigation.stop(nsIWebNavigation.STOP_ALL);return true;
				}, 'stop');
				break
			case "s-other": 
				var cb=gBrowser.mCurrentBrowser
				iterateBrowsers(function(i){
					if(i!=cb)i.webNavigation.stop(nsIWebNavigation.STOP_ALL);
				}, 'stop');
				break
			case "f-this":
				gBrowser.mCurrentBrowser.webNavigation.allowJavascript = false
				document.getElementsByAttribute('action','disableJS')[0].checked = false
				// fallthrough 
			case "s-this":  BrowserStop();break			
			case "r-this":  BrowserReload();break			
			case "r-all": 
				iterateBrowsers(function(i){
					i.reload();return true
				}, 'reload');
				break
			case "r-other":
				var cb=gBrowser.mCurrentBrowser
				iterateBrowsers(function(i){
					if(i!=cb){i.reload();return true}
				}, 'reload');
				break
			case "r-broken": 
				iterateBrowsers(function(i){
					if(/about:neterror/.test(i.contentDocument.baseURI)){i.reload();return true}
				}, 'reload');
				break
			case "r-stopped": 
				iterateBrowsers(function(i){
					if(i.contentDocument.readyState=='loading'){i.reload();return true}
				}, 'reload');
				break			
			case "disableJS": 
				var webnav=gBrowser.mCurrentBrowser.webNavigation
				webnav.allowJavascript=!webnav.allowJavascript
				break
			case "r-memory": gBrowser.mCurrentBrowser.reloadWithFlags(nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE);break
		}
	}
	
	function iterateBrowsers(action, actionName){
		var brs=gBrowser.browsers
		var tbs=gBrowser.tabs
		var count=0
		for(var i in brs){
			var br=brs[i],tb=tbs[i]
			if(!tb.hidden){
				action(br)&&(count++)
			}
		}
		sayCount(count, actionName)
	}	
	function sayCount(count, actionName){
		//document.getElementById("load-control-panel").setAttribute('noautohide',true)
		var panel = document.getElementById("load-control-panel") 
		var lab = panel.getElementsByTagName('label')[0] || panel.appendChild(
			document.createElement('label')
		)
		lab.style.MozTransition='opacity 500ms ease-out 0ms'
		lab.style.opacity=1
		setTimeout(function(){
			lab.style.MozTransition='opacity 700ms ease-out 0ms'
			lab.style.opacity=0
		},1000)

		lab.value=count+' tabs '+ actionName +'ed'

		lab.style.cssText="height:0px;padding:0px;text-align:center;pointer-events:none;-moz-transform:translatey(-2px);"
	}	
	
	/**************/
	//CombinedStopReload._init = CombinedStopReload.init
	CombinedStopReload.init = function () {
		if (this._initialized)
			return;

		var urlbar = document.getElementById("urlbar-container");
		var reload = document.getElementById("reload-button");
		var stop = document.getElementById("stop-button");

		if (urlbar) {
			if (urlbar.parentNode.getAttribute("mode") != "icons" ||
					!reload || urlbar.nextSibling != reload ||
					!stop || reload.nextSibling != stop)
				urlbar.removeAttribute("combined");
			else {
				urlbar.setAttribute("combined", "true");
				reload = document.getElementById("urlbar-reload-button");
				stop = document.getElementById("urlbar-stop-button");
			}
		}
		if (!stop || !reload || reload.nextSibling != stop){
			this.reload = reload;
			this.stop = stop;
			this['someUsersWantUncombinedButtonsToGive5Stars:(']()
		}else{
			this.reload = reload;
			this.stop = stop;
			if (XULBrowserWindow.stopCommand.getAttribute("disabled") != "true")
				reload.setAttribute("displaystop", "true");
			this.loadControlHook()
		}

		this._initialized = true;
		appendXML(window.document)
	}
	CombinedStopReload.loadControlHook = function(){
		/*****/
		var button = this.reload
		button.removeAttribute('command');
		button.removeAttribute('oncommand')
		button.setAttribute('onclick','CombinedStopReload.buttonClick(event)')
		if(!button.hasAttribute('oldtooltiptext'))
			button.setAttribute('oldtooltiptext', button.getAttribute('tooltiptext'))
		button.setAttribute('tooltiptext','shift+leftClick/middleClick: relod from memory\ncontrol+leftClick: bypass cache')
		button.setAttribute('context','load-control-panel')
		button.disabled=false

		var button = this.stop 
		button.removeAttribute('command');
		button.removeAttribute('oncommand')
		button.setAttribute('onclick','CombinedStopReload.buttonClick(event)')
		//button.setAttribute('tooltiptext','')
		button.setAttribute('context','load-control-panel')
		button.disabled=false
		/*****/
		window.XULBrowserWindow.stopCommand.removeAttribute("disabled");
		/*****/
		if(!this.switchToReload){
			this.switchToStop = this._switchToStop 
			this.switchToReload = this._switchToReload
			delete this._switchToStop
			delete this._switchToReload
		}
	}
	CombinedStopReload.uninit = function () {
		if (!this._initialized)
		  return;
		this._initialized = false;
		var panel=window.document.getElementById('load-control-panel')
		panel && panel.parentNode.removeChild(panel)
	}
	//
	CombinedStopReload['someUsersWantUncombinedButtonsToGive5Stars:('] = function(){
		var fakeRClick = 'CombinedStopReload.buttonClick({button:2,target:this})'
		var button = this.stop || {__noSuchMethod__:dump}
		button.setAttribute('command', 'Browser:Stop');
		button.removeAttribute('onclick')
		button.setAttribute('context','load-control-panel')
		button.setAttribute('oncontextmenu', fakeRClick)
		button.disabled=false

		var button = this.reload || {__noSuchMethod__:dump}
		button.setAttribute('command', "Browser:ReloadOrDuplicate");
		button.setAttribute('onclick','checkForMiddleClick(this, event);')
		if(	button.hasAttribute('oldtooltiptext')){
			button.setAttribute('tooltiptext', button.getAttribute('oldtooltiptext'))
			button.removeAttribute('oldtooltiptext')
		}
		button.setAttribute('context','load-control-panel')
		button.setAttribute('oncontextmenu', fakeRClick)
		button.disabled=false


		//XULBrowserWindow.stopCommand.setAttribute("disabled", !button.hasAttribute("displaystop") );
		this.reload.removeAttribute("displaystop");
		CombinedStopReload.__noSuchMethod__ = function(){}
		if(this.switchToReload){
			this._switchToStop = this.switchToStop 
			this._switchToReload = this.switchToReload
			delete this.switchToStop
			delete this.switchToReload
		}
	}
}}

function loadIntoWindow(window) {
	try{
		var csr = window.CombinedStopReload
		if(csr._initialized)
			csr.uninit()
		modifyCombinedStopReload(window)
		csr.init()
	}catch(e){Components.utils.reportError(e)}
}


function unloadFromWindow(mWindow){
	try{
		Cc["@mozilla.org/moz/jssubscript-loader;1"].createInstance(Ci.mozIJSSubScriptLoader)
				.loadSubScript( __SCRIPT_URI_SPEC__+'/../cleanup.js', mWindow);
	}catch(e){Components.utils.reportError(e)}
}

function windowWatcher(win, topic) {
	if (topic == "domwindowopened") {
		win.addEventListener("load", function() {
			win.removeEventListener("load", arguments.callee, false);
			if (win.location.href == 'chrome://browser/content/browser.xul')
				loadIntoWindow(win)
		}, false);
	}
}

/**************************************************************************
 * bootstrap.js API
 *****************/
function startup(aData, aReason) {
	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

	// Load into any existing windows
	let enumerator = wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		loadIntoWindow(win);
	}
	// Load into all new windows
	Services.ww.registerNotification(windowWatcher)
}

function shutdown(aData, aReason) {	
	if (aReason == APP_SHUTDOWN)
		return;
		
	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);	
	// Unload from any existing windows
	let enumerator = wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		unloadFromWindow(win);
	}
	Services.ww.unregisterNotification(windowWatcher)
}

function install(aData, aReason){
}

function uninstall(aData, aReason){
}


