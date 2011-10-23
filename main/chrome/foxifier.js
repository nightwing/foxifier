var TabHistory ={// copies history from one tab to another, via tab.browser.sessionHistory
	copyHistory : function(fromTab, newTab){
		var fromHistory = getBrowser().getBrowserForTab(fromTab).sessionHistory;
		var toHistory = getBrowser().getBrowserForTab(newTab).sessionHistory;
		// needed to use addEntry
		toHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);
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
			"if((0==b.sessionHistory.count)&&aReferrerURI)TabHistory.copyHistory(this.selectedTab, t);\n $1"));
	}
};


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
// undo close tab
rightContext = {}
rightContext.$ = function(x)document.getElementById(x)
rightContext.XML = function(element, xml, childBefore){
	var range = element.ownerDocument.createRange()
	range.selectNode(element)
	range.collapse(true)
	var fragment = range.createContextualFragment(xml)

	return element.insertBefore(fragment, childBefore)
}
rightContext.elem = function(parent, name, props, before, children){
	if(typeof parent=="string"){
		children = before
		before = props
		props = name
		name = parent
		parent = null
	}
	if(typeof before == 'number')
		before = parent.children[before]
	else if(before && Array.isArray(before)){
		children = before
		before = null
	}

	var el = document.createElement(name)
	for(var prop in props){
		el.setAttribute(prop, props[prop])
	}
	if(parent)
		parent.insertBefore(el, before)
	return el
}
rightContext.remove = function(el){
	if(typeof el == "string")
		el = rightContext.$(el)
	el && el.parentNode.removeChild(el)
	return el
}

rightContext.duplicate = function(){
	var tab = gBrowser.mContextTab||gBrowser.mCurrentTab;
	var newTab = Cc['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore).duplicateTab(window, tab, 0);
	gBrowser.moveTabTo(newTab, tab._tPos)
}

dump(1)

rightContext.undoCloseTab = function(e){
	var item = e.target;
	if(item.undoCount){
		while(item.undoCount--)
			undoCloseTab()
	}else{
		undoCloseTab(item.value)
	}	
	if(e.button == 1){
		gBrowser.moveTabToEnd()
		item.parentNode.closePopup()
	}
}
rightContext.createTabContextMenu = function() {
	var tabContextMenu = rightContext.$("tabContextMenu")
	var oldEl = rightContext.remove('context_undoCloseTab')
	var oldEl = rightContext.remove('context_reloadTab')
	
	rightContext.remove('context_duplicate')
	
	var menu = rightContext.elem(tabContextMenu, 'menu',{
		id: "context_undoCloseTab",
		label: "Undo Close Tab",
		type: "splitmenu",
		closemenu: "none",
		accesskey: "U",
		observes: "History:UndoCloseTab"
	}, 0)
	rightContext.elem(menu, 'menupopup', {
		oncommand: "event.stopPropagation();rightContext.undoCloseTab(event)",
		onclick: "event.stopPropagation();rightContext.undoCloseTab(event)",
		onpopupshowing: "rightContext.populateUndoSubmenu(this)"
	})
	rightContext.elem(tabContextMenu, 'menuitem', {
		id: "context_duplicate",
		label: "Duplicate",
		accesskey: "D",
		oncommand:"rightContext.duplicate()"
	}, 1)
}
rightContext.createTabContextMenu()
rightContext.populateUndoSubmenu = function(popup) {
	var _ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore)
    var undoMenu = popup.parentNode;
    var undoPopup = popup;
    while (undoPopup.hasChildNodes()) {
        undoPopup.removeChild(undoPopup.firstChild);
    }
    if (_ss.getClosedTabCount(window) == 0) {
        undoMenu.setAttribute("disabled", true);
        return;
    }
    undoMenu.removeAttribute("disabled");
    var undoItems = eval("(" + _ss.getClosedTabData(window) + ")");
    for (var i = 0; i < undoItems.length; i++) {
        var m = document.createElement("menuitem");
        m.setAttribute("label", undoItems[i].title);
        if (undoItems[i].image) {
            let iconURL = undoItems[i].image;
            if (/^https?:/.test(iconURL)) {
                iconURL = "moz-anno:favicon:" + iconURL;
            }
            m.setAttribute("image", iconURL);
        }
        m.setAttribute("class", "menuitem-iconic bookmark-item menuitem-with-favicon");
        m.value = i;
        let tabData = undoItems[i].state;
        let activeIndex = (tabData.index || tabData.entries.length) - 1;
        if (activeIndex >= 0 && tabData.entries[activeIndex]) {
            m.setAttribute("targetURI", tabData.entries[activeIndex].url);
        }
        if (i == 0)
            m.setAttribute("key", "key_undoCloseTab");
        undoPopup.appendChild(m);
    }
    var strings = gNavigatorBundle;
    undoPopup.appendChild(document.createElement("menuseparator"));
    m = undoPopup.appendChild(document.createElement("menuitem"));
    m.id = "menu_restoreAllTabs";
    m.setAttribute("label", strings.getString("menuRestoreAllTabs.label"));
    m.undoCount = undoItems.length
}

/*********************************************************************************
 ** contextMenu **
 **/
/*** called with this = gContextMenu **/
rightContext.isTextSelection = function() {
	var splitMenu = document.getElementById("ifox-context-searchselect") || rightContext.createSearchItem()
	var menuitem = splitMenu.menuitem

	var selectedText = rightContext.getSelectedText(), croppedText = selectedText

	if (!selectedText) {
		splitMenu.hidden = true
		return false;
	}

	if (selectedText.length > 15)
		croppedText = selectedText.substr(0,15) + this.ellipsis;

	var engine = Services.search[
		isElementVisible(BrowserSearch.searchBar)?"currentEngine": "defaultEngine"
	];

	// format "Search <engine> for <selection>" string to show in menu
	var menuLabel = gNavigatorBundle.getFormattedString(
										"contextMenuSearchText", [engine.name, croppedText]);
	if(menuitem){
		menuitem.label = menuLabel;
		menuitem.image = engine.iconURI.spec
		splitMenu.setAttribute('name', engine.name)
		splitMenu.setAttribute('pluginType', "instantFox")
		menuitem.accessKey = gNavigatorBundle.getString("contextMenuSearchText.accesskey");
		splitMenu.hidden = false
	}

	return croppedText;
}
rightContext.createSearchItem = function(){
	var old = document.getElementById("context-searchselect")
	if(old){
		nsContextMenu.prototype.oldNode = old
		nsContextMenu.prototype.oldNodePosId = old.nextSibling && old.nextSibling.id
		old.parentNode.removeChild(old)
	}

	var m = rightContext.elem('menu', {
		id: "ifox-context-searchselect",
		type: "splitmenu",
		onclick: "gContextMenu&&rightContext.doSearch(event)",
		oncommand: "gContextMenu&&rightContext.doSearch(event)",
		class: "menu-non-iconic"
	})
	rightContext.elem(m, 'menupopup', {onpopupshowing: "rightContext.fillSearchSubmenu(this)"})

	var s = document.getElementById("context-sep-open")

	var c = document.getElementById("contentAreaContextMenu")
	c.insertBefore(m, s)
	return m
}
rightContext.getSelectedText = function() {
	var selectedText = getBrowserSelection();

	if (selectedText)
		return selectedText
	try{
		var editor = content.document.activeElement
			.QueryInterface(Ci.nsIDOMNSEditableElement).editor
	}catch(e){
		try{
			var editor = document.popupNode
				.QueryInterface(Ci.nsIDOMNSEditableElement).editor
		}catch(e){}
	}
	try{
		return editor.selection.toString()
	}catch(e){}
	return ''
}
rightContext.fillSearchSubmenu = function(popup) {
	var menu
	while(menu = popup.firstChild)
		popup.removeChild(menu)
	Services.search.getVisibleEngines().forEach(function(engine){
		rightContext.elem(popup, 'menuitem', {
			name: engine.name,
			label: engine.name,
			image: engine.iconURI.spec,
			class: "menuitem-iconic"
		})				
	})
}
rightContext.doSearch = function(e) {
	var name = e.target.getAttribute('name')
	if(!name)
		return
	var selectedText = this.getSelectedText()
	
	var engine = Services.search.getEngineByName(name);
	var submission = engine.getSubmission(selectedText);
	if (!submission) {
		return;
	}
	var href = submission.uri.spec
	var postData = submission.postData
	
	this.openLinkIn(href, e, postData);
}
rightContext.openLinkIn = function(href, e, postData, fixup){			
	var where = e.target.getAttribute('where') || "tab"
	if(e.button == 1)
		where = "tabshifted"
	else if(e.button == 2)
		where = "current"
	if(e.ctrlKey || e.altKey){
		if(where == 'tab')
			where = 'tabshifted'
		else if(where == 'tabshifted')
			where = 'tab';
	}else if(e.shiftKey && where != 'current')
		where = 'current';
	
	openLinkIn(href, where, fixup||{postData: postData, relatedToCurrent: true});
}
rightContext.linkClick = function(e){
	var doc = gContextMenu.target.ownerDocument;
	this.openLinkIn(rightContext.linkURL, e, null, {
			charset: doc.characterSet,
			referrerURI: doc.documentURIObject
	})
}

/*** called with this = gContextMenu **/
rightContext.initOpenItems = function() {
    var item = document.getElementById("context-openlinkintab")
	if(!item)
		return;

    var isMailtoInternal = false;
    if (this.onMailtoLink) {
        var mailtoHandler = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
			getService(Ci.nsIExternalProtocolService).getProtocolHandlerInfo("mailto");
        isMailtoInternal = (!mailtoHandler.alwaysAskBeforeHandling && mailtoHandler.preferredAction == Ci.nsIHandlerInfo.useHelperApp && (mailtoHandler.preferredApplicationHandler instanceof Ci.nsIWebHandlerApp));
    }

    // Time to do some bad things and see if we've highlighted a URL that
    // isn't actually linked.
    var onPlainTextLink = false
	
	var linkText = this.isTextSelected;
	if(linkText && !rightContext.isMouseOverSelection()){
		linkText = ""
	}
	if (!linkText && !this.onLink) {
		linkText = rightContext.getPlainLinkText() || this.isTextSelected
	}
	
	if (linkText) {
		var uri;
		if (/^(?:https?|ftp):/i.test(linkText)) {
			try {
				uri = makeURI(linkText);
			} catch (ex) {}
		}
		// Check if this could be a valid url, just missing the protocol.
		else if (/^(?:[a-z\d-]+\.)+/i.test(linkText)) {
			let uriFixup = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
			try {
				uri = uriFixup.createFixupURI(linkText, uriFixup.FIXUP_FLAG_NONE);
			} catch (ex) {}		
		}

		if (uri && uri.host) {
			this.linkURI = uri;
			this.linkURL = uri.spec;
			onPlainTextLink = true;
		}
	}

    var shouldShow = this.onSaveableLink || isMailtoInternal || onPlainTextLink;
	this.showItem("context-sep-open", shouldShow || this.isTextSelected);
	item.hidden = !shouldShow
	if (shouldShow)
		item.linkText = this.linkURL
}
rightContext.getPlainLinkText = function(){
	var linkText = ""
	var text = document.popupRangeParent.textContent
	var l = document.popupRangeOffset
	
	var i = text.lastIndexOf(' ', l)
	if (i !=-1){
		text = text.substr(i).replace(/\s/g, ' ')
		l = l-i
	}
	var findMatch = function(r){
		var match
		while(match = r.exec(text)){
			var end = match.index+match[0].length
			if (match.index > l)
				break

			if (end > l){
				linkText = match[0]
				break
			}
		}
		return linkText
	}
	
	findMatch(/https?:\/\/[^\s]+/ig) ||
	findMatch(/www\.[^\s]+/ig) ||
	findMatch(/[a-z\d-]+\.[a-z\d-]+[^\s]*/ig)

	return linkText.replace(/[\)\]\}\>\.;,]*$/, '')
}
rightContext.isMouseOver = function(item){
	var rect = item.getBoundingClientRect()
	var x = this.lastEvent.x, y = this.lastEvent.y
	if(x < rect.right && x > rect.left && y < rect.bottom && y > rect.top)
		return true
}
rightContext.isMouseOverSelection = function(){
	try{
		var pn = document.popupNode
		if(pn instanceof Ci.nsIDOMNSEditableElement){
			var sel = pn.QueryInterface(Ci.nsIDOMNSEditableElement).editor.selection
		}else
			var sel = pn.ownerDocument.defaultView.getSelection()
		return this.isMouseOver(sel.getRangeAt(0))
	}catch(e){
		dump(e)
		return true
	}
}
rightContext.saveMousePos = function(e){
    rightContext.lastEvent={x:e.clientX,y:e.clientY,b:e.button,time: e.timeStamp}
}

 
rightContext.modifyContextMenu = function(enable){
	let proto = nsContextMenu.prototype
	if (enable && !this.isTextSelection_orig){
		this.isTextSelection_orig = proto.isTextSelection;
		this.initOpenItems_orig = proto.initOpenItems;
		
		proto.isTextSelection = this.isTextSelection
		proto.initOpenItems = this.initOpenItems

		gBrowser.addEventListener("mouseup", this.saveMousePos, false)
	}
	else if(!enable && this.isTextSelection_orig){
		proto.isTextSelection = this.isTextSelection_orig
		proto.initOpenItems = this.initOpenItems_orig;
		
		gBrowser.removeEventListener("mouseup", rightContext.saveMousePos, false)
		let popup = document.getElementById("contentAreaContextMenu")
		let node = document.getElementById("ifox-context-searchselect")
		node && node.parentNode.removeChild(node)
		popup.insertBefore(proto.oldNode, proto.oldNodePosId && document.getElementById(proto.oldNodePosId))
	}

}
rightContext.modifyContextMenu(true)


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
    this.overLink = url.replace(/[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]/g, encodeURIComponent);
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
	getCookies: function(host){
		var ans = [];
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
		return this.profiles[name] = this.getCookies('google.com')
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
