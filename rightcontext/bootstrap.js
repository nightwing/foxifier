/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["right@context.a.am"]

/******************************************************************/

pref = {
	name: "extensions.rightContext.itemlist",
	defVal: '#openlink,#openlinkincurrent,#openlinkintab,#searchselect',
	
	get: function(){
		if (Services.prefs.prefHasUserValue(this.name))
			var pref=Services.prefs.getCharPref(this.name)
		else
			var pref=this.defVal
		return pref.replace('#', "context-", "g")
	},
	save: function(idList){
	
		idList = idList.sort()		
		var str = idList.join(",").replace('context-', "#", "g")
		if(str != this.defVal)
			Services.prefs.setCharPref(this.name, str)
		else
			Services.prefs.clearUserPref(this.name);
	}
}


var Cc = Components.classes;
var Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/Services.jsm");

function loadIntoWindow(aWindow) {
	for each(var x in ["rightContext"])try{
			//Services.scriptloader.loadSubScript( 'resource://instantmaps/'+x+'.js', aWindow);
			var script = aWindow.document.createElementNS("http://www.w3.org/1999/xhtml",'html:script');
				script.src = 'chrome://rightContext/content/'+x+'.js';
				script.type="text/javascript;version=1.8";
				aWindow.document.documentElement.appendChild(script);
	}catch(e){Components.utils.reportError(e)}
}

function unloadFromWindow(aWindow){
	try{
		// delete all added variables and remove eventListeners
		aWindow.rightContext.init(false)
		// todo: may need to remove script elements added by loadIntoWindow
	}catch(e){Components.utils.reportError(e)}
}

WindowListener={
	onOpenWindow: function(aWindow){
		// Wait for the window to finish loading
		// see https://bugzilla.mozilla.org/show_bug.cgi?id=670235 for Ci.nsIDOMWindowInternal||Ci.nsIDOMWindow
		aWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal||Ci.nsIDOMWindow).window;
		aWindow.addEventListener("load", function() {
			if(aWindow.location.href != 'chrome://browser/content/browser.xul')
				return
			aWindow.removeEventListener("load", arguments.callee, false);
				loadIntoWindow(aWindow)
		}, false);
	},
	onCloseWindow: function(aWindow){ },
	onWindowTitleChange: function(aWindow, aTitle){ },
	forEach: function(func){
		let enumerator = Services.wm.getEnumerator("navigator:browser");
		while(enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
			try{func(win)}catch(e){Components.utils.reportError(e)}
		}		
	}
}




/**************************************************************************
 * bootstrap.js API
 *****************/
function startup(aData, aReason) {
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
							.addBootstrappedManifestLocation(aData.installPath)
	// Load into any existing windows
	WindowListener.forEach(loadIntoWindow)	
	// listener for loading into all new windows
	Services.wm.addListener(WindowListener);
}

function shutdown(aData, aReason) {
	// no need to cleanup, everything goes to die anyway
	if (aReason == APP_SHUTDOWN)
		return;

	// Unload from any existing windows
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		unloadFromWindow(win);
	}
	Services.wm.removeListener(WindowListener);
	
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
			.removeBootstrappedManifestLocation(aData.installPath)
}

function install(aData, aReason){
}

function uninstall(aData, aReason){
}

