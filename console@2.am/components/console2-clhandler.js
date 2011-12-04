/*const*/ var Cc = Components.classes;
/*const*/ var Ci = Components.interfaces;
/*const*/ var Cr = Components.results;

/*const*/ var Console2CommandLineHandler = {
	mCID: Components.ID("{1280606b-2510-4fe0-97ef-9b5a22eafe81}"),
	// mContractID: "@zeniko/console2-clh;1",
	mContractID: "@mozilla.org/commandlinehandler/general-startup;1?type=console2",
	mClassName: "Console² Component",
	mCategory: "c-console2",
	mCategory2: "console2 command line handler",

/* ........ nsIModule .............. */

	getClassObject: function(aCompMgr, aCID, aIID)
	{
		if (!aCID.equals(this.mCID))
		{
			throw Cr.NS_ERROR_NO_INTERFACE;
		}
		if (!aIID.equals(Ci.nsIFactory))
		{
			throw Cr.NS_ERROR_NOT_IMPLEMENTED;
		}
		
		return this.QueryInterface(aIID);
	},

	registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(this.mCID, this.mCategory, this.mContractID, aFileSpec, aLocation, aType);
		
		var catMan = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
		catMan.addCategoryEntry("command-line-handler", this.mCategory, this.mContractID, true, true);
		catMan.addCategoryEntry("command-line-argument-handlers", this.mCategory2, this.mContractID, true, true);
		catMan.addCategoryEntry("app-startup", this.mClassName, "service," + this.mContractID, true, true);
	},

	unregisterSelf: function(aCompMgr, aLocation, aType)
	{
		aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.unregisterFactoryLocation(this.mCID, aLocation);
		
		var catMan = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
		catMan.deleteCategoryEntry("command-line-handler", this.mCategory, true);
		catMan.deleteCategoryEntry("command-line-argument-handlers", this.mCategory2, true);
		catMan.deleteCategoryEntry("app-startup", "service," + this.mContractID, true);
	},

	canUnload: function(aCompMgr)
	{
		return true;
	},

/* ........ nsIFactory .............. */

	createInstance: function(aOuter, aIID)
	{
		if (aOuter != null)
		{
			throw Cr.NS_ERROR_NO_AGGREGATION;
		}
		return this.QueryInterface(aIID);
	},

	lockFactory: function(aLock) { },

/* ........ nsICommandLineHandler .............. */

	helpInfo: "	 -console2          Open the Error Console.\n",

	handle: function(aCmdLine)
	{
		if (aCmdLine.handleFlag("console2", false))
		{
			var window = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getMostRecentWindow("global:console");
			if (window)
			{
				window.focus();
			}
			else
			{
				Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher).openWindow(null, "chrome://console2/content/console2.xul", "_blank", "chrome,dialog=no,all", aCmdLine);
			}
			aCmdLine.preventDefault = true;
		}
	},

/* ........ nsICmdLineHandler .............. */

	commandLineArgument: "-console2",
	prefNameForStartup: "general.startup.jsconsole",
	chromeUrlForTask: "chrome://console2/content/console2.xul",
	helpText: "-console2  Open the Error Console.",
	handlesArgs: false,
	defaultArgs: null,
	openWindowWithArgs: false,

/* ........ nsIObserver .............. */

	observe: function(aSubject, aTopic, aData)
	{
		switch (aTopic)
		{
		case "app-startup":
			Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).addObserver(this, "browser:purge-session-history", false);
			break;
		case "browser:purge-session-history":
			var cs = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
			if (!cs.reset && !Ci.nsIConsoleService_MOZILLA_1_8_BRANCH)
			{
				for (var i = 0; i < 250; i++) // make sure to overwrite the whole buffer
				{
					cs.logStringMessage(null);
				}
			}
			break;
		}
	},

/* ........ QueryInterface .............. */

	QueryInterface: function(aIID)
	{
		if (aIID.equals(Ci.nsISupports) ||
			aIID.equals(Ci.nsIModule) ||
			aIID.equals(Ci.nsIFactory) ||
			aIID.equals(Ci.nsICommandLineHandler) ||
			aIID.equals(Ci.nsICmdLineHandler) ||
			aIID.equals(Ci.nsIObserver))
		{
			return this;
		}
		throw Components.results.NS_ERROR_NO_INTERFACE;
	}
};

function NSGetModule(aComMgr, aFileSpec)
{
	return Console2CommandLineHandler;
}
