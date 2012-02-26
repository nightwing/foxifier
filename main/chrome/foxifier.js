var TabHistory ={// copies history from one tab to another, via tab.browser.sessionHistory
	copyHistory : function(fromTab, newTab){
		var fromHistory = gBrowser.getBrowserForTab(fromTab).sessionHistory;
		var toHistory = gBrowser.getBrowserForTab(newTab).sessionHistory;
		// needed to use addEntry
		toHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

		// toHistory.count && toHistory.PurgeHistory(toHistory.count);
		// copy oldHistory entries to newHistory, simulating a continued session
		for(var i = 0; i < (fromHistory.index + 1); ++i){
			toHistory.addEntry(fromHistory.getEntryAtIndex(i, false), true);
		}
	},
	init: function(){
		// when left-click opens new windows in tabs (TabMix doesn't need this)
		// Note: this calls addTab, but with a blank tab, which is kind of a pain in the ass.
		eval('nsBrowserAccess.prototype.openURI='+
			nsBrowserAccess.prototype.openURI.toString().replace(/(var newTab.*;)/,
				'$1\nTabHistory.copyHistory(gBrowser.selectedTab, newTab);'));
		// rewrite addTab to add history
		// Note: the (0 == sessionHistory.count) is to not execute copyHistory if the
		// previous eval statement was called, because it's already been executed.
		var tabbrowser = document.getElementById("content");
		eval('tabbrowser.addTab='+ tabbrowser.addTab.toString().replace(/(return t;)/,
			"if((0==b.sessionHistory.count)&&(aRelatedToCurrent||aReferrerURI))TabHistory.copyHistory(this.selectedTab, t);\n $1"));
	}
};

FullZoom.onLocationChange = function FullZoom_onLocationChange(aURI, aIsTabSwitch, aBrowser) {
	if (!aBrowser || aBrowser.zoomIsModified)
		return
    if (!aURI || aIsTabSwitch) {
		if (!this.button)
			this.button = document.getElementById("zoomb")
		var browser = aBrowser || gBrowser.selectedBrowser;
		var markupDocumentViewer = browser.markupDocumentViewer;
		this.button.label = markupDocumentViewer.fullZoom
		return;
    }
    if (aURI.spec == "about:blank") {
        this._applyPrefToSetting(undefined, aBrowser);
        return;
    }
    var browser = aBrowser || gBrowser.selectedBrowser;
    if (!aIsTabSwitch && browser.contentDocument.mozSyntheticDocument) {
        ZoomManager.setZoomForBrowser(browser, 1);
        return;
    }
    var markupDocumentViewer = browser.markupDocumentViewer;

	markupDocumentViewer.textZoom = this._tzoom;
	markupDocumentViewer.fullZoom = this._fzoom;
	aBrowser.zoomIsModified = true
}
FullZoom._fzoom=1.2
FullZoom._tzoom=1
zoommy = {
	attachTopup:function(p){
		var s = p.querySelectorAll("scale")
		this.s1=s[0]
		this.s2=s[1]
		var t = p.querySelectorAll("textbox")
		this.t1=t[0]
		this.t2=t[1]

		this.attachTopup = this.attachTopup_
		this.attachTopup_()
	},
	attachTopup_:function(p){
		this.t1.value=20
		this.t2.value=20

		this.s1.value=100-20
		this.s2.value=100-20
	},
	onchange:function(e){
		var t = e.target
		var val = t.value

		if(t==this.t1){
			this.s1.value=100-val
		}else if(t==this.s1){
			this.t1.value=100-val
		}else if(t==this.t2){
			this.s2.value=100-val
		}else if(t==this.s2){
			this.t2.value=100-val
		}
	},
	schedule: function(){

	}
}

//addonManager In window

XULBrowserWindow.inContentWhitelist=[]
BrowserOpenAddonsMgr=function(){toOpenWindowByURI("about:addons")}

toOpenWindowByURI=function(uri){
    var winEnum = Services.wm.getEnumerator("");
    while (winEnum.hasMoreElements()) {
        let win = winEnum.getNext();
        if (win.closed || win == window) {
            continue;
        }
        if (win.location.href==uri) {
            win.focus()
            return true;
        }
    }
    window.open(uri, "_blank", "chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar");

}

// disable haveSetDesktopBackground
nsContextMenu.prototype.initViewItems = function() {
    // View source is always OK, unless in directory listing.
    this.showItem("context-viewpartialsource-selection",
                  this.isContentSelected);
    this.showItem("context-viewpartialsource-mathml",
                  this.onMathML && !this.isContentSelected);

    var shouldShow = !(this.isContentSelected ||
                       this.onImage || this.onCanvas ||
                       this.onVideo || this.onAudio ||
                       this.onLink || this.onTextInput);
    this.showItem("context-viewsource", shouldShow);
    this.showItem("context-viewinfo", shouldShow);

    this.showItem("context-sep-viewsource", shouldShow);

    // Reload image depends on an image that's not fully loaded
    this.showItem("context-reloadimage", (this.onImage && !this.onCompletedImage));

    // View image depends on having an image that's not standalone
    // (or is in a frame), or a canvas.
    this.showItem("context-viewimage", (this.onImage &&
                  (!this.onStandaloneImage || this.inFrame)) || this.onCanvas);

    this.showItem("context-viewvideo", this.onVideo);
    this.setItemAttr("context-viewvideo",  "disabled", !this.mediaURL);

    // View background image depends on whether there is one.
    this.showItem("context-viewbgimage", shouldShow && !this._hasMultipleBGImages);
    this.showItem("context-sep-viewbgimage", shouldShow && !this._hasMultipleBGImages);
    document.getElementById("context-viewbgimage")
            .disabled = !this.hasBGImage;

    this.showItem("context-viewimageinfo", this.onImage);
}



/***************************************************************************
 *   status 4 evar
 */
XULBrowserWindow.setOverLink=function (url) {
    this.overLink = url//url.replace(/[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]/g, encodeURIComponent);
	this.newColor = gBrowser.currentURI.spec.replace(/\/?#.*?$/,'') == url.replace(/\/?#.*?$/,'') ? 'green' : ''
    this.updateStatusField();
}

XULBrowserWindow.updateStatusField = function () {
    var text, type, types = ["overLink","status","jsStatus", "jsDefaultStatus", "defaultStatus"];
    for (let i = 0; !text && i < types.length; i++) {
        type = types[i];
        text = this[type];
    }
    if (this.statusText != text) {
        let field = this.statusTextField;
        //field.setAttribute("previoustype", field.getAttribute("type"));
        field.setAttribute("type", type);
        field.value= text;
        field.setAttribute("crop", type == "overLink" ? "center" : "end");
        this.statusText = text;		
		if(this.statusColor != (type == "overLink"?this.newColor:'')){
			field.style.color = this.newColor
		}
    }
}

XULBrowserWindow.onProgressChange = function (aWebProgress, aRequest,
		aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
    if (aMaxTotalProgress > 0 && this._busyUI){
		let percentage = (aCurTotalProgress * 100) / aMaxTotalProgress;
		this.throbberElement.el.value = percentage;
	}
}
XULBrowserWindow.throbberElement = {
	setAttribute:function(){this.el.collapsed=false},
	removeAttribute:function(){this.el.collapsed=true;this.el.value=0}
}
XULBrowserWindow.init = function () {
	delete this.statusTextField
	this.statusTextField=document.createElement('label')
	var a = document.getElementById("addon-bar")
	a.insertBefore(this.statusTextField, a.firstChild)
	this.throbberElement.el=document.getElementById('urlbar-progress-alt')

    var securityUI = gBrowser.securityUI;
    this._hostChanged = true;
    this.onSecurityChange(null, null, securityUI.state);
}
/***************************************************************************
 *   remove annoying shortcuts and "features"
 */
BrowserHandleBackspace = BrowserHandleShiftBackspace = dump

/*	TabsInTitlebar.uninit()
	TabsInTitlebar=null
	updateAppButtonDisplay = dump */
//gFindBar._shouldFastFind=function(){}
/*gFindBar._onBrowserKeypress = function(aEvent) {
    if (!this._shouldFastFind(aEvent))
        return;

    if (this._findMode != this.FIND_NORMAL && this._quickFindTimeout) {
        if (!aEvent.charCode) {
            return;
        }
        this._findField.select();
        this._findField.focus();
        this._dispatchKeypressEvent(this._findField.inputField, aEvent);
        aEvent.preventDefault();
        return;
    }
}*/
/***************************************************************************
 *   onRefreshAttempted
 */
TabsProgressListener.onRefreshAttempted=function(aBrowser, aWebProgress, aURI, aDelay, aSameURI){
	//dump(aBrowser, aWebProgress, aURI, aDelay, aSameURI)
	/*PopupNotifications.show(
		gBrowser.mCurrentBrowser, 'notificationID', aSameURI?'reload'+aDelay:'redirect '+aURI.spec+aDelay, 'ff-LogoBtn',
		{label:'pop',accessKey:'s',
		 callback:function(){}
		},
		null, {timeout:30000}
	);*/

	return !aSameURI

}



/***************************************************************************
 *   load Listener
 */

window.addEventListener("load", function(){
	window.removeEventListener("load", arguments.callee, false);
	TabHistory.init()
	delete TabHistory.init
	gFindBar._shouldFastFind=function(){}


	gBrowser.tabContainer.addEventListener("click", function(event) {
		if (event.button != 1)
			return;

		if (event.target.localName == "tab") {
		  if (this.childNodes.length > 1){
			  //this.tabbrowser
			  var t = gBrowser.visibleTabs
			var tab = event.target
			gBrowser.moveTabTo(tab, t[t.length - 1]._tPos);
			gBrowser.selectedTab = tab
			//tab.focus();
		  }
		} else if (event.originalTarget.localName == "box") {
		  BrowserOpenTab();
		} else {
		  return;
		}

		event.stopPropagation();
		event.preventDefault();
	}, true)
}, false);



/***************************************************************************
 *   swapCookies
 */
// helpers
// helpers
function writeToFile(file, text) {
    var fostream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream), converter = Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(Ci.nsIConverterOutputStream);
    fostream.init(file, 2 | 8 | 32, 436, 0);
    converter.init(fostream, "UTF-8", 4096, 0);
    converter.writeString(text);
    converter.close();
}
function getInProfileFilePath(name, getFile){
	var dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
	dir.append(name)
	if(getFile)
		return dir
	var fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
	var uri = fileHandler.getURLSpecFromFile(dir);

	return uri
}
// todo: use async request
function makeReq(href) {
    var req = new XMLHttpRequest;
    req.overrideMimeType("text/plain");
    req.open("GET", href, false);
    try {
        req.send(null);
    } catch (e) {
    }
    return req.responseText;
}

var cookieSwap = {
	getCookies: function(host, cookieList){
		var ans = cookieList || [];
		var e = Services.cookies.getCookiesFromHost(host)
		while(e.hasMoreElements()){
			item=e.getNext(Ci.nsICookie).QueryInterface(Ci.nsICookie).QueryInterface(Ci.nsICookie2)
			var cookieData = [
				item.host, item.path, item.name,
				item.value,
				item.isSecure, item.isHttpOnly, item.isSession,
				item.expiry]
			ans.push(cookieData)
		}
		return ans
	},
	removeCookie: function(cookieData){
		//Services.cookies.remove(item.host, item.name, item.path, false)
		Services.cookies.remove(cookieData[0], cookieData[2], cookieData[1], false)
	},
	addCookie: function (cookieData){
		//Services.cookies.remove(item.host, item.name, item.path, false)
		Services.cookies.add.apply(Services.cookies, cookieData)
	},

	saveProfileData: function(){
		writeToFile(
			getInProfileFilePath('cookieSwap.txt', true),
			JSON.stringify(this.profiles)
		)
	},
	get profiles () {
		try{
			var path = getInProfileFilePath('cookieSwap.txt')
			var text = makeReq(path)
			delete this.profiles
			var profiles = JSON.parse(text)
		}catch(e){Cu.reportError(e)}

		return this.profiles = profiles || {__currentProfile__: 'default'}
	},

	captureProfile: function(name){
		return this.profiles[name] = this.getCookies('google.com', this.getCookies('youtube.com'))
	},
	removeProfile: function(name){
		if(this.profiles[name])
			for each(var i in this.profiles[name])
				this.removeCookie(i)
	},
	setProfile: function(name){
		if(this.profiles[name])
			for each(var i in this.profiles[name])
				this.addCookie(i)
	},

	switchToProfile: function(name){
		var currentName = this.profiles.__currentProfile__
		this.captureProfile(currentName)
		this.removeProfile(currentName)
		if(name=='__currentProfile__' || name=='empty'){
			name = 'undefined'
		}else
			this.setProfile(name)
		this.profiles.__currentProfile__ = name
		setTimeout(this.saveProfileData.bind(this),10000)
	},

	switchAndReload: function(name, loadMail){
		var brs=gBrowser.browsers
		var tbs=gBrowser.tabs
		var currentBr=gBrowser.mCurrentBrowser
		for(var i in brs){
			var br=brs[i],tab=tbs[i], loc = br._contentWindow.location.href
			if(br!=currentBr && loc.search('mail.google.com')!=-1){
				//tab=gBrowser.mCurrentTab
				//Cc['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore).duplicateTab(window,tab , 0)
				gBrowser.removeTab(tab, {animate: false, byMouse: false})
			}
		}
		this.switchToProfile(name)
		// loc = currentBr._contentWindow.location.href
		if(loadMail)
			getWebNavigation().loadURI('https://mail.google.com/mail/',
									nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY |
									nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE |
									nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
								  null, null, null);
		else
			currentBr.reloadWithFlags(nsIWebNavigation.LOAD_FLAGS_CHARSET_CHANGE)
		gBrowser._lastRelatedTab = null
	},
	onPopupCommand: function(e){
		var t = e.target
		var name = t.getAttribute('value')
		if(name)
			this.switchAndReload(name, !e.button)
	}

}
// Services.cookies is missing on ff4
if(!Services.cookies)
	Services.cookies = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2)












