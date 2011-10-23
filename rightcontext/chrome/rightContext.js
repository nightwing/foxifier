rightContext = {}
rightContext.$ = function(x)document.getElementById(x)
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
// undo close tab
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
rightContext.modifyTabContextMenu = function(enable) {
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
	var old = this.$("context-searchselect")
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

	var s = this.$("context-sep-open")

	var c = this.$("contentAreaContextMenu")
	c.insertBefore(m, s)
	return m
}
rightContext.createOpenItem = function(){
	nsContextMenu.prototype.showItem("context-openlinkincurrent", false)
	nsContextMenu.prototype.showItem("context-openlinkintab", false)
	nsContextMenu.prototype.showItem("context-openlink", false)

	var m = this.elem('menu', {
		id: "right-context-openlinkintab",
		label: "Open Link in New Tab",
		type: "splitmenu",
		onclick: "gContextMenu&&rightContext.linkClick(event)",
		oncommand: "gContextMenu&&rightContext.linkClick(event)",
		onmouseover: "window.XULBrowserWindow.setOverLink(this.linkText, null);",
		onmouseout: "window.XULBrowserWindow.setOverLink('', null);",
		class: "menu-non-iconic"
	})
	var p = this.elem(m, 'menupopup')
	
	this.elem(p, "menuitem", {label: "in current tab", where: 'current'})
	this.elem(p, "menuitem", {label: "in foreground tab", where: 'tabshifted'})
	this.elem(p, "menuitem", {label: "in new window", where: 'window'})

	var s = this.$("ifox-context-searchselect") || this.$("context-sep-open")

	var c = this.$("contentAreaContextMenu")
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
dump(4)
	var doc = gContextMenu.target.ownerDocument;
	this.openLinkIn(gContextMenu.linkURL, e, null, {
			charset: doc.characterSet,
			referrerURI: doc.documentURIObject
	})
}

/*** called with this = gContextMenu **/
rightContext.initOpenItems = function() {
    var item = rightContext.$("right-context-openlinkintab")||rightContext.createOpenItem()
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

rightContext.hook = function(proto, fName, enable){
	if(enable){
		this[fName+"_orig"] = proto[fName]
		proto[fName] = this[fName]
	}else if(fName+"_orig" in this){
		proto[fName] = this[fName+"_orig"]
	}
}
rightContext.modifyContextMenu = function(enable){
	if(this.wasEnabled == enable)
		return;

	var proto = nsContextMenu.prototype
	var ifox = "InstantFox" in window
	
	ifox || this.hook(proto, 'isTextSelection',  enable)
	this.hook(proto, 'initOpenItems',  enable)
	
	if (enable && !this.isTextSelection_orig){
		gBrowser.addEventListener("mouseup", this.saveMousePos, false)
	}else if(!enable && this.wasEnabled){
		gBrowser.removeEventListener("mouseup", rightContext.saveMousePos, false)
		let popup = this.$("contentAreaContextMenu")
		let node = this.$("ifox-context-searchselect")
		node && node.parentNode.removeChild(node)
		popup.insertBefore(proto.oldNode, proto.oldNodePosId && this.$(proto.oldNodePosId))
		
		this.remove("right-context-openlinkintab")
	}
}


rightContext.init = function(enable) {
	if (enable) {
		if (!("InstantFox" in window)){
			//this.pi=document.createProcessingInstruction("xml-stylesheet", 'href="chrome://rightContext/content/overlay.css"')            
            //document.appendChild(this.pi)
			var s = document.createElementNS('http://www.w3.org/1999/xhtml', "style")
        	s.setAttribute("href", "chrome://rightContext/content/overlay.css")
    		s.setAttribute("type", "text/css")
			s.innerHTML=
'menuitem.split-menuitem-item[_moz-menuactive="true"], .split-menu-right-image[_moz-menuactive="true"] {/*for xp*/\
    background-color: -moz-menuhover;\
    color: -moz-menuhovertext;\
}\
menuitem.split-menuitem-item{\
    padding: 0!important;/*for mac*/\
    pointer-events:none;\
    -moz-margin-end:1px;/*for xp*/\
}\
.split-menu-right-image {\
   /* padding: 0!important;for mac*/\
    -moz-appearance: menuitem;\
    -moz-box-pack: end;\
}\
menu[type=splitmenu] {\
    -moz-binding: url("chrome://rightContext/content/bindings.xml#splitmenu")!important;\
    -moz-box-orient: horizontal;\
    -moz-appearance: none !important;\
    color: menutext;\
    background-color: transparent !important;\
}'
            
            document.documentElement.appendChild(s)
		}
	}else{
		this.remove(this.pi)
		var s = document.querySelector('style[src^="chrome://rightContext/content/"]')
		this.remove(s)
		var s = document.querySelector('script[src^="chrome://rightContext/content/"]')
		this.remove(s)
	}
	this.modifyContextMenu(enable)
	this.modifyTabContextMenu(enable)
}
rightContext.init(true)