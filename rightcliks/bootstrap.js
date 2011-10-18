/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["instant@maps.de"]

/******************************************************************/

var Cc = Components.classes;
var Ci = Components.interfaces;
Components.utils.import("resource://gre/modules/Services.jsm");

function loadIntoWindow(aWindow) {	

	for each(var x in ["config", "debug", "request", "main", "dom_handle", "init"])try{
			//Services.scriptloader.loadSubScript( 'resource://instantmaps/'+x+'.js', aWindow);
			var script = aWindow.document.createElementNS("http://www.w3.org/1999/xhtml",'html:script');
				script.src = 'resource://instantmaps/'+x+'.js';
				script.language="javascript";
				script.type="text/javascript";
				aWindow.document.documentElement.appendChild(script);
	}catch(e){Components.utils.reportError(e)}
}

function unloadFromWindow(aWindow){
	try{
		// delete all added variables and remove eventListeners
		aWindow.instantmaps_loader.uninit()
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
	onWindowTitleChange: function(aWindow, aTitle){ }
}

/**************************************************************************
 * bootstrap.js API
 *****************/
function startup(aData, aReason) {
	//set resource://instantmaps/ to contents folder
	Services.io.getProtocolHandler('resource')
		.QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution(
			'instantmaps',
			Services.io.newURI(__SCRIPT_URI_SPEC__+'/../content/', null, null)    
		)
	// Load into any existing windows
	let enumerator = Services.wm.getEnumerator("navigator:browser");
	while(enumerator.hasMoreElements()) {
		let win = enumerator.getNext();
		loadIntoWindow(win);
	}
	// Load into all new windows
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
	
	Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler)
		.setSubstitution('instantmaps',null)
}

function install(aData, aReason){
}

function uninstall(aData, aReason){
}
