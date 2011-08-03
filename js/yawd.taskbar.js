/*
 *	yawd Taskbar
 *
*/
var yawd = window.yawd || {};
yawd.Taskbar = function(opts, app_id){

	// private variables and function
	opts = yawd.util.extend({}, yawd.Taskbar.defaults, opts);
	
	// public variables and functions
	var pub = {
		app_id: app_id,
		
		create: function(){
			var self = pub;

			var osTaskbar = (self.osTaskbar = document.createElement('aside'));
				// add it to the dom
				yawd.taskbar.appendChild(osTaskbar);
				osTaskbar.style.display = 'none';
				osTaskbar.className = yawd.cssClasses.osTaskbar.main;
				// setting tabIndex makes the div focusable
				// setting outline to 0 prevents a border on focus in Mozilla
				osTaskbar.tabIndex = -1;
				osTaskbar.style.outline = 0;

			// add title and icon
			var osTaskbarLabel = (self.osTaskbarLabel = document.createElement('label'));
				osTaskbarLabel.className = yawd.cssClasses.osTaskbar.title;
				// add icon to the label
				if(opts.icon){
					var osTaskbarIcon = document.createElement('img');
						osTaskbarIcon.src = opts.icon;
						osTaskbarIcon.alt = 'application icon';
						osTaskbarIcon.className = yawd.cssClasses.osTaskbar.icon;
						osTaskbarLabel.appendChild(osTaskbarIcon);
				}
				// add the text to the label and label to taskbar
				if(opts.showTitle)
					osTaskbarLabel.appendChild(document.createTextNode(opts.title));
				osTaskbar.appendChild(osTaskbarLabel);

			// add close button if allowed
			if(opts.closable){
				var osTaskbarClose = (self.osTaskbarClose = document.createElement('button'));
					osTaskbarClose.className = yawd.cssClasses.osTaskbar.closeBtn;
					osTaskbarClose.appendChild(document.createTextNode('close'));
					osTaskbarClose.addEventListener('click', self.close, false);
					osTaskbar.appendChild(osTaskbarClose);
			}
			
			// events
			osTaskbar.addEventListener('click', self.handleClick, false);
			osTaskbar.addEventListener('mouseover', self.handleMouseover, false);
			osTaskbar.addEventListener('mouseout', self.handleMouseout, false);
			
			// open will always be called by the window
			
		},

		open: function(){
			pub.osTaskbar.style.display = 'inline-block';
		},

		setTitle: function(newTitle){
			var self = pub,
				title = self.osTaskbarLabel;

			for(var i=0; i < title.childNodes.length; i++){
				// 3 == text node
				if(title.childNodes[i].nodeType == 3)
					title.childNodes[i].nodeValue = newTitle;
			}
		},

		getWindow: function(){
			return yawd.open_windows[pub.app_id];
		},

		handleClick: function(e){
			var self = pub,
				w = self.getWindow(),
				wZ = w.osWindow.style.zIndex,
				maxZ = yawd.util.arrayMax(yawd.zIndexes);

			// restores if it's minimized
			if(w.isMinimized){
				w.minimize();
			} else {
				// brings the window to the top if its not
				// minimizes if its at the top
				if( w.isCascaded ){
					w.moveToTop();
					yawd.removeClass(w.osWindow, yawd.cssClasses.osWindow.cascaded);
					w.isCascaded = false;

				} else if(wZ < maxZ)
					w.moveToTop();
				else {
					w.minimize();
					// since we just clicked we're obviously over it so trigger that
					w.emphasize();
				}
			}
		},
		
		handleMouseover: function(e){
			var self = pub,
				w = self.getWindow()
				allWindows = yawd.open_windows;
			
			// loop through all of the open windows
			// emphasize this one
			// deemphasize the others
			for(i in allWindows){
				if(allWindows[i].app_id == w.app_id){
					allWindows[i].emphasize();
				} else {
					allWindows[i].deemphasize();
				}
			}
		},

		handleMouseout: function(e){
			var self = pub,
				w = self.getWindow();

			if(w.isMinimized){
				w.osWindow.style.MozTransform = null;
				w.osWindow.style.display = 'none';
			}

			var allWindows = yawd.open_windows;
			for(i in allWindows){
				if(allWindows[i].app_id == w.app_id){
					allWindows[i].removeEmphasize();
				} else {
					allWindows[i].removeDeemphasize();
				}
			}
		},

		close: function(e){
			var self = pub,
				c = self.osTaskbarClose
				t = self.osTaskbar;
			
			// if we're closing via taskbar close button
			// just trigger the window's close method
			if(e.target == c){
				self.handleMouseout();
				self.getWindow().close();
				// keep it from bubbling back to the taskbar click
				e.stopPropagation();
				return false;
			}

			t.style.display = 'none';

			var removed = t.parentNode.removeChild(t);
			delete removed;
		}
	};

	pub.create();

	return pub;
}

yawd.Taskbar.defaults = {
	icon: null,
	title: 'untitled',
	showTitle: true,
	minable: true,
	closable: true
};