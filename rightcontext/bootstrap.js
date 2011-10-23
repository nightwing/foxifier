/** use this code in console to access global for this file

var XPIProviderBP = Components.utils.import("resource://gre/modules/XPIProvider.jsm")
XPIProviderBP.XPIProvider.bootstrapScopes["instant@maps.de"]

/******************************************************************/

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
	onWindowTitleChange: function(aWindow, aTitle){ }
}

/**************************************************************************
 * bootstrap.js API
 *****************/
function startup(aData, aReason) {
	AddManifestLocation(aData.installPath)
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
	
	removeManifestLocation(aData.installPath)
}

function install(aData, aReason){
}

function uninstall(aData, aReason){
}


/******************************************************************/
AddManifestLocation = function(file){
	Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
	if(Components.manager.addBootstrappedManifestLocation){
		Components.manager.addBootstrappedManifestLocation(file)
		return
	}
	if(file.path.substr(-4) == ".xpi")
		AddJarManifestLocation(file.path)
	else
		Components.manager.autoRegister(file)
}
removeManifestLocation = function(file){
	Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
	if(Components.manager.removeBootstrappedManifestLocation){
		Components.manager.removeBootstrappedManifestLocation(file)
		return
	}	
}
function AddJarManifestLocation(path) {
	Components.utils.import("resource://gre/modules/ctypes.jsm");
	var file = Cc["@mozilla.org/file/directory_service;1"]
				.getService(Ci.nsIProperties)
				.get("XCurProcD", Ci.nsIFile);
	file.append(ctypes.libraryName("xul"));
	var libxul = ctypes.open(file.path);
  
	// we need to explicitly allocate a type for the buffer we'll need to hold
	// the path in :(
	var bufLen = path.length + 2;
	var PathBuffer_t = ctypes.StructType("PathBuffer",
										[{buf: ctypes.jschar.array(bufLen)}])
	var nsString_t = ctypes.StructType("nsAString",
										[{mData:   PathBuffer_t.ptr}
										,{mLength: ctypes.uint32_t}
										,{mFlags:  ctypes.uint32_t}])
	var PRBool_t = ctypes.uint32_t; // yay NSPR
	var nsILocalFile_t = ctypes.StructType("nsILocalFile").ptr;

	var NS_NewLocalFile = libxul.declare("NS_NewLocalFile_P",
                   ctypes.default_abi,
                   ctypes.uint32_t,         // nsresult return
                   nsString_t.ptr,          // const nsAString &path
                   PRBool_t,                // PRBool followLinks
                   nsILocalFile_t.ptr       // nsILocalFile* *result
	);
	var XRE_AddJarManifestLocation = libxul.declare("XRE_AddJarManifestLocation",
                   ctypes.default_abi,
                   ctypes.uint32_t,         // nsresult return
                   ctypes.int32_t,          // NSLocationType aType
                   nsILocalFile_t           // nsILocalFile* aLocation
	);
	var pathBuffer = new PathBuffer_t;
	pathBuffer.buf = path + '\0';
	var manifest = new nsString_t;
	manifest.mData = pathBuffer.address();
	manifest.mLength = path.length;
	manifest.mFlags = 1 << 4; // F_FIXED
	var manifestPtr = manifest.address();
  
	try {
		var rv;
		var localFile = new nsILocalFile_t;
		rv = NS_NewLocalFile(manifest.address(), false, localFile.address());
		if (rv & 0x80000000) {
			throw Components.Exception("NS_NewLocalFile error", rv);
		}
		const NS_SKIN_LOCATION = 1;
		rv = XRE_AddJarManifestLocation(NS_SKIN_LOCATION, localFile);
		if (rv & 0x80000000) {
			throw Components.Exception("XRE_AddJarManifestLocation error", rv);
		}
	} finally {
		libxul.close();
	}
}

