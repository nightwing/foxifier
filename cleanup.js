/*var XPIProviderBP=Components.utils.import("resource://gre/modules/XPIProvider.jsm")//
__SCRIPT_URI_SPEC__=XPIProviderBP.XPIProvider.bootstrapScopes["absolute@load.control.am"].__SCRIPT_URI_SPEC__*/
(function(){
	var panel=window.document.getElementById('load-control-panel')
	if(panel)
		panel.parentNode.removeChild(panel)
	
	var button = CombinedStopReload.reload
	button.setAttribute('command', "Browser:ReloadOrDuplicate");
	button.setAttribute('onclick','checkForMiddleClick(this, event);')
	if(	button.hasAttribute('oldtooltiptext')){
		button.setAttribute('tooltiptext', button.getAttribute('oldtooltiptext'))
		button.removeAttribute('oldtooltiptext')
	}
	button.removeAttribute('context')
	button.disabled=false

	
	var button = CombinedStopReload.stop
	button.setAttribute('command', 'Browser:Stop');
	button.removeAttribute('onclick')
	button.removeAttribute('context')
	button.disabled=false
	
	window.XULBrowserWindow.stopCommand.setAttribute("disabled", !button.hasAttribute("displaystop") );

})()

/** revert changes to CombinedStopReload **/
var CombinedStopReload = {
  init: function () {
    if (this._initialized)
      return;

    var urlbar = document.getElementById("urlbar-container");
    var reload = document.getElementById("reload-button");
    var stop = document.getElementById("stop-button");

    if (urlbar) {
      if (urlbar.parentNode.getAttribute("mode") != "icons" ||
          !reload || urlbar.nextSibling != reload ||
          !stop || reload.nextSibling != stop)
        urlbar.removeAttribute("combined");
      else {
        urlbar.setAttribute("combined", "true");
        reload = document.getElementById("urlbar-reload-button");
        stop = document.getElementById("urlbar-stop-button");
      }
    }
    if (!stop || !reload || reload.nextSibling != stop)
      return;

    this._initialized = true;
    if (XULBrowserWindow.stopCommand.getAttribute("disabled") != "true")
      reload.setAttribute("displaystop", "true");
    stop.addEventListener("click", this, false);
    this.reload = reload;
    this.stop = stop;
  },

  uninit: function () {
    if (!this._initialized)
      return;

    this._cancelTransition();
    this._initialized = false;
    this.stop.removeEventListener("click", this, false);
    this.reload = null;
    this.stop = null;
  },

  handleEvent: function (event) {
    // the only event we listen to is "click" on the stop button
    if (event.button == 0 &&
        !this.stop.disabled)
      this._stopClicked = true;
  },

  switchToStop: function () {
    if (!this._initialized)
      return;

    this._cancelTransition();
    this.reload.setAttribute("displaystop", "true");
  },

  switchToReload: function (aDelay) {
    if (!this._initialized)
      return;

    this.reload.removeAttribute("displaystop");

    if (!aDelay || this._stopClicked) {
      this._stopClicked = false;
      this._cancelTransition();
      this.reload.disabled = XULBrowserWindow.reloadCommand
                                             .getAttribute("disabled") == "true";
      return;
    }

    if (this._timer)
      return;

    // Temporarily disable the reload button to prevent the user from
    // accidentally reloading the page when intending to click the stop button
    this.reload.disabled = true;
    this._timer = setTimeout(function (self) {
      self._timer = 0;
      self.reload.disabled = XULBrowserWindow.reloadCommand
                                             .getAttribute("disabled") == "true";
    }, 650, this);
  },

  _cancelTransition: function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = 0;
    }
  }
};
CombinedStopReload.init()