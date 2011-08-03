/*
 *	YAWD - Yet Another Web Desktop
*/
yawd = {

	open_windows: {},
	open_taskbars: {},

	zIndexes: [],

	cssClasses: {
		osWindow: {
			main: 'yawd-window',
			titlebar: 'yawd-window-titlebar',
			title: 'yawd-window-title',
			titlebarIcon: 'yawd-window-titlebar-icon',
			minimizeBtn: 'yawd-window-titlebar-minimize',
			maximizeBtn: 'yawd-window-titlebar-maximize',
			closeBtn: 'yawd-window-titlebar-close',
			content: 'yawd-window-content',
			footer: 'yawd-window-footer',
			resizeHandle: 'yawd-window-footer-resize-handle',
			maximized: 'yawd-window-maximized',
			minimized: 'yawd-window-minimized',
			emphasized: 'yawd-window-emphasized',
			deemphasized: 'yawd-window-deemphasized',
			cascaded: 'yawd-window-cascaded'
		},
		osTaskbar: {
			main: 'yawd-taskbar',
			title: 'yawd-taskbar-title',
			icon: 'yawd-taskbar-title-icon',
			closeBtn: 'yawd-taskbar-close'
		},
		osShortcut: {
			main: 'yawd-shortcut',
			icon: 'yawd-shortcut-icon',
			hover: 'yawd-shortcut-hover',
			highlight: 'yawd-shortcut-highlight'
		},
		osMenuItem: {
			mainMenu: 'yawd-menu',
			menu: 'yawd-menuitem-menu',
			main: 'yawd-menuitem',
			hover: 'yawd-menuitem-hover',
			hasSub: 'yawd-menuitem-hasSub'
		},
		osContextMenu: {
			holder: 'yawd-contextmenu-holder',
			holderHover: 'yawd-contextmenu-holder-hover',
			menu: 'yawd-contextmenu-menu',
			item: 'yawd-contextmenu-item',
			itemHover: 'yawd-contextmenu-item-hover',
			trigger: 'yawd-contextmenu-trigger'
		},
		osDialog:{
			holder: 'yawd-dialog-holder',
			btnHolder: 'yawd-dialog-btnholder',
			button: 'yawd-dialog-button'
		},
		misc: {
			dragging: 'yawd-dragging'
		}
	},

	desktop: false,
	taskbar: false,
	quicklaunch: false,
	menu: false,
	menuTrigger: false,

	desktopContext: {
		items: [
			{
				title: 'Properties',
				icon: 'imgs/icons/shape_square_add.png',
				action: 'systemProperties'
			}
		]
	},
	

	// used to properly position/size things on window resize
	windowInnerWidth: 0,
	windowInnerHeight: 0,
	
	shortcuts: [],
	alignTo: 'left',
	curX: 10,
	curY: 10,

	init:function(opts){
		
		this.desktop = opts.desktop;
		this.taskbar = opts.taskbar;
		this.quicklaunch = opts.quicklaunch;
		this.menu = opts.menu;
		this.menuTrigger = opts.menuTrigger;

		// add osDesktop class
		this.addClass(this.desktop, 'yawd-desktop');
		// setup context for desktop
		if(this.desktopContext.items.length){
			var cm = new yawd.ContextMenu(this.desktopContext);
			this.desktop.appendChild(cm.osMenu);
			this.desktop.addEventListener(
				'contextmenu',
				function(e){
					cm.open(e);
					e.preventDefault();
					e.stopPropagation();
				},
				false
			);
		} else {
			this.desktop.addEventListener('contextmenu', function(e){
				e.preventDefault();
			}, false);
		}

		// loop through all of the buttons in quicklaunch
		// if their rel matches a function here, add that as the click event
		if(this.quicklaunch){
			var q = this.quicklaunch,
				btns = q.getElementsByTagName('button');

			for(i=0; i < btns.length; i++){
				if( this.util.isFunction(this[btns[i].getAttribute('rel')]) )
					btns[i].addEventListener('click', this[btns[i].getAttribute('rel')].bind(this), false);
			}
		}

		// add the supplied desktop shortcuts
		if(opts.desktopShortcuts[0].toString() == '[object Object]'){
			// json objects
			for(i in opts.desktopShortcuts){
				this.addShortcut(opts.desktopShortcuts[i]);
			}
		} else {
			// making it from existing html
			for(i in opts.desktopShortcuts){
				if(opts.desktopShortcuts[i].nodeType == 1){
					// build the json data off of the element's attributes and content
					var t = {},
						el = opts.desktopShortcuts[i];
					
					// just using .src here makes it absolute, which we don't want (I think, it might not matter)
					t.icon = el.getElementsByTagName('img')[0].attributes.src.nodeValue;
					t.appIcon = el.attributes['data-appicon'].value;
					t.action = el.rel;
					t.title = el.getElementsByTagName('label')[0].firstChild.nodeValue;
					t.position = 'auto';
					
					this.addShortcut(t, el);
				}
				delete t, el;
			}
		}
		

		// menu and menu items
		if(this.menu){
			this.addClass(this.menu, this.cssClasses.osMenuItem.mainMenu);
			// setup show/hide on a trigger if given
			if(this.menuTrigger){
				this.menu.style.display = 'none';
				this.menuTrigger.addEventListener(
					'click', 
					function(e){
						if(yawd.menu.style.display == 'none')	
							yawd.menu.style.display = 'block';
						else
							yawd.menu.style.display = 'none';
					},
					false
				);
				// click anywhere hides the menu
				document.body.addEventListener(
					'click',
					function(){
						if(yawd.menu.style.display == 'block')
							yawd.menu.style.display = 'none';
					},
					true
				);
			}

			if(opts.menuItems){
				for(i in opts.menuItems){
					new this.MenuItem(opts.menuItems[i]);
				}
			} else {
				for(i in this.menu.children){
					if(this.menu.children[i].nodeType == 1){
						var el = this.menu.children[i];
						new this.MenuItem({}, el);
					}
				}
				delete t, el;
			}
		}

		// save the current window width and height
		this.windowInnerWidth = window.innerWidth;
		this.windowInnerHeight = window.innerHeight;

		// setup the document unload function
		window.addEventListener('unload', this.unload.bind(this), false);
		window.addEventListener('resize', this.resize, false);

		// this.openTestWindow({}, 1);
	},

	resize: function(e){
		var self = yawd,
			diffWidth = 0,
			diffHeight = 0;
		
		// figure out the difference in width / height
		diffWidth = (self.windowInnerWidth - window.innerWidth) / 2;
		diffHeight = (self.windowInnerHeight - window.innerHeight) / 2;
		
		for(i in self.shortcuts){
			if(self.shortcuts[i].autoPositioned == false){
				var s = self.shortcuts[i],
					curLeft = s.osShortcut.offsetLeft,
					curTop = s.osShortcut.offsetTop;

				s.osShortcut.style.left = curLeft - diffWidth + 'px';
				s.osShortcut.style.top = curTop - diffHeight + 'px';
			}
		}

		self.windowInnerWidth = window.innerWidth;
		self.windowInnerHeight = window.innerHeight;
	},

	unload: function(e){
		var savedShortcuts = [];

		// save the settings for the different shortcuts
		for(i in this.shortcuts)
			savedShortcuts.push(this.shortcuts[i].getOptions());
		
		// save it to localStorage
		localStorage.setItem('osSavedShortcuts', JSON.stringify(savedShortcuts));
	},

	addShortcut: function(opts, el){
		// figure out the position before creating it
		// starting at top left (or right depending on align) and going down first
		if(opts.position == 'auto'){
			if( ( this.curY + 85 ) > this.desktop.offsetHeight){
				this.curY = 10;
				this.curX += 70;
			}
			opts.x = this.curX;
			opts.y = this.curY;

			this.curY += 85;
		}
		this.shortcuts.push(new this.Shortcut(opts, this.alignTo, el));
	},

	openWindow: function(element, window_options, app_id){
		if(app_id == undefined)
			app_id = this.randInt();

		// for developing
		window_options.title += ' - '+app_id;

		if(window_options.parent == null){
			window_options.parent = this.desktop;
		}

		// create the taskbar first so window can open it
		if(this.taskbar && window_options.taskbar !== false){
			var t = new this.Taskbar(window_options, app_id);
			this.open_taskbars[app_id] = t;
		}
		
		var w = new this.Window(element, window_options, app_id);
		if(window_options.taskbar !== false){
			this.open_windows[app_id] = w;
			w.osWindow.addEventListener('close', this.closeWindow.bind(this), false);
		}

		return w;
	},

	openDialog: function(htmlstr, opts, app_id, e){
		return new this.Dialog(htmlstr, opts, app_id, e ? e.target : null);
	},
	
	// callback for when a window is closed we're in the scope of the window html here
	closeWindow: function(e){
		delete this.open_windows[e.detail];
		if(this.taskbar){
			this.open_taskbars[e.detail].close(e);
			delete this.open_taskbar[e.detail];
		}
	},

	iframeLoad: function(url, opts){
		var f = document.createElement('iframe');
			f.src = url;
			f.style.width = '100%';
			f.style.height = '100%';
			f.style.border = 0;
		
		// make sure autoOpen is false so we don't get the flash before the src is loaded
		opts.autoOpen = false;

		var w = yawd.openWindow(f, opts);
		f.addEventListener('load', function(){ w.open(); }, false);
	},

	ajaxLoad: function(url, opts){
		var xhr = new XMLHttpRequest();

		// make sure autoOpen is false se we don't get the flash before it' loaded in
		opts.autoOpen = false;

		// create a window with an empty elements
		w = yawd.openWindow(document.createElement('div'), opts);
		
		// ajax in the url
		xhr.onreadystatechange = function() {
			if ( xhr.readyState == 4 ) {
				if ( xhr.status == 200 ) {
					w.osWindowContent.innerHTML = xhr.responseText;
					w.open();

				} else {
					console.log('error');
				}
			}
		};
		xhr.open("GET", url, true);
		xhr.send(null);
	},

	showDesktop: function(){
		var allMinimized = true;

		// if all windows are minimized show them all
		// otherwise minimize them all
		for(i in this.open_windows){
			if(this.open_windows[i].isMinimized === false){
				allMinimized = false;
				break;
			}
		}

		if(allMinimized){
			// all are minimized show them
			for(i in this.open_windows)
				this.open_windows[i].minimize();
		} else {
			// all shown or mixed of some shown some minimized
			// minimize the ones that aren't minimized
			for(i in this.open_windows){
				if(this.open_windows[i].isMinimized === false)
					this.open_windows[i].minimize();
			}
		}
	},
	cascadeWindows: function(e){
		var windows = [],
			scaleModifier = .75,
			skewModifier = '0deg, -10deg',
			overlapX = 50,
			overlapY = 50,
			countLeft = 0,
			countTop = 0,
			currentWidth = 0,
			currentHeight = 0,
			fullWidth = 0,
			fullHeight = 0;

		for(var i in this.open_windows){
			// restore all of the windows to their regular size
			if(this.open_windows[i].isMinimized || this.open_windows[i].isMaximized){
				if(this.open_windows[i].isMaximized)
					this.open_windows[i]._saveState();

				this.open_windows[i]._restoreState('normal');
			} else {
				this.open_windows[i]._saveState('normal');
			}
			
			this.open_windows[i].moveToTop();

			// add the transform properties
			this.open_windows[i].osWindow.style.MozTransformOrigin = '0 0';
			this.open_windows[i].osWindow.style.MozTransform = 'skew('+skewModifier+') scale('+scaleModifier+')';

			// figure out the width & height of all of the elements when cascaded
			// take into account some windows are wider/higher than others
			currentWidth = countLeft + this.open_windows[i].osWindow.offsetWidth;
			fullWidth = Math.max(fullWidth, currentWidth);
			countLeft += overlapX;
			currentHeight = countTop + this.open_windows[i].osWindow.offsetHeight;
			fullHeight = Math.max(fullHeight, currentHeight);
			countTop += overlapY;

			this.addClass(this.open_windows[i].osWindow, this.cssClasses.osWindow.cascaded);
			this.open_windows[i].isCascaded = true;

			windows.push(this.open_windows[i]);
		}
		
		// account for the scale
		fullWidth = fullWidth * scaleModifier;
		fullHeight = fullHeight * scaleModifier;

		// figure out where the first window needs to be placed for the whole thing to be centered
		countLeft = ( this.desktop.offsetWidth / 2 ) - ( fullWidth / 2 );
		countTop = ( this.desktop.offsetHeight / 2 ) - ( fullHeight / 2 );
		// I don't like the top being dead center, so move it up another chunk
		// countTop = countTop / 2;

		// now loop through all of the windows and place them in the proper x,y coordinates
		for(i in windows){
			windows[i].osWindow.style.left = countLeft + 'px';
			windows[i].osWindow.style.top = countTop + 'px';

			countLeft += overlapX;
			countTop += overlapY;
		}

		// can't .bind(this) because that results in an anonymous function which keeps us from being able to unbind it
		// switch this to true to make the event listen on the capture phase before everything else bound to the bubble phase
		document.addEventListener('click', this.removeCascade, true);
	},
	removeCascade: function(e){
		var w = yawd;
		for(var i in w.open_windows){
			w.open_windows[i]._restoreState(w.open_windows[i].isMaximized ? 'maximized' : 'normal');
			w.removeClass(w.open_windows[i].osWindow, w.cssClasses.osWindow.cascaded);
			w.open_windows[i].isCascaded = false;
		}

		if(e.target.getAttribute('rel')=='cascadeWindows')
			e.stopPropagation();
		
		document.removeEventListener('click', w.removeCascade, true);
	},
	
	// used by this and its modules to trigger events
	trigger: function(type, target, details){
		if(details == null)
			details = 1;
		var e = document.createEvent("UIEvents");
		e.initUIEvent(type, true, true, window, details);
		if(target.dispatchEvent(e) === false){
			return false;
		} else {
			return true;
		}
	},

	randInt: function(){
		return Math.floor(Math.random()*100)
	},

	addClass: function(el, cls){
		if(!this.hasClass(el, cls)){
			el.className += ' '+cls;
		}
	},

	removeClass: function(el, cls){
		if(this.hasClass(el, cls)){
			var classes = el.className.split(' ');
			classes.splice(classes.indexOf(cls), 1);
			el.className = classes.join(' ');
		}
	},

	hasClass: function(el, cls){
		var classes = el.className.split(' ');
		return this.util.inArray(cls, classes);
	},

	getNextZ: function(current){
		var z = 0;
		current = current * 1;

		// initial window open
		if(this.zIndexes.length == 0){
			z = 1;
		} else {			
			// find the top z in the array
			var maxZ = this.util.arrayMax(this.zIndexes);
			
			// if the max is the same as the current just return
			if(maxZ == current)
				return current;

			// if the current z is already in the array remove it
			if(this.util.inArray(current, this.zIndexes))
				this.zIndexes.splice( this.zIndexes.indexOf(current), 1);
			
			// now set z to maxZ += 1
			z = maxZ + 1;
		}

		// add the z to the array
		this.zIndexes.push(z);

		return z;
	}
};

// a lot of these are just copies from jquery 1.6.1
yawd.util = {
	
	// [[Class]] -> type pairs
	class2type: {
		'[object Boolean]': 'boolean',
		'[object Number]': 'number',
		'[object String]': 'string',
		'[object Function]': 'function',
		'[object Array]': 'array',
		'[object Date]': 'date',
		'[object RegExp]': 'regexp',
		'[object Object]': 'object',
	},

	inArray: function(needle, haystack){
		return haystack.indexOf(needle)>=0;
	},
	
	// extend, just like jquery
	extend: function(){
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		if ( length === i ) {
			target = this;
			--i;
		}

		for ( ; i < length; i++ ) {
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null ) {
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray(src) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	},

	// http://www.davidflanagan.com/2009/08/typeof-isfuncti.html
	isFunction: function( obj ) {
		return Object.prototype.toString.call(obj) === "[object Function]";
	},
	
	// [link here]
	isArray: Array.isArray || function( obj ) {
		return this.type(obj) === "array";
	},
	
	// A crude way of determining if an object is a window
	// [link here]
	isWindow: function( obj ) {
		return obj && typeof obj === "object" && "setInterval" in obj;
	},

	// [link here]
	isNaN: function( obj ) {
		return obj == null || !/\d/.test( obj ) || isNaN( obj );
	},

	// [link here]
	type: function( obj ) {
		return obj == null ?
			String( obj ) :
			this.class2type[ toString.call(obj) ] || "object";
	},

	// [link here]
	isPlainObject: function( obj ) {
		var hasOwn = Object.prototype.hasOwnProperty;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || this.type(obj) !== "object" || obj.nodeType || this.isWindow( obj ) ) {
			return false;
		}

		// Not own constructor property must be Object
		if ( obj.constructor &&
			!hasOwn.call(obj, "constructor") &&
			!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		var key;
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	// [link here]
	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},

	// [link here]
	error: function( msg ) {
		throw msg;
	},

	// loops through array of numbers and returns the biggest
	arrayMax: function( arr ){
		var max = 0;
		for(var i in arr){
			max = Math.max(max, arr[i]);
		}
		return max;
	}
}

// add bind to the function prototype
Function.prototype.bind = function(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  }
}