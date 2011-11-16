var fireRibbon = {
    gPref: null,
    prefDir: 'extensions.fireRibbon.',

    //------------------------------------
    OnLoad: function(){

        this.gPref = Cc["@mozilla.org/preferences-service" + ";1"].getService(Ci.nsIPrefService).getBranch("extensions.fireRibbon.");

        this.initRibbon();
        var i, mainW;

        try {
            mainW = document.getElementById("main-window");
        }
        catch (e) {
            mainW = null;
        }

        //Not closing popupmenu when user middle clicks
        //bookmarks and histories menuitem
        //if(gpref.getBoolPref("don't close bookmarks menus"))
        try {
            eval('BookmarksEventHandler.onClick =' +
            BookmarksEventHandler.onClick.toString().replace('node.hidePopup()', ''));
            eval('checkForMiddleClick =' +
            checkForMiddleClick.toString().replace('closeMenus(event.target);', ''));
        }
        catch (e) {
        }
		this.onCustomize("");
        //restore window position from last session
        window.setTimeout(this.delayedStartup, this, 0);
    },
    shutDown:function(){
		fireRibbon.gPref.setIntPref("lastSelectedRib",fireRibbon.ribbonContainer.selectedIndex)
		//document.persist("fireRibbon","selectedIndex")
		/*alert("0")
		try{
		fireRibbon.gPref.setIntPref("lastSelectedRib",fireRibbon.ribbonContainer.selectedIndex)
		}catch(e){alert(0)}
		alert("1")
		alert(fireRibbon.ribbonContainer.selectedIndex+" "+this.gPref.prefHasUserValue("lastSelectedRib")?this.gPref.getIntPref("lastSelectedRib"):0)
		*/
	},
    //********************------------------------------------------------

    delayedStartup: function(){
        //fireRibbon.syncRibbonToolbars(0);//***********************************************************
    },

    //--------------------------------------------------------
    onCustomize: function(e){
        if (e && e.attrName != 'disabled')
            return;
			try{
        mBtn = document.getElementById("ff-bookmarks");
            if (mBtn != null)
                mBtn = mBtn.firstChild;
            popup = mBtn && mBtn.firstChild == null ? document.getElementById("bookmarksMenuPopup") : null;
            if (popup) {
                popup1 = popup.cloneNode(false);
                mBtn.appendChild(popup1);
                for (i = 0; i < popup.childNodes.length; i++) {
                    Item = popup.childNodes[i];
                    if (Item.hasAttribute("id"))
                        popup1.appendChild(Item.cloneNode(true));
                }
            }
			}catch(e){}

    },
    //MenuBtn------------------------------------------------------


	//historyBtn------------------------------------------------------
    HistoryClick: function(e){
        if (e.button == 1) {
            if (e.target.id == 'bookmarks-button')
                toggleSidebar('viewBookmarksSidebar');
            else
                if (e.target.id == 'history-button')
                    toggleSidebar('viewHistorySidebar');
        }
    },
    HistoryShowing: function(e){
        if (e.target.id == 'ff-history-menu' &&
        !e.target.hasAttribute('oncommand')) {
            e.target.setAttribute('oncommand', document.getElementById('history-menu').getAttribute('oncommand'));
        }
        if (e.target.id != 'ff-undo-tab-menu')
            return;

        ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
        Items = eval('(' + ss.getClosedTabData(window) + ')');
        while (e.target.hasChildNodes())
            e.target.removeChild(e.target.lastChild);
        for (i = (Items.length > 0 ? 0 : -1); i < Items.length; i += 1) {
            undo = i >= 0 ? Items[i] : null;
            Item = document.createElement('menuitem');
            e.target.appendChild(Item);
            Item.setAttribute('label', (i != -1 ? (i + ': ' +
            undo.title) : this.GetString('UndoEmpty')));
            try {
                Item.setAttribute("tooltiptext", !undo ? '' : undo.state.entries[undo.state.index - 1].url);
            }
            catch (e) {
            }
            if (i == -1)
                Item.setAttribute('disabled', true);
            else {
                Item.setAttribute('class', 'menuitem-iconic bookmark-item');
                Item.setAttribute('oncommand', 'undoCloseTab(' + i + ');');
                if (i < 10)
                    Item.setAttribute('accesskey', i);
            }
            if (undo && undo.image)
                Item.setAttribute('image', undo.image);
        }
    },


    ////prefs**********************************



    //// pseudo ribbon
    initRibbon: function(){
        var rib = document.getElementById('fireRibbon');
        if (rib == null)
            return;

        fireRibbon.ribbonContainer = rib;
        try {
            var names = fireRibbon.gPref.getCharPref('rib.names');
        }
        catch (e) {
            return;
        }
        //fireRibbon.gPref.setCharPref('rib.names', 'navigation,bookmarks,page,none');
        names = names.split(',');
        names[0];


        for (i = 0; i < names.length; i++) {
            var rib1 = document.createElement("label");
            rib1.setAttribute('value', names[i]);
            rib1.setAttribute('checked', false);
            rib1.setAttribute('onclick', "fireRibbon.ribbonClick(event," + i + ");");
            rib1.setAttribute('ondragenter', "fireRibbon.ribbondragenter(" + i + ");");
            rib.appendChild(rib1);
        }
        rib.removeChild(rib.firstChild);

        rib.selectedIndex = 0;
        fireRibbon.ribbonClick("", this.gPref.prefHasUserValue("lastSelectedRib")?this.gPref.getIntPref("lastSelectedRib"):0)

        try {

            onViewToolbarsPopupShowing = function(aEvent){
                fireRibbon.onViewToolbarsPopupShowing(aEvent)
            };

            onViewToolbarCommand = function(aEvent){
                fireRibbon.updateRibbonPrefs(aEvent);
            };


        }
        catch (e) {
        }
        //fireRibbon.syncRibbonToolbars(0);
        rib.selectedIndex = 0;
        fireRibbon.ribbonClick("", this.gPref.prefHasUserValue("lastSelectedRib")?this.gPref.getIntPref("lastSelectedRib"):0)

    },
    //
    onViewToolbarsPopupShowing: function(aEvent){
        var popup = aEvent.target;
		var oldBox=popup.getElementsByClassName("checkboxcontainer")[0]
		if(!oldBox){
			oldBox=document.createElement("groupbox")
			oldBox.classList.add("checkboxcontainer")
			popup.insertBefore(oldBox,popup.firstChild)
		}else{
			var oldBox1=oldBox.cloneNode(false);
			popup.replaceChild(oldBox1,oldBox);
			oldBox=oldBox1;
		}
			
		this.populateCheckboxes(oldBox)
       
    },

	populateCheckboxes: function(groupbox){
		for (var i = 0; i < gNavToolbox.childNodes.length; ++i) {
            var toolbar = gNavToolbox.childNodes[i];
            var toolbarName = toolbar.getAttribute("toolbarname");
            if (toolbarName) {
                var checkbox = document.createElement("checkbox");
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
                checkbox.setAttribute("toolbarindex", i);
                checkbox.setAttribute("label", toolbarName);
                checkbox.setAttribute("checked", toolbar.getAttribute(hidingAttribute) != "true");
                checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefs()");
				groupbox.appendChild(checkbox);
            }
        }
        //tabbar
        checkbox = document.createElement("checkbox");
        checkbox.setAttribute("toolbarindex", ++i);
        checkbox.setAttribute("label", 'tabbar');
        checkbox.setAttribute("checked", !getBrowser().mStrip.collapsed);
        checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefsTab()");
		groupbox.appendChild(checkbox);

        //statusbar
        checkbox = document.createElement("checkbox");
        checkbox.setAttribute("toolbarindex", ++i);
        checkbox.setAttribute("label", 'statusbar');
        checkbox.setAttribute("checked", !document.getElementById('status-bar').hidden);
        checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefsStatusbar()");
		groupbox.appendChild(checkbox);		
	},

    //sets rib prefs while customizing ribbon displayed toolbars
    updateRibbonPrefs: function(aEvent){
        var rib = fireRibbon.ribbonContainer;
        var toolbarIds = '';
        var toolbaranonIds = '';

        var index = aEvent.originalTarget.getAttribute("toolbarindex");
        var toolbar = gNavToolbox.childNodes[index];
        var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
        toolbar.setAttribute(hidingAttribute, aEvent.originalTarget.getAttribute("checked") != "true");
        dump(rib.selectedIndex);
        if (rib.selectedIndex == 0) {
            document.persist(toolbar.id, hidingAttribute);
        }

        for (i = 0; i < gNavToolbox.childNodes.length; ++i) {
            toolbar = gNavToolbox.childNodes[i];
            var toolbarName = toolbar.getAttribute("toolbarname");
            if (toolbarName) {
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
                if (toolbar.getAttribute(hidingAttribute) == "false") {
                    if (toolbar.hasAttribute('id'))
                        toolbarIds += toolbar.getAttribute('id') + ',' + hidingAttribute + ',';
                    else {
                        toolbaranonIds += toolbarName + ',' + hidingAttribute + ',';
                    }
                }
            }
        }
        fireRibbon.gPref.setCharPref('rib.' + rib.selectedIndex, toolbarIds);
        fireRibbon.gPref.setCharPref('rib.' + rib.selectedIndex + "anon", toolbaranonIds);
        dump('updateRibbon ' + toolbarIds);

        //alert(fireRibbon.gPref.getCharPref('rib'+rib.selectedIndex).split(' '));
    },

    //updates tabbar visibility
    updateRibbonPrefsTab: function(aEvent){
        var rib = fireRibbon.ribbonContainer;

        var hide = aEvent.originalTarget.getAttribute("checked") == "true";
        getBrowser().setStripVisibilityTo(hide);
        try {
            fireRibbon.gPref.setBoolPref('rib.' + rib.selectedIndex + ".tab", hide);
        }
        catch (e) {
        }
        dump('updateRibbon ' + toolbarIds);

        //alert(fireRibbon.gPref.getCharPref('rib'+rib.selectedIndex).split(' '));
    },
    //
    updateRibbonPrefsStatusbar: function(aEvent){
        var rib = fireRibbon.ribbonContainer;

        var hide = aEvent.originalTarget.getAttribute("checked") != "true";
        document.getElementById('status-bar').hidden = hide;
        try {
            fireRibbon.gPref.setBoolPref('rib.' + rib.selectedIndex + ".stat", hide);
        }
        catch (e) {
        }
        dump('updateRibbon ' + toolbarIds);

        //alert(fireRibbon.gPref.getCharPref('rib'+rib.selectedIndex).split(' '));
    },

    //hides toolbars according to prefs
    syncRibbonToolbars: function(selectedIndex){
        var rib = fireRibbon.ribbonContainer;
        if (rib == null)
            return;
        rib.selectedIndex = selectedIndex;

        var toolbarSet = fireRibbon.gPref.getCharPref('rib.' + selectedIndex).split(',');
        //hide everything
        for (i = 0; i < gNavToolbox.childNodes.length; ++i) {
            var toolbar = gNavToolbox.childNodes[i];
            var toolbarName = toolbar.getAttribute("toolbarname");
            if (toolbarName) {
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
                toolbar.setAttribute(hidingAttribute, "true");
            }
        }
        //toolbars with ids
        for (i = 0; i < toolbarSet.length / 2 - 1; i++) {
            var toolbar = document.getElementById(toolbarSet[2 * i]);
            if (toolbar) {
                toolbar.setAttribute(toolbarSet[2 * i + 1], "false");
            }
        }
        //handle anonymouse toolbars (in case there are toolbars without ids)
        var toolbarSet = fireRibbon.gPref.getCharPref('rib.' + selectedIndex + 'anon').split(',');
        for (i = 0; i < toolbarSet.length / 2 - 1; i++) {
            toolbar = gNavToolbox.getElementsByAttribute("toolbarname", toolbarSet[2 * i])[0];
            if (toolbar) {
                toolbar.setAttribute(toolbarSet[2 * i + 1], "false");
            }
        }
        //handle tabbar
        try {
            getBrowser().setStripVisibilityTo(fireRibbon.gPref.getBoolPref('rib.' + rib.selectedIndex + ".tab"));
        }
        catch (e) {
        }
        //handle status bar

        try {
            document.getElementById('status-bar').hidden = fireRibbon.gPref.getBoolPref('rib.' + rib.selectedIndex + ".stat");
        }
        catch (e) {
        }
    },

    ribbonClick: function(event, selectedIndexNew){
        var rib = fireRibbon.ribbonContainer;
        rib.childNodes[rib.selectedIndex].setAttribute('checked', false);

        if (event.button == 0 && rib.selectedIndex == selectedIndexNew && selectedIndexNew != 0) {
            rib.selectedIndex = 0;
        }
        else {
            rib.selectedIndex = selectedIndexNew;
        }
        //rib.selectedIndex=0;
        if (event.button == 2){
			this.openRibbonPopup(rib.selectedIndex)
		}
        rib.childNodes[rib.selectedIndex].setAttribute('checked', true);
        fireRibbon.syncRibbonToolbars(rib.selectedIndex);
    },

    ribbondragenter: function(selectedIndexNew){
        var rib = fireRibbon.ribbonContainer;
        rib.childNodes[rib.selectedIndex].setAttribute('checked', false);

        rib.selectedIndex = selectedIndexNew;
        //rib.selectedIndex=0;

        rib.childNodes[rib.selectedIndex].setAttribute('checked', true);
        fireRibbon.syncRibbonToolbars(rib.selectedIndex);
    },

    saveRibbonNames: function(){
        var rib = fireRibbon.ribbonContainer.children;
        var names = "";
        for (var i = 0; i < rib.length; i++) {
            names += "," + rib[i].value;
        }
        names.slice(1);

        try {
            fireRibbon.gPref.setCharPref('rib.names', names);
        }
        catch (e) {
        }
    },

    makeLabelEditable: function(el){
        var editnode = document.createElement('textbox');
        editnode.setAttribute('value', el.value);
        editnode.setAttribute('class', 'plain');
        el.oldValue = el.value;
		//el.removeAttribute('value');
		editnode.width=el.boxObject.width;
		el.parent.insertBefore(editnode,el);
    },

	openRibbonPopup: function(i){
		var pan=document.getElementById("mainPanel")
		pan.setAttribute("hidden",false)
		pan.querySelector(".textbox").value=fireRibbon.ribbonContainer.children[i].getAttribute('value')

		pan.openPopup(fireRibbon.ribbonContainer, "after_start", 0, 0, false, false)
	}

};


window.addEventListener('load', function(){
	removeEventListener('load', arguments.callee, true);
    fireRibbon.OnLoad()
}, false);
window.addEventListener("unload", fireRibbon.shutDown, false);



dump = function(){
var aMessage="message "
	for (var i = 0; i < arguments.length; i++)
		aMessage += arguments[i] + " ; ";

    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(aMessage);
}
/*fireRibbon.makeLabelEditable(document.getElementById('fireRibbon').children[1])
   makeLabelEditable= function(el){
        var node = document.createElement('textbox');
        node.setAttribute('value', el.value);
        node.setAttribute('class', 'plain');
        el.oldValue = el.value;
		el.removeAttribute('value');
		node.width=el.boxObject.width+100;
alert(el.boxObject.width);
el.width=el.boxObject.width;
		el.appendChild(node);
    }
makeLabelEditable(document.getElementById('fireRibbon').children[0])*/
