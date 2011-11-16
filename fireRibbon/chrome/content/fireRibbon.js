var fireRibbon = {
    gPref: null,
    prefDir: 'extensions.fireRibbon.',

    //------------------------------------
    OnLoad: function(){

        this.gPref = Cc["@mozilla.org/preferences-service" + ";1"].getService(Ci.nsIPrefService).getBranch("extensions.fireRibbon.");

        this.initRibbon();
       
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
    },
    shutDown:function(){
		this.gPref.setIntPref("lastSelectedRib",this.ribbonContainer.selectedIndex)
		this.saveSettings()
	},
    //********************------------------------------------------------


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
                for (var i = 0; i < popup.childNodes.length; i++) {
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
        for (var i = (Items.length > 0 ? 0 : -1); i < Items.length; i += 1) {
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
	/*"navigation:;bookmarks:;page:;none:;"
",false,nav-bar,false,PersonalToolbar,true,nav-bar-ext,true"
	"navigation:;bookmarks:;page:;none:;"
"name:1:1:toolbar-menubar,nav-bar,PersonalToolbar"*/
    //// pseudo ribbon
	   //document.persist(toolbar.id, hidingAttribute);
	createRibButton: function(i,name){
		var rib1 = document.createElement("label");
        rib1.setAttribute('value', name);
		rib1.setAttribute('checked', false);
		rib1.setAttribute('onclick', "fireRibbon.ribbonClick(event," + i + ");");
		rib1.setAttribute('ondragenter', "fireRibbon.ribbondragenter(" + i + ");");
        this.ribbonContainer.appendChild(rib1);
	},
	synchRibNames: function(){
		var rib=this.ribbonContainer
		while(rib.firstChild)
			rib.removeChild(rib.firstChild)
		for (var i = 0; i < this.ribbonSettings.length; i++) {
           this.createRibButton(i,this.ribbonSettings[i].name)
        }
		rib.children[rib.selectedIndex].setAttribute('checked', true)
	},
	saveSettings:function(){
		var n=this.ribbonSettings.length
		var allOpts=[]
		for (var i = 0; i < n; i++) {
			var opt=this.ribbonSettings[i];
			allOpts.push([opt.name,opt.tab?"1":"0",opt.stb?"1":"0",opt.toolbarSet].join(":"))
		}		
		this.gPref.setCharPref('ribbon',allOpts.join(";"))
	},
    initRibbon: function(){
        var rib = document.getElementById('fireRibbon');
        dump(rib)
		if (rib == null)
            return;
		
        this.ribbonContainer = rib;
		try {
			var allOpts =this.gPref.getCharPref('ribbon')
		}catch (e) {
            var allOpts ="navigation:1:1:toolbar-menubar,nav-bar,;bookmarks:1:1:toolbar-menubar,PersonalToolbar,;page:1:1:toolbar-menubar,page-toolbar,;none:0:0:toolbar-menubar,";
        }
       
		//var names = fireRibbon.gPref.getCharPref('ribbon');
		allOpts=allOpts.split(";");
		this.ribbonSettings=[]
		for (var i = 0; i < allOpts.length; i++) {
			var opts=allOpts[i].split(":");
			this.ribbonSettings.push({name:opts[0],tab:opts[1]==="1",stb:opts[2]==="1",toolbarSet:opts[3]})
		}

		rib.selectedIndex = 0;
		this.synchRibNames() 
        try {
            onViewToolbarsPopupShowing = function(aEvent){
                fireRibbon.onViewToolbarsPopupShowing(aEvent)
            };
            onViewToolbarCommand = function(aEvent){
                fireRibbon.updateRibbonPrefs(aEvent);
            };
        }catch (e) {
        }
        //fireRibbon.syncRibbonToolbars(0);
      
        fireRibbon.ribbonClick("", this.gPref.prefHasUserValue("lastSelected")?this.gPref.getIntPref("lastSelected"):0)
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
		this.populateCheckboxes(oldBox);
		//save settings
		
		
    },

	populateCheckboxes: function(groupbox){
		for (var i = 0; i < gNavToolbox.childNodes.length; ++i) {
            var toolbar = gNavToolbox.childNodes[i];
            var toolbarName = toolbar.getAttribute("toolbarname");
            if (toolbarName) {
                var checkbox = document.createElement("checkbox");
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
                checkbox.setAttribute("toolbarindex", toolbar.id||toolbarName);
                checkbox.setAttribute("label", toolbarName);
                checkbox.setAttribute("checked", toolbar.getAttribute(hidingAttribute) != "true");
                checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefs(event)");
				groupbox.appendChild(checkbox);
			//	menuItem.addEventListener("command", fireRibbon.updateRibbonPrefsTab, false);
            }
        }
        //tabbar
        checkbox = document.createElement("checkbox");
        checkbox.setAttribute("toolbarindex", "tab");
        checkbox.setAttribute("label", 'tabbar');
        checkbox.setAttribute("checked", this.ribbonSettings[this.ribbonContainer.selectedIndex].tab);
        checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefsTab(event)");
		groupbox.appendChild(checkbox);

        //statusbar
        checkbox = document.createElement("checkbox");
        checkbox.setAttribute("toolbarindex", "stb");
        checkbox.setAttribute("label", 'statusbar');
        checkbox.setAttribute("checked", this.ribbonSettings[this.ribbonContainer.selectedIndex].stb);
        checkbox.setAttribute("oncommand", "fireRibbon.updateRibbonPrefsStatusbar(event)");
		groupbox.appendChild(checkbox);		
	},

    //sets rib prefs while customizing ribbon displayed toolbars
    updateRibbonPrefs: function(aEvent){
        var rib = this.ribbonContainer;
		var settings = this.ribbonSettings[rib.selectedIndex]

        var index = aEvent.originalTarget.getAttribute("toolbarindex")+",";
		var hide=(aEvent.originalTarget.getAttribute("checked") != "true")
		if(hide)
			settings.toolbarSet=settings.toolbarSet.replace(index,"")
		else
			settings.toolbarSet+=index

        
		this.syncRibbonToolbars(rib.selectedIndex)
		fireRibbon.saveSettings()
    },

    //updates tabbar visibility
    updateRibbonPrefsTab: function(aEvent){
        var rib = this.ribbonContainer;
        var hide = aEvent.originalTarget.getAttribute("checked") == "true";
        gBrowser.setStripVisibilityTo(hide);
        this.ribbonSettings[this.ribbonContainer.selectedIndex].tab=hide
		fireRibbon.saveSettings();

    },
    //
    updateRibbonPrefsStatusbar: function(aEvent){
        var rib = this.ribbonContainer;
        var hide = aEvent.originalTarget.getAttribute("checked") != "true";
        document.getElementById('status-bar').hidden = hide;
        this.ribbonSettings[this.ribbonContainer.selectedIndex].stb=!hide
				fireRibbon.saveSettings()
    },

    //hides toolbars according to prefs
    syncRibbonToolbars: function(selectedIndex){
        var rib = this.ribbonContainer;
        if (rib == null)
            return;
        rib.selectedIndex = selectedIndex;

        var toolbarSet = this.ribbonSettings[selectedIndex].toolbarSet;
        //hide everything
        for (var i = 0; i < gNavToolbox.childNodes.length; ++i) {
            var toolbar = gNavToolbox.childNodes[i];
            var toolbarName = toolbar.getAttribute("toolbarname");
            if (toolbarName) {
                var hidingAttribute = toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";				
				toolbarName=(toolbar.id||toolbarName)+",";
				if(toolbarSet.indexOf(toolbarName)===-1)
					toolbar.setAttribute(hidingAttribute, "true");
				else
					toolbar.removeAttribute(hidingAttribute);
            }
        }        
        //handle tabbar
        try {
            gBrowser.setStripVisibilityTo(this.ribbonSettings[selectedIndex].tab);
        }catch (e) {}
        //handle status bar
        try {
            document.getElementById('status-bar').hidden = !this.ribbonSettings[selectedIndex].stb
        }catch (e) {}
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

    renametab: function(newname,textbox){
		if(!newname){
		dump("!!!!")
			if(this.ribbonSettings.length>1){
				this.ribbonSettings.splice(this.ribbonContainer.selectedIndex,1)
				if(this.ribbonContainer.selectedIndex>this.ribbonSettings.length)
					this.ribbonContainer.selectedIndex--;
				this.synchRibNames()	
textbox.value=this.ribbonSettings[this.ribbonContainer.selectedIndex].name
			}			
		}else{			
			var ind = this.ribbonContainer.selectedIndex;
			this.ribbonSettings[ind].name=newname;        
			this.ribbonContainer.children[ind].setAttribute('value', newname);
		}
				fireRibbon.saveSettings()

    },
	clonetab: function(newname){
		if(!newname)
			return			
        var ind = this.ribbonContainer.selectedIndex;
		var setting = this.ribbonSettings
		dump(setting[ind])
		var clone={},obj=setting[ind]; 
		for (property in obj) clone[property] = obj[property];
		clone.name=newname;
		setting.splice(ind,0,clone)
		this.ribbonContainer.selectedIndex++;    
		this.synchRibNames()	
				fireRibbon.saveSettings()

    },

	openRibbonPopup: function(i){
		var pan=document.getElementById("mainPanel")
		pan.setAttribute("hidden",false)
		pan.querySelector(".textbox").value=fireRibbon.ribbonContainer.children[i].getAttribute('value')

		pan.openPopup(fireRibbon.ribbonContainer, "after_start", 0, 0, false, false)
	}

};


window.addEventListener('load', function(){
	removeEventListener('load', arguments.callee, false);
    fireRibbon.OnLoad()
}, false);
window.addEventListener("unload", fireRibbon.shutDown, false);

var commandCenter={}

commandCenter.start=function(){
	var pan=document.getElementById("ff-commandcenter")
	//pan=document.getElementById("mainPanel")
	pan.setAttribute("hidden",false)
	var tbox=pan.querySelector(".textbox")
	this.listbox=pan.querySelector("listbox")
	pan.openPopup(document.getElementById("ff-LogoBtn"), "after_start", 0, 0, false, false)
	tbox.focus()
	tbox.addEventListener('input', this.op1, true);
	this.listbox.addEventListener('click', function(e){commandCenter.op2(e)}, true);
}
commandCenter.op2=function(event){
	var index=event.target.getAttribute('value')
	var lt=commandCenter.sortedArray[index]
	for each(var i in items)
	if(i.label==lt){
		break
	}
	var tld=document.getElementById('ff-commandcenter')

	tld.setAttribute('oncommand',i.oncommand)
	tld.doCommand()
	tld.setAttribute('oncommand','')
}
commandCenter.op1=function(event){
p11=event.keyCode;dump(event.keyCode);
	switch(event.keyCode){
		case KeyEvent.DOM_VK_UP:				
			event.preventDefault();event.stopPropagation();
			break
		case KeyEvent.DOM_VK_DOWN:
			event.preventDefault();event.stopPropagation();
			break		
		case KeyEvent.DOM_VK_RETURN:		
			editNext()
			event.preventDefault();event.stopPropagation();
			return;
			break		
		default:				
			if(event.charCode==0){

			}else{
				commandCenter.op(this.value);
			}
				
	}
}
commandCenter.op=function(text){
	this.text=text;
	this.filter();
	var n=this.listbox.itemCount
	for(var i=0;i<n;i++)
		this.listbox.removeItemAt(0)
	for(var i in this.sortedArray)
		this.listbox.appendItem(this.sortedArray[i],i)
}
commandCenter.filter=function(){
	var table = [];	
	var filterText=this.text.toLowerCase()
	if(!filterText){		
		var arr=[]
		this.propsArray.forEach(function(val) {arr.push(val[1])})
		arr.sort()
		this.sortedArray=arr
		return;
	}
	this.propsArray.forEach(function(val) {
		var lowVal=val[0]
		var priority=0,lastI=0,ind1=0;
		//exact match
		if(val[1].indexOf(filterText)===0){
			table.push([-2,val[0],val[1]]);
			return;
		}
		//vague matches		
		for(var j=0;j<filterText.length;j++){
			lastI = lowVal.indexOf(filterText[j],ind1);
			priority += lastI-ind1
			ind1 = lastI+1;
			if(lastI===-1)
				break;
		}
		if (lastI != -1) {
			table.push([priority,val[0],val[1]]);
		}
	})
	table.sort(function (a, b) {
		for(i in a){	
		  if (a[i]<b[i]) return -1;
		  if (a[i]>b[i]) return 1;
		}			
		return 0;
	})	
	var arr=[]
	table.forEach(function(val) {arr.push(val[2])})
	this.sortedArray=arr
}

//
commandCenter.popupShowing=function(){

}
commandCenter.digestMenu=function(){
	a1=[];a2=[];items=[];unknownItems=[];
	t = document.getElementById("main-menubar");
	this.handler.menubar(t)
	//ooo=[a1.length,a2.length,a3.length,a4.length]
	
	this.propsArray=[]
	for(i in items)
		this.propsArray.push([items[i].label.toLowerCase(),items[i].label])
		this.propsArray.sort()
}

commandCenter.persist=function(){
	var pan=document.getElementById("ff-commandcenter")
	if(pan.hasAttribute("noautohide"))
		pan.removeAttribute("noautohide")
	else
		pan.setAttribute("noautohide",'true')
	pan.hidePopup()
	pan.openPopup(document.getElementById("ff-LogoBtn"), "after_start", 0, 0, false, false)
}

commandCenter.handler={	
	menu:function(m){
		this.menupopup(m.firstChild);
	},
	menuitem:function(m){
		var com
		if(m.command){
			com1= com=document.getElementById(m.command);
			com=com.getAttribute("oncommand")
		}else com=m.getAttribute("oncommand")
		if(!com){
			unknownItems.push(com+m.label);return
		}
		items.push({label:m.label, oncommand:com, id:m.id});
		y1={label:m.label,command:com}
	},
	default:function(m){
		a2.push(m.nodeName+"empty");
	},
	menupopup:function(m){
		var n=m.children.length;
		for(var i=0;i<n;i++){
			var el=m.children[i];
			var t=el.nodeName in this? el.nodeName: "default";
			a2.push(t);
			this[t](el);
		}
	},
	menubar:function(m){
		var n=m.children.length;
		for(var i=0;i<n;i++){
			var el=m.children[i];
			var t=el.nodeName in this? el.nodeName: "default";
			a1.push(t);
			this[t](el);
		}
	}
};





dump = function(){
var aMessage="message "
	for (var i = 0; i < arguments.length; i++)
		aMessage += arguments[i] + " ; ";

    var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage(aMessage);
}
