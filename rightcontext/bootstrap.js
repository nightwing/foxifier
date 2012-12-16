/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["right@context.a.am"]

/******************************************************************/

pref = {
	name: "extensions.rightContext.itemlist",
	defVal: '#openlink,#openlinkincurrent,#openlinkintab,#searchselect,#openlinkprivate',
	
	get: function(){
		if (Services.prefs.prefHasUserValue(this.name))
			var pref=Services.prefs.getCharPref(this.name)
		else
			var pref=this.defVal
		
		return pref.replace('#', "context-", "g") + ',context_reloadTab,context_undoCloseTab'
	},
	save: function(idList) {
	
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
	/*devel__(*/
		Services.obs.notifyObservers(null, "startupcache-invalidate", null);
	/*devel__)*/
	try {
		Services.scriptloader.loadSubScript('chrome://rightContext/content/rightContext.js', aWindow);
	}catch(e){Components.utils.reportError(e)}
}

function unloadFromWindow(aWindow){
	try{
		// delete all added variables and remove eventListeners
		aWindow.rightContext.init(false)
		delete aWindow.rightContext
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
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
							.addBootstrappedManifestLocation(aData.installPath)
	// Load into any existing windows
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		try{loadIntoWindow(win)}catch(e){Components.utils.reportError(e)}
	}
	// listener for loading into all new windows
	Services.ww.registerNotification(windowWatcher)
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
	Services.ww.unregisterNotification(windowWatcher)
	
	if (Services.vc.compare(Services.appinfo.platformVersion, "10.0") < 0)  
		Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
			.removeBootstrappedManifestLocation(aData.installPath)
}

function install(aData, aReason){
}

function uninstall(aData, aReason){
}

